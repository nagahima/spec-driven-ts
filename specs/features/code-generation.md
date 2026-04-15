# 機能仕様: コード生成

> ステータス: approved

## 依存仕様

| 仕様 | 理由 |
|-----|------|
| `task-decomposition` | タスク生成を受けて自動起動する |
| `spec-elaboration` | 詳細仕様（`ElaboratedSpec`）を参照してコードを生成する |

## 概要

タスクが生成されると自動的に起動し、詳細仕様から実装コードとテストを生成する。全テスト通過でコードをコミットしタスクを `done` に、失敗時はコードを破棄してタスクを `blocked` にする。ユーザーには不可視のバックグラウンド処理。

## 受け入れ条件

- [ ] AC-01: タスクが生成されると自動的にコード生成が開始される
- [ ] AC-02: 詳細仕様から実装ファイル（`apps/web/lib/api/[name].ts`）を生成する
- [ ] AC-03: 受け入れ条件と1:1で対応するテストファイル（`apps/web/tests/[name].test.ts`）を生成する
- [ ] AC-04: 必要な型定義を `packages/types/index.ts` に追加する
- [ ] AC-05: APIルートを `apps/web/app/api/[[...route]]/route.ts` に登録する
- [ ] AC-06: 生成後にテストを自動実行し、全テスト通過でコードをコミットしタスクを `done` にする
- [ ] AC-07: テスト失敗・生成エラー・既存テストのデグレード検出時はコードを破棄し、タスクを `blocked` にする
- [ ] AC-E01: 詳細仕様（`ElaboratedSpec`）が存在しないタスクは処理せず、タスクを `blocked` にする

## データモデル

```typescript
export interface CodeGenerationJob {
  id: string
  task_id: string
  spec_id: string
  elaborated_spec_id: string
  status: CodeGenerationStatus
  generated_files: string[]
  test_result?: TestResult
  error?: string
  created_at: string
  updated_at: string
}

export type CodeGenerationStatus =
  | 'running'
  | 'success'
  | 'failed'

export interface TestResult {
  passed: number
  failed: number
  duration_ms: number
}
```

## インターフェース

ユーザー向けインターフェースなし。タスクのステータス（`done` / `blocked`）を通じて結果を確認する。

## 非機能要件

- **不可視性**: ユーザーへの直接インターフェースを持たない
- **安全性**: コードのコミットは全テスト通過と既存テストのデグレードなしを必要条件とする
- **トークン効率**: 生成時は対象の詳細仕様のみをコンテキストとして渡す
- **エクスポート**: 生成ジョブの結果（生成ファイル一覧・テスト結果）はMarkdown形式で出力できる
