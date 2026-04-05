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
