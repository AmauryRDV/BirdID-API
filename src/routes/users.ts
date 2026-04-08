import { Hono } from 'hono';
import type { User } from '../tables/users.js';
import { hashPassword } from '../services/hashpassword.js';
import { getAllUsersSQL, getUserByIdSQL, insertUserSQL, updateUserSQL, deleteUserSQL } from '../tables/users.js';
import { pool } from '../db_connect.js';
import { isValidEmail, isStrongPassword, isNonEmptyString, isPositiveInteger } from '../services/validation.js';
import { DatabaseError } from 'pg';
import { honoJwtMiddleware } from '../middleware/middleware.js';

const userRoutes = new Hono();

userRoutes.get('/', async (c) => {
  try {
    let page = parseInt(c.req.query('page') || '1', 10);
    let limit = parseInt(c.req.query('limit') || '20', 10);
    
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100; // Protection contre une requête trop lourde
    
    const offset = (page - 1) * limit;
    const result = await pool.query(getAllUsersSQL, [limit, offset]);
    return c.json(result.rows.map(user => { const { password, ...rest } = user; return rest; })); 
  } catch (err) {
    console.error(err);
    if (err instanceof DatabaseError) {
      return c.json({ error: 'Erreur de base de données lors de la récupération des utilisateurs' }, 500);
    }
    return c.json({ error: 'Erreur interne du serveur' }, 500);
  }
});

userRoutes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400);
  try {
    const result = await pool.query(getUserByIdSQL, [id]);
    if (result.rows.length === 0) return c.notFound();
    const { password, ...userWithoutPassword } = result.rows[0]; // Filtrer le mot de passe
    return c.json(userWithoutPassword);
  } catch (err) {
    console.error(err);
    if (err instanceof DatabaseError) {
      return c.json({ error: 'Erreur de base de données lors de la récupération de l\'utilisateur' }, 500);
    }
    return c.json({ error: 'Erreur interne du serveur' }, 500);
  }
});


userRoutes.put('/:id', honoJwtMiddleware, async (c) => {
  const id = parseInt(c.req.param('id'));
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400);
  try {
    const body = await c.req.json();
    const { userName, email, password, notes, points, avatar } = body;
    if (!userName || !email || !password) return c.json({ error: 'Champs requis manquants' }, 400);
    if (!isNonEmptyString(userName)) return c.json({ error: 'Le nom d\'utilisateur ne peut pas être vide' }, 400);
    if (!isValidEmail(email)) return c.json({ error: 'Format d\'email invalide' }, 400);
    if (!isStrongPassword(password)) return c.json({ error: 'Le mot de passe doit contenir au moins 8 caractères' }, 400);
    // Les champs notes, points, avatar sont optionnels mais s'ils sont fournis, ils doivent être valides
    if (notes !== undefined && notes !== null && !isNonEmptyString(notes)) return c.json({ error: 'Les notes doivent être une chaîne de caractères non vide' }, 400);
    if (points !== undefined && points !== null && !isPositiveInteger(points)) return c.json({ error: 'Les points doivent être un nombre entier positif' }, 400);
    if (avatar !== undefined && avatar !== null && !isNonEmptyString(avatar)) return c.json({ error: 'L\'avatar doit être une chaîne de caractères non vide' }, 400);
    const hashedPassword = await hashPassword(password);
    const result = await pool.query(updateUserSQL, [userName, email, hashedPassword, notes, points, avatar, id]);
    if (result.rows.length === 0) return c.notFound();
    const { password: _password, ...updatedUserWithoutPassword } = result.rows[0]; // Renommer 'password' pour éviter la redéclaration
    return c.json(updatedUserWithoutPassword);
  } catch (err) {
    console.error(err);
    if (err instanceof DatabaseError) {
      if (err.code === '23505') {
        return c.json({ error: 'Email déjà utilisé' }, 409);
      }
      return c.json({ error: 'Erreur de base de données lors de la mise à jour de l\'utilisateur' }, 500);
    }
    return c.json({ error: 'Erreur interne du serveur' }, 500);
  }
});

userRoutes.delete('/:id', honoJwtMiddleware, async (c) => {
  const id = parseInt(c.req.param('id'));
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400);
  try {
    const result = await pool.query(deleteUserSQL, [id]);
    if (result.rows.length === 0) return c.notFound();
    return c.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    console.error(err);
    if (err instanceof DatabaseError) {
      return c.json({ error: 'Erreur de base de données lors de la suppression de l\'utilisateur' }, 500);
    }
    return c.json({ error: 'Erreur interne du serveur' }, 500);
  }
});

export default userRoutes;