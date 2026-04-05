import { Hono } from 'hono'
import type { HealthResponse } from 'types'

export const healthRoute = new Hono()
  .get('/', (c) => {
    const response: HealthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
    }
    return c.json(response)
  })
