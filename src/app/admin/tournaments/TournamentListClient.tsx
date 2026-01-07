'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Trash2, Edit2, Calendar } from 'lucide-react'
import { deleteTournament } from '@/app/actions/admin'
import { useRouter } from 'next/navigation'
import PasswordPromptModal from '@/components/common/PasswordPromptModal'

interface Tournament {
    id: string
    name: string
    status: string
    start_date: string | null
    end_date: string | null
    reg_start_at: string
    reg_end_at: string
    div_caps: Record<string, number>
    teams: { count: number }[]
}

interface Props {
    tournaments: Tournament[]
}

const TABS = ['접수중', '접수전', '마감', '종료']

export default function TournamentListClient({ tournaments: initialTournaments }: Props) {
    const [tournaments, setTournaments] = useState(initialTournaments)
    const [activeTab, setActiveTab] = useState('접수중')
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
    const [isDeleteLoading, setIsDeleteLoading] = useState(false)
    const router = useRouter()

    const filteredTournaments = tournaments.filter(t => {
        const totalCap = t.div_caps ? Object.values(t.div_caps).reduce((a, b) => a + Number(b), 0) : 0
        const teamCount = t.teams?.[0]?.count || 0
        const isAutoClosed = totalCap > 0 && teamCount >= totalCap

        if (activeTab === '접수중' && t.status === '접수중' && !isAutoClosed) return true
        if (activeTab === '접수전' && t.status === '접수전') return true
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
                alert('삭제 실패: ' + res.error)
            }
        } catch (e) {
            alert('삭제 중 오류가 발생했습니다.')
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
                    const totalCap = tour.div_caps ? Object.values(tour.div_caps).reduce((a, b) => a + Number(b), 0) : 0
                    const teamCount = tour.teams?.[0]?.count || 0
                    const isAutoClosed = totalCap > 0 && teamCount >= totalCap

                    return (
                        <div
                            key={tour.id}
                            className="group relative bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all hover:border-blue-500 overflow-hidden flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold ${(isAutoClosed || tour.status === '마감') ? 'bg-red-50 text-red-600' :
                                        tour.status === '접수중' ? 'bg-blue-50 text-blue-600' :
                                            'bg-gray-100 text-gray-500'
                                        }`}>
                                        {isAutoClosed ? '마감 (자동)' : tour.status}
                                    </span>
                                    <Link href={`/admin/tournaments/${tour.id}`} className="hover:underline">
                                        <h3 className="text-lg font-bold text-gray-900">{tour.name}</h3>
                                    </Link>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {tour.start_date ? new Date(tour.start_date).toLocaleDateString() : '미정'} ~ {tour.end_date ? new Date(tour.end_date).toLocaleDateString() : '미정'}
                                    </span>
                                    <span className="text-gray-400">|</span>
                                    <span>
                                        참가팀: {teamCount} / {totalCap > 0 ? totalCap : '-'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-gray-100">
                                <Link
                                    href={`/admin/tournaments/edit/${tour.id}`}
                                    className="p-2 text-gray-400 hover:text-[hsl(var(--primary))] hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    <Edit2 className="w-5 h-5" />
                                </Link>
                                <button
                                    onClick={(e) => handleDeleteClick(tour.id, e)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )
                })}

                {/* Add New Card */}
                <Link
                    href="/admin/tournaments/create"
                    className="flex flex-col items-center justify-center gap-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-6 hover:bg-blue-50 hover:border-blue-300 transition-all min-h-[240px] group"
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
        </div>
    )
}
