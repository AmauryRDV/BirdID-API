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
  imagepath TEXT NOT NULL
);
`;

export const insertObservationSQL = `
INSERT INTO observations (birdid, userid, birdname, date, time, note, size, gender, imagepath)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING id, birdid, userid, birdname, date, time, note, size, gender, imagepath;
`;

export const getObservationByIdSQL = `
SELECT id, birdid, userid, birdname, date, time, note, size, gender, imagepath FROM observations WHERE id = $1;
`;

export const updateObservationSQL = `
UPDATE observations SET birdid = $1, userid = $2, birdname = $3, date = $4, time = $5, note = $6, size = $7, gender = $8, imagepath = $9
WHERE id = $10 RETURNING id, birdid, userid, birdname, date, time, note, size, gender, imagepath;
`;

export const deleteObservationSQL = `
DELETE FROM observations WHERE id = $1 RETURNING id;
`;

export const getAllObservationsSQL = `
SELECT id, birdid, userid, birdname, date, time, note, size, gender, imagepath FROM observations;
`;
