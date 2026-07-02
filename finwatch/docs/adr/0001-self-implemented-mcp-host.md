# ADR-0001: MCPホスト(クライアント)を自前実装する

Status: Accepted / Date: 2026-07-02

## Context
外部公開MCPサーバー(EDINET DB)を利用するにあたり、Claude Desktop / Claude Code等の既製MCPクライアントを使う選択肢と、ホストを自前実装する選択肢がある。

## Decision
`@modelcontextprotocol/sdk` を用いてMCPホストを自前実装する。MCPサーバーは `config/mcp-servers.json` のレジストリで宣言し、プラガブルに追加できる抽象(`McpServerRegistry`)を設ける。

## Alternatives
- **A. Claude Desktopを利用**: 実装ゼロで済むが、認可・レート制御・監査ログ・スケジュール実行をアプリ側で制御できない。非機能要件の設計余地がなくなるため却下
- **B. LangChain等のフレームワーク経由**: 抽象が厚く、プロトコルレベルの制御(セッション管理、認証境界)が隠蔽される。学習実証の目的に反するため却下

## Consequences
- (+) 認証境界・allowlist・回復性を自分の設計で実装できる(ADR-0005/0006/0007の前提)
- (+) レジストリ抽象により、将来の自作補完MCP(非上場企業データ)追加が設定変更のみで可能=拡張性
- (-) プロトコル仕様変更への追従コストを自分で負う → ADR-0008の契約テストで検知する
