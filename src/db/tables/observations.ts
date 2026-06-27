export interface Observation {
  id: number;
  birdid: number;
  userid: number;
  birdname: string;
  date: Date;
  time: string;
  note?: string;
  size: number;
  gender: string;
  imagepath: string;
  client_id?: string;
  latitude?: number;
  longitude?: number;
  created_at: Date;
  updated_at: Date;
}

export const createObservationsTableSQL = `
CREATE TABLE IF NOT EXISTS observations (
  id SERIAL PRIMARY KEY,
  birdid INTEGER NOT NULL,
  userid INTEGER NOT NULL,
  birdname VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  note TEXT,
  size INTEGER NOT NULL,
  gender VARCHAR(255) NOT NULL,
  imagepath TEXT NOT NULL,
  client_id UUID UNIQUE,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

const COLS = 'id, birdid, userid, birdname, date, time, note, size, gender, imagepath, client_id, latitude, longitude, created_at, updated_at';

export const insertObservationSQL = `
INSERT INTO observations (birdid, userid, birdname, date, time, note, size, gender, imagepath, client_id, latitude, longitude)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
ON CONFLICT (client_id) WHERE client_id IS NOT NULL DO UPDATE SET updated_at = NOW()
RETURNING ${COLS};
`;

export const getObservationByIdSQL = `
SELECT ${COLS} FROM observations WHERE id = $1;
`;

export const getObservationsByUserIdSQL = `
SELECT ${COLS} FROM observations
WHERE userid = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;
`;

export const updateObservationSQL = `
UPDATE observations
SET birdid = $1, userid = $2, birdname = $3, date = $4, time = $5, note = $6, size = $7, gender = $8, imagepath = $9, latitude = $10, longitude = $11, updated_at = NOW()
WHERE id = $12
RETURNING ${COLS};
`;

export const deleteObservationSQL = `
DELETE FROM observations WHERE id = $1 RETURNING id;
`;

export const getAllObservationsSQL = `
SELECT ${COLS} FROM observations ORDER BY created_at DESC LIMIT $1 OFFSET $2;
`;
