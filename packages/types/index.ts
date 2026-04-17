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

// 仕様管理
export interface Spec {
  id: string
  name: string
  type: 'feature' | 'design'
  status: 'draft' | 'review' | 'approved' | 'implemented'
  path: string
  version: string
  created_at: string
  updated_at: string
}

export interface SpecIssue {
  id: string
  spec_id: string
  type: 'contradiction' | 'missing' | 'ambiguous'
  description: string
  question: string
  resolved: boolean
}

export interface SpecChangeProposal {
  id: string
  spec_id: string
  proposed_content: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

// タスク管理
export type TaskStatus = 'not-started' | 'in-progress' | 'done' | 'blocked' | 'needs-review'

export interface Task {
  id: string
  spec_id: string
  elaborated_spec_id: string
  title: string
  description: string
  estimate: TaskEstimate
  status: TaskStatus
  order: number
  created_at: string
  updated_at: string
}

export interface TaskEstimate {
  size: 'XS' | 'S' | 'M' | 'L' | 'XL'
  hours_min: number
  hours_max: number
  rationale: string
}

// バグ管理
export type BugStatus = 'open' | 'analyzing' | 'resolved' | 'spec-defect' | 'unclassified'

export interface BugAnalysis {
  root_cause: 'implementation' | 'spec-defect' | 'unknown'
  affected_spec_id: string
  affected_acceptance_condition: string
  confidence: number
  reasoning: string
}

export interface BugReport {
  id: string
  description: string
  status: BugStatus
  analysis?: BugAnalysis
  fix_task_id?: string
  change_proposal_id?: string
  created_at: string
  updated_at: string
}
