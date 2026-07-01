# CLAUDE.md — Steering Instructions

このファイルはClaude Codeへの恒久的な指示です。

---

## 仕様駆動開発の原則

1. **仕様が唯一のマスター**: `specs/features/*.md` が真実の源泉です
2. **コードを直接書かない**: 実装は必ず `/implement [feature]` コマンド経由で生成
3. **型定義は共有**: すべての型は `packages/types/` に定義
4. **テストは仕様と1:1**: 受け入れ条件（AC-XX）とテストケースは必ず対応
5. **デザインは `specs/design/` に従う**: フロントエンド実装前に `specs/design/_SYSTEM.md` を必ず読む

---

## ツールの役割分担

| レイヤー | ツール | 担当 |
|---------|-------|------|
| 仕様の作成・校正・詳細化・タスク生成・バグ分析 | `sdd` CLI（`apps/cli/`、Anthropic API利用） | 非開発者でも使える |
| コード生成・ドリフト検出・ワークフロー編成 | Claude Code カスタムコマンド | 開発セッションで使う |

`sdd` CLIの実行: `node apps/cli/dist/index.js <command>`（要 `ANTHROPIC_API_KEY`）

---

## カスタムコマンド

| コマンド | 用途 |
|---------|------|
| `/develop [feature] "[概要]"` | 仕様→校正→承認→詳細化→タスク→実装 の全フローを案内 |
| `/implement [feature]` | 詳細仕様とタスクからコード・テストを生成（コード生成機能の実体） |
| `/spec-check` | 仕様とコードのドリフトを検出 |
| `/new-spec [name] "[概要]"` | 新しい仕様ファイルを作成 |
| `/doc-sync` | ドキュメントを仕様に同期 |

## sdd CLIコマンド（対応関係）

| コマンド | 用途 |
|---------|------|
| `sdd spec new/check/resolve/status` | 仕様の作成・AI校正・指摘解決・状態確認 |
| `sdd spec set-status/approve` | ステータス変更・修正提案の承認 |
| `sdd spec elaborate` | 詳細仕様（ADR・データ設計・API設計）の生成 |
| `sdd task generate/list/roadmap` | タスク分解・一覧・ロードマップ |
| `sdd bug report/list/show` | バグのAI分析→修正タスク or 仕様修正提案 |
| `sdd auth login/status/logout` | GitHub認証 |

---

## 仕様のステータスフロー

```
draft → review → approved → implemented
```

- `sdd spec elaborate` と `/implement` は `approved` 状態の仕様のみ処理します
- `/implement` は全タスク完了時に `implemented` へ更新します
- ステータス変更は `sdd spec set-status [name] [status]` を使う（Markdown手編集はしない）

---

## ディレクトリ構造（仕様関連）

```
specs/
├── features/    機能仕様（マスター）
├── design/      デザインシステム（_SYSTEM.md が入口）
├── elaborated/  詳細仕様（sdd spec elaborate の出力）
├── tasks/       タスク（sdd task generate の出力、JSON）
├── issues/      校正指摘（sdd spec check の出力、JSON）
├── proposals/   仕様修正提案（sdd bug report の出力、JSON）
└── bugs/        バグ報告（JSON）
```
