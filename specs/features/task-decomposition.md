# 機能仕様: タスク分解

> ステータス: approved

## 依存仕様

| 仕様 | 理由 |
|-----|------|
| `spec-elaboration` | `ElaboratedSpec` を入力とする（AC-E01） |
| `spec-management` | 仕様変更を検知してタスクを `needs-review` に更新する（AC-06） |

## 概要

詳細仕様からタスクを分解し、工数見積もりと実施順を定める。タスク間の依存関係を自動で解析して実行順に並べ、仕様変更時には影響を受けるタスクを検出する。

## 受け入れ条件

- [ ] AC-01: 詳細仕様を指定すると、実装可能な粒度のタスク一覧が生成される
- [ ] AC-02: 各タスクに工数見積もり（XS/S/M/L/XL）と根拠が付与される
- [ ] AC-03: タスク間の依存関係が自動解析され、実施順（`order`）が決定される
- [ ] AC-04: タスク一覧は依存順に並んで表示される
- [ ] AC-05: 各タスクの進捗状態（`not-started` / `in-progress` / `done` / `blocked`）が参照できる
- [ ] AC-06: 仕様が変更された場合、影響を受けるタスクが `needs-review` 状態に自動更新される
- [ ] AC-07: 複数仕様のタスクを横断した全体ロードマップが表示できる
- [ ] AC-E01: 詳細仕様（`ElaboratedSpec`）が存在しない仕様を指定したとき、エラーで停止する
- [ ] AC-E02: タスク間に循環依存が検出されたとき、エラーとして報告し生成を中断する

## データモデル

```typescript
export interface Task {
  id: string
  spec_id: string
  elaborated_spec_id: string
  title: string
  description: string
  estimate: TaskEstimate
  status: TaskStatus
  order: number             // 実施順（依存関係から自動算出）
  created_at: string
  updated_at: string
}

export type TaskStatus =
  | 'not-started'
  | 'in-progress'
  | 'done'
  | 'blocked'
  | 'needs-review'  // 仕様変更により要見直し

export interface TaskEstimate {
  size: 'XS' | 'S' | 'M' | 'L' | 'XL'
  hours_min: number
  hours_max: number
  rationale: string
}

export interface TaskDependency {
  from_task_id: string   // このタスクは
  to_task_id: string     // このタスクが完了してから開始できる
}
```

## インターフェース（CLIコマンド）

| コマンド | 説明 |
|---------|------|
| `sdd task generate [name]` | 詳細仕様からタスクを生成 |
| `sdd task list [name]` | タスク一覧を依存順で表示 |
| `sdd task roadmap` | 全仕様の横断ロードマップを表示 |

## 非機能要件

- **パフォーマンス**: タスク生成 10秒以内（AI呼び出し含む）
- **自動性**: タスクの進捗状態はコード生成・テスト実行の結果から自動更新される（手動操作不要）
- **トレーサビリティ**: 各タスクは必ず元の詳細仕様（`elaborated_spec_id`）への参照を保持する
- **トークン効率**: AI呼び出し時は対象の詳細仕様のみを渡す。他仕様のタスクは参照しない
- **エクスポート**: タスク一覧・ロードマップはMarkdown形式で出力できる
