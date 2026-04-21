export interface Bird {
  id: number;
  birdname: string;
  latinbirdname: string;
  media: string;
  funfact: string;
  rarity: string;
  habitat: string;
}
export const createBirdsTableSQL = `
CREATE TABLE IF NOT EXISTS birds (
  id SERIAL PRIMARY KEY,
  birdname VARCHAR(255) NOT NULL,
  latinbirdname VARCHAR(255) NOT NULL,
  media TEXT NOT NULL,
  funfact TEXT NOT NULL,
  rarity VARCHAR(255) NOT NULL,
  habitat VARCHAR(255) NOT NULL
);
`;
export const insertBirdSQL = `
INSERT INTO birds (birdname, latinbirdname, media, funfact, rarity, habitat)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, birdname, latinbirdname, media, funfact, rarity, habitat;
`;
export const getBirdByIdSQL = `
SELECT id, birdname, latinbirdname, media, funfact, rarity, habitat FROM birds WHERE id = $1;
`;
export const updateBirdSQL = `
UPDATE birds SET birdname = $1, latinbirdname = $2, media = $3, funfact = $4, rarity = $5, habitat = $6
WHERE id = $7 RETURNING id, birdname, latinbirdname, media, funfact, rarity, habitat;
`;
export const deleteBirdSQL = `
DELETE FROM birds WHERE id = $1 RETURNING id;
`;

export const getAllBirdsSQL = `
SELECT id, birdname, latinbirdname, media, funfact, rarity, habitat FROM birds;
`;
