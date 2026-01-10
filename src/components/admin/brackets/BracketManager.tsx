'use client'

import React, { useState } from 'react'
import BracketGenerator from '@/components/admin/brackets/BracketGenerator'
import BracketViewer from '@/components/admin/brackets/BracketViewer'
import { Plus } from 'lucide-react'

interface Props {
    tournamentId: string
    teamCount: number
}

export default function BracketManager({ tournamentId, teamCount }: Props) {
    const [viewMode, setViewMode] = useState<'view' | 'generate'>('view')
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    const handleSuccess = () => {
        setRefreshTrigger(prev => prev + 1)
        setViewMode('view')
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">대진표 관리</h2>
                <button
                    onClick={() => setViewMode(viewMode === 'view' ? 'generate' : 'view')}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                    {viewMode === 'view' ? (
                        <>
                            <Plus className="w-4 h-4" />
                            새로 생성하기 / 설정
                        </>
                    ) : '취소'}
                </button>
            </div>

            {viewMode === 'generate' && (
                <BracketGenerator
                    tournamentId={tournamentId}
                    teamCount={teamCount}
                    onSuccess={handleSuccess}
                />
            )}

            <BracketViewer
                tournamentId={tournamentId}
                refreshTrigger={refreshTrigger}
            />
        </div>
    )
}
