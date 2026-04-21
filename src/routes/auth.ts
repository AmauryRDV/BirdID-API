import { Hono } from 'hono';
import type { User } from '../tables/users.js';
import { hashPassword, verifyPassword } from '../services/hashpassword.js';
import { getUserByIdSQL, insertUserSQL, getUserByEmailSQL } from '../tables/users.js';
import { pool } from '../db_connect.js';
import { DatabaseError } from 'pg';
import { sign } from 'hono/jwt';
import { isValidEmail, isStrongPassword, isNonEmptyString } from '../services/validation.js';
import { JWT_SECRET } from '../middleware/middleware.js';
import 'dotenv/config'; 
import { randomBytes, createHash } from 'crypto';
import { insertRefreshTokenSQL, getRefreshTokenByHashedTokenSQL, revokeRefreshTokenSQL, revokeAllUserRefreshTokensSQL } from '../db/tables/refresh_tokens.js';

const authRoutes = new Hono();

// Constants for token expiration
const ACCESS_TOKEN_EXPIRATION_SECONDS = 60 * 60; // 1 hour
const REFRESH_TOKEN_EXPIRATION_DAYS = 7; // 7 days

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
            exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXPIRATION_SECONDS,
        };
        const token = await sign(payload, JWT_SECRET as string);

        // Generate and store refresh token
        const refreshToken = randomBytes(32).toString('hex'); // Generate a random string for the refresh token
        const hashedRefreshToken = createHash('sha256').update(refreshToken).digest('hex'); // Hash it for storage
        const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);

        await pool.query(insertRefreshTokenSQL, [user.id, hashedRefreshToken, refreshTokenExpiresAt]);
        return c.json({
            message: 'Connexion réussie', 
            token,
            refreshToken,
            id: user.id, 
            userName: user.username 
        }, 200);
    } catch (err) {
        console.error(err);
        if (err instanceof DatabaseError) {
            if (err.code === '23505') { // Unique violation, e.g., if refresh token hash somehow collides (highly unlikely)
                return c.json({ error: 'Erreur de base de données: Conflit de token de rafraîchissement' }, 500);
            }
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

// New route for refreshing access tokens
authRoutes.post('/refresh', async (c) => {
    try {
        const body = await c.req.json();
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

        // Check if token is expired
        if (new Date(storedRefreshToken.expires_at) < new Date()) {
            await pool.query(revokeRefreshTokenSQL, [hashedRefreshToken]);
            return c.json({ error: 'Token de rafraîchissement expiré' }, 401);
        }
        if (storedRefreshToken.revoked_at !== null) {
            return c.json({ error: 'Token de rafraîchissement révoqué' }, 401);
        }

        // Get user details to create new access token payload
        const userResult = await pool.query(getUserByIdSQL, [storedRefreshToken.user_id]);
        if (userResult.rows.length === 0) { // This should ideally not happen if user_id is a foreign key and ON DELETE CASCADE is not used
            return c.json({ error: 'Utilisateur associé au token introuvable' }, 401); // or if the user was deleted without revoking tokens.
        }
        const user = userResult.rows[0] as User;

        const newAccessTokenPayload = {
            id: user.id,
            email: user.email,
            is_admin: user.is_admin,
            exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXPIRATION_SECONDS,
        };
        const newAccessToken = await sign(newAccessTokenPayload, JWT_SECRET as string);

        await pool.query(revokeRefreshTokenSQL, [hashedRefreshToken]);
        const newRefreshToken = randomBytes(32).toString('hex');
        const newHashedRefreshToken = createHash('sha256').update(newRefreshToken).digest('hex');
        const newRefreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);
        await pool.query(insertRefreshTokenSQL, [user.id, newHashedRefreshToken, newRefreshTokenExpiresAt]);
        return c.json({ message: 'Token d\'accès rafraîchi avec succès', token: newAccessToken, refreshToken: newRefreshToken }, 200);
    } catch (err) {
        console.error(err);
        if (err instanceof DatabaseError) {
            return c.json({ error: 'Erreur de base de données lors du rafraîchissement du token' }, 500);
        }
        return c.json({ error: 'Erreur interne du serveur' }, 500);
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
    } catch (err) {
        console.error(err);
        if (err instanceof DatabaseError) {
            return c.json({ error: 'Erreur de base de données lors de la déconnexion' }, 500);
        }
        return c.json({ error: 'Erreur interne du serveur' }, 500);
    }
});

export default authRoutes;