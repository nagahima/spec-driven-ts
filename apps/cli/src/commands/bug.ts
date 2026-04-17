import { Command } from 'commander'
import { randomBytes } from 'crypto'
import {
  readBugs, saveBug, getBug,
  buildSpecIndex, readSpec, appendTask,
  saveProposal,
} from '../lib/specs'
import { analyzeBug, generateBugFixTask } from '../lib/claude'
import type { BugReport } from 'types'
import type { StoredTask } from '../lib/specs'

const STATUS_LABEL: Record<string, string> = {
  open:          'オープン',
  analyzing:     '分析中',
  resolved:      '解決済み',
  'spec-defect': '仕様欠陥',
  unclassified:  '未分類',
}

export function createBugCommand(): Command {
  const bug = new Command('bug').description('バグ管理')

  bug
    .command('report <description>')
    .description('バグを報告して分析・タスク生成を開始する')
    .action(async (description: string) => {
      const now = new Date().toISOString()
      const id = `bug-${randomBytes(4).toString('hex')}`

      const report: BugReport = { id, description, status: 'analyzing', created_at: now, updated_at: now }
      saveBug(report)
      console.log(`\nバグ登録: ${id}`)
      console.log('分析中...')

      try {
        const specIndex = buildSpecIndex()
        // 関連仕様の特定と詳細分析
        const dummySpec = '' // analyzeBug内部で2段階呼び出し
        const analysis = await analyzeBug(description, specIndex, dummySpec)

        // 分析結果を表示
        console.log(`\n分析結果:`)
        console.log(`  原因種別 : ${analysis.root_cause === 'implementation' ? '実装バグ' : analysis.root_cause === 'spec-defect' ? '仕様欠陥' : '不明'}`)
        console.log(`  関連仕様 : ${analysis.affected_spec_id}`)
        console.log(`  違反条件 : ${analysis.affected_acceptance_condition}`)
        console.log(`  確信度   : ${Math.round(analysis.confidence * 100)}%`)
        console.log(`  根拠     : ${analysis.reasoning}`)

        report.analysis = analysis
        report.updated_at = new Date().toISOString()

        if (analysis.root_cause === 'unknown' || analysis.confidence < 0.4) {
          report.status = 'unclassified'
          saveBug(report)
          console.log(`\n分類不能: ${id} - 追加情報をお知らせください`)
          return
        }

        if (analysis.root_cause === 'implementation') {
          // 修正タスクを生成
          console.log('\n修正タスクを生成中...')
          let specContent = ''
          try { specContent = readSpec(analysis.affected_spec_id) } catch { /* spec not found */ }

          const taskData = await generateBugFixTask(description, analysis, specContent)
          const now2 = new Date().toISOString()
          const fixTask: StoredTask = {
            ...taskData,
            id: `bug-fix-${id}`,
            spec_id: analysis.affected_spec_id,
            status: 'not-started',
            order: 9999,
            created_at: now2,
            updated_at: now2,
          }
          appendTask(analysis.affected_spec_id, fixTask)
          report.fix_task_id = fixTask.id
          report.status = 'resolved'
          saveBug(report)

          console.log(`\n✓ 修正タスクを生成しました: ${fixTask.id}`)
          console.log(`  タイトル: ${fixTask.title}`)
          console.log(`  見積もり: ${fixTask.estimate.size} (${fixTask.estimate.hours_min}〜${fixTask.estimate.hours_max}h)`)
          console.log(`  タスク確認: sdd task list ${analysis.affected_spec_id}`)

        } else {
          // 仕様欠陥 → SpecChangeProposal を生成
          const proposalId = `proposal-${randomBytes(4).toString('hex')}`
          saveProposal({
            id: proposalId,
            spec_id: analysis.affected_spec_id,
            proposed_content: `バグ報告 ${id} に基づく仕様修正:\n\n${analysis.reasoning}`,
            reason: description,
            status: 'pending',
            created_at: new Date().toISOString(),
          })
          report.change_proposal_id = proposalId
          report.status = 'spec-defect'
          saveBug(report)

          console.log(`\n仕様欠陥として記録しました`)
          console.log(`  修正提案ID: ${proposalId}`)
          console.log(`  承認するには: sdd spec approve ${proposalId}`)
        }

      } catch (err) {
        report.status = 'unclassified'
        saveBug(report)
        console.error(`\n分析失敗: ${(err as Error).message}`)
      }
    })

  bug
    .command('list')
    .description('バグ報告の一覧を表示する')
    .action(() => {
      const bugs = readBugs()
      if (bugs.length === 0) { console.log('バグ報告はありません'); return }

      console.log(`\nバグ一覧 (${bugs.length} 件)\n`)
      for (const b of bugs) {
        const status = STATUS_LABEL[b.status] ?? b.status
        const spec = b.analysis?.affected_spec_id ? ` [${b.analysis.affected_spec_id}]` : ''
        console.log(`  ${b.id}  [${status}]${spec}  ${b.description.slice(0, 60)}`)
      }
    })

  bug
    .command('show <id>')
    .description('バグの詳細を表示する')
    .action((id: string) => {
      const report = getBug(id)
      if (!report) { console.error(`バグが見つかりません: ${id}`); process.exit(1) }

      console.log(`\nバグ: ${report.id}`)
      console.log(`ステータス: ${STATUS_LABEL[report.status] ?? report.status}`)
      console.log(`説明: ${report.description}`)
      console.log(`登録日時: ${report.created_at}`)

      if (report.analysis) {
        const a = report.analysis
        console.log(`\n分析結果:`)
        console.log(`  原因種別: ${a.root_cause}`)
        console.log(`  関連仕様: ${a.affected_spec_id}`)
        console.log(`  違反条件: ${a.affected_acceptance_condition}`)
        console.log(`  確信度  : ${Math.round(a.confidence * 100)}%`)
        console.log(`  根拠    : ${a.reasoning}`)
      }

      if (report.fix_task_id) console.log(`\n修正タスク: ${report.fix_task_id}`)
      if (report.change_proposal_id) console.log(`\n仕様修正提案: ${report.change_proposal_id}`)
    })

  return bug
}
