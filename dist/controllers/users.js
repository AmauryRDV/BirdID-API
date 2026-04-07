import { pool } from '../db_connect.js';
import { DatabaseError } from 'pg';
import { hashPassword, verifyPassword } from '../services/hashpassword.js';
import { getAllUsersSQL, getUserByIdSQL, insertUserSQL, updateUserSQL, deleteUserSQL } from '../db/tables/users.js';
export const getAllUsers = async (c) => {
    try {
        const result = await pool.query(getAllUsersSQL);
        return c.json(result.rows);
    }
    catch (err) {
        console.error(err);
        if (err instanceof DatabaseError) {
            return c.json({ error: 'Erreur de base de données lors de la récupération des utilisateurs' }, 500);
        }
        return c.json({ error: 'Erreur interne du serveur' }, 500);
    }
};
export const getUserById = async (c) => {
    const id = parseInt(c.req.param('id') || '', 10);
    if (isNaN(id))
        return c.json({ error: 'ID invalide' }, 400);
    try {
        const result = await pool.query(getUserByIdSQL, [id]);
        if (result.rows.length === 0)
            return c.notFound();
        return c.json(result.rows[0]);
    }
    catch (err) {
        console.error(err);
        if (err instanceof DatabaseError) {
            return c.json({ error: 'Erreur de base de données lors de la récupération de l\'utilisateur' }, 500);
        }
        return c.json({ error: 'Erreur interne du serveur' }, 500);
    }
};
export const getUserByEmail = async (c) => {
    const email = c.req.param('email');
    try {
        const result = await pool.query('SELECT id, username, email, notes, points, avatar, created_at, updated_at FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0)
            return c.notFound();
        return c.json(result.rows[0]);
    }
    catch (err) {
        console.error(err);
        if (err instanceof DatabaseError) {
            return c.json({ error: 'Erreur de base de données lors de la récupération de l\'utilisateur' }, 500);
        }
        return c.json({ error: 'Erreur interne du serveur' }, 500);
    }
};
export const createUser = async (c) => {
    try {
        const body = await c.req.json();
        const { userName, email, password, notes, points, avatar } = body;
        if (!userName || !email || !password)
            return c.json({ error: 'Champs requis manquants' }, 400);
        const hashedPassword = await hashPassword(password);
        const result = await pool.query(insertUserSQL, [userName, email, hashedPassword, notes || null, points || 0, avatar || '0']);
        return c.json(result.rows[0], 201);
    }
    catch (err) {
        console.error(err);
        if (err instanceof DatabaseError) {
            if (err.code === '23505') {
                return c.json({ error: 'Email déjà utilisé' }, 409);
            }
            return c.json({ error: 'Erreur de base de données lors de la création de l\'utilisateur' }, 500);
        }
        return c.json({ error: 'Erreur interne du serveur' }, 500);
    }
};
export const updateUser = async (c) => {
    const id = parseInt(c.req.param('id') || '', 10);
    if (isNaN(id))
        return c.json({ error: 'ID invalide' }, 400);
    try {
        const body = await c.req.json();
        const { userName, email, password, notes, points, avatar } = body;
        if (!userName || !email || !password)
            return c.json({ error: 'Champs requis manquants' }, 400);
        const hashedPassword = await hashPassword(password);
        const result = await pool.query(updateUserSQL, [userName, email, hashedPassword, notes, points, avatar, id]);
        if (result.rows.length === 0)
            return c.notFound();
        return c.json(result.rows[0]);
    }
    catch (err) {
        console.error(err);
        if (err instanceof DatabaseError) {
            if (err.code === '23505') {
                return c.json({ error: 'Email déjà utilisé' }, 409);
            }
            return c.json({ error: 'Erreur de base de données lors de la mise à jour de l\'utilisateur' }, 500);
        }
        return c.json({ error: 'Erreur interne du serveur' }, 500);
    }
};
export const deleteUser = async (c) => {
    const id = parseInt(c.req.param('id') || '', 10);
    if (isNaN(id))
        return c.json({ error: 'ID invalide' }, 400);
    try {
        const result = await pool.query(deleteUserSQL, [id]);
        if (result.rows.length === 0)
            return c.notFound();
        return c.json({ message: 'Utilisateur supprimé' });
    }
    catch (err) {
        console.error(err);
        if (err instanceof DatabaseError) {
            return c.json({ error: 'Erreur de base de données lors de la suppression de l\'utilisateur' }, 500);
        }
        return c.json({ error: 'Erreur interne du serveur' }, 500);
    }
};
