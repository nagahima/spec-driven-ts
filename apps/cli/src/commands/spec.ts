import { Command } from 'commander'
import { createInterface } from 'readline'
import {
  readTemplate, specExists, readSpec, writeSpec,
  readIssues, saveIssues, getSpecStatus, setSpecStatus,
  parseSpecDependencies, elaboratedSpecExists,
  readElaboratedSpec, writeElaboratedSpec,
  getProposal, saveProposal,
} from '../lib/specs'
import { generateSpecDraft, validateSpec, elaborateSpec } from '../lib/claude'

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

  spec
    .command('set-status <name> <status>')
    .description('仕様のステータスを変更する (draft/review/approved/implemented)')
    .action((name: string, status: string) => {
      try {
        const prev = getSpecStatus(readSpec(name))
        setSpecStatus(name, status)
        console.log(`✓ ${name}: ${prev} → ${status}`)
      } catch (err) {
        console.error(`エラー: ${(err as Error).message}`)
        process.exit(1)
      }
    })

  spec
    .command('approve <proposalId>')
    .description('仕様修正提案を承認して仕様に反映する')
    .action(async (proposalId: string) => {
      const proposal = getProposal(proposalId)
      if (!proposal) { console.error(`修正提案が見つかりません: ${proposalId}`); process.exit(1) }
      if (proposal.status !== 'pending') {
        console.log(`この提案は既に ${proposal.status} です: ${proposalId}`)
        return
      }

      console.log(`\n修正提案: ${proposalId}`)
      console.log(`対象仕様: ${proposal.spec_id}`)
      console.log(`理由    : ${proposal.reason}`)
      console.log(`\n--- 提案内容 ---\n${proposal.proposed_content}\n`)

      const answer = await prompt('この提案を承認して仕様に反映しますか？ (y/N): ')
      if (answer.toLowerCase() !== 'y') { console.log('キャンセルしました'); return }

      // 仕様ファイルに修正提案のメモを追記
      try {
        const current = readSpec(proposal.spec_id)
        const note = `\n\n---\n## 適用済み修正提案: ${proposalId}\n\n${proposal.proposed_content}\n`
        writeSpec(proposal.spec_id, current + note)
      } catch {
        console.warn(`警告: 仕様ファイルへの書き込みに失敗しました（proposals.jsonのみ更新します）`)
      }

      proposal.status = 'approved'
      saveProposal(proposal)

      console.log(`✓ 承認しました: ${proposalId}`)
      console.log(`仕様を確認して必要な修正を加えてください: specs/features/${proposal.spec_id}.md`)
    })

  spec
    .command('elaborate <name>')
    .description('詳細仕様を生成する')
    .option('--diff', '既存の詳細仕様との差分を表示')
    .option('--summary', 'アーキテクチャ決定のサマリーのみ表示')
    .action(async (name: string, opts: { diff?: boolean; summary?: boolean }) => {
      const content = readSpec(name)
      const status = getSpecStatus(content)

      if (status !== 'approved') {
        console.error(`エラー: ステータスが "approved" でないため実行できません（現在: ${status}）`)
        process.exit(1)
      }

      // 依存仕様の詳細仕様を収集（トークン効率: 直接依存のみ）
      const deps = parseSpecDependencies(content)
      let depContext = ''
      for (const dep of deps) {
        if (elaboratedSpecExists(dep)) {
          depContext += `\n--- ${dep} ---\n${readElaboratedSpec(dep)}\n`
        } else if (dep !== 'なし') {
          console.warn(`警告: ${dep} の詳細仕様がありません（部分情報で生成します）`)
        }
      }

      const prevExists = elaboratedSpecExists(name)
      if (prevExists && opts.diff) {
        console.log('既存の詳細仕様と差分モードで再生成します...')
      }

      console.log(`詳細仕様を生成中: ${name}...`)
      const elaborated = await elaborateSpec(content, depContext)

      if (opts.summary) {
        const adrSection = elaborated.match(/## アーキテクチャ決定([\s\S]*?)(?=\n##|$)/)
        console.log(adrSection ? adrSection[0] : '（アーキテクチャ決定セクションが見つかりません）')
        return
      }

      writeElaboratedSpec(name, elaborated)
      console.log(`✓ 保存: specs/elaborated/${name}.md`)
      console.log(`\n次のステップ: sdd task generate ${name}`)
    })

  return spec
}
