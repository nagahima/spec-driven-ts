# 機能仕様: パスキー認証

> ステータス: draft

> **実装方針**: 初期リリースはスコープ外（単一ユーザー前提）。マルチユーザー対応時に実装する。コア機能（spec-management等）は認証なしで動作するよう設計する。

## 依存仕様

なし（認証基盤。他の仕様には依存しない）

## 概要

パスキー（WebAuthn/FIDO2）のみで認証を行う。パスワード不要。登録時にデバイスへ秘密鍵を生成し、認証時はデバイスの生体認証・PINで署名してJWTを発行する。CLIからはWeb認証後に発行するAPIトークンで利用する。

## 受け入れ条件

### 登録（初回のみ）
- [ ] AC-01: 登録開始リクエストに対してチャレンジ（ランダムバイト列）を返す
- [ ] AC-02: デバイスが生成した公開鍵クレデンシャルを検証し、サーバーに保存する
- [ ] AC-03: 登録完了後、ユーザーのid・email・created_atを返す

### 認証
- [ ] AC-04: 認証開始リクエストに対してチャレンジを返す
- [ ] AC-05: デバイスが署名したチャレンジを検証し、JWTアクセストークンを返す
- [ ] AC-06: 認証成功時にサインカウントを更新する（リプレイ攻撃防止）

### CLI連携
- [ ] AC-07: Web UIで認証後、CLI用の長期APIトークンを発行できる
- [ ] AC-08: CLIはAPIトークンを `~/.sdd/config` に保存して以降の認証に使用する

### エラー
- [ ] AC-E01: チャレンジの有効期限（5分）切れのとき、401を返す
- [ ] AC-E02: 署名の検証に失敗したとき、401を返す
- [ ] AC-E03: 登録済みでないクレデンシャルで認証したとき、401を返す
- [ ] AC-E04: サインカウントが想定より小さいとき（リプレイ攻撃の疑い）、401を返し管理者に通知する

## データモデル

```typescript
export interface PasskeyCredential {
  id: string
  user_id: string
  credential_id: string  // WebAuthn クレデンシャルID（base64url）
  public_key: string     // CBORエンコード公開鍵
  sign_count: number     // リプレイ攻撃防止カウンター
  device_name?: string   // 任意のデバイス識別名
  created_at: string
  last_used_at: string
}

export interface AuthChallenge {
  id: string
  challenge: string      // base64url エンコードされたランダムバイト列
  expires_at: string     // 発行から5分
}

// 登録フロー
export interface RegistrationStartResponse {
  challenge: string
  rp: { name: string; id: string }
  user: { id: string; name: string; displayName: string }
  pubKeyCredParams: PublicKeyCredentialParameters[]
}

export interface RegistrationCompleteRequest {
  credential_id: string
  attestation_object: string  // base64url
  client_data_json: string    // base64url
  device_name?: string
}

// 認証フロー
export interface AuthenticationStartResponse {
  challenge: string
  allow_credentials: { type: string; id: string }[]
}

export interface AuthenticationCompleteRequest {
  credential_id: string
  authenticator_data: string  // base64url
  client_data_json: string    // base64url
  signature: string           // base64url
}

export interface AuthenticationResponse {
  access_token: string
  user: User
}

// CLI連携
export interface CliTokenRequest {
  access_token: string  // Web認証で得たJWT
  device_name: string
}

export interface CliTokenResponse {
  cli_token: string     // 長期トークン（有効期限90日）
}
```

## APIエンドポイント

| Method | Path | 説明 |
|--------|------|------|
| POST | `/api/auth/passkey/register/start` | 登録チャレンジを発行 |
| POST | `/api/auth/passkey/register/complete` | 公開鍵を検証・保存 |
| POST | `/api/auth/passkey/authenticate/start` | 認証チャレンジを発行 |
| POST | `/api/auth/passkey/authenticate/complete` | 署名を検証・JWT発行 |
| POST | `/api/auth/passkey/cli-token` | CLI用長期トークンを発行 |

## 非機能要件

- **セキュリティ**: 秘密鍵はデバイスから外に出ない（WebAuthn仕様による）
- **セキュリティ**: チャレンジは使い捨て（一度使用したら即時無効化）
- **パフォーマンス**: 認証レスポンス 500ms以内
- **ポータビリティ**: CLIトークンは `~/.sdd/config`（TOML形式）に保存。環境変数 `SDD_TOKEN` でも上書き可能
- **エクスポート**: 登録済みデバイス一覧はMarkdown形式で出力できる（`sdd auth devices`）
