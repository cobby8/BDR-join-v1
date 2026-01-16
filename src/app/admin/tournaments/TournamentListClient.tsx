'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Trash2, Edit2, Calendar } from 'lucide-react'
import { deleteTournament } from '@/app/actions/admin'
import { useRouter } from 'next/navigation'
import PasswordPromptModal from '@/components/common/PasswordPromptModal'
import ConfirmModal from '@/components/common/ConfirmModal'

interface Tournament {
    id: string
    name: string
    status: string
    start_date: string | null
    end_date: string | null
    reg_start_at: string
    reg_end_at: string
    div_caps: Record<string, number>
    divs: any // Detailed division info
    teams: { count: number }[]
}

interface Props {
    tournaments: Tournament[]
}

const TABS = ['접수중', '준비중', '마감', '종료']

export default function TournamentListClient({ tournaments: initialTournaments }: Props) {
    const [tournaments, setTournaments] = useState(initialTournaments)
    const [activeTab, setActiveTab] = useState('접수중')
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
    const [isDeleteLoading, setIsDeleteLoading] = useState(false)
    const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string }>({
        isOpen: false,
        title: '',
        message: ''
    })
    const router = useRouter()

    const filteredTournaments = tournaments.filter(t => {
        // Calculate totalCap from divs (detailed) if available, otherwise fallback
        let totalCap = 0

        let divsObj = t.divs
        if (typeof divsObj === 'string') {
            try { divsObj = JSON.parse(divsObj) } catch (e) { }
        }

        if (divsObj) {
            Object.values(divsObj).forEach((divs: any) => {
                if (Array.isArray(divs)) {
                    divs.forEach((d: any) => {
                        const cap = typeof d === 'object' ? (d.cap || d.max_teams || 0) : 0
                        totalCap += Number(cap)
                    })
                }
            })
        } else if (t.div_caps) {
            totalCap = Object.values(t.div_caps).reduce((a, b) => a + Number(b), 0)
        }
        const teamCount = t.teams?.[0]?.count || 0
        const isAutoClosed = totalCap > 0 && teamCount >= totalCap

        if (activeTab === '접수중' && t.status === '접수중' && !isAutoClosed) return true
        if (activeTab === '준비중' && t.status === '준비중') return true
        if (activeTab === '마감' && (t.status === '마감' || isAutoClosed)) return true
        if (activeTab === '종료' && t.status === '종료') return true
        return false
    })

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        setDeleteTargetId(id)
    }

    const handleDeleteConfirm = async () => {
        if (!deleteTargetId) return

        setIsDeleteLoading(true)
        try {
            const res = await deleteTournament(deleteTargetId)
            if (res.success) {
                setTournaments(prev => prev.filter(t => t.id !== deleteTargetId))
                setDeleteTargetId(null)
            } else {
                setAlertState({ isOpen: true, title: '삭제 실패', message: res.error || '삭제 실패' })
            }
        } catch (e) {
            setAlertState({ isOpen: true, title: '오류', message: '삭제 중 오류가 발생했습니다.' })
        } finally {
            setIsDeleteLoading(false)
        }
    }

    return (
        <div>
            <div className="mb-6">
                <div className="flex border-b border-gray-200">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 -mb-px text-sm font-medium ${activeTab === tab
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTournaments.map((tour) => {
                    // Calculate totalCap from divs (detailed) if available
                    let totalCap = 0

                    let divsObj = tour.divs
                    if (typeof divsObj === 'string') {
                        try { divsObj = JSON.parse(divsObj) } catch (e) { }
                    }

                    if (divsObj) {
                        Object.values(divsObj).forEach((divs: any) => {
                            if (Array.isArray(divs)) {
                                divs.forEach((d: any) => {
                                    const cap = typeof d === 'object' ? (d.cap || d.max_teams || 0) : 0
                                    totalCap += Number(cap)
                                })
                            }
                        })
                    } else if (tour.div_caps) {
                        totalCap = Object.values(tour.div_caps).reduce((a, b) => a + Number(b), 0)
                    }
                    const teamCount = tour.teams?.[0]?.count || 0
                    const isAutoClosed = totalCap > 0 && teamCount >= totalCap
                    const fillRatio = totalCap > 0 ? teamCount / totalCap : 0
                    const isClosingSoon = fillRatio >= 0.9 && !isAutoClosed && tour.status === '접수중'

                    return (
                        <div
                            key={tour.id}
                            className={`group relative bg-white border rounded-2xl px-5 py-4 hover:shadow-lg transition-all overflow-hidden flex flex-col justify-between ${isClosingSoon ? 'border-red-400 ring-1 ring-red-100' : 'border-gray-200 hover:border-blue-500'}`}
                        >
                            <div>
                                <Link href={`/admin/tournaments/${tour.id}`} className="hover:underline block mb-1.5">
                                    <h3 className="text-lg font-bold text-gray-900 leading-snug break-keep">{tour.name}</h3>
                                </Link>

                                {/* Participation Progress Bar */}
                                <div className="flex flex-col gap-1 w-full mt-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs text-gray-500">모집현황</span>
                                        <div className="flex items-center gap-1 text-sm">
                                            <span className="font-bold text-gray-900">{teamCount}</span>
                                            <span className="text-gray-400">/</span>
                                            <span className="text-gray-500">{totalCap > 0 ? totalCap : '-'}</span>
                                        </div>
                                    </div>
                                    {totalCap > 0 && (
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-full">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${teamCount >= totalCap ? 'bg-red-500' : 'bg-blue-500'}`}
                                                style={{ width: `${Math.min((teamCount / totalCap) * 100, 100)}%` }}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 text-sm text-gray-500 mt-3 mb-1">
                                    <span className="flex items-center gap-1 shrink-0">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {tour.start_date ? new Date(tour.start_date).toLocaleDateString() : '미정'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-3 mt-auto border-t border-gray-100">
                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold shrink-0 ${(isAutoClosed || tour.status === '마감') ? 'bg-red-50 text-red-600' :
                                        tour.status === '접수중' ? 'bg-blue-50 text-blue-600' :
                                            'bg-gray-100 text-gray-500'
                                        }`}>
                                        {isAutoClosed ? '마감 (자동)' : tour.status}
                                    </span>
                                    {isClosingSoon && (
                                        <span className="inline-flex px-2 py-1 rounded-md text-xs font-bold bg-red-100 text-red-600 animate-pulse shrink-0">
                                            마감임박
                                        </span>
                                    )}
                                </div>

                                <div className="flex gap-1">
                                    <Link
                                        href={`/admin/tournaments/edit/${tour.id}`}
                                        className="p-2 text-gray-400 hover:text-[hsl(var(--primary))] hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </Link>
                                    <button
                                        onClick={(e) => handleDeleteClick(tour.id, e)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}

                {/* Add New Card */}
                <Link
                    href="/admin/tournaments/create"
                    className="flex flex-col items-center justify-center gap-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl px-5 py-4 hover:bg-blue-50 hover:border-blue-300 transition-all min-h-[160px] group"
                >
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Plus className="w-8 h-8 text-gray-400 group-hover:text-blue-500" />
                    </div>
                    <span className="font-bold text-gray-500 group-hover:text-blue-600">새 대회 만들기</span>
                </Link>
            </div>

            <PasswordPromptModal
                isOpen={!!deleteTargetId}
                onClose={() => setDeleteTargetId(null)}
                onConfirm={handleDeleteConfirm}
                title="대회 삭제"
                description="정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                isLoading={isDeleteLoading}
            />
            <ConfirmModal
                isOpen={alertState.isOpen}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                title={alertState.title}
                description={alertState.message}
                variant="alert"
            />
        </div>
    )
}
