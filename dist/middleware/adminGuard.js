import { createMiddleware } from 'hono/factory';
import { honoJwtMiddleware } from './middleware.js';
export const adminGuard = createMiddleware(async (c, next) => {
    const jwtPayload = c.get('jwtPayload');
    if (!jwtPayload || !jwtPayload.is_admin) {
        return c.json({ error: 'Accès non autorisé : privilèges administrateur requis.' }, 403);
    }
    await next();
});
