'use client'

import { AIBoardPanel } from '@/components/dashboard/AIBoardPanel'

interface AIBoardTabProps {
  documents?: any[]
}

export function AIBoardTab({ documents = [] }: AIBoardTabProps) {
  return (
    <div className="space-y-6">
      {/* Full-width AI Board Panel */}
      <AIBoardPanel documents={documents} />
    </div>
  )
}
