
export interface User {
  id: number;
  username: string;
  email: string;
  password: string; 
  notes?: string;
  points: number;
  avatar: string;
  created_at: Date;
  updated_at: Date;
}


export const createUsersTableSQL = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  userName VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  notes TEXT,
  points INTEGER DEFAULT 0,
  avatar VARCHAR(255) DEFAULT '0',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

export const insertUserSQL = `
INSERT INTO users (userName, email, password, notes, points, avatar) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, userName, email, password, notes, points, avatar, created_at, updated_at;
`;

export const getUserByEmailSQL = `
SELECT id, userName, email, notes, points, avatar, created_at, updated_at FROM users WHERE email = $1;
`;

export const getUserByIdSQL = `
SELECT id, userName, email, notes, points, avatar, created_at, updated_at FROM users WHERE id = $1;
`;

export const updateUserSQL = `
UPDATE users SET userName = $1, email = $2, password = $3, notes = $4, points = $5, avatar = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING id, userName, email, password, notes, points, avatar, created_at, updated_at;
`;

export const deleteUserSQL = `
DELETE FROM users WHERE id = $1 RETURNING id;
`;

export const getAllUsersSQL = `
SELECT id, userName, email, notes, points, avatar, created_at, updated_at FROM users;
`;