'use client'

import Link from 'next/link'
import { useState } from 'react'
import { MapPin, Users, Trophy, Phone } from 'lucide-react'
import { updateTeamStatus } from '@/app/actions/admin'

// (Keep Team interface same as Client or import shared type, but since it's a prop, we can redefine local subset or use any)
// To be safe, let's redefine with new fields
interface Team {
    id: string
    tournament_id: string
    name_ko: string
    name_en: string | null
    manager_name: string
    manager_phone: string
    payment_status: string
    status: string
    created_at: string
    tournaments: { name: string } | null | any
    province?: string
    city?: string
    players?: { count: number }[]
}

interface TeamsTableProps {
    teams: Team[]
    onTeamClick: (id: string) => void
    teamCounts: Record<string, number>
    enableInlineStatusEditing?: boolean
}

export default function TeamsTable({ teams, onTeamClick, teamCounts, enableInlineStatusEditing = false }: TeamsTableProps) {
    const [updatingParams, setUpdatingParams] = useState<string | null>(null)

    const handleStatusChange = async (teamId: string, field: string, value: string) => {
        if (!confirm('상태를 변경하시겠습니까?')) return

        setUpdatingParams(`${teamId}-${field}`)
        const res = await updateTeamStatus(teamId, field, value)
        setUpdatingParams(null)

        if (res.error) {
            alert('업데이트 실패: ' + res.error)
        }
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3">팀명</th>
                            <th className="px-6 py-3">대표자</th>
                            <th className="px-6 py-3">지역</th>
                            <th className="px-6 py-3">등록선수</th>
                            {enableInlineStatusEditing ? (
                                <>
                                    <th className="px-6 py-3">참가비</th>
                                    <th className="px-6 py-3">승인</th>
                                </>
                            ) : (
                                <th className="px-6 py-3">참가대회</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {teams.map(team => {
                            const playerCount = team.players?.[0]?.count || 0

                            return (
                                <tr key={team.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => onTeamClick(team.id)}
                                            className="text-left font-bold text-gray-900 hover:text-blue-600 hover:underline"
                                        >
                                            <div className="text-base">{team.name_ko}</div>
                                            {team.name_en && (
                                                <div className="text-xs text-gray-400 font-normal">{team.name_en}</div>
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-gray-900 font-medium">{team.manager_name}</div>
                                        <a href={`tel:${team.manager_phone}`} className="text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1 mt-0.5">
                                            <Phone className="w-3 h-3" /> {team.manager_phone}
                                        </a>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-gray-600">
                                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                            {team.province} {team.city}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5 text-gray-400" />
                                            <span className="font-bold text-gray-900">{playerCount}</span>
                                            <span className="text-gray-400 text-xs">명</span>
                                        </div>
                                    </td>
                                    {enableInlineStatusEditing ? (
                                        <>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={team.payment_status}
                                                    onChange={(e) => handleStatusChange(team.id, 'payment_status', e.target.value)}
                                                    disabled={updatingParams === `${team.id}-payment_status`}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border-0 ring-1 ring-inset focus:outline-none cursor-pointer ${team.payment_status === 'paid' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                                            team.payment_status === 'pending' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' :
                                                                'bg-red-50 text-red-700 ring-red-600/20'
                                                        }`}
                                                >
                                                    <option value="pending">미입금</option>
                                                    <option value="paid">입금완료</option>
                                                    <option value="refunded">환불완료</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={team.status}
                                                    onChange={(e) => handleStatusChange(team.id, 'status', e.target.value)}
                                                    disabled={updatingParams === `${team.id}-status`}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border-0 ring-1 ring-inset focus:outline-none cursor-pointer ${team.status === 'confirmed' ? 'bg-blue-50 text-blue-700 ring-blue-700/10' :
                                                            team.status === 'pending' ? 'bg-gray-50 text-gray-600 ring-gray-500/10' :
                                                                'bg-red-50 text-red-700 ring-red-600/10'
                                                        }`}
                                                >
                                                    <option value="pending">대기중</option>
                                                    <option value="confirmed">확정</option>
                                                    <option value="cancelled">취소</option>
                                                </select>
                                            </td>
                                        </>
                                    ) : (
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-gray-600">
                                                <Trophy className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                <span className="font-bold text-gray-900">{teamCounts[team.name_ko] || 1}</span>
                                                <span className="text-gray-400 text-xs">회</span>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            )
                        })}
                        {teams.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-gray-400">
                                    검색 결과가 없습니다.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
