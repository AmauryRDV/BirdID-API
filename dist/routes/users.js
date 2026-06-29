import { Hono } from 'hono';
import { getAllUsers, getUserById, updateUser, deleteUser, updateUserPassword } from '../controllers/users.js';
import { getObservationsByUserId } from '../controllers/observations.js';
import { honoJwtMiddleware } from '../middleware/middleware.js';
import { adminGuard } from '../middleware/adminGuard.js';
const userRoutes = new Hono();
userRoutes.get('/', honoJwtMiddleware, adminGuard, async (c) => {
    return await getAllUsers(c);
});
userRoutes.get('/:id/observations', honoJwtMiddleware, async (c) => {
    const id = parseInt(c.req.param('id'), 10);
    if (isNaN(id))
        return c.json({ error: 'ID invalide' }, 400);
    const jwtPayload = c.get('jwtPayload');
    if (jwtPayload.id !== id && !jwtPayload.is_admin) {
        return c.json({ error: 'Accès interdit' }, 403);
    }
    return await getObservationsByUserId(c);
});
userRoutes.get('/:id', honoJwtMiddleware, async (c) => {
    const id = parseInt(c.req.param('id'), 10);
    if (isNaN(id))
        return c.json({ error: 'ID invalide' }, 400);
    return await getUserById(c);
});
userRoutes.put('/:id', honoJwtMiddleware, async (c) => {
    const id = parseInt(c.req.param('id'), 10);
    if (isNaN(id))
        return c.json({ error: 'ID invalide' }, 400);
    const jwtPayload = c.get('jwtPayload');
    if (jwtPayload.id !== id && !jwtPayload.is_admin) {
        return c.json({ error: 'Accès interdit : vous n\'êtes pas autorisé à modifier ce profil' }, 403);
    }
    return await updateUser(c);
});
userRoutes.put('/:id/password', honoJwtMiddleware, async (c) => {
    const id = parseInt(c.req.param('id'), 10);
    if (isNaN(id))
        return c.json({ error: 'ID invalide' }, 400);
    const jwtPayload = c.get('jwtPayload');
    if (jwtPayload.id !== id) {
        return c.json({ error: 'Accès interdit : vous n\'êtes pas autorisé à modifier ce mot de passe' }, 403);
    }
    return await updateUserPassword(c);
});
userRoutes.delete('/:id', honoJwtMiddleware, async (c) => {
    const id = parseInt(c.req.param('id'), 10);
    if (isNaN(id))
        return c.json({ error: 'ID invalide' }, 400);
    const jwtPayload = c.get('jwtPayload');
    if (jwtPayload.id !== id && !jwtPayload.is_admin) {
        return c.json({ error: 'Accès interdit : vous n\'êtes pas autorisé à supprimer ce profil' }, 403);
    }
    return await deleteUser(c);
});
export default userRoutes;
