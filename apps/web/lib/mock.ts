export type Stage = 'draft' | 'review' | 'approved' | 'elaborated' | 'tasks' | 'implemented'
export type TaskStatus = 'not-started' | 'in-progress' | 'done' | 'blocked' | 'needs-review'
export type TaskSize = 'XS' | 'S' | 'M' | 'L' | 'XL'

export interface MockTask {
  id: string
  title: string
  status: TaskStatus
  size: TaskSize
  hoursMin: number
  hoursMax: number
}

export interface MockSpec {
  id: string
  title: string
  currentStage: Stage
  tasks: MockTask[]
}

export const STAGE_ORDER: Stage[] = ['draft', 'review', 'approved', 'elaborated', 'tasks', 'implemented']

export const STAGE_LABELS: Record<Stage, string> = {
  draft: 'Draft',
  review: 'Review',
  approved: 'Approved',
  elaborated: 'Elaborated',
  tasks: 'Tasks',
  implemented: 'Done',
}

export const mockSpecs: MockSpec[] = [
  {
    id: 'spec-management',
    title: '仕様管理',
    currentStage: 'implemented',
    tasks: [
      { id: 'task-001', title: 'spec new コマンド', status: 'done', size: 'M', hoursMin: 4, hoursMax: 8 },
      { id: 'task-002', title: 'spec check コマンド', status: 'done', size: 'M', hoursMin: 4, hoursMax: 8 },
      { id: 'task-003', title: 'spec resolve コマンド', status: 'done', size: 'S', hoursMin: 2, hoursMax: 4 },
      { id: 'task-004', title: 'spec elaborate コマンド', status: 'done', size: 'L', hoursMin: 8, hoursMax: 16 },
      { id: 'task-005', title: 'spec set-status コマンド', status: 'done', size: 'XS', hoursMin: 1, hoursMax: 2 },
      { id: 'task-006', title: 'spec approve コマンド', status: 'done', size: 'S', hoursMin: 2, hoursMax: 4 },
    ],
  },
  {
    id: 'auth-login',
    title: 'GitHub認証',
    currentStage: 'tasks',
    tasks: [
      { id: 'task-001', title: 'OAuthコールバックサーバーの実装', status: 'done', size: 'M', hoursMin: 4, hoursMax: 8 },
      { id: 'task-002', title: 'アクセストークンの取得と保存', status: 'done', size: 'S', hoursMin: 2, hoursMax: 4 },
      { id: 'task-003', title: 'ログアウト処理の実装', status: 'in-progress', size: 'XS', hoursMin: 1, hoursMax: 2 },
      { id: 'task-004', title: 'auth status コマンド', status: 'not-started', size: 'XS', hoursMin: 1, hoursMax: 2 },
    ],
  },
  {
    id: 'task-decomposition',
    title: 'タスク分解',
    currentStage: 'tasks',
    tasks: [
      { id: 'task-001', title: 'task generate コマンド', status: 'done', size: 'M', hoursMin: 4, hoursMax: 8 },
      { id: 'task-002', title: 'task list コマンド', status: 'done', size: 'S', hoursMin: 2, hoursMax: 4 },
      { id: 'task-003', title: 'task roadmap コマンド', status: 'in-progress', size: 'S', hoursMin: 2, hoursMax: 4 },
    ],
  },
  {
    id: 'traceability',
    title: 'バグ追跡',
    currentStage: 'tasks',
    tasks: [
      { id: 'task-001', title: 'bug report コマンド（2段階分析）', status: 'in-progress', size: 'L', hoursMin: 8, hoursMax: 16 },
      { id: 'task-002', title: 'bug list / show コマンド', status: 'not-started', size: 'S', hoursMin: 2, hoursMax: 4 },
      { id: 'task-003', title: 'SpecChangeProposal生成', status: 'needs-review', size: 'M', hoursMin: 4, hoursMax: 8 },
    ],
  },
  {
    id: 'web-dashboard',
    title: 'Webダッシュボード',
    currentStage: 'approved',
    tasks: [],
  },
]
