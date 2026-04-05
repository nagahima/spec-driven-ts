# /doc-sync

仕様からドキュメントを生成・更新します。

## 手順

1. `specs/features/*.md` を全て読む（`_TEMPLATE.md` は除外）
2. ステータスが `implemented` の仕様のみ対象
3. `docs/` フォルダが存在しない場合は作成
4. 各仕様に対して `docs/[feature-name].md` を生成
5. `docs/README.md` にすべての機能の索引を更新
