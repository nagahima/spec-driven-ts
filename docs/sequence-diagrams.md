# シーケンス図

> `sdd` CLI v0.1.0 の各ユーザーストーリーのシーケンス図

---

## 全体フロー概要

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant CLI as sdd CLI
    participant Claude as Claude API
    participant FS as ファイルシステム (specs/)
    participant GitHub as GitHub

    User->>CLI: sdd auth login
    CLI->>GitHub: OAuth認証
    GitHub-->>CLI: access_token
    CLI->>FS: ~/.sdd/config.json に保存

    User->>CLI: sdd spec new [name] "[概要]"
    CLI->>Claude: テンプレート + 概要
    Claude-->>CLI: draft仕様
    CLI->>FS: specs/features/[name].md

    User->>CLI: sdd spec check [name]
    CLI->>Claude: 仕様内容（校正）
    Claude-->>CLI: SpecIssue[]
    CLI->>FS: specs/issues/[name].json

    User->>CLI: sdd spec resolve [name] [id]
    CLI->>FS: 指摘を解決済みに更新

    Note over User,FS: 仕様ステータスを approved に変更（手動）

    User->>CLI: sdd spec elaborate [name]
    CLI->>Claude: 仕様 + 依存仕様コンテキスト
    Claude-->>CLI: 詳細仕様（ADR・データ設計・API設計）
    CLI->>FS: specs/elaborated/[name].md

    User->>CLI: sdd task generate [name]
    CLI->>Claude: 詳細仕様（タスク分解）
    Claude-->>CLI: Task[]（見積もり・依存関係付き）
    CLI->>FS: specs/tasks/[name].json

    User->>CLI: sdd bug report "[説明]"
    CLI->>Claude: バグ分析（2段階）
    Claude-->>CLI: BugAnalysis
    CLI->>FS: 修正タスク or 仕様修正提案を保存
```

---

## US-A01〜A03: 認証フロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant CLI as sdd CLI
    participant LocalServer as localhost:9876
    participant GitHub as GitHub OAuth
    participant Config as ~/.sdd/config.json

    User->>CLI: sdd auth login
    CLI->>LocalServer: 一時HTTPサーバーを起動
    CLI->>User: ブラウザを開く（GitHub OAuth URL）
    User->>GitHub: ログイン・アクセス許可
    GitHub->>LocalServer: GET /callback?code=xxx&state=yyy
    LocalServer->>CLI: code と state を受け取る
    CLI->>CLI: state を検証（CSRF防止）
    CLI->>GitHub: POST /login/oauth/access_token
    GitHub-->>CLI: access_token
    CLI->>GitHub: GET /user（read:user, user:email）
    GitHub-->>CLI: login, email
    CLI->>Config: トークンを保存
    CLI->>LocalServer: サーバーを停止
    CLI-->>User: ✓ ログイン成功: username (email)

    User->>CLI: sdd auth status
    CLI->>Config: 設定を読む
    CLI-->>User: ログイン中: username (email)

    User->>CLI: sdd auth logout
    CLI->>Config: auth フィールドを削除
    CLI-->>User: ログアウトしました: username
```

---

## US-S01: 仕様のdraft生成

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant CLI as sdd CLI
    participant Claude as Claude API
    participant FS as specs/features/

    User->>CLI: sdd spec new payment "クレジットカードで決済する"
    CLI->>FS: _TEMPLATE.md を読む

    alt 同名の仕様が存在する場合
        CLI-->>User: 上書きしますか？(y/N)
        User->>CLI: y
    end

    CLI->>Claude: 機能名 + 概要 + テンプレート
    Note over Claude: 受け入れ条件・データモデル・<br/>APIエンドポイントを生成
    Claude-->>CLI: draft仕様（Markdown）

    CLI->>FS: specs/features/payment.md を書き込む
    CLI-->>User: ✓ 作成: specs/features/payment.md
    CLI-->>User: 次のステップ: sdd spec check payment
```

---

## US-S02〜S03: 仕様校正・指摘解決

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant CLI as sdd CLI
    participant Claude as Claude API
    participant FS as specs/

    User->>CLI: sdd spec check payment
    CLI->>FS: specs/features/payment.md を読む
    CLI->>Claude: 仕様内容（校正リクエスト）
    Note over Claude: 矛盾・抜け・曖昧さを分析<br/>各指摘に質問を付与
    Claude-->>CLI: SpecIssue[]

    alt 指摘あり
        CLI->>FS: specs/issues/payment.json を保存
        CLI-->>User: N件の指摘事項を表示
        CLI-->>User: sdd spec resolve payment issue-001
    else 指摘なし
        CLI-->>User: ✓ 指摘事項はありません
    end

    loop 各指摘を解決
        User->>CLI: sdd spec resolve payment issue-001
        CLI->>FS: specs/issues/payment.json を読む
        CLI-->>User: 問題・質問を表示
        User->>CLI: 回答を入力
        CLI->>FS: resolved: true で保存
        CLI-->>User: ✓ 解決済み（残りN件）
    end
```

---

## US-S05〜S07: 詳細仕様生成

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant CLI as sdd CLI
    participant Claude as Claude API
    participant FS as specs/

    User->>CLI: sdd spec elaborate payment
    CLI->>FS: specs/features/payment.md を読む
    CLI->>CLI: ステータスが approved か確認

    alt approved でない場合
        CLI-->>User: エラー: ステータスが approved ではありません
    end

    CLI->>FS: 依存仕様の一覧を取得（## 依存仕様 セクション）
    loop 依存仕様ごと（トークン効率: 直接依存のみ）
        CLI->>FS: specs/elaborated/[dep].md を読む
        alt 詳細仕様が存在しない場合
            CLI-->>User: 警告: [dep] の詳細仕様がありません（部分情報で生成）
        end
    end

    CLI->>Claude: 仕様 + 依存仕様の技術決定
    Note over Claude: アーキテクチャ決定（ADR）<br/>データ設計・API設計<br/>非機能要件の実装方針
    Claude-->>CLI: 詳細仕様（Markdown）

    alt --summary オプション
        CLI-->>User: ADRセクションのみ表示（保存しない）
    else 通常 / --diff
        CLI->>FS: specs/elaborated/payment.md を保存
        CLI-->>User: ✓ 保存: specs/elaborated/payment.md
        CLI-->>User: 次のステップ: sdd task generate payment
    end
```

---

## US-T01〜T03: タスク管理

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant CLI as sdd CLI
    participant Claude as Claude API
    participant FS as specs/

    User->>CLI: sdd task generate payment
    CLI->>FS: specs/elaborated/payment.md を読む

    alt 詳細仕様が存在しない場合
        CLI-->>User: エラー: 先に sdd spec elaborate を実行してください
    end

    CLI->>Claude: 詳細仕様（タスク分解リクエスト）
    Note over Claude: 粒度: 1〜2日/タスク<br/>サイズ: XS/S/M/L/XL<br/>依存関係を解析
    Claude-->>CLI: Task[]

    CLI->>FS: specs/tasks/payment.json を保存
    CLI-->>User: N件のタスクを依存順で表示
    CLI-->>User: 合計見積もり: XX〜XXh

    User->>CLI: sdd task list payment
    CLI->>FS: specs/tasks/payment.json を読む
    CLI-->>User: ステータス付きタスク一覧

    User->>CLI: sdd task roadmap
    loop 全タスクファイル
        CLI->>FS: specs/tasks/[name].json を読む
    end
    CLI-->>User: 全仕様横断ロードマップ + 合計進捗
```

---

## US-B01〜B03: バグ報告（実装バグの場合）

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant CLI as sdd CLI
    participant Claude as Claude API
    participant FS as specs/

    User->>CLI: sdd bug report "ログイン後に404が返る"
    CLI->>FS: specs/bugs/bugs.json にバグを登録（status: analyzing）

    Note over CLI: Step 1: 関連仕様の特定（軽量）
    CLI->>FS: 全仕様のタイトル+概要インデックスを構築
    CLI->>Claude: バグ説明 + 仕様インデックス
    Claude-->>CLI: "auth-login"（最も関連する仕様名）

    Note over CLI: Step 2: 詳細分析（関連仕様のみ）
    CLI->>FS: specs/features/auth-login.md を読む
    CLI->>Claude: バグ説明 + auth-login仕様
    Claude-->>CLI: BugAnalysis（root_cause: implementation, AC-01違反, 確信度90%）

    CLI-->>User: 分析結果を表示

    Note over CLI: Step 3: 修正タスク生成
    CLI->>Claude: バグ + 分析結果 + 仕様内容
    Claude-->>CLI: 修正タスク（タイトル・説明・見積もり）

    CLI->>FS: specs/tasks/auth-login.json にタスクを追記
    CLI->>FS: bugs.json を resolved で更新
    CLI-->>User: ✓ 修正タスク生成: bug-fix-bug-xxxx (S, 1〜3h)
    CLI-->>User: タスク確認: sdd task list auth-login
```

---

## US-B03: バグ報告（仕様欠陥の場合）

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant CLI as sdd CLI
    participant Claude as Claude API
    participant FS as specs/

    User->>CLI: sdd bug report "エラー時の挙動が仕様に書いていない"

    Note over CLI,Claude: （関連仕様の特定・詳細分析）
    CLI->>Claude: 詳細分析
    Claude-->>CLI: BugAnalysis（root_cause: spec-defect）

    CLI->>FS: specs/proposals/proposals.json に<br/>SpecChangeProposal を保存（status: pending）
    CLI->>FS: bugs.json を spec-defect で更新

    CLI-->>User: 仕様欠陥として記録
    CLI-->>User: 修正提案ID: proposal-xxxx
    CLI-->>User: 承認するには: sdd spec approve proposal-xxxx

    Note over User,FS: sdd spec approve は未実装<br/>現在は proposals.json を直接編集
```

---

## データフロー（ファイルシステム）

```mermaid
graph LR
    A[specs/features/\n仕様 Markdown] -->|spec check| B[specs/issues/\nSpecIssue JSON]
    A -->|spec elaborate| C[specs/elaborated/\n詳細仕様 Markdown]
    C -->|task generate| D[specs/tasks/\nTask JSON]
    E[sdd bug report] -->|実装バグ| D
    E -->|仕様欠陥| F[specs/proposals/\nChangeProposal JSON]
    E --> G[specs/bugs/\nBugReport JSON]
```
