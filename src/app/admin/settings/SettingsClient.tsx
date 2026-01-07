'use client'

import { useState, useMemo } from 'react'
import { Users, Layers, Search, Phone } from 'lucide-react'
import TeamDetailModal from '@/components/admin/TeamDetailModal'
import CategoryManager from '@/components/admin/settings/CategoryManager'

interface Team {
    id: string
    name_ko: string
    manager_name: string
    manager_phone: string
    created_at: string
    tournaments?: any
}

interface Tournament {
    id: string
    name: string
    divs: any
}

interface SettingsClientProps {
    initialTeams: Team[]
    initialTournaments: Tournament[]
}

export default function SettingsClient({ initialTeams, initialTournaments }: SettingsClientProps) {
    const [activeTab, setActiveTab] = useState<'representatives' | 'divisions'>('representatives')
    const [searchTerm, setSearchTerm] = useState('')

    // For Modal
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)

    // Aggregate Representatives
    const representatives = useMemo(() => {
        const map = new Map<string, { name: string, phone: string, teams: { id: string, name: string }[], lastActive: string }>()

        initialTeams.forEach(t => {
            const key = `${t.manager_name}-${t.manager_phone}`
            if (!map.has(key)) {
                map.set(key, {
                    name: t.manager_name,
                    phone: t.manager_phone,
                    teams: [],
                    lastActive: t.created_at
                })
            }
            const entry = map.get(key)!
            entry.teams.push({ id: t.id, name: t.name_ko })
            if (t.created_at > entry.lastActive) entry.lastActive = t.created_at
        })

        return Array.from(map.values())
    }, [initialTeams])

    // Filter Reps
    const filteredReps = representatives.filter(r =>
        r.name.includes(searchTerm) || r.phone.includes(searchTerm) || r.teams.some(t => t.name.includes(searchTerm))
    )

    // Helper to find full team object for modal
    const openTeamModal = (teamId: string) => {
        const team = initialTeams.find(t => t.id === teamId)
        if (team) setSelectedTeam(team)
    }

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('representatives')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'representatives' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                        }`}
                >
                    <Users className="w-4 h-4" />
                    대표자 관리
                </button>
                <button
                    onClick={() => setActiveTab('divisions')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'divisions' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                        }`}
                >
                    <Layers className="w-4 h-4" />
                    종별 관리
                </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[500px]">
                {activeTab === 'representatives' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-bold">등록된 대표자 목록 ({representatives.length}명)</h2>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="이름, 전화번호, 팀명 검색"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 w-64"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-3">이름</th>
                                        <th className="px-4 py-3">전화번호</th>
                                        <th className="px-4 py-3">소속 팀 ({filteredReps.length})</th>
                                        <th className="px-4 py-3">최근 활동</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredReps.map((rep, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-bold text-gray-900">{rep.name}</td>
                                            <td className="px-4 py-3 text-gray-600">
                                                <a href={`tel:${rep.phone}`} className="flex items-center gap-1 hover:text-blue-600 hover:underline">
                                                    <Phone className="w-3 h-3 text-gray-300" />
                                                    {rep.phone}
                                                </a>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {rep.teams.slice(0, 3).map((t, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => openTeamModal(t.id)}
                                                            className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100"
                                                        >
                                                            {t.name}
                                                        </button>
                                                    ))}
                                                    {rep.teams.length > 3 && (
                                                        <span className="text-xs text-gray-400 self-center">
                                                            +{rep.teams.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 text-xs">
                                                {new Date(rep.lastActive).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredReps.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-12 text-center text-gray-400">
                                                검색 결과가 없습니다.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'divisions' && (
                    <CategoryManager />
                )}
            </div>

            <TeamDetailModal
                isOpen={!!selectedTeam}
                onClose={() => setSelectedTeam(null)}
                teamId={selectedTeam?.id || null}
                teamName={selectedTeam?.name_ko || ''}
                teamData={selectedTeam}
            />
        </div>
    )
}
