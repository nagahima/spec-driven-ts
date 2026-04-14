# 機能仕様: 詳細仕様生成

> ステータス: draft

## 依存仕様

| 仕様 | 理由 |
|-----|------|
| `spec-management` | `Spec`（approved状態）を入力とする。`SpecDependency` を参照して依存仕様の技術決定を継承する（AC-02） |

## 概要

校正済みの機能仕様から、技術方針・アーキテクチャ決定・データ設計・API設計を含む詳細仕様を生成する。非開発者が書いた機能仕様を、そのまま実装に使える設計書に落とし込む。

## 受け入れ条件

- [ ] AC-01: `approved` ステータスの仕様を指定すると、技術方針・アーキテクチャ・データ設計・API設計を含む詳細仕様が生成される
- [ ] AC-02: 依存する仕様の詳細仕様が存在する場合、その技術決定を継承・参照した詳細仕様が生成される
- [ ] AC-03: 生成された詳細仕様は `specs/elaborated/[name].md` に保存される
- [ ] AC-04: 生成完了後、アーキテクチャ決定の一覧がサマリーとして表示される
- [ ] AC-05: 仕様が変更されて再生成する場合、既存の詳細仕様との差分のみが更新される
- [ ] AC-E01: 仕様のステータスが `approved` 未満のとき、エラーで停止する
- [ ] AC-E02: 依存する仕様の詳細仕様が存在しない場合、警告を出して続行する（部分情報で生成）
- [ ] AC-E03: 技術的に矛盾する決定が検出された場合、エラーとして報告し生成を中断する

## データモデル

```typescript
export interface ElaboratedSpec {
  id: string
  spec_id: string           // 元の機能仕様への参照
  version: string
  tech_stack: TechStack
  architecture: ArchitectureDecision[]
  data_design: DataDesign
  api_design: ApiDesign
  non_functional: NonFunctionalDetail[]
  created_at: string
  updated_at: string
}

export interface TechStack {
  runtime: string
  framework: string
  database?: string
  external_services: string[]
}

export interface ArchitectureDecision {
  id: string
  title: string
  decision: string
  rationale: string
  alternatives_considered: string[]
}

export interface DataDesign {
  entities: Entity[]
  relationships: Relationship[]
}

export interface Entity {
  name: string
  fields: Field[]
  indexes: string[]
}

export interface Field {
  name: string
  type: string
  nullable: boolean
  description: string
}

export interface Relationship {
  from: string
  to: string
  type: 'one-to-one' | 'one-to-many' | 'many-to-many'
  description: string
}

export interface ApiDesign {
  endpoints: EndpointDetail[]
}

export interface EndpointDetail {
  method: string
  path: string
  request_schema: string
  response_schema: string
  error_responses: ErrorResponse[]
}

export interface ErrorResponse {
  status: number
  description: string
}

export interface NonFunctionalDetail {
  category: 'performance' | 'security' | 'scalability' | 'reliability'
  requirement: string
  implementation_strategy: string
}
```

## インターフェース（CLIコマンド）

| コマンド | 説明 |
|---------|------|
| `sdd spec elaborate [name]` | 詳細仕様を生成・保存 |
| `sdd spec elaborate --diff [name]` | 再生成時に既存との差分を表示 |
| `sdd spec elaborate --summary [name]` | アーキテクチャ決定のサマリーのみ表示 |

## 非機能要件

- **パフォーマンス**: 生成レスポンス 10秒以内（AI呼び出し含む）
- **可読性**: 詳細仕様はMarkdown形式で人間が直接読み書きできる形式を維持する
- **トレーサビリティ**: 詳細仕様は必ず元の機能仕様（`spec_id`）への参照を保持する
- **トークン効率**: AI呼び出し時は対象仕様・直接依存する仕様の要約のみを渡す。無関係な仕様はコンテキストに含めない
- **エクスポート**: 生成された詳細仕様（アーキテクチャ決定・データ設計・API設計）はMarkdown形式で出力できる
