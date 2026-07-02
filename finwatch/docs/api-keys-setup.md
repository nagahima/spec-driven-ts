# APIキー設定ガイド

finwatch 実行に必要な外部APIキーの取得方法と設定手順。

## 概要

| API | 用途 | 取得先 | キープレフィックス | 必須 |
|---|---|---|---|---|
| EDINET DB | 上場企業の財務データ取得(MCP) | https://edinetdb.jp/ | `edb_` | ✅ |
| Anthropic(Claude) | LLMツール呼び出しループ・レポート生成 | https://console.anthropic.com | `sk-ant-` | ✅ |

## 1. EDINET DB API キー取得

### 概要
**EDINET DB** は、日本の上場企業の有価証券報告書(財務・セグメント情報)を公開している経済産業省傘下のMCPサーバーです。無料プランは **100リクエスト/日** のレート制限があります(ADR-0007)。

### 取得手順

1. **EDINET DB公式サイトにアクセス**
   ```
   https://edinetdb.jp/developers
   ```

2. **APIキーを発行する**
   - 「APIキー管理」または「Developer」セクションを探す
   - 「新しいキーを生成」ボタンをクリック
   - APIキーが表示される(形式: `edb_xxxxx`)

3. **キーをコピーして安全に保管**
   - 他者に共有しない
   - コード・ログ・GitHubに直接書かない

### 動作確認(オプション)
```bash
export EDINETDB_API_KEY="edb_your_api_key_here"
npm run tools:snapshot
```
成功すると `contracts/edinetdb.snapshot.json` が生成されます(Phase 2)。

## 2. Anthropic API キー取得

### 概要
**Anthropic API** は Claude LLMへのアクセスを提供します。finwatch はデフォルトで **claude-sonnet-4-6**(agent層) と **claude-haiku-4-5**(formatting層) を使用し、ADR-0010の予算(`maxInputTokens: 200000 / run` など)で管理されています。

### 取得手順

1. **Anthropic Console にアクセス**
   ```
   https://console.anthropic.com
   ```

2. **アカウント作成 / ログイン**
   - メールアドレスで登録(または Google/GitHub で OAuth)
   - API利用規約に同意

3. **支払い方法を設定**
   - 「Billing」セクションでクレジットカードを登録
   - 使用量制限を設定(オプション、推奨)

4. **APIキーを生成**
   - 「API Keys」または「Settings」で「Create new key」
   - キーが表示される(形式: `sk-ant-xxxxx`)
   - キーをコピーして安全に保管(再表示不可、忘れたら再生成)

### 動作確認(オプション)
```bash
export ANTHROPIC_API_KEY="sk-ant-your_api_key_here"
npm run typecheck  # basic syntax check
# Phase 3 以降で agent テストで実際の呼び出しを検証
```

## 3. ローカル環境での設定

### .env ファイルの作成

```bash
cd finwatch
cp .env.example .env
```

### .env の編集
```bash
# EDINET DB (https://edinetdb.jp/developers で発行)
EDINETDB_API_KEY=edb_your_actual_key_here

# Anthropic API (https://console.anthropic.com で発行)
ANTHROPIC_API_KEY=sk-ant-your_actual_key_here
```

### 確認
```bash
# キーが正しくロードされたか確認(redact で秘匿情報がマスクされている)
npm run tools:snapshot 2>&1 | head -20
```

## 4. GitHub Actions での設定(CI/本番運用)

### Secrets 追加手順

1. **GitHub リポジトリで Secrets 管理ページを開く**
   ```
   Settings → Secrets and variables → Actions → Repository secrets
   ```

2. **各Secretを追加**

   | 名前 | 値 |
   |---|---|
   | `EDINETDB_API_KEY` | edb_xxxxx |
   | `ANTHROPIC_API_KEY` | sk-ant-xxxxx |

3. **Actions で利用する**
   ```yaml
   - run: npm run report:generate
     env:
       EDINETDB_API_KEY: ${{ secrets.EDINETDB_API_KEY }}
       ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
   ```

### 注意
- GitHub Secrets は、Actions 実行時にのみ環境変数として展開される
- ログ出力には自動的にマスク処理が適用される(GitHub標準機能)
- finwatch 内部でも `redact()` (src/mcp/redact.ts)でマスクし、多層防御(ADR-0005)

## 5. セキュリティのベストプラクティス

### ❌ 絶対にしてはいけないこと
- コード・テスト・ドキュメント・.md ファイルにキーを直書き
- キーを含む `.env` ファイルを Git にコミット(`.gitignore` で除外済み)
- ログ出力にキーを含める → `redact()` 経由で出力

### ✅ 安全な運用方法
- `.env` はローカルのみ、`.env.example` のみをコミット
- GitHub Secrets で厳格に管理(Actions 実行時のみアクセス可)
- ローテーション: 四半期ごと(docs/runbook.md 参照)に新キーを発行して更新

## 6. トラブルシューティング

### 「403 Unauthorized」エラー
- キーが正しくセットされているか確認: `echo $EDINETDB_API_KEY`
- キーの有効期限を確認(EDINET DB・Anthropic Console)
- キーの形式確認: `edb_` または `sk-ant-` で始まるか

### 「Rate limit exceeded (429)」
- EDINET DB の 100req/日 制限に達した
- ADR-0007: キャッシュが自動的に優先される(鮮度をレポートに明示)
- 翌日になるとリセット

### 「Invalid request」
- キーの有効性を確認(EDINET DB・Anthropic Console で再発行)
- キーにホワイトスペース・改行が混入していないか確認

## 7. キーローテーション(四半期)

詳細は `docs/runbook.md` を参照。簡単には:

```bash
# 1. EDINET DB Dashboard で新キーを発行
# 2. GitHub Secrets EDINETDB_API_KEY を更新
# 3. npm run tools:snapshot で疎通確認
# 4. 旧キーを失効させる

# 同様に Anthropic Console でもローテーション
```

## 参考

- **EDINET DB**: https://edinetdb.jp/
  - API ドキュメント: https://edinetdb.jp/api-docs
  - 無料プラン制限: 100req/日、ただし ADR-0007 キャッシュで対応
  
- **Anthropic API**: https://docs.anthropic.com/
  - 価格・トークン数: https://www.anthropic.com/pricing
  - Claude モデルカタログ: https://docs.anthropic.com/models
  
- **finwatch セキュリティ設計**:
  - ADR-0005: 秘匿情報の管理と LLM コンテキストへの秘匿境界
  - ADR-0010: コスト管理(トークン予算 200k入力 / 8k出力)
