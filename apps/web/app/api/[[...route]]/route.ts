import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { healthRoute } from '@/lib/api/health'
import { watchFaceRoute } from '@/lib/api/apple-watch-ultra-face'

export const runtime = 'edge'

const app = new Hono().basePath('/api')
app.route('/health', healthRoute)
app.route('/watch-face', watchFaceRoute)

export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)
