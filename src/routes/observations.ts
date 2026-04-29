import { Hono } from 'hono';
import type { Observation } from '../db/tables/observations.js';
import { getAllObservations, getObservationById, createObservation, updateObservation, deleteObservation, uploadImage } from '../controllers/observations.js';
import { honoJwtMiddleware } from '../middleware/middleware.js';
import { DatabaseError } from 'pg';

const observationRoutes = new Hono();

observationRoutes.get('/', async (c) => {
  try {
    let page = parseInt(c.req.query('page') || '1', 10);
    let limit = parseInt(c.req.query('limit') || '20', 10);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 20; if (limit > 100) limit = 100;
    return await getAllObservations(c);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Erreur lors de la récupération des observations' }, 500);
  }
});

observationRoutes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400);
  try {
    return await getObservationById(c);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Erreur lors de la récupération de l\'observation' }, 500);
    if (err instanceof DatabaseError) {
      return c.json({ error: 'Erreur de base de données lors de la récupération de l\'observation' }, 500);
    }
    return c.json({ error: 'Erreur interne du serveur lors de la récupération de l\'observation' }, 500);
  }
});

observationRoutes.post('/', honoJwtMiddleware, async (c) => {
  try {
    return await createObservation(c);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Erreur de base de données lors de la création de l\'observation' }, 500);
  }
});

observationRoutes.put('/:id', honoJwtMiddleware, async (c) => {
  const id = parseInt(c.req.param('id')!, 10);
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400);
  try {
    return await updateObservation(c);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Erreur lors de la mise à jour de l\'observation' }, 500);
  }
});

observationRoutes.delete('/:id', honoJwtMiddleware, async (c) => {
  const id = parseInt(c.req.param('id')!, 10);
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400);
  try {
    return await deleteObservation(c);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Erreur de base de données lors de la suppression de l\'observation' }, 500);
  }
});

export default observationRoutes;
