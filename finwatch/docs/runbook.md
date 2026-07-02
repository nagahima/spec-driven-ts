# Runbook

## APIキーローテーション(四半期、ADR-0005)
1. edinetdb.jp Dashboardで新キー発行 → GitHub Secrets `EDINETDB_API_KEY` 更新 → workflow_dispatchで疎通確認 → 旧キー失効
2. Anthropic Consoleで同様

## 障害対応
- レポート未生成Issue起票時: Actionsログ確認 → 外部起因(429/5xx)ならstaleレポートが出ているか確認(出ていれば鮮度SLI消費として記録、出ていなければresilience層のバグとして扱う)
- スキーマdiff検知Issue: allowlist該当ツールの変更内容を確認 → zodスキーマ修正PR → スナップショット更新

## SLOレビュー(四半期)
- 生成成功率/鮮度/完全性/eval合格率の実績を docs/slo/slo.md に追記。バジェット枯渇時は機能凍結(SLO文書のポリシー)
