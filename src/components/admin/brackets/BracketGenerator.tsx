'use client'

import React, { useState } from 'react'
import { generateHybridBracket } from '@/app/actions/bracket'
import { Loader2, Settings2, Users } from 'lucide-react'
import ConfirmModal from '@/components/common/ConfirmModal'

interface Props {
    tournamentId: string
    teamCount: number
    onSuccess?: () => void
}

export default function BracketGenerator({ tournamentId, teamCount, onSuccess }: Props) {
    const [groupCount, setGroupCount] = useState(4)
    const [isGenerating, setIsGenerating] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [confirmState, setConfirmState] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    })

    const teamsPerGroup = Math.ceil(teamCount / groupCount)
    const recommendedGroups = teamCount >= 12 ? 4 : teamCount >= 6 ? 2 : 1

    const handleGenerate = async () => {
        setConfirmState({
            isOpen: true,
            title: '대진표 생성',
            message: '기존 대진표가 있다면 초기화됩니다. 계속하시겠습니까?',
            onConfirm: async () => {
                setIsGenerating(true)
                setMessage(null)

                try {
                    const result = await generateHybridBracket(tournamentId, {
                        groupCount,
                        advancePerGroup: 2 // Default for now
                    })

                    if (result.success) {
                        setMessage({ type: 'success', text: result.message || '완료' })
                        if (onSuccess) onSuccess()
                    } else {
                        setMessage({ type: 'error', text: result.message || '실패' })
                    }
                } catch (error) {
                    setMessage({ type: 'error', text: '오류가 발생했습니다.' })
                    console.error(error)
                } finally {
                    setIsGenerating(false)
                }
            }
        })
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-6">
            <div className="flex items-center gap-2 mb-4">
                <Settings2 className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-bold text-gray-900">대진표 생성기</h3>
            </div>

            <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Users className="w-4 h-4" />
                        <span>총 참가팀: <strong>{teamCount}팀</strong></span>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        조(Group) 개수 설정
                    </label>
                    <select
                        value={groupCount}
                        onChange={(e) => setGroupCount(Number(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        {[1, 2, 4, 8, 16].map(num => (
                            <option key={num} value={num}>{num}개 조 ({Math.ceil(teamCount / num)}팀/조)</option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                        {teamCount}팀 기준, {groupCount}개 조 생성 시 각 조에 약 {teamsPerGroup}팀이 배정됩니다.
                    </p>
                </div>

                {message && (
                    <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || teamCount < 2}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            생성 중...
                        </>
                    ) : (
                        '대진표 자동 생성'
                    )}
                </button>
            </div>
            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={() => {
                    confirmState.onConfirm()
                    setConfirmState(prev => ({ ...prev, isOpen: false }))
                }}
                title={confirmState.title}
                description={confirmState.message}
                confirmText="생성"
                isDangerous
            />
        </div>
    )
}
