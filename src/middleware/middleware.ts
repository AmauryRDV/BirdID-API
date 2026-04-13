import { jwt } from 'hono/jwt'
import 'dotenv/config'; 

export const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('ERREUR CRITIQUE: La variable d\'environnement JWT_SECRET n\'est pas définie ou utilise une valeur par défaut non sécurisée.');
  throw new Error('JWT_SECRET doit être défini avec une clé forte et unique dans le fichier .env.');
}

export const honoJwtMiddleware = jwt({
  secret: JWT_SECRET,
  alg: 'HS256',
});

export default honoJwtMiddleware;