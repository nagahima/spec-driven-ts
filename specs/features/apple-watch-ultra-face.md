# 機能仕様: Apple Watch Ultra アーティスティック文字盤

> ステータス: draft

## 概要

Apple Watch Ultra向けのデザイン重視・アーティスティックな文字盤。視覚表現を最優先しつつ、残りバッテリー残量だけは常に視認できる。

## 受け入れ条件

- [ ] AC-01: 文字盤を表示したとき、現在時刻（時・分）がアーティスティックな表現で読み取れる
- [ ] AC-02: 文字盤を表示したとき、現在のバッテリー残量（0-100%）が常時視認できる位置に描画される
- [ ] AC-03: バッテリー残量が変化したとき、表示が1分以内に更新される
- [ ] AC-04: バッテリー残量が20%以下のとき、警告色（例: 赤系）で強調表示される
- [ ] AC-05: Always-On Display時にも、時刻とバッテリー残量が読み取れる
- [ ] AC-E01: バッテリー情報が取得できないとき、ダッシュ等のフォールバック表示にする
- [ ] AC-E02: 描画中に例外が発生したとき、文字盤がクラッシュせずデフォルト表現にフォールバックする

## データモデル

```typescript
export interface WatchFaceState {
  currentTime: Date
  batteryLevel: number // 0.0 - 1.0
  batteryState: 'charging' | 'discharging' | 'full' | 'unknown'
  isAlwaysOn: boolean
}

export interface ArtisticTheme {
  id: string
  paletteName: string
  backgroundStyle: 'gradient' | 'particle' | 'flowfield'
  batteryIndicatorStyle: 'arc' | 'orb' | 'stroke'
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
- **セキュリティ**:
  - 個人情報・通知内容は文字盤に表示しない
  - バッテリー情報のみシステムAPIから読み取る
- **省電力**: Always-On時は静的描画に切り替え、消費電力を最小化
