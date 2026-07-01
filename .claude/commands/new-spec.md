# /new-spec [name] "[概要]"

新しい機能仕様ファイルを作成します。

## 手順

1. `specs/features/[name].md` が既に存在すれば、上書きするかユーザーに確認する
2. `ANTHROPIC_API_KEY` が設定されていれば `sdd` CLIに委譲する：
   ```sh
   node apps/cli/dist/index.js spec new [name] "[概要]"
   ```
3. 未設定の場合はClaude Code自身が作成する：
   - `specs/features/_TEMPLATE.md` を読む
   - 概要から受け入れ条件を3〜5個（AC-01形式）、エラー条件を1〜2個（AC-E01形式）推測して作成
   - データモデル・APIエンドポイントを概要に合わせて定義
   - 他仕様に依存する場合は `## 依存仕様` セクションを追加（表形式・理由付き）
   - ステータスは `draft` で作成
4. 作成後、次のステップを案内する：`sdd spec check [name]` または `/develop [name]`
