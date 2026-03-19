import { Pool } from 'pg';
import { env } from 'process';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});


pool.on('connect', () => {
  console.log('Connecté à la base de données PostgreSQL');
});

pool.on('error', (err: Error) => {
  console.error('Erreur de connexion à la base de données:', err);
});