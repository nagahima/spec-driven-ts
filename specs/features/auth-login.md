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
