import { Command } from 'commander'
import { readElaboratedSpec, readTasks, saveTasks, listAllTaskFiles } from '../lib/specs'
import { generateTasks } from '../lib/claude'
import type { StoredTask } from '../lib/specs'

const STATUS_LABEL: Record<string, string> = {
  'not-started': '未着手',
  'in-progress':  '進行中',
  'done':         '完了  ',
  'blocked':      'ブロック',
  'needs-review': '要確認',
}

const SIZE_LABEL: Record<string, string> = { XS: 'XS', S: 'S ', M: 'M ', L: 'L ', XL: 'XL' }

function printTask(task: StoredTask): void {
  const status = STATUS_LABEL[task.status] ?? task.status
  const size = SIZE_LABEL[task.estimate.size] ?? task.estimate.size
  const hours = `${task.estimate.hours_min}〜${task.estimate.hours_max}h`
  const deps = task.depends_on.length > 0 ? ` ← [${task.depends_on.join(', ')}]` : ''
  console.log(`  ${String(task.order).padStart(2)}. [${status}] [${size} ${hours}] ${task.id}: ${task.title}${deps}`)
}

export function createTaskCommand(): Command {
  const task = new Command('task').description('タスクの管理')

  task
    .command('generate <name>')
    .description('詳細仕様からタスクを生成する')
    .action(async (name: string) => {
      const elaborated = readElaboratedSpec(name)

      console.log(`タスクを生成中: ${name}...`)
      const tasks = await generateTasks(name, elaborated)
      saveTasks(name, tasks)

      console.log(`\n✓ ${tasks.length} 件のタスクを生成しました: specs/tasks/${name}.json\n`)
      tasks.forEach(printTask)
      console.log(`\n合計見積もり: ${tasks.reduce((s, t) => s + t.estimate.hours_min, 0)}〜${tasks.reduce((s, t) => s + t.estimate.hours_max, 0)}h`)
    })

  task
    .command('list <name>')
    .description('タスク一覧を表示する')
    .action((name: string) => {
      const tasks = readTasks(name)
      if (tasks.length === 0) {
        console.log(`タスクがありません。先に実行: sdd task generate ${name}`)
        return
      }

      console.log(`\nタスク一覧: ${name} (${tasks.length} 件)\n`)
      tasks.forEach(printTask)
      const done = tasks.filter(t => t.status === 'done').length
      console.log(`\n進捗: ${done}/${tasks.length} 完了`)
    })

  task
    .command('roadmap')
    .description('全仕様の横断ロードマップを表示する')
    .action(() => {
      const files = listAllTaskFiles()
      if (files.length === 0) {
        console.log('タスクファイルがありません')
        return
      }

      let totalTasks = 0
      let totalDone = 0

      for (const name of files) {
        const tasks = readTasks(name)
        const done = tasks.filter(t => t.status === 'done').length
        totalTasks += tasks.length
        totalDone += done

        console.log(`\n─── ${name} (${done}/${tasks.length}) ───`)
        tasks.forEach(printTask)
      }

      console.log(`\n━━━ 合計: ${totalDone}/${totalTasks} 完了 ━━━`)
    })

  return task
}