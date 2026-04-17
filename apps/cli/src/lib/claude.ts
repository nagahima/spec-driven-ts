import Anthropic from '@anthropic-ai/sdk'
import type { SpecIssue } from 'types'
import type { StoredTask } from './specs'

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('エラー: ANTHROPIC_API_KEY を環境変数に設定してください')
    process.exit(1)
  }
  return new Anthropic({ apiKey })
}

function parseJson<T>(text: string): T {
  const cleaned = text.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '')
  return JSON.parse(cleaned) as T
}

export async function generateSpecDraft(name: string, overview: string, template: string): Promise<string> {
  const client = getClient()
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `以下のテンプレートと概要から、機能仕様のdraftを作成してください。

機能名: ${name}
概要: ${overview}

テンプレート:
${template}

ルール:
- ステータスは必ず "draft" にする
- 受け入れ条件は概要から推測して3〜5個作成（AC-01, AC-02... 形式）
- エラー条件も1〜2個含める（AC-E01... 形式）
- データモデルは概要に合わせて定義する
- マークダウンのみ返す（前後の説明文不要）`,
    }],
  })
  return response.content[0].type === 'text' ? response.content[0].text : ''
}

export async function validateSpec(specName: string, specContent: string): Promise<SpecIssue[]> {
  const client = getClient()
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `仕様レビュアーとして、以下の仕様の矛盾・抜け・曖昧さを指摘してください。
指摘は技術的な詳細ではなく、仕様として不完全な点に絞ってください。

${specContent}

以下のJSON形式のみ返してください:
{"issues":[{"id":"issue-001","type":"contradiction"|"missing"|"ambiguous","description":"問題の説明（日本語）","question":"ユーザーへの具体的な質問（日本語）"}]}

問題がなければ {"issues":[]} を返してください。`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const parsed = parseJson<{ issues: Omit<SpecIssue, 'spec_id' | 'resolved'>[] }>(text)
  return parsed.issues.map(issue => ({ ...issue, spec_id: specName, resolved: false }))
}

export async function elaborateSpec(
  specContent: string,
  dependencyContext: string
): Promise<string> {
  const client = getClient()
  const depSection = dependencyContext
    ? `\n依存仕様の技術決定（継承すること）:\n${dependencyContext}\n`
    : ''

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    messages: [{
      role: 'user',
      content: `技術アーキテクトとして、以下の機能仕様から詳細仕様を生成してください。${depSection}
機能仕様:
${specContent}

以下のMarkdown形式で詳細仕様を生成してください。マークダウンのみ返してください:

# 詳細仕様: [機能名]

> 元仕様: [spec_id]
> 生成日: [YYYY-MM-DD]

## 技術スタック
- ランタイム:
- フレームワーク:
- 外部サービス:

## アーキテクチャ決定

### ADR-001: [タイトル]
- **決定**:
- **理由**:
- **検討した代替案**:

## データ設計

### エンティティ
[TypeScriptインターフェース定義]

### リレーション
[エンティティ間の関係]

## API設計

| Method | Path | リクエスト | レスポンス |
|--------|------|-----------|-----------|

## 非機能要件の実装方針

| 要件 | 実装方針 |
|-----|---------|`,
    }],
  })
  return response.content[0].type === 'text' ? response.content[0].text : ''
}

export async function generateTasks(
  specName: string,
  elaboratedContent: string
): Promise<StoredTask[]> {
  const client = getClient()
  const now = new Date().toISOString()

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `以下の詳細仕様からタスクを生成してください。
各タスクは1〜2日で完了できる粒度にしてください。

詳細仕様:
${elaboratedContent}

以下のJSON形式のみ返してください:
{"tasks":[{"id":"task-001","title":"タスクのタイトル","description":"具体的な作業内容","estimate":{"size":"S","hours_min":2,"hours_max":4,"rationale":"見積もりの根拠"},"depends_on":[]}]}

サイズ基準: XS=1h以下, S=2〜4h, M=4〜8h, L=1〜2日, XL=2日以上`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const parsed = parseJson<{ tasks: Pick<StoredTask, 'id' | 'title' | 'description' | 'estimate' | 'depends_on'>[] }>(text)

  return parsed.tasks.map((t, i) => ({
    ...t,
    spec_id: specName,
    status: 'not-started' as const,
    order: i + 1,
    created_at: now,
    updated_at: now,
  }))
}
