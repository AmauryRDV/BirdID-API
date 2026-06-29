import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { env } from 'process';
import 'dotenv/config';
import { cors } from 'hono/cors';
import userRoutes from './routes/users.js';
import birdRoutes from './routes/birds.js';
import observationRoutes from './routes/observations.js';
import authRoutes from './routes/auth.js';
import { rateLimiter } from './middleware/rateLimiter.js';
const app = new Hono();
const allowedOrigins = (env.ALLOWED_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());
app.use('/*', cors({
    origin: (origin) => (allowedOrigins.includes(origin) ? origin : allowedOrigins[0]),
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
}));
// 10 tentatives max par minute sur les routes d'authentification
const authRateLimit = rateLimiter({ maxRequests: 10, windowMs: 60_000 });
app.get('/', (c) => c.text('Hello Hono!'));
app.use('/login', authRateLimit);
app.use('/register', authRateLimit);
app.use('/refresh', authRateLimit);
app.route('/', authRoutes);
app.route('/users', userRoutes);
app.route('/birds', birdRoutes);
app.route('/observations', observationRoutes);
serve({
    fetch: app.fetch,
    port: Number(env.PORT) || 3000,
}, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
});
