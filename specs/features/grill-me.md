# 機能仕様: Grill Me（仕様尋問セッション）

> ステータス: draft

## 概要

仕様に対してAIがユーザーを対話的に「尋問」し、隠れた要件・曖昧さ・前提を次々と質問で引き出すインタラクティブセッション機能。`sdd spec check` が一方的な指摘リストを返すのに対し、`grill-me` はユーザーとAIが往復しながら仕様を掘り下げる。

## 受け入れ条件

- [ ] AC-01: 仕様名を指定すると、AIがその仕様を読み込み、最初の質問を1件だけ表示してセッションを開始する
- [ ] AC-02: ユーザーが回答を入力すると、AIはその回答を踏まえて次の質問を生成し、セッションを続行する
- [ ] AC-03: 各質問には「カテゴリ」（隠れた要件 / 曖昧さ / 前提 / エッジケース）が付与される
- [ ] AC-04: セッション終了時（`done` 入力またはAIが十分と判断したとき）、セッションの要約と仕様への推奨修正リストが表示される
- [ ] AC-05: セッション内容は `specs/grill-sessions/[name]-[timestamp].json` に保存される
- [ ] AC-06: `--max-questions N` オプションで最大質問数を指定できる（デフォルト: 10）
- [ ] AC-07: `--focus [category]` オプションで質問カテゴリを絞り込める
- [ ] AC-08: セッション終了後、発見された指摘を `sdd spec check` と同じ形式（`specs/issues/[name].json`）に追記できる（`--save-issues` オプション）
- [ ] AC-E01: 指定した仕様ファイルが存在しないとき、エラーで停止する
- [ ] AC-E02: ANTHROPIC_API_KEY が未設定のとき、エラーで停止する
- [ ] AC-E03: セッション中にユーザーが `quit` を入力したとき、要約なしで即座に終了する

## データモデル

```typescript
export interface GrillSession {
  id: string
  spec_name: string
  started_at: string
  ended_at: string | null
  status: GrillSessionStatus
  turns: GrillTurn[]
  summary: GrillSummary | null
}

export type GrillSessionStatus = 'active' | 'completed' | 'aborted'

export interface GrillTurn {
  turn_number: number
  question: GrillQuestion
  answer: string | null
  answered_at: string | null
}

export interface GrillQuestion {
  id: string
  category: GrillQuestionCategory
  text: string
  context: string  // AIがなぜこの質問をするかの根拠（1文）
}

export type GrillQuestionCategory =
  | 'hidden-requirement'  // 隠れた要件
  | 'ambiguity'           // 曖昧さ
  | 'assumption'          // 前提
  | 'edge-case'           // エッジケース

export interface GrillSummary {
  total_turns: number
  key_findings: string[]           // 発見された重要な洞察
  recommended_changes: GrillRecommendation[]
}

export interface GrillRecommendation {
  type: 'add-ac' | 'modify-ac' | 'add-data-model' | 'add-nonfunctional'
  description: string
  draft_text: string  // 仕様に追記できる形式のテキスト
}
```

## インターフェース（CLIコマンド）

| コマンド | 説明 |
|---------|------|
| `sdd grill [name]` | 指定仕様のGrillセッションを開始 |
| `sdd grill [name] --max-questions N` | 最大質問数を指定してセッション開始 |
| `sdd grill [name] --focus [category]` | 質問カテゴリを絞ってセッション開始 |
| `sdd grill [name] --save-issues` | セッション終了後に指摘をissuesファイルへ保存 |
| `sdd grill history [name]` | 過去のGrillセッション一覧を表示 |
| `sdd grill show [session-id]` | 特定セッションの詳細を表示 |

### セッションのインタラクション例

```sh
sdd grill user-profile

# → Grillセッションを開始します: user-profile
# → 質問 1/10 [曖昧さ]
# → 「プロフィール情報を編集する」とありますが、どのフィールドが編集可能ですか？
# → 根拠: AC-01 に編集対象フィールドの列挙がない
# → 回答> ユーザー名・自己紹介・アイコン画像です
#
# → 質問 2/10 [エッジケース]
# → アイコン画像のサイズや形式に制限はありますか？
# → 根拠: 画像アップロードには通常サイズ制限が必要
# → 回答> done
#
# ── セッション終了 ──
# 推奨修正:
#   1. [受け入れ条件追加] AC-03: 編集可能フィールドを username/bio/avatar に限定する
#   2. [受け入れ条件追加] AC-E03: アバター画像は5MB以下・JPEG/PNG形式のみ受け付ける
```

## 非機能要件

- **パフォーマンス**: 各質問の生成レスポンス 3秒以内（AI呼び出し含む）
- **対話性**: 質問は1件ずつ表示し、ユーザーの回答を待ってから次を生成する（バッチ生成禁止）
- **文脈継承**: 各質問生成時に直前5往復の文脈をAIに渡す（トークン効率のため全履歴は渡さない）
- **永続化**: セッションは途中でCtrl+Cされても、それまでのターンを保存する
- **トレーサビリティ**: 各質問の根拠（`context`）は仕様の具体的な箇所を参照する
