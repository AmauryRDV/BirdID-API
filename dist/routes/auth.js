import { Hono } from 'hono';
import { hashPassword, verifyPassword } from '../services/hashpassword.js';
import { getAllUsersSQL, getUserByIdSQL, insertUserSQL, updateUserSQL, deleteUserSQL, getUserByEmailSQL } from '../tables/users.js';
import { pool } from '../db_connect.js';
import { DatabaseError } from 'pg';
// import { sign } from 'jsonwebtoken';
import { isValidEmail, isStrongPassword, isNonEmptyString } from '../services/validation.js';
import 'dotenv/config';
const authRoutes = new Hono();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === 'super_secret_dev_key_do_not_use_in_prod') {
    console.error('ERREUR CRITIQUE: La variable d\'environnement JWT_SECRET n\'est pas définie ou utilise une valeur par défaut non sécurisée.');
    throw new Error('JWT_SECRET doit être défini avec une clé forte et unique dans le fichier .env.');
}
authRoutes.post('/login', async (c) => {
    try {
        const body = await c.req.json();
        const { email, password } = body;
        if (!email || !password)
            return c.json({ error: 'Champs requis manquants' }, 400);
        if (!isValidEmail(email))
            return c.json({ error: 'Format d\'email invalide' }, 400);
        if (!isStrongPassword(password))
            return c.json({ error: 'Le mot de passe doit contenir au moins 8 caractères' }, 400);
        const result = await pool.query(getUserByEmailSQL, [email]);
        if (result.rows.length === 0)
            return c.json({ error: 'Email ou mot de passe incorrect' }, 401);
        const user = result.rows[0];
        const isPasswordValid = await verifyPassword(password, user.password);
        if (!isPasswordValid)
            return c.json({ error: 'Email ou mot de passe incorrect' }, 401);
        // const token = sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
        return c.json({ message: 'Connexion réussie', id: user.id, userName: user.username }, 200);
    }
    catch (err) {
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
        if (!userName || !email || !password)
            return c.json({ error: 'Champs requis manquants' }, 400);
        if (!isNonEmptyString(userName))
            return c.json({ error: 'Le nom d\'utilisateur ne peut pas être vide' }, 400);
        if (!isValidEmail(email))
            return c.json({ error: 'Format d\'email invalide' }, 400);
        if (!isStrongPassword(password))
            return c.json({ error: 'Le mot de passe doit contenir au moins 8 caractères' }, 400);
        const hashedPassword = await hashPassword(password);
        const result = await pool.query(insertUserSQL, [userName, email, hashedPassword, notes || null, points || 0, avatar || '0']);
        return c.json({ message: 'Utilisateur enregistré avec succès', id: result.rows[0].id, userName: result.rows[0].userName }, 201);
    }
    catch (err) {
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
export default authRoutes;
