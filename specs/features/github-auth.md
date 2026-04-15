# 機能仕様: GitHub認証

> ステータス: draft

> **実装方針**: 初期リリースはスコープ外（単一ユーザー前提）。マルチユーザー対応時に実装する。将来のGitHubリポジトリ連携も見据えたスコープ設計にする。

## 依存仕様

なし（認証基盤。他の仕様には依存しない）

## 概要

GitHub OAuthでユーザーを認証し、JWTを発行する。Web UIではブラウザのOAuthフローを使い、CLIでは認証後に発行する長期APIトークンを `~/.sdd/config` に保存して利用する。将来のGitHubリポジトリ連携を見越したOAuthスコープを取得する。

## 受け入れ条件

### Web UI認証
- [ ] AC-01: 「GitHubでログイン」を押すと、GitHubのOAuth認可画面にリダイレクトされる
- [ ] AC-02: GitHub認可後、コールバックでアクセストークンを取得し、ユーザー情報（login・email・avatar_url）を取得する
- [ ] AC-03: 認証成功時、JWTアクセストークンとユーザー情報を返す
- [ ] AC-04: 初回ログイン時はユーザーレコードを自動作成する

### CLI認証
- [ ] AC-05: `sdd auth login` を実行するとブラウザが開き、GitHub OAuthフローが始まる
- [ ] AC-06: 認証完了後、CLI用長期トークンを発行し `~/.sdd/config` に保存する
- [ ] AC-07: `sdd auth status` で現在の認証状態（ログイン中のGitHubユーザー名・トークン有効期限）を確認できる
- [ ] AC-08: `sdd auth logout` でCLIトークンを失効・削除する

### エラー
- [ ] AC-E01: GitHub側で認可を拒否したとき、401を返す
- [ ] AC-E02: OAuthのstateパラメーターが一致しないとき、CSRF攻撃として400を返す
- [ ] AC-E03: CLIトークンの有効期限（90日）が切れているとき、401を返し再認証を促す

## データモデル

```typescript
export interface GitHubUser {
  id: string
  github_id: number
  login: string        // GitHubユーザー名
  email: string
  avatar_url: string
  created_at: string
}

export interface GitHubOAuthSession {
  id: string
  user_id: string
  github_access_token: string  // 暗号化して保存
  scope: string
  created_at: string
}

export interface CliToken {
  id: string
  user_id: string
  token_hash: string   // ハッシュ化して保存
  device_name: string
  last_used_at: string
  created_at: string
  expires_at: string   // 90日
}
```

## APIエンドポイント

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/auth/github` | OAuth開始（GitHubにリダイレクト） |
| GET | `/api/auth/github/callback` | コールバック受信・JWT発行 |
| POST | `/api/auth/cli-token` | CLI用長期トークンを発行 |
| DELETE | `/api/auth/cli-token` | CLIトークンを失効 |

## CLIコマンド

| コマンド | 説明 |
|---------|------|
| `sdd auth login` | ブラウザでGitHub認証・CLIトークン保存 |
| `sdd auth logout` | CLIトークンを失効・削除 |
| `sdd auth status` | 認証状態を表示 |

## OAuthスコープ設計

| スコープ | 用途 | 時期 |
|---------|------|------|
| `read:user` | ユーザー情報取得 | 初期 |
| `user:email` | メールアドレス取得 | 初期 |
| `repo` | リポジトリ読み書き（将来のGitHub連携用） | 将来 |
| `read:org` | Orgメンバーシップ確認（チーム管理用） | 将来 |

## 非機能要件

- **セキュリティ**: GitHubアクセストークンは暗号化して保存。CLIトークンはハッシュのみ保存
- **セキュリティ**: OAuthのstateパラメーターでCSRF防止
- **パフォーマンス**: 認証レスポンス 1秒以内（GitHubのAPI呼び出し含む）
- **ポータビリティ**: CLIトークンは環境変数 `SDD_TOKEN` でも上書き可能（CI環境向け）
- **エクスポート**: 発行済みCLIトークン一覧はMarkdown形式で出力できる（`sdd auth devices`）
