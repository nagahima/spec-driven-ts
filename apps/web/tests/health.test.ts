import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { healthRoute } from '../lib/api/health'

const app = new Hono().basePath('/api')
app.route('/health', healthRoute)

describe('GET /api/health', () => {
  it('status が ok を返す', async () => {
    const res = await app.request('/api/health')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
  })

  it('timestamp を含む', async () => {
    const res = await app.request('/api/health')
    const body = await res.json()
    expect(body.timestamp).toBeDefined()
  })
})
