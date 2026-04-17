import Anthropic from '@anthropic-ai/sdk'
import type { SpecIssue } from 'types'

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('エラー: ANTHROPIC_API_KEY を環境変数に設定してください')
    process.exit(1)
  }
  return new Anthropic({ apiKey })
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

  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}'
  const jsonText = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '')
  const parsed = JSON.parse(jsonText) as { issues: Omit<SpecIssue, 'spec_id' | 'resolved'>[] }

  return parsed.issues.map(issue => ({
    ...issue,
    spec_id: specName,
    resolved: false,
  }))
}
