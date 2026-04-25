// packages/types/index.ts
// フロントエンド・バックエンド共通の型定義

export interface ApiResponse<T> {
  data?: T
  error?: string
  timestamp: string
}

export interface User {
  id: string
  email: string
  created_at: string
}

export interface HealthResponse {
  status: 'ok' | 'error'
  timestamp: string
}

// ── Apple Watch Ultra アーティスティック文字盤 ─────────────────────────

export type BackgroundTheme =
  | 'painting'
  | 'impressionist'
  | 'monotone-mechanical'
  | 'nature-pattern'

export const BACKGROUND_THEMES: readonly BackgroundTheme[] = [
  'painting',
  'impressionist',
  'monotone-mechanical',
  'nature-pattern',
] as const

export type TimeDisplayMode = 'analog' | 'digital'

export const TIME_DISPLAY_MODES: readonly TimeDisplayMode[] = [
  'analog',
  'digital',
] as const

export type BatteryState = 'charging' | 'discharging' | 'full' | 'unknown'

export type BatteryIndicatorStyle = 'arc' | 'orb' | 'stroke' | 'none'

export interface WatchFaceConfig {
  background: BackgroundTheme
  timeMode: TimeDisplayMode
}

export interface WatchFaceRenderRequest {
  config: WatchFaceConfig
  currentTime: string // ISO 8601 (UTC推奨)
  batteryLevel?: number | null // 0.0 - 1.0
  batteryState?: BatteryState
  isAlwaysOn?: boolean
}

export interface TimeElement {
  mode: TimeDisplayMode
  hourAngle?: number // analog: 度 (0-360)
  minuteAngle?: number // analog: 度 (0-360)
  text?: string // digital: HH:MM
  opacity: number // 0.0 - 1.0、低めで背景に溶け込む
}

export interface BatteryElement {
  available: boolean
  steps?: number // 0-10 (10%刻み)
  style: BatteryIndicatorStyle
  opacity: number
}

export interface WatchFaceRender {
  background: BackgroundTheme
  time: TimeElement
  battery: BatteryElement
  isAlwaysOn: boolean
  fallback: boolean
}

export interface WatchFaceRenderResponse {
  render: WatchFaceRender
}
