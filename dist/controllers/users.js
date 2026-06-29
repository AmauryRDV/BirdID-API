import { pool } from '../db_connect.js';
import { DatabaseError } from 'pg';
import { hashPassword, verifyPassword } from '../services/hashpassword.js';
import { getAllUsersSQL, getUserByIdSQL, insertUserSQL, updateUserSQL, deleteUserSQL, getUserByEmailSQL } from '../db/tables/users.js';
import { isNonEmptyString, isValidEmail, isStrongPassword } from '../services/validation.js';
export const getAllUsers = async (c) => {
    try {
        let page = parseInt(c.req.query('page') || '1', 10);
        let limit = parseInt(c.req.query('limit') || '20', 10);
        if (isNaN(page) || page < 1)
            page = 1;
        if (isNaN(limit) || limit < 1)
            limit = 20;
        if (limit > 100)
            limit = 100;
        const offset = (page - 1) * limit;
        const result = await pool.query(getAllUsersSQL, [limit, offset]);
        return c.json(result.rows.map(user => { const { password, ...rest } = user; return rest; }));
    }
    catch (err) {
        console.error(err);
        return c.json({ error: 'Erreur lors de la récupération des utilisateurs' }, 500);
    }
};
export const getUserById = async (c) => {
    const id = parseInt(c.req.param('id'), 10);
    if (isNaN(id))
        return c.json({ error: 'ID invalide' }, 400);
    try {
        const result = await pool.query(getUserByIdSQL, [id]);
        if (result.rows.length === 0)
            return c.json({ error: 'Utilisateur introuvable' }, 404);
        const { password, ...userWithoutPassword } = result.rows[0];
        return c.json(userWithoutPassword);
    }
    catch (err) {
        console.error(err);
        return c.json({ error: 'Erreur lors de la récupération de l\'utilisateur' }, 500);
    }
};
export const getUserByEmail = async (c) => {
    const email = c.req.param('email');
    if (!email)
        return c.json({ error: 'Email manquant' }, 400);
    try {
        const result = await pool.query(getUserByEmailSQL, [email]);
        if (result.rows.length === 0)
            return c.json({ error: 'Utilisateur introuvable' }, 404);
        return c.json(result.rows[0]);
    }
    catch (err) {
        console.error(err);
        return c.json({ error: 'Erreur lors de la récupération de l\'utilisateur' }, 500);
    }
};
export const createUser = async (c) => {
    try {
        const body = await c.req.json();
        if (!body || typeof body !== 'object')
            return c.json({ error: 'Body invalide' }, 400);
        const requiredKeys = ['userName', 'email', 'password'];
        const missing = [];
        for (const key of requiredKeys) {
            const value = body[key];
            if (value == null || value === '')
                missing.push(key);
        }
        if (missing.length) {
            return c.json({ error: 'Champs requis manquants', missing }, 400);
        }
        if (!isNonEmptyString(body.userName))
            return c.json({ error: 'Le nom d\'utilisateur ne peut pas être vide' }, 400);
        if (!isValidEmail(body.email))
            return c.json({ error: 'Format d\'email invalide' }, 400);
        if (!isStrongPassword(body.password))
            return c.json({ error: 'Le mot de passe doit contenir au moins 8 caractères' }, 400);
        const { userName, email, password, notes, points, avatar } = body;
        const hashedPassword = await hashPassword(password);
        const result = await pool.query(insertUserSQL, [userName, email, hashedPassword, notes || null, points || 0, avatar || '0']);
        return c.json(result.rows[0], 201);
    }
    catch (err) {
        console.error(err);
        if (err instanceof DatabaseError && err.code === '23505') {
            return c.json({ error: 'Email déjà utilisé' }, 409);
        }
        return c.json({ error: 'Erreur lors de la création de l\'utilisateur' }, 500);
    }
};
export const updateUser = async (c) => {
    const id = parseInt(c.req.param('id'), 10);
    if (isNaN(id))
        return c.json({ error: 'ID invalide' }, 400);
    try {
        const jwtPayload = c.get('jwtPayload');
        const existingUserResult = await pool.query(getUserByIdSQL, [id]);
        if (existingUserResult.rows.length === 0)
            return c.json({ error: 'Utilisateur introuvable' }, 404);
        const existingUser = existingUserResult.rows[0];
        if (jwtPayload.id !== id && !jwtPayload.is_admin) {
            return c.json({ error: 'Accès interdit : vous n\'êtes pas autorisé à modifier ce profil' }, 403);
        }
        const body = await c.req.json();
        if (!body || typeof body !== 'object') {
            return c.json({ error: 'Body invalide' }, 400);
        }
        const userName = body.userName !== undefined ? body.userName : existingUser.username;
        const email = body.email !== undefined ? body.email : existingUser.email;
        const notes = body.notes !== undefined ? body.notes : existingUser.notes;
        const points = body.points !== undefined ? body.points : existingUser.points;
        const avatar = body.avatar !== undefined ? body.avatar : existingUser.avatar;
        if (userName !== undefined && !isNonEmptyString(userName))
            return c.json({ error: 'Le nom d\'utilisateur ne peut pas être vide' }, 400);
        if (email !== undefined && !isValidEmail(email))
            return c.json({ error: 'Format d\'email invalide' }, 400);
        if (notes !== undefined && notes !== null && !isNonEmptyString(notes))
            return c.json({ error: 'Les notes doivent être une chaîne de caractères non vide' }, 400);
        if (avatar !== undefined && avatar !== null && !isNonEmptyString(avatar))
            return c.json({ error: 'L\'avatar doit être une chaîne de caractères non vide' }, 400);
        if (Object.keys(body).length === 0) {
            return c.json({ message: 'Aucun champ fourni pour la mise à jour' }, 200);
        }
        const result = await pool.query(updateUserSQL, [userName, email, notes, points, avatar, id]);
        if (result.rows.length === 0)
            return c.notFound();
        const { password: _password, ...updatedUserWithoutPassword } = result.rows[0];
        return c.json(updatedUserWithoutPassword);
    }
    catch (err) {
        console.error(err);
        if (err instanceof DatabaseError && err.code === '23505') {
            return c.json({ error: 'Email déjà utilisé' }, 409);
        }
        return c.json({ error: 'Erreur lors de la mise à jour de l\'utilisateur' }, 500);
    }
};
export const updateUserPassword = async (c) => {
    const id = parseInt(c.req.param('id'), 10);
    if (isNaN(id))
        return c.json({ error: 'ID invalide' }, 400);
    const jwtPayload = c.get('jwtPayload');
    if (jwtPayload.id !== id) {
        return c.json({ error: 'Accès interdit : vous n\'êtes pas autorisé à modifier ce mot de passe' }, 403);
    }
    try {
        const body = await c.req.json();
        const { oldPassword, newPassword } = body;
        if (!oldPassword || !newPassword) {
            return c.json({ error: 'Ancien et nouveau mot de passe requis' }, 400);
        }
        if (!isStrongPassword(newPassword)) {
            return c.json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères' }, 400);
        }
        const userResult = await pool.query(getUserByIdSQL, [id]);
        if (userResult.rows.length === 0)
            return c.json({ error: 'Utilisateur introuvable' }, 404);
        const user = userResult.rows[0];
        const isOldPasswordValid = await verifyPassword(oldPassword, user.password);
        if (!isOldPasswordValid) {
            return c.json({ error: 'mot de passe incorrect' }, 401);
        }
        const hashedPassword = await hashPassword(newPassword);
        await pool.query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hashedPassword, id]);
        return c.json({ message: 'Mot de passe mis à jour avec succès' });
    }
    catch (err) {
        console.error('Erreur lors de la mise à jour du mot de passe:', err);
        if (err instanceof DatabaseError) {
            return c.json({ error: 'Erreur de base de données lors de la mise à jour du mot de passe' }, 500);
        }
        return c.json({ error: 'Erreur interne du serveur lors de la mise à jour du mot de passe' }, 500);
    }
};
export const deleteUser = async (c) => {
    const id = parseInt(c.req.param('id'), 10);
    if (isNaN(id))
        return c.json({ error: 'ID invalide' }, 400);
    try {
        const jwtPayload = c.get('jwtPayload');
        const existingUserResult = await pool.query(getUserByIdSQL, [id]);
        if (existingUserResult.rows.length === 0)
            return c.json({ error: 'Utilisateur introuvable' }, 404);
        const existingUser = existingUserResult.rows[0];
        if (jwtPayload.id !== id && !jwtPayload.is_admin) {
            return c.json({ error: 'Accès interdit : vous n\'êtes pas autorisé à supprimer ce profil' }, 403);
        }
        const result = await pool.query(deleteUserSQL, [id]);
        if (result.rows.length === 0)
            return c.json({ error: 'Utilisateur inconnu' }, 404);
        return c.json({ message: 'Utilisateur supprimé' }, 200);
    }
    catch (err) {
        console.error(err);
        return c.json({ error: 'Erreur lors de la suppression de l\'utilisateur' }, 500);
    }
};
