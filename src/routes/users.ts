import { Hono } from 'hono';
import type { User } from '../db/tables/users.js';
import { getAllUsers, getUserById, createUser, updateUser, deleteUser } from '../controllers/users.js';
import { updateUserPassword } from '../controllers/users.js';
import { honoJwtMiddleware } from '../middleware/middleware.js';
import { DatabaseError } from 'pg';
import { pool } from '../db_connect.js';
import { getUserByIdSQL } from '../db/tables/users.js';

const userRoutes = new Hono();

userRoutes.get('/', honoJwtMiddleware, async (c) => {
  try {
    return await getAllUsers(c);
  } catch (err) {
    console.error(err);
    if (err instanceof DatabaseError) {
      return c.json({ error: 'Erreur de base de données lors de la récupération des utilisateurs' }, 500);
    }
    return c.json({ error: 'Erreur interne du serveur lors de la récupération des utilisateurs' }, 500);
  }
});

userRoutes.get('/:id', honoJwtMiddleware, async (c) => {
  const id = parseInt(c.req.param('id')!, 10);
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400);
  try {
    return await getUserById(c);
  } catch (err) {
    console.error(err);
    if (err instanceof DatabaseError) {
      return c.json({ error: 'Erreur de base de données lors de la récupération de l\'utilisateur' }, 500);
    }
    return c.json({ error: 'Erreur interne du serveur lors de la récupération de l\'utilisateur' }, 500);
  }
});


userRoutes.put('/:id', honoJwtMiddleware, async (c) => {
  const id = parseInt(c.req.param('id')!, 10);
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400);

  const jwtPayload = c.get('jwtPayload') as { id: number, is_admin: boolean };
  if (jwtPayload.id !== id) {
    return c.json({ error: 'Accès interdit : vous n\'êtes pas autorisé à modifier ce profil' }, 403);
  }

  try {
    return await updateUser(c);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Erreur lors de la mise à jour de l\'utilisateur' }, 500);
  }
});

userRoutes.put('/:id/password', honoJwtMiddleware, async (c) => {
  const id = parseInt(c.req.param('id')!, 10);
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400);

  const jwtPayload = c.get('jwtPayload') as { id: number };
  if (jwtPayload.id !== id) {
    return c.json({ error: 'Accès interdit : vous n\'êtes pas autorisé à modifier ce mot de passe' }, 403);
  }

  try {
    return await updateUserPassword(c);
  } catch (err) {
    console.error(err);
    if (err instanceof DatabaseError) {
      return c.json({ error: 'Erreur de base de données lors de la mise à jour du mot de passe' }, 500);
    }
    return c.json({ error: 'Erreur interne du serveur lors de la mise à jour du mot de passe' }, 500);
  }
});

userRoutes.delete('/:id', honoJwtMiddleware, async (c) => {
  const id = parseInt(c.req.param('id')!, 10);
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400);

  const jwtPayload = c.get('jwtPayload') as { id: number, is_admin: boolean };
  if (jwtPayload.id !== id) {
    return c.json({ error: 'Accès interdit : vous n\'êtes pas autorisé à supprimer ce profil' }, 403);
  }

  try {
    return await deleteUser(c);
  } catch (err) {
    console.error(err);
    if (err instanceof DatabaseError) {
      return c.json({ error: 'Erreur de base de données lors de la suppression de l\'utilisateur' }, 500);
    }
    return c.json({ error: 'Erreur interne du serveur lors de la suppression de l\'utilisateur' }, 500);
  }
});

export default userRoutes;