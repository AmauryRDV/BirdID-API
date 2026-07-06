import { Hono } from 'hono';
import { getAllAchievements, getAchievementById } from '../controllers/achievements.js';
const achievementRoutes = new Hono();
achievementRoutes.get('/', async (c) => {
    return await getAllAchievements(c);
});
achievementRoutes.get('/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id))
        return c.json({ error: 'ID invalide' }, 400);
    return await getAchievementById(c);
});
export default achievementRoutes;
