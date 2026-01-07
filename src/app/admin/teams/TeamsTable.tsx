'use client'

import Link from 'next/link'
import { useState } from 'react'
import { MoreHorizontal, Search, Phone, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { updateTeamStatus } from '@/app/actions/admin'

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
}

export default function TeamsTable({ teams }: { teams: Team[] }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [updatingParams, setUpdatingParams] = useState<string | null>(null) // '{id}-{field}'

    const filteredTeams = teams.filter(t =>
        t.name_ko.includes(searchTerm) ||
        t.manager_name.includes(searchTerm) ||
        t.manager_phone.includes(searchTerm)
    )

    const handleStatusChange = async (teamId: string, field: 'status' | 'payment_status', value: string) => {
        setUpdatingParams(`${teamId}-${field}`)
        try {
            const res = await updateTeamStatus(teamId, field, value)
            if (res.error) {
                alert('업데이트 실패: ' + res.error)
            }
        } catch (e: any) {
            alert('오류: ' + e.message)
        } finally {
            setUpdatingParams(null)
        }
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="팀명, 대표자 검색"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3">팀명</th>
                            <th className="px-6 py-3">대표자</th>
                            <th className="px-6 py-3">참가비 상태</th>
                            <th className="px-6 py-3">신청 상태</th>
                            <th className="px-6 py-3">신청일시</th>
                            <th className="px-6 py-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredTeams.map(team => (
                            <tr key={team.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <Link href={`/admin/teams/${team.id}`} className="font-bold text-gray-900 hover:text-blue-600 hover:underline">
                                        {team.name_ko}
                                    </Link>
                                    {team.name_en && (
                                        <div className="text-xs text-gray-400">{team.name_en}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-gray-900">{team.manager_name}</div>
                                    <a href={`tel:${team.manager_phone}`} className="text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1">
                                        <Phone className="w-3 h-3" /> {team.manager_phone}
                                    </a>
                                </td>
                                <td className="px-6 py-4">
                                    <select
                                        value={team.payment_status}
                                        disabled={updatingParams === `${team.id}-payment_status`}
                                        onChange={(e) => handleStatusChange(team.id, 'payment_status', e.target.value)}
                                        className={`px-2 py-1.5 rounded-lg text-xs font-bold border-0 ring-1 ring-inset ${team.payment_status === 'paid' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                                team.payment_status === 'pending' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' :
                                                    team.payment_status === 'refunded' ? 'bg-red-50 text-red-700 ring-red-600/20' :
                                                        'bg-gray-50 text-gray-600 ring-gray-500/10'
                                            }`}
                                    >
                                        <option value="pending">미입금</option>
                                        <option value="paid">입금완료</option>
                                        <option value="refunded">환불완료</option>
                                        <option value="cancelled">취소</option>
                                    </select>
                                    {updatingParams === `${team.id}-payment_status` && <Clock className="w-3 h-3 ml-2 animate-spin inline text-gray-400" />}
                                </td>
                                <td className="px-6 py-4">
                                    <select
                                        value={team.status}
                                        disabled={updatingParams === `${team.id}-status`}
                                        onChange={(e) => handleStatusChange(team.id, 'status', e.target.value)}
                                        className={`px-2 py-1.5 rounded-lg text-xs font-bold border-0 ring-1 ring-inset ${team.status === 'confirmed' ? 'bg-blue-50 text-blue-700 ring-blue-700/10' :
                                                team.status === 'pending' ? 'bg-gray-50 text-gray-600 ring-gray-500/10' :
                                                    team.status === 'cancelled' ? 'bg-red-50 text-red-700 ring-red-600/10' :
                                                        'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                                            }`}
                                    >
                                        <option value="pending">대기중</option>
                                        <option value="confirmed">확정됨</option>
                                        <option value="cancelled">취소됨</option>
                                    </select>
                                    {updatingParams === `${team.id}-status` && <Clock className="w-3 h-3 ml-2 animate-spin inline text-gray-400" />}
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-500">
                                    {new Date(team.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <Link href={`/admin/teams/${team.id}`} className="p-2 hover:bg-gray-100 rounded-full inline-block text-gray-400">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {filteredTeams.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
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
