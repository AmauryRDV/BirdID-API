import type { Context } from 'hono';
import { pool } from '../db_connect.js';
import { getAllObservationsSQL, getObservationByIdSQL, insertObservationSQL, updateObservationSQL, deleteObservationSQL } from '../db/tables/observations.js';
import { DatabaseError } from 'pg'; // Added import for specific database error handling
import { uploadObservationImage } from '../services/storage-service.js';
import { isPositiveInteger, isNonEmptyString, isValidDateFormat, isValidTimeFormat } from '../services/validation.js';

export const getAllObservations = async (c: Context) => {
  try {
    let page = parseInt(c.req.query('page') || '1', 10);
    let limit = parseInt(c.req.query('limit') || '20', 10);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;
    const offset = (page - 1) * limit;
    const result = await pool.query(getAllObservationsSQL, [limit, offset]);
    return c.json(result.rows);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Erreur lors de la récupération des observations' }, 500);
  }
};

export const uploadImage = async (c: Context) => {
  try {
    const body = await c.req.parseBody();
    const file = body['file'];

    if (!file || !(file instanceof File)) {
      return c.json({ error: 'Fichier manquant ou invalide' }, 400);
    }

    const extension = file.name.split('.').pop();
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

    const filePath = `uploads/${uniqueFileName}`;

    const bucketName = 'observation';

    const imageUrl = await uploadObservationImage(file, bucketName, filePath);

    return c.json({ message: 'Upload réussi', imageUrl }, 201);
  } catch (err) {
    console.error('Erreur lors de l\'upload de l\'image:', err);
    return c.json({ error: 'Erreur lors de l\'upload de l\'image' }, 500);
  }
};

export const getObservationById = async (c: Context) => {
  const id = parseInt(c.req.param('id')!, 10);
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400);
  try {
    const result = await pool.query(getObservationByIdSQL, [id]);
    if (result.rows.length === 0) return c.json({ error: 'Observation introuvable' }, 404);
    return c.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Erreur lors de la récupération de l\'observation' }, 500);
  }
};

export const createObservation = async (c: Context) => {
  try {
    const jwtPayload = c.get('jwtPayload') as { id: number, is_admin: boolean };
    const userIdFromJwt = jwtPayload.id;

    const body = await c.req.parseBody(); // Use parseBody for file uploads
    if (!body || typeof body !== 'object') return c.json({ error: 'Body invalide' }, 400);

    const birdid = parseInt(body.birdid as string, 10);
    const birdname = body.birdname as string;
    const date = body.date as string;
    const time = body.time as string;
    const note = body.note as string;
    const size = parseInt(body.size as string, 10);
    const gender = body.gender as string;
    const imageFile = body.image; // This will be a File object if uploaded


    const requiredKeys = ['birdid', 'birdname', 'date', 'time', 'size', 'gender', 'image'];
    const missing = [];
    for (const key of requiredKeys) {
      const value = key === 'image' ? imageFile : body[key];
      if (value == null || (typeof value === 'string' && value.trim() === '')) missing.push(key);
    }
    if (missing.length) {
      return c.json({ error: 'Champs requis manquants', missing }, 400);
    }

    if (!(imageFile instanceof File)) return c.json({ error: 'L\'image doit être un fichier valide' }, 400);
    if (!isPositiveInteger(birdid)) return c.json({ error: 'L\'ID de l\'oiseau doit être un entier positif' }, 400);
    if (!isNonEmptyString(birdname)) return c.json({ error: 'Le nom de l\'oiseau ne peut pas être vide' }, 400);
    if (!isValidDateFormat(date)) return c.json({ error: 'Le format de la date est invalide (attendu: YYYY-MM-DD)' }, 400);
    if (!isValidTimeFormat(time)) return c.json({ error: 'Le format de l\'heure est invalide (attendu: HH:MM:SS)' }, 400);
    if (note !== undefined && note !== null && !isNonEmptyString(note)) return c.json({ error: 'La note doit être une chaîne de caractères non vide' }, 400);
    if (!isPositiveInteger(size)) return c.json({ error: 'La taille doit être un entier positif' }, 400);
    if (!isNonEmptyString(gender) || !['male', 'female', 'unknown'].includes(gender.toLowerCase())) return c.json({ error: 'Le genre est invalide (attendu: male, female, unknown)' }, 400);

    const sanitizedImageName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `user_${userIdFromJwt}_${Date.now()}_${sanitizedImageName}`;
    const imagepath = await uploadObservationImage(imageFile, 'observation', fileName);

    const result = await pool.query(insertObservationSQL, [birdid, userIdFromJwt, birdname, date, time, note || null, size, gender, imagepath]);
    return c.json(result.rows[0], 201);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Erreur lors de la création de l\'observation' }, 500);
  }
};

export const updateObservation = async (c: Context) => {
  const id = parseInt(c.req.param('id')!, 10);
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400);
  try {
    const jwtPayload = c.get('jwtPayload') as { id: number, is_admin: boolean };


    const existingObservationResult = await pool.query(getObservationByIdSQL, [id]);
    if (existingObservationResult.rows.length === 0) return c.json({ error: 'Observation introuvable' }, 404);
    const existingObservation = existingObservationResult.rows[0];


    if (jwtPayload.id !== existingObservation.userid && !jwtPayload.is_admin) {
      return c.json({ error: 'Accès interdit : vous n\'êtes pas autorisé à modifier cette observation.' }, 403);
    }

    const body = await c.req.parseBody();
    if (!body || typeof body !== 'object') {
      return c.json({ error: 'Body invalide' }, 400);
    }


    const birdid = body.birdid !== undefined ? parseInt(body.birdid as string, 10) : existingObservation.birdid;
    const birdname = body.birdname !== undefined ? body.birdname as string : existingObservation.birdname;
    const date = body.date !== undefined ? body.date as string : existingObservation.date;
    const time = body.time !== undefined ? body.time as string : existingObservation.time;
    const note = body.note !== undefined ? body.note as string : existingObservation.note;
    const size = body.size !== undefined ? parseInt(body.size as string, 10) : existingObservation.size;
    const gender = body.gender !== undefined ? body.gender as string : existingObservation.gender;
    const imageFile = body.image; // This will be a File object if uploaded


    if (birdid !== undefined && !isPositiveInteger(birdid)) return c.json({ error: 'L\'ID de l\'oiseau doit être un entier positif' }, 400);
    if (birdname !== undefined && !isNonEmptyString(birdname)) return c.json({ error: 'Le nom de l\'oiseau ne peut pas être vide' }, 400);
    if (date !== undefined && !isValidDateFormat(date)) return c.json({ error: 'Le format de la date est invalide (attendu: YYYY-MM-DD)' }, 400);
    if (time !== undefined && !isValidTimeFormat(time)) return c.json({ error: 'Le format de l\'heure est invalide (attendu: HH:MM:SS)' }, 400);
    if (note !== undefined && note !== null && !isNonEmptyString(note)) return c.json({ error: 'La note doit être une chaîne de caractères non vide' }, 400);
    if (size !== undefined && !isPositiveInteger(size)) return c.json({ error: 'La taille doit être un entier positif' }, 400);
    if (gender !== undefined && (!isNonEmptyString(gender) || !['male', 'female', 'unknown'].includes(gender.toLowerCase()))) return c.json({ error: 'Le genre est invalide (attendu: male, female, unknown)' }, 400);

    if (Object.keys(body).length === 0) return c.json({ message: 'Aucun champ fourni pour la mise à jour' }, 200);

    let imagepath = existingObservation.imagepath;
    if (imageFile instanceof File) {
      const sanitizedImageName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `user_${jwtPayload.id}_${Date.now()}_${sanitizedImageName}`;
      imagepath = await uploadObservationImage(imageFile, 'observation', fileName);
    }


    const result = await pool.query(updateObservationSQL, [birdid, existingObservation.userid, birdname, date, time, note || null, size, gender, imagepath, id]);
    if (result.rows.length === 0) return c.notFound();
    return c.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Erreur lors de la mise à jour de l\'observation' }, 500);
  }
};

export const deleteObservation = async (c: Context) => {
  const id = parseInt(c.req.param('id')!, 10);
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400);
  try {
    const jwtPayload = c.get('jwtPayload') as { id: number, is_admin: boolean };

    const existingObservationResult = await pool.query(getObservationByIdSQL, [id]);
    if (existingObservationResult.rows.length === 0) return c.json({ error: 'Observation introuvable' }, 404);
    const existingObservation = existingObservationResult.rows[0];


    if (jwtPayload.id !== existingObservation.userid && !jwtPayload.is_admin) {
      return c.json({ error: 'Accès interdit : vous n\'êtes pas autorisé à supprimer cette observation.' }, 403);
    }

    const result = await pool.query(deleteObservationSQL, [id]);
    if (result.rows.length === 0) return c.json({ error: 'Observation inconnu' }, 404);
    return c.json({ message: 'Observation supprimée' }, 200);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Erreur de base de données lors de la suppression de l\'observation' }, 500);
  }
};