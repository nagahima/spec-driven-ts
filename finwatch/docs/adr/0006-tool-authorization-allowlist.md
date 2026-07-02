# ADR-0006: MCPツール実行の認可 — read-only allowlist方式

Status: Accepted / Date: 2026-07-02

## Context
MCPサーバーは30超のツールを公開しており、将来サーバー側でツールが追加・変更される(rug pullリスク)。LLMがprompt injection(有報全文テキスト内の敵対的文字列など)に誘導されて意図しないツールを呼ぶ脅威がある(threat-model参照)。

## Decision
1. `config/tool-allowlist.json` に列挙した**read-onlyツールのみ**実行可(search_companies / get_company / get_financials / get_text_blocks 等)
2. allowlist外の呼び出し要求は実行せず、監査ログに記録して当該ターンを失敗させる(fail-closed)
3. サーバーから取得したツール定義は起動時にallowlistと突合し、**スキーマがスナップショット(ADR-0008)と乖離していたら警告**

## Alternatives
- **全ツール許可+人間承認ゲート**: バッチ実行(無人)と両立しない。対話モードを作る場合の将来オプションとして記録
- **denylist方式**: 新規追加ツールがデフォルト許可になり、rug pullに脆弱。却下

## Consequences
- (+) 書き込み系・破壊系操作が構造的に不可能になり、脅威モデルのT(Tampering)/E(EoP)を大幅に縮退
- (-) サーバー側の有用な新ツールを自動では享受できない → 意図的なトレードオフ(明示的レビューを経て追加)
