# デザインシステム定義

> **このファイルを差し替えるだけでUX全体が変わる。**
> Claude Codeはフロントエンドを実装する前に必ずこのファイルを読むこと。
> 機能仕様（specs/features/）にスタイルの指定がない場合は、このファイルに従う。

---

## ステータス

> **現在のシステム**: `shadcn-default`
> **最終更新**: YYYY-MM-DD

---

## 使用ライブラリ

| 用途 | ライブラリ | バージョン |
|------|-----------|-----------|
| コンポーネント | shadcn/ui | latest |
| スタイリング | Tailwind CSS | ^3.4 |
| アイコン | Lucide React | latest |
| アニメーション | tailwindcss-animate | latest |
| フォーム | React Hook Form + zod | latest |

---

## ブランド定義

詳細は `specs/design/tokens.md` を参照。

- **Primary カラー**: tokens.mdの `--primary` を使う
- **フォントファミリー**: tokens.mdの `--font-sans` を使う
- **ベースグリッド**: 8px

---

## コンポーネント方針

詳細は `specs/design/components.md` を参照。

- shadcn/uiのコンポーネントを優先して使う
- shadcn/uiにないものは `components/ui/` に独自実装する
- **コンポーネントを新規作成する前に必ず `components.md` を確認する**

---

## UXパターン方針

詳細は `specs/design/patterns.md` を参照。

- モバイルファースト（ブレークポイントは `sm` / `md` / `lg` のみ）
- エラーはインラインで表示（モーダルやalertは使わない）
- ローディングはスケルトンUI（スピナーは原則禁止）

---

## 実装時のClaude Codeへの指示

1. `specs/design/tokens.md` でカラー・タイポグラフィ・スペーシングを確認する
2. `specs/design/components.md` で使うべきコンポーネントを確認する
3. `specs/design/patterns.md` でインタラクションの方針を確認する
4. 上記に定義がない場合のみ、自分で判断してよい（判断内容をコメントに残す）

---

## デザインシステム入れ替え手順

このファイルと以下を差し替えるだけで全体のUXが変わる：

```
specs/design/
  _SYSTEM.md     ← このファイル（使用ライブラリ・方針）
  tokens.md      ← カラー・タイポ・スペーシング
  components.md  ← コンポーネント対応表
  patterns.md    ← UXパターン・インタラクション
```

**機能仕様（specs/features/）は一切触らない。**
