export interface Achievement {
  id: number;
  name: string;
  description: string;
  type: 'countTotal' | 'countUnique' | 'raritySpecific' | 'locationBased';
  target: number;
  reward_points: number;
  created_at: Date;
  updated_at: Date;
}

const COLS = 'id, name, description, type, target, reward_points, created_at, updated_at';

export const getAllAchievementsSQL = `
SELECT ${COLS} FROM achievements ORDER BY id;
`;

export const getAchievementByIdSQL = `
SELECT ${COLS} FROM achievements WHERE id = $1;
`;
