# 機能仕様: [機能名]

> ステータス: draft

## 概要

[機能の概要を1-2文で]

## 受け入れ条件

- [ ] AC-01: [条件]のとき、[結果]になる
- [ ] AC-E01: [エラー条件]のとき、[エラー]になる

## データモデル

```typescript
export interface [TypeName] {
  id: string
  created_at: string
}
```

## APIエンドポイント

- **Method**: POST
- **Path**: `/api/[path]`
- **認証**: 不要

## 非機能要件

- **パフォーマンス**: 200ms以内
- **セキュリティ**:
