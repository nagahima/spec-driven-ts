# ADR-0002: データソースはEDINET DB(リモートMCP)を採用し、非上場企業を対象外とする

Status: Accepted / Date: 2026-07-02

## Context
競合財務データの取得手段として、(a) EDINET APIを直接叩きXBRLを自前パース、(b) EDINET DB(名寄せ済みデータをMCP提供、Free 100req/日)、(c) 商用データベースがある。監視対象候補: 三協立山、LIXIL、三和HD、不二サッシ、YKK AP、Reynaers、WICONA。

## Decision
EDINET DB のリモートMCP(`https://edinetdb.jp/mcp`)を採用。**YKK AP(非上場)と海外勢はスコープ外**とし、READMEに既知の制約として明記する。

## Alternatives
- **XBRL自前パース**: タクソノミ解決・会計基準の名寄せは本プロジェクトの主目的(NFR設計)に対して工数過大。「作らない判断」も設計判断として記録
- **商用DB**: コスト超過(ADR-0010)

## Consequences
- (+) データ品質(名寄せ済み)を外部化し、本体はNFRに集中できる
- (-) 単一外部依存がSPOF化 → ADR-0007(回復性)とSLOのエラーバジェットで扱う
- (-) カバレッジ欠損(YKK AP) → 補完MCP自作を拡張ポイントとしてADR-0001のレジストリで受ける
- (-) Free枠 100req/日 → キャッシュ設計(ADR-0007)がコスト/可用性の両方に効く
