# ADR-0005: 認証情報の管理とLLMコンテキストへの秘匿境界

Status: Accepted / Date: 2026-07-02

## Context
秘匿情報は2種類: EDINET DBのAPIキー(Bearer)、Anthropic APIキー。LLMエージェントは外部から返ってきたテキストをコンテキストに取り込むため、認証情報がプロンプトへ漏出する経路を設計段階で遮断する必要がある。

## Decision
1. 保管: ローカルは `.env`、CIはGitHub Secrets。コード・fixture・ログへの直書き禁止
2. **秘匿境界**: 認証ヘッダの付与は `src/mcp/transport.ts` 内で完結させ、`agent/` 層(LLMに触れる層)は認証情報の存在すら知らないインターフェースにする
3. ログは全て `redact()` を通し、`(edb_|sk-ant-)` パターンをマスクする
4. キーローテーション手順を `docs/runbook.md` に記載(手動、四半期)

## Alternatives
- **Secrets Manager / Vault**: 商用ならローテーション自動化含め採用。個人規模では過剰。Production構成として文書化のみ
- **OAuth 2.1フロー(EDINET DBはGoogle認証も可)**: ヘッドレス実行と相性が悪くAPIキーを採用。トレードオフ(キーは長命でローテーション責務が自分側に来る)を認識した上での選択

## Consequences
- (+) 「LLMに見せてよい情報」の境界がモジュール境界と一致し、レビューで機械的に検証できる
- (-) redactは事後防御であり完全ではない → 一次防御はあくまで境界設計(2)
