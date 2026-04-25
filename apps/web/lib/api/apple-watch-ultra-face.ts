import { Hono } from 'hono'
import {
  BACKGROUND_THEMES,
  TIME_DISPLAY_MODES,
  type BackgroundTheme,
  type BatteryElement,
  type BatteryIndicatorStyle,
  type TimeDisplayMode,
  type TimeElement,
  type WatchFaceRender,
  type WatchFaceRenderRequest,
  type WatchFaceRenderResponse,
} from 'types'

const BATTERY_STYLE_BY_THEME: Record<BackgroundTheme, BatteryIndicatorStyle> = {
  painting: 'stroke',
  impressionist: 'orb',
  'monotone-mechanical': 'arc',
  'nature-pattern': 'stroke',
}

const TIME_OPACITY_ACTIVE = 0.4
const TIME_OPACITY_AOD = 0.22
const BATTERY_OPACITY_ACTIVE = 0.32
const BATTERY_OPACITY_AOD = 0.18

const DEFAULT_FALLBACK_RENDER: WatchFaceRender = {
  background: 'painting',
  time: { mode: 'analog', hourAngle: 0, minuteAngle: 0, opacity: TIME_OPACITY_ACTIVE },
  battery: { available: false, style: 'none', opacity: 0 },
  isAlwaysOn: false,
  fallback: true,
}

export function computeTimeElement(
  isoTime: string,
  mode: TimeDisplayMode,
  isAlwaysOn: boolean,
): TimeElement {
  const date = new Date(isoTime)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`invalid time: ${isoTime}`)
  }
  const hours24 = date.getUTCHours()
  const minutes = date.getUTCMinutes()
  const opacity = isAlwaysOn ? TIME_OPACITY_AOD : TIME_OPACITY_ACTIVE

  if (mode === 'analog') {
    const hours12 = hours24 % 12
    return {
      mode,
      hourAngle: hours12 * 30 + minutes * 0.5,
      minuteAngle: minutes * 6,
      opacity,
    }
  }
  const hh = String(hours24).padStart(2, '0')
  const mm = String(minutes).padStart(2, '0')
  return { mode, text: `${hh}:${mm}`, opacity }
}

export function computeBatteryElement(
  level: number | null | undefined,
  background: BackgroundTheme,
  isAlwaysOn: boolean,
): BatteryElement {
  if (level == null || Number.isNaN(level)) {
    return { available: false, style: 'none', opacity: 0 }
  }
  const clamped = Math.max(0, Math.min(1, level))
  const steps = Math.round(clamped * 10)
  return {
    available: true,
    steps,
    style: BATTERY_STYLE_BY_THEME[background],
    opacity: isAlwaysOn ? BATTERY_OPACITY_AOD : BATTERY_OPACITY_ACTIVE,
  }
}

export function renderWatchFace(req: WatchFaceRenderRequest): WatchFaceRender {
  try {
    const isAlwaysOn = req.isAlwaysOn ?? false
    const time = computeTimeElement(req.currentTime, req.config.timeMode, isAlwaysOn)
    const battery = computeBatteryElement(req.batteryLevel, req.config.background, isAlwaysOn)
    return {
      background: req.config.background,
      time,
      battery,
      isAlwaysOn,
      fallback: false,
    }
  } catch {
    return { ...DEFAULT_FALLBACK_RENDER }
  }
}

export const watchFaceRoute = new Hono().post('/', async (c) => {
  let body: WatchFaceRenderRequest
  try {
    body = await c.req.json<WatchFaceRenderRequest>()
  } catch {
    return c.json({ error: 'invalid json body' }, 400)
  }
  if (!body?.config) {
    return c.json({ error: 'config required' }, 400)
  }
  if (!BACKGROUND_THEMES.includes(body.config.background)) {
    return c.json({ error: 'invalid background' }, 400)
  }
  if (!TIME_DISPLAY_MODES.includes(body.config.timeMode)) {
    return c.json({ error: 'invalid timeMode' }, 400)
  }
  if (typeof body.currentTime !== 'string') {
    return c.json({ error: 'currentTime required' }, 400)
  }
  const render = renderWatchFace(body)
  const response: WatchFaceRenderResponse = { render }
  return c.json(response)
})
