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
