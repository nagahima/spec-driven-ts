# /implement [feature-name]

仕様からコードとテストを生成する（`code-generation.md` 仕様の実装）。
これは `sdd` CLIでは未実装の「コード生成」機能を Claude Code が担うもの。

## 前提条件（満たさない場合はエラーで停止）

1. `specs/features/[feature-name].md` が存在し、ステータスが `approved` であること
2. `specs/elaborated/[feature-name].md`（詳細仕様）が存在すること（AC-E01）
   - なければ「先に `sdd spec elaborate [feature-name]` を実行してください」と案内
3. `specs/tasks/[feature-name].json`（タスク一覧）が存在すること
   - なければ「先に `sdd task generate [feature-name]` を実行してください」と案内

## 手順

1. 以下を読み込む：
   - `specs/features/[feature-name].md`（受け入れ条件 AC-XX の源泉）
   - `specs/elaborated/[feature-name].md`（技術決定・データ設計・API設計）
   - `specs/tasks/[feature-name].json`（タスクと依存順）
   - フロントエンドを含む場合は `specs/design/_SYSTEM.md` と `specs/design/*.md`
2. タスクを `order` 順に処理する。各タスクについて：
   a. ステータスを `in-progress` に更新（JSONを直接編集）
   b. 詳細仕様に従って実装する：
      - 型定義 → `packages/types/index.ts` に追加（他の場所に書かない）
      - API実装 → `apps/web/lib/api/[feature-name].ts`
      - ルート登録 → `apps/web/app/api/[[...route]]/route.ts`
      - CLI機能の場合 → `apps/cli/src/` 配下の該当箇所
   c. テストを生成 → `apps/web/tests/[feature-name].test.ts`
      - 受け入れ条件（AC-XX）と1:1対応させる（テスト名にAC番号を含める）
      - エラー条件（AC-EXX）はHTTPステータスコードと対応させる
   d. テストを実行：`pnpm --filter web test`（CLIなら `--filter cli`）
      - 全テスト通過 → タスクを `done` に更新
      - 失敗 → 2回まで修正を試み、それでも失敗なら生成コードを revert し
        タスクを `blocked` に更新、理由を報告して次のタスクへ（AC-07）
3. 既存テストのデグレードチェック：`pnpm test` をルートで実行
4. 全タスクが `done` になったら：
   - 仕様のステータスを `implemented` に更新（`sdd spec set-status [feature-name] implemented`）
5. サマリーを報告：生成ファイル一覧・テスト結果・タスクの最終ステータス

## ルール

- 仕様に書かれていない機能を勝手に追加しない（仕様が唯一のマスター）
- 詳細仕様と機能仕様が矛盾する場合は、実装せずユーザーに報告する
- `blocked` タスクがある状態で `implemented` にしない
