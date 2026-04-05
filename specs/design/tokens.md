# デザイントークン仕様

> このファイルはデザインシステムの最小単位を定義します。
> カラー・タイポグラフィ・スペーシングはすべてここを参照してください。
> Tailwind / CSS変数の両方で定義します。

---

## カラートークン

### ブランドカラー

| トークン名 | 値 | 用途 |
|-----------|-----|------|
| `--primary` | `#0070f3` | メインアクション・リンク |
| `--primary-foreground` | `#ffffff` | Primaryの上のテキスト |
| `--secondary` | `#f5f5f5` | セカンダリアクション |
| `--secondary-foreground` | `#171717` | Secondaryの上のテキスト |
| `--accent` | `#f0f9ff` | ハイライト・強調 |
| `--accent-foreground` | `#0369a1` | Accentの上のテキスト |

### セマンティックカラー

| トークン名 | 値 | 用途 |
|-----------|-----|------|
| `--destructive` | `#ef4444` | 削除・エラー・危険 |
| `--destructive-foreground` | `#ffffff` | Destructiveの上のテキスト |
| `--success` | `#22c55e` | 成功・完了 |
| `--warning` | `#f59e0b` | 警告・注意 |
| `--muted` | `#f5f5f5` | 非アクティブ・補足情報 |
| `--muted-foreground` | `#737373` | Mutedの上のテキスト |

### ベースカラー

| トークン名 | 値 | 用途 |
|-----------|-----|------|
| `--background` | `#ffffff` | ページ背景 |
| `--foreground` | `#171717` | メインテキスト |
| `--border` | `#e5e5e5` | ボーダー |
| `--input` | `#e5e5e5` | インプットボーダー |
| `--ring` | `#0070f3` | フォーカスリング |

### Tailwind設定への対応

```javascript
// tailwind.config.ts
colors: {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  destructive: 'hsl(var(--destructive))',
  // ...
}
```

---

## タイポグラフィトークン

### フォントファミリー

| トークン名 | 値 | 用途 |
|-----------|-----|------|
| `--font-sans` | `Inter, system-ui, sans-serif` | 本文・UI全般 |
| `--font-mono` | `JetBrains Mono, monospace` | コード・数値 |

### フォントサイズスケール

| トークン名 | サイズ | Tailwindクラス | 用途 |
|-----------|--------|---------------|------|
| `--text-xs` | 12px | `text-xs` | ラベル・補足 |
| `--text-sm` | 14px | `text-sm` | 本文・UI |
| `--text-base` | 16px | `text-base` | デフォルト |
| `--text-lg` | 18px | `text-lg` | サブタイトル |
| `--text-xl` | 20px | `text-xl` | セクションタイトル |
| `--text-2xl` | 24px | `text-2xl` | ページタイトル |
| `--text-3xl` | 30px | `text-3xl` | ヒーロー見出し |

### フォントウェイト

| 用途 | ウェイト | Tailwindクラス |
|------|---------|---------------|
| 本文 | 400 | `font-normal` |
| 強調 | 500 | `font-medium` |
| ラベル・ボタン | 600 | `font-semibold` |
| 見出し | 700 | `font-bold` |

---

## スペーシングトークン

ベースグリッド: **8px**

| トークン名 | 値 | Tailwindクラス | 用途 |
|-----------|-----|---------------|------|
| `--space-1` | 4px | `p-1`, `m-1` | 最小余白 |
| `--space-2` | 8px | `p-2`, `m-2` | タイト |
| `--space-3` | 12px | `p-3`, `m-3` | コンパクト |
| `--space-4` | 16px | `p-4`, `m-4` | 標準 |
| `--space-6` | 24px | `p-6`, `m-6` | ゆったり |
| `--space-8` | 32px | `p-8`, `m-8` | セクション間 |
| `--space-12` | 48px | `p-12`, `m-12` | 大きなセクション |
| `--space-16` | 64px | `p-16`, `m-16` | ページレベル |

---

## ボーダー・シャドウトークン

### ボーダーRadius

| トークン名 | 値 | Tailwindクラス | 用途 |
|-----------|-----|---------------|------|
| `--radius-sm` | 4px | `rounded-sm` | インプット・バッジ |
| `--radius-md` | 8px | `rounded-md` | ボタン・カード |
| `--radius-lg` | 12px | `rounded-lg` | モーダル・パネル |
| `--radius-full` | 9999px | `rounded-full` | アバター・ピル |

### シャドウ

| トークン名 | 用途 | Tailwindクラス |
|-----------|------|---------------|
| `--shadow-sm` | カード・インプット | `shadow-sm` |
| `--shadow-md` | ドロップダウン・ポップオーバー | `shadow-md` |
| `--shadow-lg` | モーダル | `shadow-lg` |

---

## ブレークポイント

| 名前 | 幅 | 用途 |
|------|-----|------|
| `sm` | 640px | タブレット縦 |
| `md` | 768px | タブレット横 |
| `lg` | 1024px | デスクトップ |

> **注意**: `xl` / `2xl` は原則使わない。コンテンツ幅は `max-w-5xl` で制御する。
