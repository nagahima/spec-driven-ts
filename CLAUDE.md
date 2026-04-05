# CLAUDE.md — Project Steering

> このファイルはKiroの「Steering」に相当します。
> Claude Codeはすべてのセッションでこのファイルを最初に読みます。

---

## プロジェクト概要

- **構成**: Turborepoモノレポ
- **フロントエンド**: Next.js 14（App Router）@ `apps/web/`
- **APIサーバー**: Hono（Next.js API Routes上）@ `apps/web/app/api/`
- **DB・認証**: Supabase
- **共有型**: `packages/types/`
- **言語**: TypeScript（strict mode）
- **テスト**: Vitest
- **パッケージマネージャー**: pnpm
- **ローカル実行**: `vercel dev`（ルートで実行）
- **デプロイ**: Vercel（git push → 自動）

---

## 仕様駆動の原則（最重要）

1. **`specs/` が唯一のマスター（Single Source of Truth）**
2. 実装前に必ず対応する `specs/features/[name].md` を読む
3. 仕様にない機能は絶対に追加しない
4. 仕様と実装が乖離したら、実装を修正するか仕様更新を提案してから進む
5. 受け入れ条件はテストケースに1:1で対応させる
6. **`specs/` ディレクトリへの自動書き込みは絶対禁止**

---

## ワークフロー

```
specs/features/[name].md を読む（ステータスがapprovedであること確認）
        ↓
packages/types/src/ に型定義を追加・更新
        ↓
apps/web/tests/[name].test.ts を先に生成（TDD）
        ↓
apps/web/lib/api/[name].ts を実装
        ↓
apps/web/app/api/[[...route]]/route.ts にルートを登録
        ↓
（フロントが必要なら）specs/design/ を読んでUIを実装
        ↓
docs/[name].md を更新
        ↓
vercel dev で動作確認
```

---

## フロントエンド実装の原則

UIを実装する前に必ず以下の順で読むこと：

1. `specs/design/_SYSTEM.md` → 使用ライブラリ・全体方針
2. `specs/design/tokens.md` → カラー・タイポグラフィ・スペーシング
3. `specs/design/components.md` → 使うべきコンポーネント
4. `specs/design/patterns.md` → インタラクション・UXパターン

### デザインに関する禁止事項
- カラー値・スペーシング値のハードコード（必ずTailwindトークンを使う）
- `components.md` に定義されていないコンポーネントの無断追加
- `window.alert()` / `window.confirm()` の使用
- スピナー（`patterns.md` に記載の例外を除く）

---

## コーディング規約

### TypeScript
- `strict: true` を必ず維持する
- `any` は原則禁止
- 関数は必ず戻り値の型を明示する
- APIのレスポンス型は必ず `packages/types/` を使う

### Honoでのルーティング
- ルートごとにファイルを分ける: `apps/web/lib/api/[feature].ts`
- `apps/web/app/api/[[...route]]/route.ts` はエントリポイントのみ
- バリデーションはzodを使う

### Supabase
- クライアントは `apps/web/lib/supabase.ts` から使う
- サーバーサイドは必ず `createServerClient()` を使う
- クライアントサイドは `supabase` をそのまま使う

### ファイル構成
```
apps/web/
  app/                    Next.js App Router
  app/api/[[...route]]/   Honoエントリポイント（触らない）
  lib/api/                Honoルート実装（ここに機能を追加）
  lib/supabase.ts         Supabaseクライアント
  tests/                  テスト（*.test.ts）
packages/types/src/       共有型定義
specs/features/           機能仕様マスター（自動編集禁止）
specs/design/             デザインシステム仕様（自動編集禁止）
docs/                     生成ドキュメント
```

### コミット
- Conventional Commits: `feat:`, `fix:`, `test:`, `docs:`, `refactor:`
- 1コミット1目的

---

## ローカル開発

```bash
# 初回セットアップ
pnpm install
vercel link
vercel env pull .env.local

# 開発サーバー起動
vercel dev  # localhost:3000

# テスト
pnpm test

# 型チェック
pnpm typecheck
```

---

## 禁止事項

- `specs/` への自動書き込み
- テストをスキップした実装
- `packages/types/` を使わないAPIレスポンス型
- 仕様に記載のない外部ライブラリの追加（提案はOK）
- `any` の多用
- カラー・スペーシングのハードコード
