'use client'

import { useState, useMemo } from 'react'
import { Download, Search } from 'lucide-react'
import TeamsTable from './TeamsTable'

interface Team {
    id: string
    name_ko: string
    name_en: string | null
    manager_name: string
    manager_phone: string
    category: string | null
    division: string | null
    status: string
    payment_status: string
    created_at: string
    tournament_id: string
    tournaments: { name: string } | null | any
}

interface Tournament {
    id: string
    name: string
}

interface Props {
    initialTeams: Team[]
    tournaments?: Tournament[]
    hideTournamentFilter?: boolean
    title?: string
}

export default function TeamsManagementClient({ initialTeams, tournaments = [], hideTournamentFilter = false, title = '참가팀 관리' }: Props) {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedTour, setSelectedTour] = useState('')

    const filteredTeams = useMemo(() => {
        return initialTeams.filter(team => {
            const matchesSearch =
                (team.name_ko?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
                (team.manager_name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
                (team.name_en?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
                (team.manager_phone?.includes(searchQuery) || false);

            const matchesTour = selectedTour ? team.tournament_id === selectedTour : true

            return matchesSearch && matchesTour
        })
    }, [initialTeams, searchQuery, selectedTour])

    const handleDownload = () => {
        alert('엑셀 다운로드 기능은 준비 중입니다.')
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                <div className="flex gap-2">
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-green-700 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        엑셀 다운로드
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="팀명, 대표자 검색 (실시간)"
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[hsl(var(--primary))]"
                        />
                    </div>
                </div>
                {!hideTournamentFilter && (
                    <div className="w-full md:w-64">
                        <select
                            value={selectedTour}
                            onChange={(e) => setSelectedTour(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none"
                        >
                            <option value="">전체 대회</option>
                            {tournaments.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="flex justify-end text-sm text-gray-500 mb-2">
                총 {filteredTeams.length}개 팀
            </div>
            <TeamsTable teams={filteredTeams} />
        </div>
    )
}
