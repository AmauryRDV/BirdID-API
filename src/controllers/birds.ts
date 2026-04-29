import type { Context } from 'hono';
import { pool } from '../db_connect.js';
import { getAllBirdsSQL, getBirdByIdSQL, insertBirdSQL, updateBirdSQL, deleteBirdSQL } from '../db/tables/birds.js';



export const getAllBirds = async (c: Context) => {
  try {
    const result = await pool.query(getAllBirdsSQL);
    return c.json(result.rows);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Erreur lors de la récupération des oiseaux' }, 500);
  }
};

export const getBirdById = async (c: Context) => {
  const id = parseInt(c.req.param('id'));
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
    const { birdname, latinbirdname, media, funfact, rarity, habitat } = body;
    const result = await pool.query(insertBirdSQL, [birdname, latinbirdname, media, funfact, rarity, habitat]);
    return c.json(result.rows[0], 201);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Erreur de base de données lors de la création de l\'oiseau' }, 500);
  }
};

//Insertion du json
export const createOrInsertBirds = async (c: Context) => {
  try {
    const body = await c.req.json();
    if (!body || typeof body !== 'object') return c.json({ error: 'Body invalide' }, 400);
    const requiredKeys = ['birdname', 'latinbirdname', 'media', 'funfact', 'rarity', 'habitat'];
    //logique de parcour du fichier
    
  }
}


//A corriger et vérifier
export const updateBird = async (c: Context) => {
  const id = parseInt(c.req.param('id'));
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400);
  //A verif
  try {
    const body = await c.req.json();
    if (!body || typeof body !== 'object') {
      return c.json({ error: 'Body invalide' }, 400);
    }
    const { birdname, latinbirdname, media, funfact, rarity, habitat } = body;
    // if (!birdname || !latinbirdname || !media || !funfact || !rarity || !habitat) {
    //   return c.json({ error: 'Champs requis manquants' }, 400);
    // }
    const result = await pool.query(updateBirdSQL, [birdname, latinbirdname, media, funfact, rarity, habitat, id]);
    if (result.rows.length === 0) return c.notFound();
    return c.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Erreur de base de données lors de la mise à jour de l\'oiseau' }, 500);
  }
};

export const deleteBird = async (c: Context) => {
  const id = parseInt(c.req.param('id'));
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