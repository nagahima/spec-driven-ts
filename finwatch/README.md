# finwatch — MCP Host for Competitive Financial Monitoring

**このリポジトリの目的は「動くアプリ」ではなく「設計判断」を見せることです。**
コードは設計の実証最小実装であり、主役は `docs/` 配下のADR・脅威モデル・SLO・テスト戦略です。

## What it does

建材業界の上場競合企業(三協立山・LIXIL・三和HD・不二サッシ)の財務データを、
外部公開MCPサーバー **EDINET DB** (`https://edinetdb.jp/mcp`) から取得し、
隔週の競合モニタリングレポートを自動生成するエージェントです。

特徴: Claude Desktop等の既製MCPクライアントを使わず、**MCPホスト(クライアント)を自前実装**しています。
MCPをプロトコルレベル(Streamable HTTP / OAuth 2.1 / tool schema)で扱うことが目的です。

## 面接官向け読み順

1. `docs/adr/` — 全設計判断(10本)。各ADRに「検討した選択肢・却下理由・トレードオフ」を記載
2. `docs/threat-model/stride.md` — LLM+MCP特有の脅威モデリング(prompt injection経由のツール悪用、rug pull等)
3. `docs/slo/slo.md` — SLI/SLO定義とエラーバジェット、外部依存SPOFへの対処
4. `docs/test-strategy.md` — LLMの非決定性をCIに載せるための3層テスト設計
5. `docs/architecture/c4.md` — C4モデル+信頼境界図
6. `src/` / `evals/` — 上記の実証

## Non-Functional Requirements → 実装対応表

| NFR | 設計 | 対応ADR |
|---|---|---|
| 認証認可 | Secrets分離 + LLMコンテキストへの秘匿境界 + ツール単位allowlist | ADR-0005, 0006 |
| セキュリティ | STRIDE脅威モデル、read-onlyツール限定、出力サニタイズ | ADR-0006, threat-model |
| 高可用性 | サーキットブレーカー + キャッシュフォールバック + 鮮度明示 | ADR-0007 |
| メンテナンシビリティ | ツールスキーマスナップショット + 契約テストCI | ADR-0008 |
| 拡張性 | MCPサーバーレジストリによるプラガブル設計 | ADR-0001 |
| テスト自動化 | unit / contract / eval の3層、eval閾値のCIゲート | ADR-0009 |
| コスト | トークン予算・キャッシュによるAPI呼数削減(月$25以内) | ADR-0010 |

## Quick start

```bash
cp .env.example .env   # EDINETDB_API_KEY, ANTHROPIC_API_KEY を設定
npm install
npm run report:generate -- --companies config/companies.json
npm test               # unit + contract
npm run eval           # ツール選択精度eval(閾値90%)
```

## Known limitations(意図的なスコープ判断)

- **YKK APは非上場のためEDINETに有報がなく対象外**(ADR-0002)。決算公告/Web検索による補完は拡張ポイントとして設計のみ実施
- 海外競合(Reynaers/WICONA)も同様に対象外
- 実行基盤はGitHub Actions cron。商用想定のマネージドサービス構成はADR-0004の代替案に記載
