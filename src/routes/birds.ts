import { Hono } from 'hono';
import type { Bird } from '../db/tables/birds.js';
import { getAllBirdsSQL, getBirdByIdSQL, insertBirdSQL, updateBirdSQL, deleteBirdSQL } from '../db/tables/birds.js';
import { getAllBirds, getBirdById, createBird, updateBird, deleteBird } from '../controllers/birds.js';
import { pool } from '../db_connect.js';
import { isNonEmptyString } from '../services/validation.js';
import { DatabaseError } from 'pg';
import { honoJwtMiddleware } from '../middleware/middleware.js';
import { adminGuard } from '../middleware/adminGuard.js';

const birdRoutes = new Hono();

birdRoutes.get('/', async (c) => {
  try {
    return await getAllBirds(c);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Erreur lors de la récupération des oiseaux' }, 500);
  }
});

birdRoutes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id')!, 10);
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400);

  try {
    return await getBirdById(c);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Erreur lors de la récupération de l\'oiseau' }, 500);
  }
});

birdRoutes.post('/', honoJwtMiddleware, adminGuard, async (c) => {
  try {
    return await createBird(c);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Erreur lors de la création de l\'oiseau' }, 500);
  }
});

birdRoutes.put('/:id', honoJwtMiddleware, adminGuard, async (c) => {
  const id = parseInt(c.req.param('id')!, 10);
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400);
  try {
    return await updateBird(c);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Erreur de base de données lors de la mise à jour de l\'oiseau' }, 500);
  }
});

birdRoutes.delete('/:id', honoJwtMiddleware, adminGuard, async (c) => {
  const id = parseInt(c.req.param('id')!, 10);
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400);
  try {
    return await deleteBird(c);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Erreur de base de données lors de la suppression de l\'oiseau' }, 500);
  }
});

export default birdRoutes;
