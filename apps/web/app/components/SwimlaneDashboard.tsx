'use client'
import { useState } from 'react'
import { SpecRow } from './SpecRow'
import { mockSpecs, STAGE_ORDER, STAGE_LABELS } from '../../lib/mock'
import type { Stage } from '../../lib/mock'

export function SwimlaneDashboard() {
  const [openSpecId, setOpenSpecId] = useState<string | null>(null)
  const [openStage, setOpenStage] = useState<Stage | null>(null)

  function handleStageClick(specId: string, stage: Stage) {
    if (openSpecId === specId && openStage === stage) {
      setOpenSpecId(null)
      setOpenStage(null)
    } else {
      setOpenSpecId(specId)
      setOpenStage(stage)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Column header */}
      <div className="grid grid-cols-[200px_repeat(6,1fr)] px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">仕様</div>
        {STAGE_ORDER.map(stage => (
          <div key={stage} className="text-center text-xs font-medium text-gray-500">
            {STAGE_LABELS[stage]}
          </div>
        ))}
      </div>

      {/* Spec rows */}
      <div className="divide-y divide-gray-100">
        {mockSpecs.map(spec => (
          <SpecRow
            key={spec.id}
            spec={spec}
            isOpen={openSpecId === spec.id}
            openStage={openSpecId === spec.id ? openStage : null}
            onStageClick={(stage) => handleStageClick(spec.id, stage)}
          />
        ))}
      </div>
    </div>
  )
}
