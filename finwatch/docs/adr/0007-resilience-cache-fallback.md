# ADR-0007: 回復性 — サーキットブレーカー + キャッシュフォールバック + 鮮度明示

Status: Accepted / Date: 2026-07-02

## Context
外部依存はEDINET DB(SPOF)とAnthropic API。EDINET DB Freeプランは100req/日のレート制限。財務データの更新頻度は実質日次以下であり、強い鮮度要求はない。

## Decision
1. 全MCP呼び出しを共通の resilience パイプラインに通す: `retry(exponential backoff + jitter, max 3)` → `circuit breaker(5連続失敗でopen、60s half-open)` → `cache`
2. キャッシュ: SQLite、キーは `(tool, canonical_args_hash)`、TTL 24h。レート制限(429)検知時はTTL無視でキャッシュ優先に切替
3. **グレースフルデグラデーション**: 障害時は stale キャッシュでレポートを生成し、レポート冒頭に「データ鮮度: N時間前(EDINET DB障害のため)」を必ず明示する。silent staleness を禁止
4. レポート生成全体はべき等(同一入力・同一キャッシュ状態なら再実行安全)

## Alternatives
- **障害時は生成中止**: 「古いが明示された情報 > 情報なし」という利用者(自分)の要求に反する。却下
- **リードレプリカ的な二次データソース**: 現実装ではコスト過剰。レジストリ設計(ADR-0001)により将来追加可能

## Consequences
- (+) キャッシュがレート制限対策・コスト削減・可用性の3役を兼ね、SLO達成の主手段になる
- (-) キャッシュ整合性のバグ面が増える → contract テストでキャッシュ層単体を検証
