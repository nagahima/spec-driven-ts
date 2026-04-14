# 機能仕様: 仕様管理

> ステータス: draft

## 依存仕様

なし（このシステムの基盤）

## 認証方針

- **現時点**: 単一ユーザー前提。認証不要
- **将来**: `auth-login` 仕様として分離管理。実装時はミドルウェア層として追加する
- **設計上の制約**: 各インターフェース（CLIコマンド・内部API）はユーザーコンテキストを外部から注入できる設計にする。認証ロジックをコアロジックに混在させない

## 概要

仕様の作成・校正・バージョン管理・影響範囲分析・依存グラフを統一的に管理する。機能仕様（`specs/features/`）とデザイン仕様（`specs/design/`）を同列に扱い、矛盾・抜け・曖昧さを対話的に指摘・解決する。

## 受け入れ条件

- [ ] AC-01: 仕様名と概要を入力すると、テンプレートから新しい仕様ファイルが `draft` ステータスで作成される
- [ ] AC-02: 仕様ファイルを校正すると、矛盾・抜け・曖昧さが指摘事項（`SpecIssue`）として返される
- [ ] AC-03: 指摘事項に対して回答を入力すると、仕様ファイルが更新され、指摘が解決済みになる
- [ ] AC-04: 仕様を変更すると、依存する他の仕様への影響範囲が一覧で表示される
- [ ] AC-05: 仕様の変更履歴（バージョン）が参照できる
- [ ] AC-06: 仕様間の依存関係グラフが参照できる
- [ ] AC-07: 機能仕様とデザイン仕様が同じ校正・バージョン管理・依存グラフの対象になる
- [ ] AC-08: システムが起点の仕様修正提案は `pending` 状態で保留され、ユーザーが承認後に仕様ファイルへ反映される
- [ ] AC-E01: 同名の仕様が既に存在するとき、上書き確認を求める
- [ ] AC-E02: 循環依存が検出されたとき、エラーとして報告し変更を中断する
- [ ] AC-E03: 依存先の仕様が `approved` 未満のとき、警告を出す（中断はしない）

## データモデル

```typescript
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
  question: string  // ユーザーへの対話的な質問
  resolved: boolean
}

export interface SpecDependency {
  from_spec_id: string
  to_spec_id: string
  reason: string
}

export interface SpecVersion {
  spec_id: string
  version: string
  content: string
  changed_by: 'user' | 'system'
  change_summary: string
  created_at: string
}

export interface SpecChangeProposal {
  id: string
  spec_id: string
  proposed_content: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}
```

## ストレージ構造

全データはファイルシステムで管理する（環境ポータビリティ・Git追跡のため）。

```
specs/
  features/          # 機能仕様（Markdown）
  design/            # デザイン仕様（Markdown）
  elaborated/        # 詳細仕様（Markdown）
  tasks/             # タスクリスト（JSON）
  issues/            # SpecIssue（JSON）
  proposals/         # SpecChangeProposal（JSON）
  bugs/              # BugReport（JSON）
  versions/          # バージョン履歴（Markdown diff）
```

## インターフェース（CLIコマンド）

| コマンド | 説明 |
|---------|------|
| `sdd spec new [name] "[概要]"` | 仕様を新規作成 |
| `sdd spec check [name]` | 仕様を校正し指摘事項を返す |
| `sdd spec resolve [name] [issue-id]` | 指摘事項に回答して解決 |
| `sdd spec impact [name]` | 変更時の影響範囲を分析 |
| `sdd spec log [name]` | バージョン履歴を表示 |
| `sdd spec graph` | 全仕様の依存グラフを表示 |
| `sdd spec approve [proposal-id]` | 修正提案を承認・反映 |

## 非機能要件

- **パフォーマンス**: 校正レスポンス 3秒以内（AI呼び出し含む）
- **一貫性**: 仕様ファイルはMarkdownとして人間が直接読み書きできる形式を維持する
- **安全性**: `approved` 以降の仕様への直接変更はシステムが行わない。必ず `SpecChangeProposal` 経由とする
- **トークン効率**: AI呼び出し時は対象仕様と依存仕様の要約のみをコンテキストとして渡す。全仕様の一括読み込みは行わない
- **エクスポート**: 指摘事項（`SpecIssue`）・変更履歴・依存グラフはMarkdown形式で出力できる
