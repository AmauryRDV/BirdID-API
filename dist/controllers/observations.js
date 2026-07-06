import { pool } from '../db_connect.js';
import { getAllObservationsSQL, getObservationByIdSQL, getObservationsByUserIdSQL, insertObservationSQL, updateObservationSQL, deleteObservationSQL } from '../db/tables/observations.js';
import { DatabaseError } from 'pg';
import { uploadObservationImage, deleteObservationImage } from '../services/storage-service.js';
import { isPositiveInteger, isNonEmptyString, isValidDateFormat, isValidTimeFormat } from '../services/validation.js';
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 Mo
export const getAllObservations = async (c) => {
    try {
        let page = parseInt(c.req.query('page') || '1', 10);
        let limit = parseInt(c.req.query('limit') || '20', 10);
        if (isNaN(page) || page < 1)
            page = 1;
        if (isNaN(limit) || limit < 1)
            limit = 20;
        if (limit > 100)
            limit = 100;
        const offset = (page - 1) * limit;
        const result = await pool.query(getAllObservationsSQL, [limit, offset]);
        return c.json(result.rows);
    }
    catch (err) {
        console.error(err);
        return c.json({ error: 'Erreur lors de la récupération des observations' }, 500);
    }
};
export const getObservationById = async (c) => {
    const id = parseInt(c.req.param('id'), 10);
    if (isNaN(id))
        return c.json({ error: 'ID invalide' }, 400);
    try {
        const result = await pool.query(getObservationByIdSQL, [id]);
        if (result.rows.length === 0)
            return c.json({ error: 'Observation introuvable' }, 404);
        return c.json(result.rows[0]);
    }
    catch (err) {
        console.error(err);
        return c.json({ error: 'Erreur lors de la récupération de l\'observation' }, 500);
    }
};
export const getObservationsByUserId = async (c) => {
    const userId = parseInt(c.req.param('id'), 10);
    if (isNaN(userId))
        return c.json({ error: 'ID invalide' }, 400);
    try {
        let page = parseInt(c.req.query('page') || '1', 10);
        let limit = parseInt(c.req.query('limit') || '50', 10);
        if (isNaN(page) || page < 1)
            page = 1;
        if (isNaN(limit) || limit < 1)
            limit = 50;
        if (limit > 100)
            limit = 100;
        const offset = (page - 1) * limit;
        const result = await pool.query(getObservationsByUserIdSQL, [userId, limit, offset]);
        return c.json(result.rows);
    }
    catch (err) {
        console.error(err);
        return c.json({ error: 'Erreur lors de la récupération des observations' }, 500);
    }
};
export const createObservation = async (c) => {
    try {
        const jwtPayload = c.get('jwtPayload');
        const userIdFromJwt = jwtPayload.id;
        const body = await c.req.parseBody();
        if (!body || typeof body !== 'object')
            return c.json({ error: 'Body invalide' }, 400);
        const birdid = parseInt(body.birdid, 10);
        const birdname = body.birdname;
        const date = body.date;
        const time = body.time;
        const note = body.note;
        const size = parseInt(body.size, 10);
        const gender = body.gender;
        const imageFile = body.image;
        const client_id = body.client_id;
        const latitude = body.latitude ? parseFloat(body.latitude) : null;
        const longitude = body.longitude ? parseFloat(body.longitude) : null;
        const requiredKeys = ['birdid', 'birdname', 'date', 'time', 'size', 'gender', 'image'];
        const missing = [];
        for (const key of requiredKeys) {
            const value = key === 'image' ? imageFile : body[key];
            if (value == null || (typeof value === 'string' && value.trim() === ''))
                missing.push(key);
        }
        if (missing.length)
            return c.json({ error: 'Champs requis manquants', missing }, 400);
        if (!(imageFile instanceof File))
            return c.json({ error: 'L\'image doit être un fichier valide' }, 400);
        const extension = imageFile.name.split('.').pop()?.toLowerCase() ?? '';
        if (!ALLOWED_EXTENSIONS.includes(extension)) {
            return c.json({ error: `Format d'image non supporté (autorisés : ${ALLOWED_EXTENSIONS.join(', ')})` }, 400);
        }
        if (imageFile.size > MAX_IMAGE_SIZE) {
            return c.json({ error: 'L\'image ne doit pas dépasser 10 Mo' }, 400);
        }
        if (!isPositiveInteger(birdid))
            return c.json({ error: 'L\'ID de l\'oiseau doit être un entier positif' }, 400);
        if (!isNonEmptyString(birdname))
            return c.json({ error: 'Le nom de l\'oiseau ne peut pas être vide' }, 400);
        if (!isValidDateFormat(date))
            return c.json({ error: 'Le format de la date est invalide (attendu: YYYY-MM-DD)' }, 400);
        if (!isValidTimeFormat(time))
            return c.json({ error: 'Le format de l\'heure est invalide (attendu: HH:MM:SS)' }, 400);
        if (note != null && !isNonEmptyString(note))
            return c.json({ error: 'La note doit être une chaîne non vide' }, 400);
        if (!isPositiveInteger(size))
            return c.json({ error: 'La taille doit être un entier positif' }, 400);
        if (!isNonEmptyString(gender) || !['male', 'female', 'unknown'].includes(gender.toLowerCase())) {
            return c.json({ error: 'Le genre est invalide (attendu: male, female, unknown)' }, 400);
        }
        if (latitude != null && isNaN(latitude))
            return c.json({ error: 'Latitude invalide' }, 400);
        if (longitude != null && isNaN(longitude))
            return c.json({ error: 'Longitude invalide' }, 400);
        const sanitizedName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const fileName = `user_${userIdFromJwt}_${Date.now()}_${sanitizedName}`;
        const imagepath = await uploadObservationImage(imageFile, 'observation', fileName);
        const result = await pool.query(insertObservationSQL, [
            birdid, userIdFromJwt, birdname, date, time, note || null, size, gender, imagepath,
            client_id || null, latitude, longitude,
        ]);
        return c.json(result.rows[0], 201);
    }
    catch (err) {
        console.error(err);
        return c.json({ error: 'Erreur lors de la création de l\'observation' }, 500);
    }
};
export const updateObservation = async (c) => {
    const id = parseInt(c.req.param('id'), 10);
    if (isNaN(id))
        return c.json({ error: 'ID invalide' }, 400);
    try {
        const jwtPayload = c.get('jwtPayload');
        const existingResult = await pool.query(getObservationByIdSQL, [id]);
        if (existingResult.rows.length === 0)
            return c.json({ error: 'Observation introuvable' }, 404);
        const existing = existingResult.rows[0];
        if (jwtPayload.id !== Number(existing.userid) && !jwtPayload.is_admin) {
            return c.json({ error: 'Accès interdit : vous n\'êtes pas autorisé à modifier cette observation.' }, 403);
        }
        const body = await c.req.parseBody();
        if (!body || typeof body !== 'object')
            return c.json({ error: 'Body invalide' }, 400);
        if (Object.keys(body).length === 0)
            return c.json({ message: 'Aucun champ fourni pour la mise à jour' }, 200);
        const birdid = body.birdid !== undefined ? parseInt(body.birdid, 10) : Number(existing.birdid);
        const birdname = body.birdname !== undefined ? body.birdname : existing.birdname;
        const date = body.date !== undefined ? body.date
            : (existing.date instanceof Date ? existing.date.toISOString().slice(0, 10) : String(existing.date));
        const time = body.time !== undefined ? body.time : String(existing.time);
        const note = body.note !== undefined ? body.note : existing.note;
        const size = body.size !== undefined ? parseInt(body.size, 10) : Number(existing.size);
        const gender = body.gender !== undefined ? body.gender : existing.gender;
        const latitude = body.latitude !== undefined ? parseFloat(body.latitude) : existing.latitude;
        const longitude = body.longitude !== undefined ? parseFloat(body.longitude) : existing.longitude;
        const imageFile = body.image;
        if (!isPositiveInteger(birdid))
            return c.json({ error: 'L\'ID de l\'oiseau doit être un entier positif' }, 400);
        if (!isNonEmptyString(birdname))
            return c.json({ error: 'Le nom de l\'oiseau ne peut pas être vide' }, 400);
        if (!isValidDateFormat(date))
            return c.json({ error: 'Le format de la date est invalide (attendu: YYYY-MM-DD)' }, 400);
        if (!isValidTimeFormat(time))
            return c.json({ error: 'Le format de l\'heure est invalide (attendu: HH:MM:SS)' }, 400);
        if (note != null && !isNonEmptyString(note))
            return c.json({ error: 'La note doit être une chaîne non vide' }, 400);
        if (!isPositiveInteger(size))
            return c.json({ error: 'La taille doit être un entier positif' }, 400);
        if (!isNonEmptyString(gender) || !['male', 'female', 'unknown'].includes(gender.toLowerCase())) {
            return c.json({ error: 'Le genre est invalide (attendu: male, female, unknown)' }, 400);
        }
        let imagepath = existing.imagepath;
        if (imageFile instanceof File) {
            const extension = imageFile.name.split('.').pop()?.toLowerCase() ?? '';
            if (!ALLOWED_EXTENSIONS.includes(extension)) {
                return c.json({ error: `Format d'image non supporté (autorisés : ${ALLOWED_EXTENSIONS.join(', ')})` }, 400);
            }
            if (imageFile.size > MAX_IMAGE_SIZE) {
                return c.json({ error: 'L\'image ne doit pas dépasser 10 Mo' }, 400);
            }
            const sanitizedName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const fileName = `user_${jwtPayload.id}_${Date.now()}_${sanitizedName}`;
            imagepath = await uploadObservationImage(imageFile, 'observation', fileName);
        }
        const result = await pool.query(updateObservationSQL, [
            birdid, existing.userid, birdname, date, time, note || null, size, gender, imagepath,
            latitude ?? null, longitude ?? null, id,
        ]);
        if (result.rows.length === 0)
            return c.notFound();
        return c.json(result.rows[0]);
    }
    catch (err) {
        console.error(err);
        return c.json({ error: 'Erreur lors de la mise à jour de l\'observation' }, 500);
    }
};
export const deleteObservation = async (c) => {
    const id = parseInt(c.req.param('id'), 10);
    if (isNaN(id))
        return c.json({ error: 'ID invalide' }, 400);
    try {
        const jwtPayload = c.get('jwtPayload');
        const existingResult = await pool.query(getObservationByIdSQL, [id]);
        if (existingResult.rows.length === 0)
            return c.json({ error: 'Observation introuvable' }, 404);
        const existing = existingResult.rows[0];
        if (jwtPayload.id !== Number(existing.userid) && !jwtPayload.is_admin) {
            return c.json({ error: 'Accès interdit : vous n\'êtes pas autorisé à supprimer cette observation.' }, 403);
        }
        if (existing.imagepath) {
            await deleteObservationImage(existing.imagepath, 'observation');
        }
        const result = await pool.query(deleteObservationSQL, [id]);
        if (result.rows.length === 0)
            return c.json({ error: 'Observation introuvable' }, 404);
        return c.json({ message: 'Observation supprimée' }, 200);
    }
    catch (err) {
        console.error(err);
        return c.json({ error: 'Erreur lors de la suppression de l\'observation' }, 500);
    }
};
