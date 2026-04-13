import { Hono } from 'hono';
import type { User } from '../tables/users.js';
import { hashPassword, verifyPassword } from '../services/hashpassword.js';
import { getAllUsersSQL, getUserByIdSQL, insertUserSQL, updateUserSQL, deleteUserSQL, getUserByEmailSQL } from '../tables/users.js';
import { pool } from '../db_connect.js';
import { DatabaseError } from 'pg';
import { sign } from 'hono/jwt';
import { isValidEmail, isStrongPassword, isNonEmptyString } from '../services/validation.js';
import { JWT_SECRET } from '../middleware/middleware.js';
import 'dotenv/config'; 

const authRoutes = new Hono();

authRoutes.post('/login', async (c) => {
    try {
        const body = await c.req.json();
        const { email, password } = body;
        if (!email || !password) return c.json({ error: 'Champs requis manquants' }, 400);
        if (!isValidEmail(email)) return c.json({ error: 'Format d\'email invalide' }, 400);
        if (!isStrongPassword(password)) return c.json({ error: 'Le mot de passe doit contenir au moins 8 caractères' }, 400);
        const result = await pool.query(getUserByEmailSQL, [email]);
        if (result.rows.length === 0) return c.json({ error: 'Email ou mot de passe incorrect' }, 401);
        const user = result.rows[0] as User;
        const isPasswordValid = await verifyPassword(password, user.password);
        if (!isPasswordValid) return c.json({ error: 'Email ou mot de passe incorrect' }, 401);
        
        const payload = {
            id: user.id,
            email: user.email,
                is_admin: user.is_admin,
                exp: Math.floor(Date.now() / 1000) + 60 * 60,
        };
        const token = await sign(payload, JWT_SECRET as string);
        return c.json({ message: 'Connexion réussie', token, id: user.id, userName: user.username }, 200);
    } catch (err) {
        console.error(err);
        if (err instanceof DatabaseError) {
            return c.json({ error: 'Erreur de base de données lors de la connexion' }, 500);
        }
        return c.json({ error: 'Erreur interne du serveur' }, 500);
    }
});

authRoutes.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const { userName, email, password, notes, points, avatar } = body;
    if (!userName || !email || !password) return c.json({ error: 'Champs requis manquants' }, 400);
    if (!isNonEmptyString(userName)) return c.json({ error: 'Le nom d\'utilisateur ne peut pas être vide' }, 400);
    if (!isValidEmail(email)) return c.json({ error: 'Format d\'email invalide' }, 400);
    if (!isStrongPassword(password)) return c.json({ error: 'Le mot de passe doit contenir au moins 8 caractères' }, 400);
    const hashedPassword = await hashPassword(password);
    const result = await pool.query(insertUserSQL, [userName, email, hashedPassword, notes || null, points || 0, avatar || '0']);
    return c.json({ message: 'Utilisateur enregistré avec succès', id: result.rows[0].id, userName: result.rows[0].userName }, 201);
  } catch (err) {
    console.error(err);
    if (err instanceof DatabaseError) {
        if (err.code === '23505') {
            return c.json({ error: 'Email déjà utilisé' }, 409);
        }
      return c.json({ error: 'Erreur de base de données lors de l\'enregistrement' }, 500);
    }   
    return c.json({ error: 'Erreur interne du serveur' }, 500);
    }
});

authRoutes.post('/logout', async (c) => {
  return c.json({ message: 'Déconnexion réussie' }, 200);
});

export default authRoutes;