import type { Context } from 'hono';
import { pool } from '../db_connect.js';
import { DatabaseError } from 'pg';
import { hashPassword, verifyPassword } from '../services/hashpassword.js';

import { getAllUsersSQL, getUserByIdSQL, insertUserSQL, updateUserSQL, deleteUserSQL } from '../db/tables/users.js';

export const getAllUsers = async (c: Context) => {
  try {
    const result = await pool.query(getAllUsersSQL);
    return c.json(result.rows);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Erreur lors de la récupération des utilisateurs' }, 500);
  }
};

export const getUserById = async (c: Context) => {
  const id = parseInt(c.req.param('id'));
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400);
  try {
    const result = await pool.query(getUserByIdSQL, [id]);
    if (result.rows.length === 0) return c.json({ error: 'Utilisateur introuvable' }, 404);
    return c.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Erreur lors de la récupération de l\'utilisateur' }, 500);
  }
};

export const getUserByEmail = async (c: Context) => {
  const email = c.req.param('email');
  try {
    // const result = await pool.query('SELECT id, username, email, notes, points, avatar, created_at, updated_at FROM users WHERE email = $1', [email]);
    const result = await pool.query(getUserByEmail, [email]);
    if (result.rows.length === 0) return c.json({ error: 'Utilisateur introuvable' }, 404);
    return c.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Erreur lors de la récupération de l\'utilisateur' }, 500);
  }
};

export const createUser = async (c: Context) => {
  try {
    const body = await c.req.json();
    if (!body || typeof body !== 'object') return c.json({ error: 'Body invalide' }, 400);
    const requiredKeys = ['userName', 'email', 'password'];
    const missing = [];
    for (const key of requiredKeys) {
      const value = body[key];
      if (value == null || value === '') missing.push(key);
    }
    if (missing.length) {
      return c.json({ error: 'Champs requis manquants', missing }, 400);
    }
    const { userName, email, password, notes, points, avatar } = body;
    const hashedPassword = await hashPassword(password);
    const result = await pool.query(insertUserSQL, [userName, email, hashedPassword, notes || null, points || 0, avatar || '0']);
    return c.json(result.rows[0], 201);
  } catch (err) {
    console.error(err);
    if (DatabaseError.code === '23505') {
        return c.json({ error: 'Email déjà utilisé' }, 409);
    }
    return c.json({ error: 'Erreur lors de la création de l\'utilisateur' }, 500);
  }
};

//A verif
export const updateUser = async (c: Context) => {
  const id = parseInt(c.req.param('id'));
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400);
  try {
    const body = await c.req.json();
    if (!body || typeof body !== 'object') {
      return c.json({ error: 'Body invalide' }, 400);
    }
    const { userName, email, password, notes, points, avatar } = body;
    if (!userName || !email || !password) return c.json({ error: 'Champs requis manquants' }, 400);
    const hashedPassword = await hashPassword(password);
    const result = await pool.query(updateUserSQL, [userName, email, hashedPassword, notes, points, avatar, id]);
    if (result.rows.length === 0) return c.notFound();
    return c.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (DatabaseError.code === '23505') {
      return c.json({ error: 'Email déjà utilisé' }, 409);
    }
    return c.json({ error: 'Erreur lors de la mise à jour de l\'utilisateur' }, 500);
  }
};

export const deleteUser = async (c: Context) => {
  const id = parseInt(c.req.param('id'));
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400);
  try {
    const result = await pool.query(deleteUserSQL, [id]);
    if (result.rows.length === 0) return c.json({ error: 'Utilisateur inconnu' }, 404);
    return c.json({ message: 'Utilisateur supprimé' }, 200);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Erreur lors de la suppression de l\'utilisateur' }, 500);
  }
};