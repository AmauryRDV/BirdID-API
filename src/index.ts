import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { env } from 'process'
import 'dotenv/config'
import { cors } from 'hono/cors'
import userRoutes from './routes/users.js'
import birdRoutes from './routes/birds.js'
import observationRoutes from './routes/observations.js'
import authRoutes from './routes/auth.js' 
const app = new Hono()

app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

app.get('/', (c) => c.text('Hello Hono!'))

app.route('/', authRoutes)

app.route('/users', userRoutes)
app.route('/birds', birdRoutes)
app.route('/observations', observationRoutes)


serve({
  fetch: app.fetch,
  port: Number(env.PORT) || 3000,
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
