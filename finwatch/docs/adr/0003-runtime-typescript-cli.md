# ADR-0003: ランタイムはNode.js 22 + TypeScript strict、形態はCLI

Status: Accepted / Date: 2026-07-02

## Context
実行形態としてWeb UI / API サーバー / CLI が考えられる。目的は非機能設計の実証であり、UIは評価対象ではない。

## Decision
CLI(`finwatch report generate`)とする。TypeScript strict / ESM / zodによる境界バリデーション。

## Alternatives
- **Web UI(Next.js)**: 見栄えは良いが、認証・状態管理などUI起因の複雑さが本題(MCPホスト設計)を薄める。却下
- **常駐APIサーバー**: スケジュール実行が目的なら常駐は過剰。ステートレスCLI+外部スケジューラの方が可用性モデルが単純(ADR-0004)

## Consequences
- (+) プロセスがステートレスになり、リトライ・再実行が冪等設計しやすい
- (+) テスト容易性: エントリポイントが純粋な関数合成になる
- (-) デモ性は低い → レポートサンプルを `docs/samples/` にコミットして補う
