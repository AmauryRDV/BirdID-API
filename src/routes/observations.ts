import { Hono } from 'hono';
import type { Observation } from '../tables/observations.js';
import { getAllObservationsSQL, getObservationByIdSQL, insertObservationSQL, updateObservationSQL, deleteObservationSQL } from '../tables/observations.js';
import { pool } from '../db_connect.js';
import { isPositiveInteger, isNonEmptyString, isValidDateFormat, isValidTimeFormat } from '../services/validation.js';
import { DatabaseError } from 'pg';
import { honoJwtMiddleware } from '../middleware/middleware.js';
import { uploadObservationImage } from '../services/storage-service.js';

const observationRoutes = new Hono();

observationRoutes.get('/', async (c) => {
  try {
    let page = parseInt(c.req.query('page') || '1', 10);
    let limit = parseInt(c.req.query('limit') || '20', 10);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 20;    if (limit > 100) limit = 100;
    const offset = (page - 1) * limit;
    const result = await pool.query(getAllObservationsSQL, [limit, offset]);
    return c.json(result.rows);
  } catch (err) {
    console.error(err);
    if (err instanceof DatabaseError) {
      return c.json({ error: 'Erreur de base de données lors de la récupération des observations' }, 500);
    }
    return c.json({ error: 'Erreur interne du serveur' }, 500);
  }
});

observationRoutes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400);
  try {
    const result = await pool.query(getObservationByIdSQL, [id]);
    if (result.rows.length === 0) return c.notFound();
    return c.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err instanceof DatabaseError) {
      return c.json({ error: 'Erreur de base de données lors de la récupération de l\'observation' }, 500);
    }
    return c.json({ error: 'Erreur interne du serveur' }, 500);
  }
});

observationRoutes.post('/', honoJwtMiddleware, async (c) => {
  try {
    const jwtPayload = c.get('jwtPayload') as { id: number, is_admin: boolean };
    const userIdFromJwt = jwtPayload.id;

    const body = await c.req.parseBody();
    const birdid = parseInt(body.birdid as string, 10);
    const birdname = body.birdname as string;
    const date = body.date as string;
    const time = body.time as string;
    const note = body.note as string;
    const size = parseInt(body.size as string, 10);
    const gender = body.gender as string;
    const imageFile = body.image;

    if (!birdid || !birdname || !date || !time || !size || !gender || !imageFile) {
      return c.json({ error: 'Champs requis manquants (birdid, birdname, date, time, size, gender, image)' }, 400);
    }
    if (!(imageFile instanceof File)) return c.json({ error: 'L\'image doit être un fichier valide' }, 400);
    if (!isPositiveInteger(birdid)) return c.json({ error: 'L\'ID de l\'oiseau doit être un entier positif' }, 400);
    if (!isNonEmptyString(birdname)) return c.json({ error: 'Le nom de l\'oiseau ne peut pas être vide' }, 400);
    if (!isValidDateFormat(date)) return c.json({ error: 'Le format de la date est invalide (attendu: YYYY-MM-DD)' }, 400);
    if (!isValidTimeFormat(time)) return c.json({ error: 'Le format de l\'heure est invalide (attendu: HH:MM:SS)' }, 400);
    if (note !== undefined && note !== null && !isNonEmptyString(note)) return c.json({ error: 'La note doit être une chaîne de caractères non vide' }, 400);
    if (!isPositiveInteger(size)) return c.json({ error: 'La taille doit être un entier positif' }, 400);
    if (!isNonEmptyString(gender) || !['male', 'female', 'unknown'].includes(gender.toLowerCase())) return c.json({ error: 'Le genre est invalide (attendu: male, female, unknown)' }, 400);
    
    const fileName = `user_${userIdFromJwt}_${Date.now()}_${imageFile.name}`;
    const imagepath = await uploadObservationImage(imageFile, 'observations', fileName);

    const result = await pool.query(insertObservationSQL, [birdid, userIdFromJwt, birdname, date, time, note || null, size, gender, imagepath]);
    return c.json(result.rows[0], 201);
  } catch (err) {
    console.error(err);
    if (err instanceof DatabaseError) {
      return c.json({ error: 'Erreur de base de données lors de la création de l\'observation' }, 500);
    }
    return c.json({ error: 'Erreur interne du serveur' }, 500);
  }
});

observationRoutes.put('/:id', honoJwtMiddleware, async (c) => {
  const id = parseInt(c.req.param('id'));
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400);

  const existingObservationResult = await pool.query(getObservationByIdSQL, [id]);
  if (existingObservationResult.rows.length === 0) return c.notFound();
  const existingObservation = existingObservationResult.rows[0];

  const jwtPayload = c.get('jwtPayload') as { id: number, is_admin: boolean };
  if (jwtPayload.id !== existingObservation.userid && !jwtPayload.is_admin) {
    return c.json({ error: 'Accès interdit : vous n\'êtes pas autorisé à modifier cette observation.' }, 403);
  }

  try {
    const body = await c.req.parseBody();
    const birdid = parseInt(body.birdid as string, 10);
    const birdname = body.birdname as string;
    const date = body.date as string;
    const time = body.time as string;
    const note = body.note as string;
    const size = parseInt(body.size as string, 10);
    const gender = body.gender as string;
    const image = body.image;

    if (!birdid || !birdname || !date || !time || !size || !gender) {
      return c.json({ error: 'Champs requis manquants (birdid, birdname, date, time, size, gender)' }, 400);
    }
    if (!isPositiveInteger(birdid)) return c.json({ error: 'L\'ID de l\'oiseau doit être un entier positif' }, 400);
    const userIdFromJwt = jwtPayload.id;
    if (userIdFromJwt !== existingObservation.userid && !jwtPayload.is_admin) {
      return c.json({ error: 'Accès interdit : vous ne pouvez pas modifier le propriétaire de l\'observation.' }, 403);
    }
    if (!isNonEmptyString(birdname)) return c.json({ error: 'Le nom de l\'oiseau ne peut pas être vide' }, 400);
    if (!isValidDateFormat(date)) return c.json({ error: 'Le format de la date est invalide (attendu: YYYY-MM-DD)' }, 400);
    if (!isValidTimeFormat(time)) return c.json({ error: 'Le format de l\'heure est invalide (attendu: HH:MM:SS)' }, 400);
    if (note !== undefined && note !== null && !isNonEmptyString(note)) return c.json({ error: 'La note doit être une chaîne de caractères non vide' }, 400);
    if (!isPositiveInteger(size)) return c.json({ error: 'La taille doit être un entier positif' }, 400);
    if (!isNonEmptyString(gender) || !['male', 'female', 'unknown'].includes(gender.toLowerCase())) return c.json({ error: 'Le genre est invalide (attendu: male, female, unknown)' }, 400);
    
    let imagepath = existingObservation.imagepath; 

    if (image instanceof File) {
      const fileName = `user_${userIdFromJwt}_${Date.now()}_${image.name}`;
      imagepath = await uploadObservationImage(image, 'observations', fileName);
    }

    const result = await pool.query(updateObservationSQL, [birdid, existingObservation.userid, birdname, date, time, note || null, size, gender, imagepath, id]);
    if (result.rows.length === 0) return c.notFound();
    return c.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err instanceof DatabaseError) {
      return c.json({ error: 'Erreur de base de données lors de la mise à jour de l\'observation' }, 500);
    }
    return c.json({ error: 'Erreur interne du serveur' }, 500);
  }
});

observationRoutes.delete('/:id', honoJwtMiddleware, async (c) => {
  const id = parseInt(c.req.param('id'));
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400);

  const existingObservationResult = await pool.query(getObservationByIdSQL, [id]);
  if (existingObservationResult.rows.length === 0) return c.notFound();
  const existingObservation = existingObservationResult.rows[0];

  const jwtPayload = c.get('jwtPayload') as { id: number, is_admin: boolean };
  if (jwtPayload.id !== existingObservation.userid && !jwtPayload.is_admin) {
    return c.json({ error: 'Accès interdit : vous n\'êtes pas autorisé à supprimer cette observation.' }, 403);
  }

  try {
    const result = await pool.query(deleteObservationSQL, [id]);
    if (result.rows.length === 0) return c.notFound();
    return c.json({ message: 'Observation supprimée' });
  } catch (err) {
    console.error(err);
    if (err instanceof DatabaseError) {
      return c.json({ error: 'Erreur de base de données lors de la suppression de l\'observation' }, 500);
    }
    return c.json({ error: 'Erreur interne du serveur' }, 500);
  }
});

export default observationRoutes;
