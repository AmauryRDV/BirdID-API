import { Hono } from 'hono';
import { getAllObservations, getObservationById, createObservation, updateObservation, deleteObservation } from '../controllers/observations.js';
import { honoJwtMiddleware } from '../middleware/middleware.js';
const observationRoutes = new Hono();
observationRoutes.get('/', async (c) => {
    return await getAllObservations(c);
});
observationRoutes.get('/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id))
        return c.json({ error: 'ID invalide' }, 400);
    return await getObservationById(c);
});
observationRoutes.post('/', honoJwtMiddleware, async (c) => {
    return await createObservation(c);
});
observationRoutes.put('/:id', honoJwtMiddleware, async (c) => {
    const id = parseInt(c.req.param('id'), 10);
    if (isNaN(id))
        return c.json({ error: 'ID invalide' }, 400);
    return await updateObservation(c);
});
observationRoutes.delete('/:id', honoJwtMiddleware, async (c) => {
    const id = parseInt(c.req.param('id'), 10);
    if (isNaN(id))
        return c.json({ error: 'ID invalide' }, 400);
    return await deleteObservation(c);
});
export default observationRoutes;
