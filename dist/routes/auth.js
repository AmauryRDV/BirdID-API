import { Hono } from 'hono';
import { hashPassword, verifyPassword } from '../services/hashpassword.js';
import { getUserByIdSQL, insertUserSQL, getUserByEmailSQL } from '../db/tables/users.js';
import { pool } from '../db_connect.js';
import { DatabaseError } from 'pg';
import { sign } from 'hono/jwt';
import { isValidEmail, isStrongPassword, isNonEmptyString } from '../services/validation.js';
import { JWT_SECRET } from '../middleware/middleware.js';
import 'dotenv/config';
import { randomBytes, createHash } from 'crypto';
import { insertRefreshTokenSQL, getRefreshTokenByHashedTokenSQL, revokeRefreshTokenSQL, revokeAllUserRefreshTokensSQL } from '../db/tables/refresh_tokens.js';
import { createUser } from '../controllers/users.js';
const authRoutes = new Hono();
const ACCESS_TOKEN_EXPIRATION_SECONDS = 60 * 60;
const REFRESH_TOKEN_EXPIRATION_DAYS = 30;
authRoutes.post('/login', async (c) => {
    try {
        const body = await c.req.json();
        if (!body || typeof body !== 'object')
            return c.json({ error: 'Body invalide' }, 400);
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
        const payload = {
            id: Number(user.id),
            email: user.email,
            is_admin: user.is_admin,
            exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXPIRATION_SECONDS,
        };
        const token = await sign(payload, JWT_SECRET);
        const refreshToken = randomBytes(32).toString('hex');
        const hashedRefreshToken = createHash('sha256').update(refreshToken).digest('hex');
        const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);
        await pool.query(insertRefreshTokenSQL, [user.id, hashedRefreshToken, refreshTokenExpiresAt]);
        return c.json({
            message: 'Connexion réussie',
            token,
            refreshToken,
            id: user.id,
            userName: user.username
        }, 200);
    }
    catch (err) {
        console.error(err);
        if (err instanceof DatabaseError) {
            return c.json({ error: 'Conflit de token de rafraîchissement' }, 500);
        }
        return c.json({ error: 'Erreur lors de la connexion' }, 500);
    }
});
authRoutes.post('/register', async (c) => {
    try {
        return await createUser(c);
    }
    catch (err) {
        console.error(err);
        if (err instanceof DatabaseError && err.code === '23505') {
            return c.json({ error: 'Email déjà utilisé' }, 409);
        }
        return c.json({ error: 'Erreur de base de données lors de l\'enregistrement' }, 500);
    }
});
authRoutes.post('/refresh', async (c) => {
    try {
        const body = await c.req.json();
        if (!body || typeof body !== 'object')
            return c.json({ error: 'Body invalide' }, 400);
        const { refreshToken } = body;
        if (!refreshToken) {
            return c.json({ error: 'Token de rafraîchissement manquant' }, 400);
        }
        const hashedRefreshToken = createHash('sha256').update(refreshToken).digest('hex');
        const result = await pool.query(getRefreshTokenByHashedTokenSQL, [hashedRefreshToken]);
        if (result.rows.length === 0) {
            return c.json({ error: 'Token de rafraîchissement invalide' }, 401);
        }
        const storedRefreshToken = result.rows[0];
        if (new Date(storedRefreshToken.expires_at) < new Date()) {
            await pool.query(revokeRefreshTokenSQL, [hashedRefreshToken]);
            return c.json({ error: 'Token de rafraîchissement expiré' }, 401);
        }
        if (storedRefreshToken.revoked_at !== null) {
            return c.json({ error: 'Token de rafraîchissement révoqué' }, 401);
        }
        const userResult = await pool.query(getUserByIdSQL, [storedRefreshToken.user_id]);
        if (userResult.rows.length === 0) {
            return c.json({ error: 'Utilisateur associé au token introuvable' }, 401);
        }
        const user = userResult.rows[0];
        const newAccessTokenPayload = {
            id: Number(user.id),
            email: user.email,
            is_admin: user.is_admin,
            exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXPIRATION_SECONDS,
        };
        const newAccessToken = await sign(newAccessTokenPayload, JWT_SECRET);
        await pool.query(revokeRefreshTokenSQL, [hashedRefreshToken]);
        const newRefreshToken = randomBytes(32).toString('hex');
        const newHashedRefreshToken = createHash('sha256').update(newRefreshToken).digest('hex');
        const newRefreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);
        await pool.query(insertRefreshTokenSQL, [user.id, newHashedRefreshToken, newRefreshTokenExpiresAt]);
        return c.json({ message: 'Token d\'accès rafraîchi avec succès', token: newAccessToken, refreshToken: newRefreshToken }, 200);
    }
    catch (err) {
        console.error(err);
        return c.json({ error: 'Erreur de base de données lors du rafraîchissement du token' }, 500);
    }
});
authRoutes.post('/logout', async (c) => {
    try {
        const body = await c.req.json();
        const { refreshToken } = body;
        if (!refreshToken) {
            return c.json({ error: 'Token de rafraîchissement manquant' }, 400);
        }
        const hashedRefreshToken = createHash('sha256').update(refreshToken).digest('hex');
        await pool.query(revokeRefreshTokenSQL, [hashedRefreshToken]);
        return c.json({ message: 'Déconnexion réussie' }, 200);
    }
    catch (err) {
        console.error(err);
        return c.json({ error: 'Erreur de base de données lors de la déconnexion' }, 500);
    }
});
export default authRoutes;
