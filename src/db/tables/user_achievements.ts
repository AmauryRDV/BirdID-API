export interface UserAchievement {
  id: number;
  user_id: number;
  achievement_id: number;
  current_progress: number;
  unlocked: boolean;
  unlock_date: Date | null;
  created_at: Date;
  updated_at: Date;
}

// Catalogue complet des succès, avec la progression de l'utilisateur (0/non débloqué
// si aucune ligne user_achievements n'existe encore pour ce succès).
export const getUserAchievementsSQL = `
SELECT
  a.id AS achievement_id,
  a.name,
  a.description,
  a.type,
  a.target,
  a.reward_points,
  COALESCE(ua.current_progress, 0) AS current_progress,
  COALESCE(ua.unlocked, FALSE) AS unlocked,
  ua.unlock_date
FROM achievements a
LEFT JOIN user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = $1
ORDER BY a.id;
`;

// La progression est calculée côté client (comme les points) : l'API se contente de
// stocker l'état envoyé. unlock_date n'est écrasée que si elle n'était pas déjà fixée,
// pour garder la date du premier déblocage.
export const upsertUserAchievementSQL = `
INSERT INTO user_achievements (user_id, achievement_id, current_progress, unlocked, unlock_date)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (user_id, achievement_id) DO UPDATE
SET current_progress = EXCLUDED.current_progress,
    unlocked = EXCLUDED.unlocked,
    unlock_date = COALESCE(user_achievements.unlock_date, EXCLUDED.unlock_date),
    updated_at = NOW()
RETURNING id, user_id, achievement_id, current_progress, unlocked, unlock_date, created_at, updated_at;
`;
