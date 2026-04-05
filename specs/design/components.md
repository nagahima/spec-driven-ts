# コンポーネント仕様

> Claude Codeはフロントエンドを実装する際、このファイルに定義されたコンポーネントを使うこと。
> ここにないコンポーネントが必要な場合は、新規追加の提案をしてから実装すること。

---

## コンポーネント対応表

### アクション

| 用途 | 使うコンポーネント | importパス |
|------|-----------------|-----------|
| メインアクション | `<Button>` | `@/components/ui/button` |
| 危険なアクション | `<Button variant="destructive">` | 同上 |
| サブアクション | `<Button variant="outline">` | 同上 |
| テキストリンク | `<Button variant="link">` | 同上 |
| アイコンのみ | `<Button variant="ghost" size="icon">` | 同上 |

### フォーム

| 用途 | 使うコンポーネント | importパス |
|------|-----------------|-----------|
| テキスト入力 | `<Input>` | `@/components/ui/input` |
| テキストエリア | `<Textarea>` | `@/components/ui/textarea` |
| セレクト | `<Select>` | `@/components/ui/select` |
| チェックボックス | `<Checkbox>` | `@/components/ui/checkbox` |
| ラジオ | `<RadioGroup>` | `@/components/ui/radio-group` |
| トグル | `<Switch>` | `@/components/ui/switch` |
| フォームラベル | `<Label>` | `@/components/ui/label` |
| エラーメッセージ | `<p className="text-sm text-destructive">` | - |

### レイアウト

| 用途 | 使うコンポーネント | importパス |
|------|-----------------|-----------|
| カード | `<Card>` | `@/components/ui/card` |
| 区切り線 | `<Separator>` | `@/components/ui/separator` |
| スクロールエリア | `<ScrollArea>` | `@/components/ui/scroll-area` |

### フィードバック

| 用途 | 使うコンポーネント | importパス |
|------|-----------------|-----------|
| 成功・情報通知 | `<Alert>` | `@/components/ui/alert` |
| トースト通知 | `<toast>` (sonner) | `sonner` |
| ローディング | `<Skeleton>` | `@/components/ui/skeleton` |
| バッジ・ラベル | `<Badge>` | `@/components/ui/badge` |
| プログレス | `<Progress>` | `@/components/ui/progress` |

### オーバーレイ

| 用途 | 使うコンポーネント | importパス |
|------|-----------------|-----------|
| 確認ダイアログ | `<AlertDialog>` | `@/components/ui/alert-dialog` |
| 情報モーダル | `<Dialog>` | `@/components/ui/dialog` |
| コンテキストメニュー | `<DropdownMenu>` | `@/components/ui/dropdown-menu` |
| ツールチップ | `<Tooltip>` | `@/components/ui/tooltip` |
| ポップオーバー | `<Popover>` | `@/components/ui/popover` |

### ナビゲーション

| 用途 | 使うコンポーネント | importパス |
|------|-----------------|-----------|
| タブ切り替え | `<Tabs>` | `@/components/ui/tabs` |
| パンくず | `<Breadcrumb>` | `@/components/ui/breadcrumb` |

---

## コンポーネント実装ルール

### Buttonのバリアント使い分け

```tsx
// ✅ メインアクション（1画面に1つだけ）
<Button>ログイン</Button>

// ✅ 危険なアクション（削除など）
<Button variant="destructive">削除する</Button>

// ✅ キャンセル・戻る
<Button variant="outline">キャンセル</Button>

// ❌ variantを指定しないセカンダリアクション
<button className="bg-gray-200">キャンセル</button>
```

### フォームの実装パターン

```tsx
// React Hook Form + zod + shadcn/ui の組み合わせ必須
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
```

### スケルトンのパターン

```tsx
// ✅ ローディング中はスケルトン
<Skeleton className="h-4 w-full" />

// ❌ スピナーは原則使わない
<Spinner />
```

---

## 独自コンポーネントの追加ルール

shadcn/uiにないものを追加する場合：

1. `specs/design/components.md` にコンポーネント仕様を追記してから実装する
2. 実装先は `apps/web/components/ui/` に配置する
3. Tailwindのトークン（`tokens.md`）だけを使う（ハードコードしない）

```tsx
// ✅ トークンを使う
<div className="text-primary border-border">

// ❌ 値をハードコード
<div style={{ color: '#0070f3', borderColor: '#e5e5e5' }}>
```
