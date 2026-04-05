import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { healthRoute } from '@/lib/api/health'

export const runtime = 'edge'

const app = new Hono().basePath('/api')
app.route('/health', healthRoute)

export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)
