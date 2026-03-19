import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { env } from 'process';
import 'dotenv/config';
import userRoutes from './routes/users.js';
import birdRoutes from './routes/birds.js';
import observationRoutes from './routes/observations.js';
const app = new Hono();
app.get('/', (c) => {
    return c.text('Hello Hono!');
});
app.route('/users', userRoutes);
app.route('/birds', birdRoutes);
app.route('/observations', observationRoutes);
serve({
    fetch: app.fetch,
    port: Number(env.PORT) || 3000,
}, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
});
