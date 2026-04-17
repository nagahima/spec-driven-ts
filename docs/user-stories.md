# ユーザーストーリー一覧

> `sdd` CLI v0.1.0 で現在実行可能なユーザーストーリー

---

## 前提条件

```sh
# 環境変数を設定する
export GITHUB_CLIENT_ID=your_client_id
export GITHUB_CLIENT_SECRET=your_client_secret
export ANTHROPIC_API_KEY=your_api_key

# CLIをビルドする
cd apps/cli && pnpm build

# プロジェクトルートから実行する（specs/ ディレクトリを自動検出）
node apps/cli/dist/index.js <command>
# または pnpm --filter cli dev <command>
```

---

## 認証

### US-A01: GitHubでログインする

> 私はGitHubアカウントを使ってツールにログインし、認証済みの状態で作業を始めたい。

```sh
sdd auth login
# → ブラウザが開いてGitHub OAuth認証
# → 完了後、~/.sdd/config.json にトークンが保存される
# ログイン成功: username (user@example.com)
```

### US-A02: ログイン状態を確認する

> 私は現在自分がログインしているかどうかをすぐに確認したい。

```sh
sdd auth status
# → ログイン中: username (user@example.com)
# → または: 未ログイン
```

### US-A03: ログアウトする

> 私は明示的にログアウトして、保存されたトークンを削除したい。

```sh
sdd auth logout
# → ログアウトしました: username
```

---

## 仕様管理

### US-S01: 新しい仕様のdraftをAIで作成する

> 私は機能名と概要を伝えるだけで、受け入れ条件・データモデルを含む仕様のdraftをAIに生成してもらいたい。

```sh
sdd spec new user-profile "ユーザーのプロフィール情報を表示・編集する"
# → AIが受け入れ条件・データモデル・APIエンドポイントを含むdraftを生成
# → specs/features/user-profile.md に保存
# → 次のステップ: sdd spec check user-profile
```

**生成される仕様の構成:**
- ステータス: `draft`
- 受け入れ条件（AC-01〜05）
- エラー条件（AC-E01〜02）
- データモデル（TypeScript interface）
- APIエンドポイント定義
- 非機能要件

### US-S02: 仕様の矛盾・抜け・曖昧さをAIに指摘してもらう

> 私が書いた仕様に問題がないか、AIに校正してもらいたい。問題は「矛盾」「抜け」「曖昧」に分類して、具体的な質問形式で教えてほしい。

```sh
sdd spec check user-profile
# → 例: 3件の指摘事項が見つかりました
#   [1] issue-001 (抜け)
#     問題: パスワード変更の受け入れ条件が定義されていません
#     質問: プロフィール編集の範囲にパスワード変更は含みますか？
# → specs/issues/user-profile.json に保存
```

### US-S03: 指摘事項を一つずつ解決する

> 私はAIの指摘に回答して、指摘を解決済みにしていきたい。

```sh
sdd spec resolve user-profile issue-001
# → 問題と質問が表示される
# → 回答を入力すると指摘が resolved になる
# → 残り件数が表示される
```

### US-S04: 仕様のステータスと指摘残件数を確認する

> 私は仕様が今どの状態にあるかを素早く確認したい。

```sh
sdd spec status user-profile
# → 仕様: user-profile
#   ステータス: draft
#   指摘: 1 件未解決 / 3 件合計
```

### US-S05: 承認済み仕様からAIで詳細仕様を生成する

> 私は機能仕様（what）をAIが技術仕様（how）に変換してほしい。アーキテクチャ決定・データ設計・API設計を含む詳細仕様として出力してほしい。

```sh
# 事前に仕様のステータスを approved に変更しておく

sdd spec elaborate user-profile
# → 依存仕様の技術決定を自動で継承
# → specs/elaborated/user-profile.md に保存
# → 次のステップ: sdd task generate user-profile
```

**生成される詳細仕様の構成:**
- 技術スタック（ランタイム・フレームワーク・外部サービス）
- アーキテクチャ決定（ADR形式・代替案付き）
- データ設計（エンティティ・リレーション）
- API設計（エンドポイント・スキーマ）
- 非機能要件の実装方針

### US-S06: アーキテクチャ決定のサマリーだけを確認する

> 私は詳細仕様の全体を読まずに、何の技術的決定がなされたかだけを素早く確認したい。

```sh
sdd spec elaborate --summary user-profile
# → アーキテクチャ決定セクションのみ表示（ファイルは保存しない）
```

### US-S07: 仕様変更後に詳細仕様を再生成する

> 私は仕様が変わったとき、詳細仕様を最新の状態に更新したい。

```sh
sdd spec elaborate user-profile          # 上書き再生成
sdd spec elaborate --diff user-profile   # 既存との差分を表示しながら再生成
```

---

## タスク管理

### US-T01: 詳細仕様からタスクを自動生成する

> 私はアーキテクチャが決まった仕様から、実装タスクを見積もり付きで自動生成してほしい。依存関係に基づいた実施順も知りたい。

```sh
sdd task generate user-profile
# → 例: 5 件のタスクを生成しました
#    1. [未着手] [S  2〜4h] task-001: データベーススキーマの定義
#    2. [未着手] [M  4〜8h] task-002: APIエンドポイントの実装 ← [task-001]
#    3. [未着手] [S  2〜4h] task-003: バリデーションロジックの追加 ← [task-002]
#   合計見積もり: 12〜24h
```

**タスクの属性:**
- ステータス: `未着手 / 進行中 / 完了 / ブロック / 要確認`
- サイズ: `XS(<1h) / S(2〜4h) / M(4〜8h) / L(1〜2日) / XL(2日以上)`
- 依存タスクID

### US-T02: 特定仕様のタスク一覧を確認する

> 私はある機能のタスクが今どうなっているかを確認したい。

```sh
sdd task list user-profile
# →  1. [未着手] [S  2〜4h] task-001: ...
#    2. [未着手] [M  4〜8h] task-002: ...
#   進捗: 0/5 完了
```

### US-T03: 全仕様を横断したロードマップを確認する

> 私はプロジェクト全体のタスクと進捗を一画面で把握したい。

```sh
sdd task roadmap
# → ─── spec-management (0/8) ───
#      1. [未着手] [M] task-001: ...
#   ─── user-profile (3/5) ───
#      1. [完了  ] [S] task-001: ...
#   ━━━ 合計: 3/13 完了 ━━━
```

---

## バグ管理

### US-B01: バグを自然言語で報告する

> 私はバグの内容を自然言語で書くだけで、AIがどの仕様の何の条件に違反しているかを分析してほしい。

```sh
sdd bug report "ログイン後にダッシュボードではなく404が返る"
# → バグ登録: bug-a1b2c3d4
#   分析中...
#   分析結果:
#     原因種別: 実装バグ
#     関連仕様: auth-login
#     違反条件: AC-01
#     確信度  : 90%
#     根拠    : ログイン成功時のリダイレクト処理が未実装
```

### US-B02: 実装バグの修正タスクを自動生成する

> 私はバグ報告から自動的に修正タスクが作られ、タスクリストに追加されてほしい。

```sh
# bug report コマンドで実装バグと判定された場合、自動的に実行される
# ✓ 修正タスクを生成しました: bug-fix-bug-a1b2c3d4
#   タイトル: ログイン後リダイレクト処理の修正
#   見積もり: S (1〜3h)
#   タスク確認: sdd task list auth-login
```

### US-B03: 仕様欠陥バグを仕様修正提案に変換する

> 私はバグの原因が実装ではなく仕様の書き漏れにあると判明したとき、仕様修正提案として記録し、承認フローに乗せてほしい。

```sh
# bug report コマンドで仕様欠陥と判定された場合、自動的に実行される
# 仕様欠陥として記録しました
#   修正提案ID: proposal-e5f6g7h8
#   承認するには: sdd spec approve proposal-e5f6g7h8
```

### US-B04: バグ一覧を確認する

> 私は報告されたバグの一覧と対応状況を確認したい。

```sh
sdd bug list
# → バグ一覧 (3 件)
#   bug-a1b2c3d4  [解決済み] [auth-login]  ログイン後に404...
#   bug-e5f6g7h8  [仕様欠陥] [user-profile] プロフィール画像が...
#   bug-i9j0k1l2  [未分類  ]               エラーメッセージが...
```

### US-B05: バグの詳細と分析結果を確認する

> 私はバグの分析根拠・生成されたタスクID・仕様修正提案IDを確認したい。

```sh
sdd bug show bug-a1b2c3d4
# → バグ: bug-a1b2c3d4
#   ステータス: 解決済み
#   説明: ログイン後に404が返る
#   分析結果:
#     原因種別: implementation
#     関連仕様: auth-login
#     違反条件: AC-01
#     確信度  : 90%
#     根拠    : ...
#   修正タスク: bug-fix-bug-a1b2c3d4
```

---

## 標準フロー（エンドツーエンド）

```sh
# 1. ログイン
sdd auth login

# 2. 仕様を作成
sdd spec new payment "クレジットカードで決済する"

# 3. 仕様を校正
sdd spec check payment

# 4. 指摘を解決（繰り返す）
sdd spec resolve payment issue-001

# 5. 仕様のステータスを approved に変更（手動でMarkdownを編集）

# 6. 詳細仕様を生成
sdd spec elaborate payment

# 7. タスクを生成
sdd task generate payment

# 8. 進捗確認
sdd task list payment
sdd task roadmap

# 9. バグが見つかったとき
sdd bug report "決済後に領収書メールが届かない"
sdd bug list
sdd bug show bug-xxxxxxxx
```

---

## 現在の制限事項

| 機能 | 状態 |
|-----|------|
| コード・テスト自動生成 | 未実装（`sdd task generate` でタスクは作られるが実装は行わない） |
| 仕様ステータスの変更 | 手動（Markdownファイルを直接編集） |
| `sdd spec approve` | 未実装（修正提案の承認はファイルを直接編集） |
| GitHub認証 | 実装済みだが当面は単一ユーザー前提 |
| Web UI | 未実装 |
