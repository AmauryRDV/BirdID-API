import { Hono } from 'hono';
import type { Bird } from '../tables/birds.js';
import { getAllBirdsSQL, getBirdByIdSQL, insertBirdSQL, updateBirdSQL, deleteBirdSQL } from '../tables/birds.js';
import { pool } from '../db_connect.js';
import { isNonEmptyString } from '../services/validation.js';
import { DatabaseError } from 'pg';
import { honoJwtMiddleware } from '../middleware/middleware.js';

const birdRoutes = new Hono();

// GET /birds - Get all birds
birdRoutes.get('/', async (c) => {
  try {
    let page = parseInt(c.req.query('page') || '1', 10);
    let limit = parseInt(c.req.query('limit') || '20', 10);
    
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;
    
    const offset = (page - 1) * limit;
    const result = await pool.query(getAllBirdsSQL, [limit, offset]);
    return c.json(result.rows);
  } catch (err) {
    console.error(err);
    if (err instanceof DatabaseError) {
      return c.json({ error: 'Erreur de base de données lors de la récupération des oiseaux' }, 500);
    }
    return c.json({ error: 'Erreur interne du serveur' }, 500);
  }
});

// GET /birds/:id - Get bird by ID
birdRoutes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
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
});

// POST /birds - Create a new bird
birdRoutes.post('/', honoJwtMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { birdname, latinbirdname, media, funfact, rarity, habitat } = body;
    if (!birdname || !latinbirdname || !media || !funfact || !rarity || !habitat) {
      return c.json({ error: 'Champs requis manquants' }, 400);
    }
    if (!isNonEmptyString(birdname)) return c.json({ error: 'Le nom de l\'oiseau ne peut pas être vide' }, 400);
    if (!isNonEmptyString(latinbirdname)) return c.json({ error: 'Le nom latin de l\'oiseau ne peut pas être vide' }, 400);
    if (!isNonEmptyString(media)) return c.json({ error: 'Le média ne peut pas être vide' }, 400);
    if (!isNonEmptyString(funfact)) return c.json({ error: 'Le funfact ne peut pas être vide' }, 400);
    if (!isNonEmptyString(rarity)) return c.json({ error: 'La rareté ne peut pas être vide' }, 400);
    if (!isNonEmptyString(habitat)) return c.json({ error: 'L\'habitat ne peut pas être vide' }, 400);
    const result = await pool.query(insertBirdSQL, [birdname, latinbirdname, media, funfact, rarity, habitat]);
    return c.json(result.rows[0], 201);
  } catch (err) {
    console.error(err);
    if (err instanceof DatabaseError) {
      return c.json({ error: 'Erreur de base de données lors de la création de l\'oiseau' }, 500);
    }
    return c.json({ error: 'Erreur interne du serveur' }, 500);
  }
});

// PUT /birds/:id - Update bird
birdRoutes.put('/:id', honoJwtMiddleware, async (c) => {
  const id = parseInt(c.req.param('id'));
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400);
  try {
    const body = await c.req.json();
    const { birdname, latinbirdname, media, funfact, rarity, habitat } = body;
    if (!birdname || !latinbirdname || !media || !funfact || !rarity || !habitat) {
      return c.json({ error: 'Champs requis manquants' }, 400);
    }
    if (!isNonEmptyString(birdname)) return c.json({ error: 'Le nom de l\'oiseau ne peut pas être vide' }, 400);
    if (!isNonEmptyString(latinbirdname)) return c.json({ error: 'Le nom latin de l\'oiseau ne peut pas être vide' }, 400);
    if (!isNonEmptyString(media)) return c.json({ error: 'Le média ne peut pas être vide' }, 400);
    if (!isNonEmptyString(funfact)) return c.json({ error: 'Le funfact ne peut pas être vide' }, 400);
    if (!isNonEmptyString(rarity)) return c.json({ error: 'La rareté ne peut pas être vide' }, 400);
    if (!isNonEmptyString(habitat)) return c.json({ error: 'L\'habitat ne peut pas être vide' }, 400);
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
});

// DELETE /birds/:id - Delete bird
birdRoutes.delete('/:id', honoJwtMiddleware, async (c) => {
  const id = parseInt(c.req.param('id'));
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
});

export default birdRoutes;
