import type { Context } from 'hono';
import { pool } from '../db_connect.js';
import { DatabaseError } from 'pg';
import {
  getAllBirdsSQL,
  getBirdByIdSQL,
  insertBirdSQL,
  updateBirdSQL,
  deleteBirdSQL
} from '../db/tables/birds.js';

export const getAllBirds = async (c: Context) => {
  try {
    const result = await pool.query(getAllBirdsSQL);
    return c.json(result.rows);
  } catch (err) {
    console.error(err);
    if (err instanceof DatabaseError) {
      return c.json({ error: 'Erreur de base de données lors de la récupération des oiseaux' }, 500);
    }
    return c.json({ error: 'Erreur interne du serveur' }, 500);
  }
};

export const getBirdById = async (c: Context) => {
  const id = parseInt(c.req.param('id') || '', 10);
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400);
  try {
    const result = await pool.query(getBirdByIdSQL, [id]);
    if (result.rows.length === 0) return c.notFound();
    return c.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err instanceof DatabaseError) {
      return c.json({ error: 'Erreur de base de données lors de la récupération de l\'oiseau' }, 500);
    }
    return c.json({ error: 'Erreur interne du serveur' }, 500);
  }
};

export const createBird = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { birdname, latinbirdname, media, funfact, rarity, habitat } = body;
    if (!birdname || !latinbirdname || !media || !funfact || !rarity || !habitat) {
      return c.json({ error: 'Champs requis manquants' }, 400);
    }
    const result = await pool.query(insertBirdSQL, [birdname, latinbirdname, media, funfact, rarity, habitat]);
    return c.json(result.rows[0], 201);
  } catch (err) {
    console.error(err);
    if (err instanceof DatabaseError) {
      return c.json({ error: 'Erreur de base de données lors de la création de l\'oiseau' }, 500);
    }
    return c.json({ error: 'Erreur interne du serveur' }, 500);
  }
};

export const updateBird = async (c: Context) => {
  const id = parseInt(c.req.param('id') || '', 10);
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400);
  try {
    const body = await c.req.json();
    const { birdname, latinbirdname, media, funfact, rarity, habitat } = body;
    if (!birdname || !latinbirdname || !media || !funfact || !rarity || !habitat) {
      return c.json({ error: 'Champs requis manquants' }, 400);
    }
    const result = await pool.query(updateBirdSQL, [birdname, latinbirdname, media, funfact, rarity, habitat, id]);
    if (result.rows.length === 0) return c.notFound();
    return c.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err instanceof DatabaseError) {
      return c.json({ error: 'Erreur de base de données lors de la mise à jour de l\'oiseau' }, 500);
    }
    return c.json({ error: 'Erreur interne du serveur' }, 500);
  }
};

export const deleteBird = async (c: Context) => {
  const id = parseInt(c.req.param('id') || '', 10);
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400);
  try {
    const result = await pool.query(deleteBirdSQL, [id]);
    if (result.rows.length === 0) return c.notFound();
    return c.json({ message: 'Oiseau supprimé' });
  } catch (err) {
    console.error(err);
    if (err instanceof DatabaseError) {
      return c.json({ error: 'Erreur de base de données lors de la suppression de l\'oiseau' }, 500);
    }
    return c.json({ error: 'Erreur interne du serveur' }, 500);
  }
};