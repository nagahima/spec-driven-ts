# ADR-0004: 実行基盤はGitHub Actions cron(ステートレス実行)

Status: Accepted / Date: 2026-07-02

## Context
隔週レポートの定期実行が必要。個人開発の予算制約(月$25、ADR-0010)の中で、可用性と運用性を確保したい。

## Decision
GitHub Actions の schedule トリガーで隔週実行。キャッシュDB(SQLite)は actions/cache で持ち回り、成果物はArtifact + リポジトリへのコミットで永続化。

## Alternatives
- **AWS Lambda + EventBridge**: 商用ならこちら。Secrets Manager / CloudWatch / DLQが揃う。個人予算と管理面の過剰さで今回は不採用だが、**移行パスをdocs/architecture/c4.mdの「Production構成」として設計のみ記載**
- **自宅サーバー/VPS常駐**: 可用性が単一マシン依存になり、パッチ運用負債を抱える。却下

## Consequences
- (+) インフラ費ゼロ、Secretsの保管はGitHub Secretsに集約
- (-) cronの起動遅延(数分〜)があり得る → SLOで「起動時刻」でなく「当日中の生成成功」を目標にする(SLO文書参照)
- (-) actions/cacheは揮発 → キャッシュミスは劣化(コスト増)であって障害ではない設計にする
