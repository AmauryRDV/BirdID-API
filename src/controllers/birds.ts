import type { Context } from 'hono';
import { pool } from '../db_connect.js';
import { getAllBirdsSQL, getBirdByIdSQL, insertBirdSQL, updateBirdSQL, deleteBirdSQL } from '../db/tables/birds.js';
import { isNonEmptyString } from '../services/validation.js'; // Added import for validation


export const getAllBirds = async (c: Context) => {
  try {
    let page = parseInt(c.req.query('page') || '1', 10);
    let limit = parseInt(c.req.query('limit') || '20', 10);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 20;    if (limit > 100) limit = 100;
    const offset = (page - 1) * limit;

    const result = await pool.query(getAllBirdsSQL, [limit, offset]);
    return c.json(result.rows);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Erreur lors de la récupération des oiseaux' }, 500);
  }
};

export const getBirdById = async (c: Context) => {
  const id = parseInt(c.req.param('id')!, 10);
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400);
  try {
    const result = await pool.query(getBirdByIdSQL, [id]);
    if (result.rows.length === 0) return c.json({ error: 'Oiseau introuvable' }, 404);
    return c.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Erreur lors de la récupération de l\'oiseau' }, 500);
  }
};

export const createBird = async (c: Context) => {
  try {
    const body = await c.req.json();
    if (!body || typeof body !== 'object') return c.json({ error: 'Body invalide' }, 400);
    const requiredKeys = ['birdname', 'latinbirdname', 'media', 'funfact', 'rarity', 'habitat'];
    const missing = [];
    for (const key of requiredKeys) {
      const value = body[key];
      if (value == null || value === '') missing.push(key);
    }
    if (missing.length) {
      return c.json({ error: 'Champs requis manquants', missing }, 400);
    }
    if (!isNonEmptyString(body.birdname)) return c.json({ error: 'Le nom de l\'oiseau ne peut pas être vide' }, 400);
    if (!isNonEmptyString(body.latinbirdname)) return c.json({ error: 'Le nom latin de l\'oiseau ne peut pas être vide' }, 400);
    if (!isNonEmptyString(body.media)) return c.json({ error: 'Le média ne peut pas être vide' }, 400);
    if (!isNonEmptyString(body.funfact)) return c.json({ error: 'Le funfact ne peut pas être vide' }, 400);
    if (!isNonEmptyString(body.rarity)) return c.json({ error: 'La rareté ne peut pas être vide' }, 400);
    if (!isNonEmptyString(body.habitat)) return c.json({ error: 'L\'habitat ne peut pas être vide' }, 400);

    const { birdname, latinbirdname, media, funfact, rarity, habitat } = body;
    const result = await pool.query(insertBirdSQL, [birdname, latinbirdname, media, funfact, rarity, habitat]);
    return c.json(result.rows[0], 201);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Erreur de base de données lors de la création de l\'oiseau' }, 500);
  }
};

//Insertion du json
// export const createOrInsertBirds = async (c: Context) => {
//   try {
//     const body = await c.req.json();
//     if (!body || typeof body !== 'object') return c.json({ error: 'Body invalide' }, 400);
//     const requiredKeys = ['birdname', 'latinbirdname', 'media', 'funfact', 'rarity', 'habitat'];
//     //logique de parcour du fichier
    
//   }
// }

export const updateBird = async (c: Context) => {
  const id = parseInt(c.req.param('id')!, 10);
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400);
  try {
    const existingBirdResult = await pool.query(getBirdByIdSQL, [id]);
    if (existingBirdResult.rows.length === 0) return c.json({ error: 'Oiseau introuvable' }, 404);
    const existingBird = existingBirdResult.rows[0];

    const body = await c.req.json();
    if (!body || typeof body !== 'object') {
      return c.json({ error: 'Body invalide' }, 400);
    }

    const birdname = body.birdname !== undefined ? body.birdname : existingBird.birdname;
    const latinbirdname = body.latinbirdname !== undefined ? body.latinbirdname : existingBird.latinbirdname;
    const media = body.media !== undefined ? body.media : existingBird.media;
    const funfact = body.funfact !== undefined ? body.funfact : existingBird.funfact;
    const rarity = body.rarity !== undefined ? body.rarity : existingBird.rarity;
    const habitat = body.habitat !== undefined ? body.habitat : existingBird.habitat;

    if (birdname !== undefined && !isNonEmptyString(birdname)) return c.json({ error: 'Le nom de l\'oiseau ne peut pas être vide' }, 400);
    if (latinbirdname !== undefined && !isNonEmptyString(latinbirdname)) return c.json({ error: 'Le nom latin de l\'oiseau ne peut pas être vide' }, 400);
    if (media !== undefined && !isNonEmptyString(media)) return c.json({ error: 'Le média ne peut pas être vide' }, 400);
    if (funfact !== undefined && !isNonEmptyString(funfact)) return c.json({ error: 'Le funfact ne peut pas être vide' }, 400);
    if (rarity !== undefined && !isNonEmptyString(rarity)) return c.json({ error: 'La rareté ne peut pas être vide' }, 400);
    if (habitat !== undefined && !isNonEmptyString(habitat)) return c.json({ error: 'L\'habitat ne peut pas être vide' }, 400);

    const result = await pool.query(updateBirdSQL, [birdname, latinbirdname, media, funfact, rarity, habitat, id]);
    if (result.rows.length === 0) return c.notFound();
    return c.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Erreur de base de données lors de la mise à jour de l\'oiseau' }, 500);
  }
};

export const deleteBird = async (c: Context) => {
  const id = parseInt(c.req.param('id')!, 10);
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400);
  try {
    const result = await pool.query(deleteBirdSQL, [id]);
    if (result.rows.length === 0) return c.json({ error: 'Oiseau inconnu' }, 404);
    return c.json({ message: 'Oiseau supprimé' }, 200);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Erreur de base de données lors de la suppression de l\'oiseau' }, 500);
  }
};