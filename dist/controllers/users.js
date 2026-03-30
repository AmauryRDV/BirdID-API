import { pool } from '../db_connect.js';
import { DatabaseError } from 'pg';
import { hashPassword, verifyPassword } from '../services/hashpassword.js';
import { sign } from 'jsonwebtoken'; // Importez sign pour générer le JWT
import 'dotenv/config'; // Assurez-vous que les variables d'environnement sont chargées
import { getAllUsersSQL, // Cette requête devrait aussi exclure le mot de passe
getUserByIdSQL, insertUserSQL, updateUserSQL, deleteUserSQL } from '../db/tables/users.js';
// GET /users - Get all users
// IMPORTANT: Cette route devrait idéalement être accessible uniquement par les administrateurs et ne doit pas retourner les mots de passe.
export const getAllUsers = async (c) => {
    try {
        // Modifiez getAllUsersSQL ou sélectionnez explicitement les colonnes pour exclure le mot de passe.
        // Pour l'instant, nous filtrons le mot de passe côté application.
        const result = await pool.query('SELECT id, username, email, notes, points, avatar, created_at, updated_at FROM users');
        return c.json(result.rows.map(row => { const { password, ...rest } = row; return rest; })); // S'assure que le mot de passe n'est pas renvoyé
    }
    catch (err) {
        console.error(err);
        if (err instanceof DatabaseError) {
            return c.json({ error: 'Erreur de base de données lors de la récupération des utilisateurs' }, 500);
        }
        return c.json({ error: 'Erreur interne du serveur' }, 500);
    }
};
// GET /users/:id - Get user by ID
export const getUserById = async (c) => {
    const id = parseInt(c.req.param('id') || '', 10);
    if (isNaN(id))
        return c.json({ error: 'ID invalide' }, 400);
    try {
        const result = await pool.query(getUserByIdSQL, [id]);
        if (result.rows.length === 0)
            return c.json({ error: 'Utilisateur non trouvé' }, 404);
        const { password, ...userWithoutPassword } = result.rows[0]; // Exclure le mot de passe
        return c.json(userWithoutPassword);
    }
    catch (err) {
        console.error(err);
        if (err instanceof DatabaseError) {
            return c.json({ error: 'Erreur de base de données lors de la récupération de l\'utilisateur' }, 500);
        }
        return c.json({ error: 'Erreur interne du serveur' }, 500);
    }
};
// GET /users/email/:email - Get user by email
export const getUserByEmail = async (c) => {
    const email = c.req.param('email');
    try {
        const result = await pool.query('SELECT id, username, email, password, notes, points, avatar, created_at, updated_at FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0)
            return c.json({ error: 'Utilisateur non trouvé' }, 404);
        const { password, ...userWithoutPassword } = result.rows[0]; // Exclure le mot de passe
        return c.json(userWithoutPassword);
    }
    catch (err) {
        console.error(err);
        if (err instanceof DatabaseError) {
            return c.json({ error: 'Erreur de base de données lors de la récupération de l\'utilisateur' }, 500);
        }
        return c.json({ error: 'Erreur interne du serveur' }, 500);
    }
};
// POST /auth/login - Connexion utilisateur
export const loginUser = async (c) => {
    try {
        const body = await c.req.json();
        const { email, password } = body;
        if (!email || !password) {
            return c.json({ error: 'Email et mot de passe requis' }, 400);
        }
        const result = await pool.query('SELECT id, email, password FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        if (!user) {
            return c.json({ error: 'Email ou mot de passe incorrect' }, 401);
        }
        const isPasswordValid = await verifyPassword(password, user.password);
        if (!isPasswordValid) {
            return c.json({ error: 'Email ou mot de passe incorrect' }, 401);
        }
        const token = sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'votre_cle_secrete_jwt_par_defaut', { expiresIn: '1h' });
        return c.json({ token });
    }
    catch (err) {
        console.error(err);
        return c.json({ error: 'Erreur interne du serveur lors de la connexion' }, 500);
    }
};
// POST /users - Create a new user
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
// PUT /users/:id - Update user
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
// DELETE /users/:id - Delete user
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
