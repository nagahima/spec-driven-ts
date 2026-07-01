# /spec-check

仕様とコード・成果物のドリフト（ズレ）を検出します。
（注: `sdd spec check` はAIによる仕様の校正。このコマンドは仕様↔実装の整合性チェックで別物）

## 手順

1. `specs/features/*.md` を全て読む（`_TEMPLATE.md` は除外）
2. 各仕様のステータスに応じてチェックする：

   **`implemented` の仕様:**
   - 対応するテストファイルが存在するか（`apps/web/tests/` または `apps/cli/` 配下）
   - 受け入れ条件（AC-XX）すべてに対応するテストがあるか
   - APIエンドポイント／CLIコマンドが実装されているか
   - 型定義が `packages/types/index.ts` に存在するか

   **`approved` の仕様:**
   - `specs/elaborated/[name].md` があるのに仕様が更新されている場合、
     詳細仕様の再生成（`sdd spec elaborate`）が必要か判定
   - `specs/tasks/[name].json` のタスクが仕様の受け入れ条件をカバーしているか

   **全仕様共通:**
   - `specs/issues/[name].json` に未解決の指摘が残っていないか
   - `specs/proposals/proposals.json` に `pending` の修正提案が残っていないか
   - 依存仕様（`## 依存仕様`）が実在するか

3. 実装があるのに仕様がない「逆ドリフト」もチェックする：
   - `apps/cli/src/commands/` のコマンドがいずれかの仕様でカバーされているか
   - `apps/web/app/` の画面がいずれかの仕様でカバーされているか
4. 結果を報告：
   - ドリフトがあれば、仕様ごとに「何がズレているか」「推奨アクション」を表で報告
   - 問題なければ「仕様とコードは同期しています」と報告
