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
