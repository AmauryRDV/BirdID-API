import { Hono } from 'hono';
import { getAllObservationsSQL, getObservationByIdSQL, insertObservationSQL, updateObservationSQL, deleteObservationSQL } from '../tables/observations.js';
import { pool } from '../db_connect.js';
import { DatabaseError } from 'pg';
const observationRoutes = new Hono();
// GET /observations - Get all observations
observationRoutes.get('/', async (c) => {
    try {
        const result = await pool.query(getAllObservationsSQL);
        return c.json(result.rows);
    }
    catch (err) {
        console.error(err);
        if (err instanceof DatabaseError) {
            return c.json({ error: 'Erreur de base de données lors de la récupération des observations' }, 500);
        }
        return c.json({ error: 'Erreur interne du serveur' }, 500);
    }
});
// GET /observations/:id - Get observation by ID
observationRoutes.get('/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id))
        return c.json({ error: 'ID invalide' }, 400);
    try {
        const result = await pool.query(getObservationByIdSQL, [id]);
        if (result.rows.length === 0)
            return c.notFound();
        return c.json(result.rows[0]);
    }
    catch (err) {
        console.error(err);
        if (err instanceof DatabaseError) {
            return c.json({ error: 'Erreur de base de données lors de la récupération de l\'observation' }, 500);
        }
        return c.json({ error: 'Erreur interne du serveur' }, 500);
    }
});
// POST /observations - Create a new observation
observationRoutes.post('/', async (c) => {
    try {
        const body = await c.req.json();
        const { birdid, userid, birdname, date, time, note, size, gender, imagepath } = body;
        if (!birdid || !userid || !birdname || !date || !time || !size || !gender || !imagepath) {
            return c.json({ error: 'Champs requis manquants' }, 400);
        }
        const result = await pool.query(insertObservationSQL, [birdid, userid, birdname, date, time, note || null, size, gender, imagepath]);
        return c.json(result.rows[0], 201);
    }
    catch (err) {
        console.error(err);
        if (err instanceof DatabaseError) {
            return c.json({ error: 'Erreur de base de données lors de la création de l\'observation' }, 500);
        }
        return c.json({ error: 'Erreur interne du serveur' }, 500);
    }
});
// PUT /observations/:id - Update observation
observationRoutes.put('/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id))
        return c.json({ error: 'ID invalide' }, 400);
    try {
        const body = await c.req.json();
        const { birdid, userid, birdname, date, time, note, size, gender, imagepath } = body;
        if (!birdid || !userid || !birdname || !date || !time || !size || !gender || !imagepath) {
            return c.json({ error: 'Champs requis manquants' }, 400);
        }
        const result = await pool.query(updateObservationSQL, [birdid, userid, birdname, date, time, note || null, size, gender, imagepath, id]);
        if (result.rows.length === 0)
            return c.notFound();
        return c.json(result.rows[0]);
    }
    catch (err) {
        console.error(err);
        if (err instanceof DatabaseError) {
            return c.json({ error: 'Erreur de base de données lors de la mise à jour de l\'observation' }, 500);
        }
        return c.json({ error: 'Erreur interne du serveur' }, 500);
    }
});
// DELETE /observations/:id - Delete observation
observationRoutes.delete('/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id))
        return c.json({ error: 'ID invalide' }, 400);
    try {
        const result = await pool.query(deleteObservationSQL, [id]);
        if (result.rows.length === 0)
            return c.notFound();
        return c.json({ message: 'Observation supprimée' });
    }
    catch (err) {
        console.error(err);
        if (err instanceof DatabaseError) {
            return c.json({ error: 'Erreur de base de données lors de la suppression de l\'observation' }, 500);
        }
        return c.json({ error: 'Erreur interne du serveur' }, 500);
    }
});
export default observationRoutes;
