# UXパターン・インタラクション仕様

> インタラクションの「ふるまい」を定義します。
> 機能仕様（specs/features/）はここを参照しません。
> Claude Codeはフロントエンドを実装する際、このファイルに従うこと。

---

## 基本方針

- **モバイルファースト**: スマートフォンで使いやすいことを最優先
- **ゼロ状態を設計する**: データがない状態・エラー状態を必ず実装する
- **楽観的UI**: 可能な限り即座にUIを更新し、バックグラウンドで同期する
- **フォーカス管理**: キーボード操作・スクリーンリーダーを考慮する

---

## フォーム・バリデーション

### バリデーションのタイミング

```
入力開始前  → バリデーションしない
入力中      → バリデーションしない（onChangeでは動かさない）
フォーカスを外したとき（onBlur） → バリデーション開始
送信ボタン押下 → 全フィールドをバリデーション
```

### エラーの表示場所

```tsx
// ✅ フィールドの直下にインライン表示
<FormItem>
  <FormLabel>メールアドレス</FormLabel>
  <FormControl>
    <Input type="email" />
  </FormControl>
  <FormMessage /> {/* ← ここにエラーを表示 */}
</FormItem>

// ❌ モーダルやalert()でエラーを出さない
// ❌ ページトップにエラーをまとめて表示しない
```

### 送信中の状態

```tsx
// ✅ 送信中はボタンをdisabledにしてローディング表示
<Button disabled={isSubmitting}>
  {isSubmitting ? '送信中...' : '送信する'}
</Button>
```

---

## ローディング

### スケルトンUI（原則）

```tsx
// ✅ データ取得中はスケルトンを表示
if (isLoading) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}
```

### スピナーを使っていい例外ケース

- ボタンクリック後の送信中（テキストで代替可能な場合はテキスト優先）
- 全画面のページ遷移（Next.jsのloading.tsxで対応）

---

## エラー状態

### APIエラーの表示

```tsx
// ✅ sonnerのtoastで通知（操作の結果として）
import { toast } from 'sonner';
toast.error('送信に失敗しました。もう一度お試しください。');

// ✅ フォームエラーはインライン表示
// ❌ window.alert()は使わない
// ❌ エラーページに飛ばさない（ページ全体のエラーを除く）
```

### ゼロ状態（データなし）

```tsx
// ✅ データが空のときは必ずゼロ状態を表示
if (items.length === 0) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <p>まだデータがありません</p>
      <Button variant="outline" className="mt-4">追加する</Button>
    </div>
  );
}
```

---

## ナビゲーション・遷移

### ページ遷移

- `<Link>` を使う（`router.push()` はイベントハンドラ内のみ）
- 外部リンクには必ず `target="_blank" rel="noopener noreferrer"`

### モーダルの使い方

```
✅ 使っていいケース:
  - 削除の確認（AlertDialog）
  - 簡易フォーム（フィールドが3つ以下）

❌ 使わないケース:
  - フィールドが4つ以上のフォーム → 別ページに遷移
  - エラー表示 → インライン表示
  - 情報の表示だけ → ページ内に展開
```

---

## レスポンシブ

### ブレークポイントの使い方

```tsx
// ✅ モバイルファースト（smから書き始める）
<div className="flex-col sm:flex-row">

// ❌ デスクトップファースト
<div className="flex-row sm:flex-col">
```

### タッチターゲット

- タップできる要素の最小サイズ: **44×44px**
- `size="icon"` のButtonは `h-11 w-11` 以上にする

---

## アクセシビリティ

- インタラクティブな要素には必ず `aria-label` または可視テキストを持たせる
- カラーだけで状態を伝えない（アイコンまたはテキストを併用）
- フォームの `<Input>` には必ず対応する `<Label>` をつける

```tsx
// ✅
<Label htmlFor="email">メールアドレス</Label>
<Input id="email" type="email" />

// ❌
<Input type="email" placeholder="メールアドレス" />
```

---

## デザインシステム入れ替え時の影響範囲

このファイルを変更することで変わるもの：

| 変更内容 | 影響範囲 |
|----------|---------|
| バリデーションタイミングをonChangeに変更 | 全フォーム |
| ローディングをスピナーに変更 | 全ローディング箇所 |
| エラー表示をトーストに統一 | 全エラー表示 |
| モーダルの使用基準を変更 | 全モーダル |

**機能仕様（specs/features/）は一切変更不要。**
