# 機能仕様: トレーサビリティ

> ステータス: draft

## 概要

バグ報告を受け付け、仕様との差分として解釈して自動修正する。修正が仕様の欠陥に起因する場合は `SpecChangeProposal` を生成して仕様管理に差し戻し、ユーザーの承認を求める。

## 受け入れ条件

- [ ] AC-01: バグの説明を入力すると、関連する仕様と違反している受け入れ条件が特定される
- [ ] AC-02: 実装のバグと判定された場合、コードが自動修正されてテストが再実行される
- [ ] AC-03: 自動修正後にテストが通れば、バグ報告が `resolved` になる
- [ ] AC-04: 仕様の欠陥と判定された場合、`SpecChangeProposal` が生成されて仕様管理（spec-management）に差し戻される
- [ ] AC-05: バグ報告の一覧と対応状況（ステータス）が参照できる
- [ ] AC-06: 3回試みても自動修正に失敗した場合、`unresolved` として記録しユーザーに通知する
- [ ] AC-E01: 関連する仕様を特定できないバグ報告は `unclassified` として記録し、ユーザーに追加情報を求める
- [ ] AC-E02: 自動修正によって既存のテストが新たに壊れた場合、修正を取り消して `unresolved` に戻す（デグレード防止）

## データモデル

```typescript
export interface BugReport {
  id: string
  description: string
  status: BugStatus
  spec_id?: string
  acceptance_condition?: string  // 違反している受け入れ条件（例: "AC-02"）
  analysis?: BugAnalysis
  fix?: BugFix
  created_at: string
  updated_at: string
}

export type BugStatus =
  | 'open'           // 報告済み・未分析
  | 'analyzing'      // 分析中
  | 'fixing'         // 自動修正中
  | 'resolved'       // 解決済み
  | 'spec-defect'    // 仕様欠陥として差し戻し済み
  | 'unresolved'     // 自動修正失敗
  | 'unclassified'   // 関連仕様を特定できず

export interface BugAnalysis {
  root_cause: 'implementation' | 'spec-defect' | 'unknown'
  affected_spec_id: string
  affected_acceptance_condition: string
  confidence: number   // 0〜1
  reasoning: string
}

export interface BugFix {
  attempt_count: number
  last_attempt_at: string
  test_result: 'passed' | 'failed'
  change_proposal_id?: string  // spec-defect の場合に生成
}
```

## インターフェース（CLIコマンド）

| コマンド | 説明 |
|---------|------|
| `bug report "[description]"` | バグを報告して分析・修正を開始 |
| `bug list` | バグ報告の一覧とステータスを表示 |
| `bug show [id]` | 分析結果・修正内容・テスト結果を詳細表示 |

## 非機能要件

- **安全性**: 自動修正は既存テストをすべて通過した場合のみコミットする（デグレード防止）
- **透明性**: 修正内容と根拠は必ず `bug show` で確認できる状態で記録する
- **パフォーマンス**: 分析・修正・テスト実行の全体を 60秒以内に完了する
