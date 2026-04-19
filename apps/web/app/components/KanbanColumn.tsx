import type { MockTask, TaskStatus } from '../../lib/mock'

interface Props {
  title: string
  tasks: MockTask[]
  color: 'gray' | 'blue' | 'green'
  onCollapse?: () => void
}

const colorMap = {
  gray:  { dot: 'bg-gray-400',  card: 'bg-white border-gray-200' },
  blue:  { dot: 'bg-blue-400',  card: 'bg-blue-50 border-blue-200' },
  green: { dot: 'bg-green-400', card: 'bg-green-50 border-green-200' },
}

const sizeColor: Record<string, string> = {
  XS: 'bg-gray-100 text-gray-500',
  S:  'bg-emerald-100 text-emerald-700',
  M:  'bg-yellow-100 text-yellow-700',
  L:  'bg-orange-100 text-orange-700',
  XL: 'bg-red-100 text-red-700',
}

const statusBadge: Record<TaskStatus, string | null> = {
  'not-started': null,
  'in-progress': null,
  'done': null,
  'blocked':      'bg-red-100 text-red-600',
  'needs-review': 'bg-amber-100 text-amber-700',
}

const statusLabel: Record<TaskStatus, string | null> = {
  'not-started': null,
  'in-progress': null,
  'done': null,
  'blocked':      'ブロック',
  'needs-review': '要確認',
}

export function KanbanColumn({ title, tasks, color, onCollapse }: Props) {
  const c = colorMap[color]
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
        <span className={`w-2 h-2 rounded-full ${c.dot}`} />
        <span className="text-sm font-medium text-gray-700">{title}</span>
        <span className="ml-auto text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
          {tasks.length}
        </span>
        {onCollapse && (
          <button
            onClick={onCollapse}
            className="text-gray-400 hover:text-gray-600 text-xs ml-1"
            title="折り畳む"
          >
            ◀
          </button>
        )}
      </div>
      <div className="space-y-2">
        {tasks.map(task => (
          <div key={task.id} className={`border rounded-lg p-3 ${c.card}`}>
            <p className="text-sm text-gray-800 leading-snug">{task.title}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-xs rounded px-1.5 py-0.5 font-medium ${sizeColor[task.size]}`}>
                {task.size}
              </span>
              <span className="text-xs text-gray-400">{task.hoursMin}〜{task.hoursMax}h</span>
              {statusBadge[task.status] && (
                <span className={`text-xs rounded px-1.5 py-0.5 ${statusBadge[task.status]}`}>
                  {statusLabel[task.status]}
                </span>
              )}
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-6">なし</p>
        )}
      </div>
    </div>
  )
}
