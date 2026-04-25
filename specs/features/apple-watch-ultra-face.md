# 機能仕様: Apple Watch Ultra アーティスティック文字盤

> ステータス: implemented

## 概要

Apple Watch Ultra向けのデザイン重視・アーティスティックな文字盤。視覚表現を最優先し、時刻・バッテリーは「わかる人だけ読み取れる」程度に背景へ溶け込ませる。バッテリー残量は10%刻みで判別できればよい。

## 背景テーマ

ユーザーは以下4種類から背景を選択できる:

- `painting` — 絵画風（油彩・筆触の質感）
- `impressionist` — 印象派風（光と色の点描・パステル）
- `monotone-mechanical` — モノトーンメカニカル（白黒の歯車・線画・幾何）
- `nature-pattern` — 自然のパターン（葉脈・水紋・地形等のオーガニック）

## 時刻表示モード

- `analog` — アナログ（針）スタイル
- `digital` — デジタル数字スタイル

いずれもギリギリ読める程度の視認性で十分。背景に溶け込むこと優先。

## 受け入れ条件

- [x] AC-01: ユーザーが背景テーマを4種類（painting / impressionist / monotone-mechanical / nature-pattern）から選択できる
- [x] AC-02: ユーザーが時刻表示モードを `analog` / `digital` から選択できる
- [x] AC-03: 選択した時刻表示モードで、現在の時・分が読み取れる（コントラストは低めでよい、背景に溶け込む程度）
- [x] AC-04: バッテリー残量が10%刻みで読み取れる視覚要素として描画される（数字表示は不要）
- [x] AC-05: バッテリー表示は背景テーマと調和したスタイルで、目立たず溶け込む
- [x] AC-06: バッテリー残量が変化したとき、表示が1分以内に更新される
- [x] AC-07: Always-On Display時にも、時刻とバッテリー残量が（同様の控えめな視認性で）読み取れる
- [x] AC-E01: バッテリー情報が取得できないとき、表示を空（または控えめなフォールバック）にする
- [x] AC-E02: 描画中に例外が発生したとき、文字盤がクラッシュせずデフォルト表現にフォールバックする

## データモデル

```typescript
export type BackgroundTheme =
  | 'painting'
  | 'impressionist'
  | 'monotone-mechanical'
  | 'nature-pattern'

export type TimeDisplayMode = 'analog' | 'digital'

export interface WatchFaceConfig {
  background: BackgroundTheme
  timeMode: TimeDisplayMode
}

export interface WatchFaceState {
  currentTime: Date
  batteryLevel: number // 0.0 - 1.0、表示は0.1刻みに丸める
  batteryState: 'charging' | 'discharging' | 'full' | 'unknown'
  isAlwaysOn: boolean
  config: WatchFaceConfig
}
```

## APIエンドポイント

- **Method**: N/A（ローカル文字盤、ネットワーク呼び出しなし）
- **Path**: WatchKit / ClockKit のシステムAPIを使用
  - `WKInterfaceDevice.current().batteryLevel`
  - `CLKComplicationDataSource`
- **認証**: 不要

## 非機能要件

- **パフォーマンス**:
  - 描画フレームレート: アクティブ時 60fps、Always-On時は省電力モード
  - 起動から初回描画まで: 100ms以内
- **視認性ポリシー**:
  - 時刻・バッテリーともに低コントラスト・背景同化を許容
  - "ギリギリ読める" を上限とし、目立たせる装飾は禁止
  - 警告色での強調表示は行わない
- **セキュリティ**:
  - 個人情報・通知内容は文字盤に表示しない
  - バッテリー情報のみシステムAPIから読み取る
- **省電力**: Always-On時は静的描画に切り替え、消費電力を最小化

## 今後の追加候補（本スコープ外）

- 数学的パターン背景テーマ（`mathematical`）
  - マンデルブロ集合 / ジュリア集合などのフラクタル
  - 連続関数のパターン（リサージュ曲線、フローフィールド、CA等）
  - 別仕様として切り出し、本機能の実装完了後に追加する
