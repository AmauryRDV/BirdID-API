const COLS = 'id, name, description, type, target, reward_points, created_at, updated_at';
export const getAllAchievementsSQL = `
SELECT ${COLS} FROM achievements ORDER BY id;
`;
export const getAchievementByIdSQL = `
SELECT ${COLS} FROM achievements WHERE id = $1;
`;
