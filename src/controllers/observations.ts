import type { Context } from 'hono';
import { pool } from '../db_connect.js';
import { DatabaseError } from 'pg';
import { getAllObservationsSQL, getObservationByIdSQL, insertObservationSQL, updateObservationSQL, deleteObservationSQL } from '../db/tables/observations.js';
import { uploadObservationImage } from '../services/storage-service.js';

export const getAllObservations = async (c: Context) => {
  try {
    const result = await pool.query(getAllObservationsSQL);
    return c.json(result.rows);
  } catch (err) {
    console.error(err);
    if (err instanceof DatabaseError) {
      return c.json({ error: 'Erreur de base de données lors de la récupération des observations' }, 500);
    }
    return c.json({ error: 'Erreur interne du serveur' }, 500);
  }
};

export const uploadImage = async (c: Context) => {
  try {
    const body = await c.req.parseBody();
    const file = body['file']; 

    if (!file || !(file instanceof File)) {
      return c.json({ error: 'Fichier manquant ou invalide. Assurez-vous d\'utiliser le champ "file" en Multipart Form.' }, 400);
    }

    const extension = file.name.split('.').pop() || 'jpg';
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
  const id = parseInt(c.req.param('id') || '', 10);
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
};

export const createObservation = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { birdid, userid, birdname, date, time, note, size, gender, imagepath } = body;
    if (!birdid || !userid || !birdname || !date || !time || !size || !gender || !imagepath) {
      return c.json({ error: 'Champs requis manquants' }, 400);
    }
    const result = await pool.query(insertObservationSQL, [birdid, userid, birdname, date, time, note || null, size, gender, imagepath]);
    return c.json(result.rows[0], 201);
  } catch (err) {
    console.error(err);
    if (err instanceof DatabaseError) {
      return c.json({ error: 'Erreur de base de données lors de la création de l\'observation' }, 500);
    }
    return c.json({ error: 'Erreur interne du serveur' }, 500);
  }
};

export const updateObservation = async (c: Context) => {
  const id = parseInt(c.req.param('id') || '', 10);
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400);
  try {
    const body = await c.req.json();
    const { birdid, userid, birdname, date, time, note, size, gender, imagepath } = body;
    if (!birdid || !userid || !birdname || !date || !time || !size || !gender || !imagepath) {
      return c.json({ error: 'Champs requis manquants' }, 400);
    }
    const result = await pool.query(updateObservationSQL, [birdid, userid, birdname, date, time, note || null, size, gender, imagepath, id]);
    if (result.rows.length === 0) return c.notFound();
    return c.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err instanceof DatabaseError) {
      return c.json({ error: 'Erreur de base de données lors de la mise à jour de l\'observation' }, 500);
    }
    return c.json({ error: 'Erreur interne du serveur' }, 500);
  }
};

export const deleteObservation = async (c: Context) => {
  const id = parseInt(c.req.param('id') || '', 10);
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400);
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
};