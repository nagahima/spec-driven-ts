import { Command } from 'commander'
import { createInterface } from 'readline'
import { readTemplate, specExists, readSpec, writeSpec, readIssues, saveIssues, getSpecStatus } from '../lib/specs'
import { generateSpecDraft, validateSpec } from '../lib/claude'

function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => rl.question(question, answer => { rl.close(); resolve(answer) }))
}

function printIssue(issue: { id: string; type: string; description: string; question: string }, index: number): void {
  const typeLabel = { contradiction: '矛盾', missing: '抜け', ambiguous: '曖昧' }[issue.type] ?? issue.type
  console.log(`\n[${index + 1}] ${issue.id} (${typeLabel})`)
  console.log(`  問題: ${issue.description}`)
  console.log(`  質問: ${issue.question}`)
}

export function createSpecCommand(): Command {
  const spec = new Command('spec').description('仕様の管理')

  spec
    .command('new <name> <overview>')
    .description('新しい仕様を作成する')
    .action(async (name: string, overview: string) => {
      if (specExists(name)) {
        const answer = await prompt(`specs/features/${name}.md は既に存在します。上書きしますか？ (y/N): `)
        if (answer.toLowerCase() !== 'y') { console.log('キャンセルしました'); return }
      }

      console.log(`仕様を生成中: ${name}...`)
      const template = readTemplate()
      const content = await generateSpecDraft(name, overview, template)
      writeSpec(name, content)
      console.log(`✓ 作成: specs/features/${name}.md`)
      console.log(`\n次のステップ: sdd spec check ${name}`)
    })

  spec
    .command('check <name>')
    .description('仕様を校正して指摘事項を返す')
    .action(async (name: string) => {
      const content = readSpec(name)
      console.log(`校正中: ${name}...`)
      const issues = await validateSpec(name, content)

      if (issues.length === 0) {
        console.log('✓ 指摘事項はありません')
        return
      }

      console.log(`\n${issues.length} 件の指摘事項が見つかりました:`)
      issues.forEach(printIssue)

      saveIssues(name, issues)
      console.log(`\n指摘を保存しました: specs/issues/${name}.json`)
      console.log('解決するには: sdd spec resolve <name> <issue-id>')
    })

  spec
    .command('resolve <name> <issueId>')
    .description('指摘事項に回答して解決する')
    .action(async (name: string, issueId: string) => {
      const issues = readIssues(name)
      const issue = issues.find(i => i.id === issueId)
      if (!issue) { console.error(`指摘が見つかりません: ${issueId}`); process.exit(1) }
      if (issue.resolved) { console.log(`${issueId} は既に解決済みです`); return }

      console.log(`\n${issue.id} (${issue.type})`)
      console.log(`問題: ${issue.description}`)
      console.log(`質問: ${issue.question}`)
      const answer = await prompt('\n回答: ')
      if (!answer.trim()) { console.log('キャンセルしました'); return }

      issue.resolved = true
      saveIssues(name, issues)

      const remaining = issues.filter(i => !i.resolved).length
      console.log(`✓ ${issueId} を解決済みにしました`)
      if (remaining > 0) {
        console.log(`残り ${remaining} 件: sdd spec check ${name} で確認`)
      } else {
        console.log('すべての指摘が解決されました')
      }
    })

  spec
    .command('status <name>')
    .description('仕様のステータスを表示する')
    .action((name: string) => {
      const content = readSpec(name)
      const status = getSpecStatus(content)
      const issues = readIssues(name)
      const unresolved = issues.filter(i => !i.resolved).length

      console.log(`仕様: ${name}`)
      console.log(`ステータス: ${status}`)
      if (issues.length > 0) {
        console.log(`指摘: ${unresolved} 件未解決 / ${issues.length} 件合計`)
      }
    })

  return spec
}
