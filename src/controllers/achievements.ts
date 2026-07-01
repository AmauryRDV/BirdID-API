import type { Context } from 'hono';
import { pool } from '../db_connect.js';
import { getAllAchievementsSQL, getAchievementByIdSQL } from '../db/tables/achievements.js';
import { getUserAchievementsSQL, upsertUserAchievementSQL } from '../db/tables/user_achievements.js';

export const getAllAchievements = async (c: Context) => {
  try {
    const result = await pool.query(getAllAchievementsSQL);
    return c.json(result.rows);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Erreur lors de la récupération des succès' }, 500);
  }
};

export const getAchievementById = async (c: Context) => {
  const id = parseInt(c.req.param('id')!, 10);
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400);
  try {
    const result = await pool.query(getAchievementByIdSQL, [id]);
    if (result.rows.length === 0) return c.json({ error: 'Succès introuvable' }, 404);
    return c.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Erreur lors de la récupération du succès' }, 500);
  }
};

export const getUserAchievements = async (c: Context) => {
  const userId = parseInt(c.req.param('id')!, 10);
  if (isNaN(userId)) return c.json({ error: 'ID invalide' }, 400);
  try {
    const result = await pool.query(getUserAchievementsSQL, [userId]);
    return c.json(result.rows);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Erreur lors de la récupération des succès de l\'utilisateur' }, 500);
  }
};

export const updateUserAchievement = async (c: Context) => {
  const userId = parseInt(c.req.param('id')!, 10);
  const achievementId = parseInt(c.req.param('achievementId')!, 10);
  if (isNaN(userId) || isNaN(achievementId)) return c.json({ error: 'ID invalide' }, 400);

  try {
    const body = await c.req.json();
    if (!body || typeof body !== 'object') return c.json({ error: 'Body invalide' }, 400);

    const { current_progress: currentProgress, unlocked } = body;

    if (typeof currentProgress !== 'number' || !Number.isInteger(currentProgress) || currentProgress < 0) {
      return c.json({ error: 'current_progress doit être un entier positif ou nul' }, 400);
    }
    if (typeof unlocked !== 'boolean') {
      return c.json({ error: 'unlocked doit être un booléen' }, 400);
    }

    const achievementResult = await pool.query(getAchievementByIdSQL, [achievementId]);
    if (achievementResult.rows.length === 0) return c.json({ error: 'Succès introuvable' }, 404);

    const unlockDate = unlocked ? new Date() : null;
    const result = await pool.query(upsertUserAchievementSQL, [userId, achievementId, currentProgress, unlocked, unlockDate]);
    return c.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Erreur lors de la mise à jour du succès' }, 500);
  }
};
