# 実装計画(Claude Code向け・Phase順厳守)

各Phaseは「テストグリーン + typecheckパス」で完了。Phase内は自律実行可、Phase跨ぎの先回り禁止。

## Phase 0: 足場
- package.json / tsconfig(strict, ESM) / eslint / vitest / .env.example / config雛形(companies.json, tool-allowlist.json, budget.json, mcp-servers.json)
- CI: typecheck + lint + test のworkflow
- 完了条件: `npm test` が空グリーン

## Phase 1: resilience層(外部依存なし・L1テスト)
- retry(exp backoff + jitter) / CircuitBreaker(closed→open→half-open) / SqliteCache(TTL, canonical args hash)
- redact() と allowlist判定関数
- 完了条件: L1テスト全緑、breaker状態遷移・429時キャッシュ優先切替のテストを含む

## Phase 2: MCPクライアント層(L2テスト)
- @modelcontextprotocol/sdk でStreamable HTTP接続、Bearer付与(transport内で完結)
- McpServerRegistry(config駆動)、tools/list取得→スナップショット保存コマンド
- モックMCPサーバー(スナップショットから生成)、contract テスト(正常/429/500/timeout/パース失敗)
- 完了条件: 実EDINET DBに対する `finwatch tools snapshot` が動作(要APIキー)、モック契約テスト全緑

## Phase 3: agent + report層
- Anthropic APIのtool useループ自前実装(allowlist判定→MCP実行→結果ラップ→継続)
- トークン予算ガード(超過でfail-visible)
- report: 数値はツール結果から機械転記、LLMは解説文のみ。鮮度・完全性メタデータをフッターに出力
- 完了条件: `finwatch report generate` で4社レポートのMarkdownが `out/` に生成される

## Phase 4: eval + 運用ワークフロー
- evals/cases 10ケース以上(正解ツール列+引数述語)、k=3、閾値90%のランナー
- Actions: 隔週生成cron / 日次スナップショットdiff / secret scanning / eval条件付き実行 / 失敗時Issue自動起票
- docs/samples/ に生成レポートサンプルをコミット
- 完了条件: eval実行レポートが出力され、README記載のコマンドが全て動作

## Phase 5(任意): 磨き込み
- lessons.md整理、ADRの実装済みステータス更新、カバレッジレポート、キャッシュヒット率などのメトリクス表示
