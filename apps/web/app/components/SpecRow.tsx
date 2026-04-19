import type { MockSpec, Stage } from '../../lib/mock'
import { STAGE_ORDER } from '../../lib/mock'
import { TaskKanban } from './TaskKanban'

interface Props {
  spec: MockSpec
  isOpen: boolean
  openStage: Stage | null
  onStageClick: (stage: Stage) => void
}

export function SpecRow({ spec, isOpen, openStage, onStageClick }: Props) {
  const currentIdx = STAGE_ORDER.indexOf(spec.currentStage)
  const hasTasks = spec.tasks.length > 0

  return (
    <div>
      <div className="grid grid-cols-[200px_repeat(6,1fr)] items-center px-4 py-3 hover:bg-slate-50 transition-colors">
        {/* Spec name */}
        <div className="pr-4">
          <p className="text-sm font-semibold text-gray-900 truncate">{spec.title}</p>
          <p className="text-xs text-gray-400 truncate">{spec.id}</p>
        </div>

        {/* Stage indicators */}
        {STAGE_ORDER.map((stage, idx) => {
          const stageIdx = idx
          const isDone = stageIdx < currentIdx
          const isCurrent = stageIdx === currentIdx
          const isFuture = stageIdx > currentIdx
          const isSelected = isOpen && openStage === stage
          const isClickable = hasTasks && !isFuture

          return (
            <div key={stage} className="flex items-center justify-center relative">
              {/* Left half connector */}
              {idx > 0 && (
                <div
                  className={`absolute right-[calc(50%+10px)] left-0 h-px ${
                    stageIdx <= currentIdx ? 'bg-indigo-300' : 'bg-gray-200'
                  }`}
                />
              )}
              {/* Right half connector */}
              {idx < STAGE_ORDER.length - 1 && (
                <div
                  className={`absolute left-[calc(50%+10px)] right-0 h-px ${
                    stageIdx < currentIdx ? 'bg-indigo-300' : 'bg-gray-200'
                  }`}
                />
              )}

              {/* Dot */}
              <button
                onClick={() => isClickable && onStageClick(stage)}
                className={[
                  'relative z-10 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all',
                  isDone   ? 'bg-indigo-500 text-white' : '',
                  isCurrent ? 'bg-indigo-600 text-white ring-2 ring-indigo-200' : '',
                  isFuture  ? 'border-2 border-gray-200 bg-white' : '',
                  isSelected ? 'ring-4 ring-indigo-300 scale-125' : '',
                  isClickable ? 'cursor-pointer hover:scale-110' : 'cursor-default',
                ].filter(Boolean).join(' ')}
                title={isClickable ? `${stage} を選択` : undefined}
              >
                {isDone ? '✓' : ''}
              </button>
            </div>
          )
        })}
      </div>

      {/* Accordion: task kanban */}
      {isOpen && hasTasks && (
        <div className="px-4 pb-3">
          <TaskKanban tasks={spec.tasks} />
        </div>
      )}
    </div>
  )
}
