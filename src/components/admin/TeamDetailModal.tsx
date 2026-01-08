'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, User, Phone, Shirt, Trophy } from 'lucide-react'

interface Player {
    id: string
    name: string
    back_number: string
    position: string
    birth_date: string
    is_elite: boolean
    created_at: string
}

interface TeamDetailModalProps {
    teamId: string | null
    isOpen: boolean
    onClose: () => void
    teamName: string // Pass generic info to show while loading
    teamData?: any // Optional full team data if available
}

export default function TeamDetailModal({ teamId, isOpen, onClose, teamName, teamData }: TeamDetailModalProps) {
    const [players, setPlayers] = useState<Player[]>([])
    const [history, setHistory] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isOpen && teamId) {
            fetchPlayers(teamId)
            if (teamData) {
                fetchHistory(teamData.name_ko, teamData.manager_phone)
            }
        } else {
            setPlayers([])
            setHistory([])
        }
    }, [isOpen, teamId, teamData])

    async function fetchPlayers(tid: string) {
        setLoading(true)
        const { data, error } = await supabase
            .from('players')
            .select('*')
            .eq('team_id', tid)
            .order('back_number', { ascending: true }) // Sort by back number? or creation

        if (!error && data) {
            setPlayers(data as unknown as Player[])
        }
        setLoading(false)
    }

    async function fetchHistory(name: string, phone: string) {
        // Fetch other participations by Name AND Manager Phone (to be safe)
        const { data } = await supabase
            .from('teams')
            .select('id, created_at, category, division, status, tournaments(name)')
            .eq('name_ko', name)
            .eq('manager_phone', phone)
            .order('created_at', { ascending: false })
            .limit(10) // Last 10

        if (data) setHistory(data)
    }

    if (!isOpen) return null

    // Uniform Icon Component
    const UniformIcon = ({ color, text }: { color: string, text: string }) => {
        // Simple Jersey Shape SVG
        return (
            <div className="relative w-12 h-12 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" style={{ fill: color || '#ddd' }}>
                    <path d="M 20,10 L 80,10 L 85,25 L 85,90 L 15,90 L 15,25 Z" />
                    {/* Neck cut */}
                    <path d="M 35,10 Q 50,30 65,10" fill="white" />
                    {/* Arm cuts */}
                    {/* A bit simplified */}
                </svg>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pt-2">
                    <span className="text-white font-bold text-lg drop-shadow-md">{text.charAt(0).toUpperCase()}</span>
                </div>
            </div>
        )
    }

    // Helper to check if color is hex
    const isColor = (c: string | null) => c && (c.startsWith('#') || c.startsWith('rgb'))

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Shirt className="w-6 h-6 text-blue-600" />
                            {teamName}
                        </h2>
                        {teamData && (
                            <p className="text-sm text-gray-500 mt-1 flex gap-3">
                                <span className='flex items-center gap-1'><User className='w-3 h-3' /> 대표자: {teamData.manager_name}</span>
                                <a href={`tel:${teamData.manager_phone}`} className='flex items-center gap-1 hover:text-blue-600 hover:underline'>
                                    <Phone className='w-3 h-3' /> {teamData.manager_phone}
                                </a>
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Team Info Section */}
                    {teamData && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">종별 / 디비전</label>
                                <div className="font-semibold text-gray-900">{teamData.category || '-'} / {teamData.division || '-'}</div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">유니폼 (홈)</label>
                                <div className="flex items-center gap-2">
                                    {isColor(teamData.uniform_home) ? (
                                        <UniformIcon color={teamData.uniform_home} text={teamData.name_en || teamData.name_ko} />
                                    ) : (
                                        <span className="font-semibold text-gray-900">{teamData.uniform_home || '-'}</span>
                                    )}
                                    {isColor(teamData.uniform_home) && <span className="text-xs text-gray-400">{teamData.uniform_home}</span>}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">유니폼 (원정)</label>
                                <div className="flex items-center gap-2">
                                    {isColor(teamData.uniform_away) ? (
                                        <UniformIcon color={teamData.uniform_away} text={teamData.name_en || teamData.name_ko} />
                                    ) : (
                                        <span className="font-semibold text-gray-900">{teamData.uniform_away || '-'}</span>
                                    )}
                                    {isColor(teamData.uniform_away) && <span className="text-xs text-gray-400">{teamData.uniform_away}</span>}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">최근 활동</label>
                                <div className="font-semibold text-gray-900">{new Date(teamData.created_at).toLocaleDateString()}</div>
                            </div>
                        </div>
                    )}

                    {/* Players Section */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-gray-500" />
                            선수 명단
                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{players.length}명</span>
                        </h3>
                        <div className="border border-gray-100 rounded-xl overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-3 w-16 text-center">No.</th>
                                        <th className="px-6 py-3">이름</th>
                                        <th className="px-6 py-3">생년월일</th>
                                        <th className="px-6 py-3">포지션</th>
                                        <th className="px-6 py-3 text-center">선출여부</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">불러오는 중...</td></tr>
                                    ) : players.length === 0 ? (
                                        <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">등록된 선수가 없습니다.</td></tr>
                                    ) : (
                                        players.map((p) => (
                                            <tr key={p.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-3 text-center font-mono text-gray-600 font-bold">{p.back_number}</td>
                                                <td className="px-6 py-3 font-medium text-gray-900">{p.name}</td>
                                                <td className="px-6 py-3 text-gray-500">{p.birth_date || '-'}</td>
                                                <td className="px-6 py-3 text-gray-500">{p.position || '-'}</td>
                                                <td className="px-6 py-3 text-center">
                                                    {p.is_elite ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">선출</span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* History Section */}
                    {history.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-gray-500" />
                                최근 출전 대회
                            </h3>
                            <div className="border border-gray-100 rounded-xl overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-medium">
                                        <tr>
                                            <th className="px-6 py-3">대회명</th>
                                            <th className="px-6 py-3">종별/디비전</th>
                                            <th className="px-6 py-3">상태</th>
                                            <th className="px-6 py-3">신청일</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {history.map((h) => {
                                            const tourName = Array.isArray(h.tournaments) ? h.tournaments[0]?.name : h.tournaments?.name
                                            return (
                                                <tr key={h.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-3 font-medium text-gray-900">{tourName || '알 수 없음'}</td>
                                                    <td className="px-6 py-3 text-gray-600">{h.category} / {h.division}</td>
                                                    <td className="px-6 py-3">
                                                        {h.status === 'confirmed' ? <span className="text-green-600 font-bold">확정</span> :
                                                            h.status === 'cancelled' ? <span className="text-red-500">취소</span> :
                                                                <span className="text-orange-500">대기</span>}
                                                    </td>
                                                    <td className="px-6 py-3 text-gray-400">{new Date(h.created_at).toLocaleDateString()}</td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
