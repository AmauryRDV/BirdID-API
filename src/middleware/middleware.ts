import { jwt } from 'hono/jwt'
import 'dotenv/config'; 

export const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('Une valeur d\'environnement est manquante');
  throw new Error('Une valeur d\'environnement est manquante');
}

export const honoJwtMiddleware = jwt({
  secret: JWT_SECRET,
  alg: 'HS256',
});

export default honoJwtMiddleware;