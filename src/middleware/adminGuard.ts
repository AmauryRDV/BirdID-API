import { createMiddleware } from 'hono/factory';
import { honoJwtMiddleware } from './middleware.js'; // Assurez-vous que ce chemin est correct

// Ce middleware doit être utilisé APRÈS honoJwtMiddleware
export const adminGuard = createMiddleware(async (c, next) => {
  // Le honoJwtMiddleware doit avoir déjà été exécuté pour que jwtPayload soit présent
  const jwtPayload = c.get('jwtPayload') as { id: number, is_admin: boolean } | undefined;

  if (!jwtPayload || !jwtPayload.is_admin) {
    return c.json({ error: 'Accès non autorisé : privilèges administrateur requis.' }, 403);
  }
  await next();
});