'use client'
import { useState } from 'react'
import { KanbanColumn } from './KanbanColumn'
import type { MockTask } from '../../lib/mock'

interface Props {
  tasks: MockTask[]
}

export function TaskKanban({ tasks }: Props) {
  const [showDone, setShowDone] = useState(false)

  const notStarted = tasks.filter(t => t.status === 'not-started')
  const inProgress = tasks.filter(t => ['in-progress', 'blocked', 'needs-review'].includes(t.status))
  const done = tasks.filter(t => t.status === 'done')

  return (
    <div className="flex gap-4 p-4 bg-slate-100 rounded-lg border border-slate-200 mt-1">
      <KanbanColumn title="未着手" tasks={notStarted} color="gray" />
      <div className="w-px bg-slate-200 shrink-0" />
      <KanbanColumn title="進行中" tasks={inProgress} color="blue" />
      <div className="w-px bg-slate-200 shrink-0" />
      {showDone ? (
        <KanbanColumn
          title="完了"
          tasks={done}
          color="green"
          onCollapse={() => setShowDone(false)}
        />
      ) : (
        <button
          onClick={() => setShowDone(true)}
          className="flex flex-col items-center justify-center gap-1.5 px-3 py-4 text-gray-400 hover:text-gray-600 bg-white border border-gray-200 rounded-lg shrink-0 self-stretch min-w-[52px] transition-colors"
          title="完了タスクを表示"
        >
          <span className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-xs font-medium">完了</span>
          <span className="text-xs bg-gray-100 rounded-full px-1.5 py-0.5">{done.length}</span>
          <span className="text-xs mt-1">▶</span>
        </button>
      )}
    </div>
  )
}
