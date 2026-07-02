# CLAUDE.md — finwatch 開発ハーネス

## プロジェクト概要

外部公開MCPサーバー(EDINET DB)に接続するMCPホストを自前実装し、
競合財務モニタリングレポートを生成するCLIエージェント。
**目的はエンタープライズグレードの非機能設計の実証。** 実装前に必ず `docs/adr/` を読むこと。

## 絶対原則

1. **ADRに反する実装をしない。** 変更したい場合はまずADRを更新(superseded)してから実装する
2. **APIキー・トークンをLLMのコンテキスト(プロンプト・ツール結果整形)に混入させない。** 認証は `src/mcp/transport.ts` の境界内で完結させる(ADR-0005)
3. **MCPツールは `config/tool-allowlist.json` にあるもののみ実行可。** allowlist外のツールが呼ばれそうになったらエラーで停止(ADR-0006)
4. 外部MCPへの全呼び出しは `src/resilience/` のサーキットブレーカー経由。直接fetchを書かない(ADR-0007)
5. TypeScript strict。`any` 禁止。外部入力(MCPレスポンス含む)はzodでパース

## 技術スタック(変更禁止、変更はADR経由)

- Node.js 22 / TypeScript strict / ESM
- `@modelcontextprotocol/sdk`(Streamable HTTP transport)
- `@anthropic-ai/sdk`(モデル: claude-sonnet系、ADR-0010のトークン予算内)
- `better-sqlite3`(キャッシュ) / `zod` / `vitest`
- Lint: eslint + prettier(設定済みのものを使う)

## 開発ワークフロー

- 非自明なタスクはPlan modeで計画を提示してから実装
- 実装順は `docs/implementation-plan.md` のPhase順を厳守。Phaseを跨いだ先回り実装をしない
- 各Phase完了条件: そのPhaseのテストがグリーン + `npm run typecheck` パス
- 同じ指示を2回受けたらそれはハーネスの欠陥 → このファイルを即更新
- 学びは `lessons.md` に追記

## テスト実行

```bash
npm test              # unit + contract(決定的、常時実行)
npm run test:contract # モックMCPサーバーに対する契約テスト
npm run eval          # LLM評価(APIコスト発生。明示的にのみ実行)
```

## ディレクトリ責務

- `src/mcp/` — MCPクライアント(transport, session, tool registry)。LLMを知らない
- `src/agent/` — LLMツール呼び出しループ。MCPの詳細を知らない(registryのインターフェースのみ)
- `src/report/` — レポート生成(Markdown出力)。純関数中心
- `src/resilience/` — circuit breaker / retry / cache。ドメインを知らない
- `evals/` — ツール選択精度の測定。ケースは `evals/cases/*.json`

## 秘匿情報

- `.env` のみ。コード・ログ・テストフィクスチャへのキー混入禁止
- ログ出力前に `redact()` を通す(`src/mcp/redact.ts`)
