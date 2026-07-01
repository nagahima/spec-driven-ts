# /develop [feature-name] "[概要]"

仕様駆動開発の全ワークフローを1コマンドで進める統合コマンド。
各ステップの間でユーザーの確認を挟みながら、仕様→実装まで案内する。

## 全体フロー

```
① 仕様作成 → ② 校正 → ③ 指摘解決 → ④ 承認 → ⑤ 詳細化 → ⑥ タスク生成 → ⑦ 実装
   (sdd/Claude)  (sdd)     (対話)      (sdd)     (sdd)       (sdd)        (/implement)
```

## 手順

### 事前判定

- `ANTHROPIC_API_KEY` が設定されているか確認（`sdd` CLIのAI機能に必要）
- 設定済み → `sdd` CLI（`node apps/cli/dist/index.js`）を使う
- 未設定 → AI機能はClaude Code自身が代行する（下記「CLI代行モード」）

### ① 仕様作成

- `specs/features/[feature-name].md` が既に存在すればスキップして②へ
- CLI: `sdd spec new [feature-name] "[概要]"`
- 代行: `_TEMPLATE.md` を元にClaude Codeが `draft` 仕様を作成

### ② 校正

- CLI: `sdd spec check [feature-name]`
- 代行: 仕様の矛盾・抜け・曖昧さを分析し `specs/issues/[feature-name].json` に保存
  （形式は既存のissuesファイルに合わせる）

### ③ 指摘解決

- 未解決の指摘を1件ずつユーザーに提示し、回答をもらう
- 回答に基づいて **仕様本文も更新** し、指摘を `resolved: true` にする
- すべて解決するまで繰り返す（ユーザーが「スキップ」と言えば先へ）

### ④ 承認

- 仕様の最終版をユーザーに要約提示し、承認を得る
- 承認されたら: `sdd spec set-status [feature-name] approved`

### ⑤ 詳細化

- CLI: `sdd spec elaborate [feature-name]`
- 代行: 依存仕様の `specs/elaborated/*.md` を読み、既存詳細仕様と同じ形式で生成
- 生成後、ADR（アーキテクチャ決定）のサマリーをユーザーに提示

### ⑥ タスク生成

- CLI: `sdd task generate [feature-name]`
- 代行: 詳細仕様からタスクを分解し `specs/tasks/[feature-name].json` に保存
  （既存タスクファイルと同じスキーマ・1〜2日粒度・依存順）

### ⑦ 実装

- ユーザーに「実装に進みますか？」と確認
- 承認されたら `/implement [feature-name]` の手順を実行する

## ルール

- 各ステップの完了時に、現在地と次のステップを明示する
- 途中で中断しても、再実行時は完了済みステップを検出してスキップする
  （ファイルの存在とステータスで判定）
- ステップを飛ばさない（仕様が唯一のマスター）
