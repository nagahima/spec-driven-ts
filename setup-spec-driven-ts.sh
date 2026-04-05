#!/bin/bash
# spec-driven-ts プロジェクト構成セットアップスクリプト
# ~/Downloads/spec-driven-ts 内で実行してください

set -e

echo "=== spec-driven-ts セットアップ開始 ==="

# .claude/commands/
mkdir -p .claude/commands

cat > .claude/commands/implement.md << 'EOF'
# /implement [feature-name]

指定した機能の仕様を読み込み、コードを生成します。

## 手順

1. `specs/features/[feature-name].md` を読む
2. ステータスが `approved` であることを確認（それ以外はエラーで停止）
3. `packages/types/index.ts` に必要な型定義を追加
4. `apps/web/tests/[feature-name].test.ts` を生成（受け入れ条件と1:1対応）
5. `apps/web/lib/api/[feature-name].ts` に実装を生成
6. `apps/web/app/api/[[...route]]/route.ts` にルートを追加
7. 仕様ファイルのステータスを `implemented` に更新
8. 実装内容のサマリーを出力

## ルール

- 受け入れ条件（AC-XX）ごとに必ずテストケースを1つ作成すること
- エラー条件（AC-EXX）はHTTPステータスコードと対応させること
- 型定義は `packages/types/` のみに記述すること
EOF

cat > .claude/commands/spec-check.md << 'EOF'
# /spec-check

仕様とコードのドリフト（ズレ）を検出します。

## 手順

1. `specs/features/*.md` を全て読む（`_TEMPLATE.md` は除外）
2. ステータスが `implemented` の仕様について:
   - 対応するテストファイルが存在するか確認
   - 受け入れ条件（AC-XX）すべてにテストがあるか確認
   - APIエンドポイントが実装されているか確認
   - 型定義が `packages/types/` に存在するか確認
3. ドリフトがあれば詳細を報告
4. 問題なければ「仕様とコードは同期しています」と報告
EOF

cat > .claude/commands/new-spec.md << 'EOF'
# /new-spec [name] "[概要]"

新しい機能仕様ファイルを作成します。

## 手順

1. `specs/features/_TEMPLATE.md` を読む
2. `specs/features/[name].md` として新規作成
3. 概要テキストを元にテンプレートの各セクションを埋める
4. ステータスは `draft` で作成
EOF

cat > .claude/commands/doc-sync.md << 'EOF'
# /doc-sync

仕様からドキュメントを生成・更新します。

## 手順

1. `specs/features/*.md` を全て読む（`_TEMPLATE.md` は除外）
2. ステータスが `implemented` の仕様のみ対象
3. `docs/` フォルダが存在しない場合は作成
4. 各仕様に対して `docs/[feature-name].md` を生成
5. `docs/README.md` にすべての機能の索引を更新
EOF

# CLAUDE.md
cat > CLAUDE.md << 'EOF'
# CLAUDE.md — Steering Instructions

このファイルはClaude Codeへの恒久的な指示です。

---

## 仕様駆動開発の原則

1. **仕様が唯一のマスター**: `specs/features/*.md` が真実の源泉です
2. **コードを直接書かない**: 実装は必ず `/implement [feature]` コマンド経由で生成
3. **型定義は共有**: すべての型は `packages/types/` に定義
4. **テストは仕様と1:1**: 受け入れ条件（AC-XX）とテストケースは必ず対応

---

## カスタムコマンド

| コマンド | 用途 |
|---------|------|
| `/implement [feature]` | 仕様からコードを生成 |
| `/spec-check` | 仕様とコードのドリフトを検出 |
| `/new-spec [name] "[概要]"` | 新しい仕様ファイルを作成 |
| `/doc-sync` | ドキュメントを仕様に同期 |

---

## 仕様のステータスフロー

```
draft → review → approved → implemented
```

`/implement` コマンドは `approved` 状態の仕様のみ処理します。
EOF

# specs/features/
mkdir -p specs/features

cat > specs/features/_TEMPLATE.md << 'EOF'
# 機能仕様: [機能名]

> ステータス: draft

## 概要

[機能の概要を1-2文で]

## 受け入れ条件

- [ ] AC-01: [条件]のとき、[結果]になる
- [ ] AC-E01: [エラー条件]のとき、[エラー]になる

## データモデル

```typescript
export interface [TypeName] {
  id: string
  created_at: string
}
```

## APIエンドポイント

- **Method**: POST
- **Path**: `/api/[path]`
- **認証**: 不要

## 非機能要件

- **パフォーマンス**: 200ms以内
- **セキュリティ**:
EOF

cat > specs/features/auth-login.md << 'EOF'
# 機能仕様: ログイン認証

> ステータス: approved

## 概要

メールアドレスとパスワードを使ってSupabase Authでユーザー認証を行い、JWTトークンとユーザー情報を返す。

## 受け入れ条件

- [ ] AC-01: 正しいメールとパスワードのとき、JWTアクセストークンを返す
- [ ] AC-02: ログイン成功時、ユーザーのid・email・created_atを返す
- [ ] AC-E01: 認証情報が間違っているとき、401を返す
- [ ] AC-E02: メールが未入力のとき、400を返す
- [ ] AC-E03: パスワードが未入力のとき、400を返す

## データモデル

```typescript
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  user: User
}
```

## APIエンドポイント

- **Method**: POST
- **Path**: `/api/auth/login`
- **認証**: 不要

## 非機能要件

- **パフォーマンス**: 500ms以内（Supabase Auth含む）
- **セキュリティ**: パスワードはログに出力しない
EOF

# packages/types/
mkdir -p packages/types

cat > packages/types/index.ts << 'EOF'
// packages/types/index.ts
// フロントエンド・バックエンド共通の型定義

export interface ApiResponse<T> {
  data?: T
  error?: string
  timestamp: string
}

export interface User {
  id: string
  email: string
  created_at: string
}

export interface HealthResponse {
  status: 'ok' | 'error'
  timestamp: string
}
EOF

cat > packages/types/package.json << 'EOF'
{
  "name": "types",
  "version": "0.0.1",
  "main": "./index.ts",
  "types": "./index.ts",
  "exports": {
    ".": "./index.ts"
  }
}
EOF

# apps/web/
mkdir -p apps/web/app/api/\[\[...route\]\]
mkdir -p apps/web/lib/api
mkdir -p apps/web/tests

cat > apps/web/package.json << 'EOF'
{
  "name": "web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "14.2.0",
    "react": "^18",
    "react-dom": "^18",
    "hono": "^4.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "types": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5",
    "vitest": "^1.0.0"
  }
}
EOF

cat > apps/web/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
EOF

cat > apps/web/next.config.ts << 'EOF'
import type { NextConfig } from 'next'
const nextConfig: NextConfig = {
  transpilePackages: ['types'],
}
export default nextConfig
EOF

cat > apps/web/app/layout.tsx << 'EOF'
import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Spec-Driven App',
  description: '仕様駆動開発のサンプルアプリ',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
EOF

cat > apps/web/app/page.tsx << 'EOF'
export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Spec-Driven App</h1>
      <p>仕様駆動開発環境が正常に動作しています。</p>
      <a href="/api/health">/api/health</a>
    </main>
  )
}
EOF

cat > "apps/web/app/api/[[...route]]/route.ts" << 'EOF'
import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { healthRoute } from '@/lib/api/health'

export const runtime = 'edge'

const app = new Hono().basePath('/api')
app.route('/health', healthRoute)

export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)
EOF

cat > apps/web/lib/api/health.ts << 'EOF'
import { Hono } from 'hono'
import type { HealthResponse } from 'types'

export const healthRoute = new Hono()
  .get('/', (c) => {
    const response: HealthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
    }
    return c.json(response)
  })
EOF

cat > apps/web/lib/supabase.ts << 'EOF'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const createServerClient = () => {
  return createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
EOF

cat > apps/web/tests/health.test.ts << 'EOF'
import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { healthRoute } from '../lib/api/health'

const app = new Hono().basePath('/api')
app.route('/health', healthRoute)

describe('GET /api/health', () => {
  it('status が ok を返す', async () => {
    const res = await app.request('/api/health')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
  })

  it('timestamp を含む', async () => {
    const res = await app.request('/api/health')
    const body = await res.json()
    expect(body.timestamp).toBeDefined()
  })
})
EOF

# ルートファイル
cat > package.json << 'EOF'
{
  "name": "spec-driven-ts",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "type-check": "turbo type-check"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  },
  "packageManager": "pnpm@9.0.0"
}
EOF

cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
EOF

cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "!.next/cache/**"] },
    "dev": { "cache": false, "persistent": true },
    "test": { "dependsOn": ["^build"] },
    "type-check": { "dependsOn": ["^build"] }
  }
}
EOF

cat > vercel.json << 'EOF'
{
  "buildCommand": "cd ../.. && pnpm build",
  "outputDirectory": "apps/web/.next",
  "framework": "nextjs",
  "installCommand": "pnpm install"
}
EOF

cat > .env.example << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
EOF

cat > .gitignore << 'EOF'
node_modules
.pnpm-store
.next
out
dist
build
.env
.env.local
.turbo
.vercel
*.log
.DS_Store
EOF

mkdir -p .github/workflows
cat > .github/workflows/ci.yml << 'EOF'
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm type-check
      - run: pnpm test
EOF

echo ""
echo "=== セットアップ完了 ==="
echo "作成されたファイル:"
find . -type f | grep -v '.git/' | sort
