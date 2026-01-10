'use client'

import { useState, useMemo } from 'react'
import { Download, Search } from 'lucide-react'
import TeamsTable from './TeamsTable'
import TeamDetailModal from '@/components/admin/TeamDetailModal'
import ConfirmModal from '@/components/common/ConfirmModal'

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
    province?: string
    city?: string
    players?: { count: number }[]
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
    enableInlineStatusEditing?: boolean
}

export default function TeamsManagementClient({
    initialTeams,
    tournaments = [],
    hideTournamentFilter = false,
    title = '참가팀 관리',
    enableInlineStatusEditing = false
}: Props) {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedTour, setSelectedTour] = useState('')
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
    const [selectedRegion, setSelectedRegion] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<'ALL' | 'WAITING'>('ALL')
    const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string }>({
        isOpen: false,
        title: '',
        message: ''
    })

    // Extract unique regions
    const regions = useMemo(() => {
        const unique = Array.from(new Set(initialTeams.map(t => t.province).filter(Boolean)))
        return unique.sort() as string[]
    }, [initialTeams])

    const filteredTeams = useMemo(() => {
        const result = initialTeams.filter(team => {
            const matchesSearch =
                (team.name_ko?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
                (team.manager_name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
                (team.name_en?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
                (team.manager_phone?.includes(searchQuery) || false);

            const matchesTour = selectedTour ? team.tournament_id === selectedTour : true
            const matchesRegion = selectedRegion ? team.province === selectedRegion : true
            const matchesTab = activeTab === 'WAITING' ? team.status === 'WAITING' : true

            return matchesSearch && matchesTour && matchesRegion && matchesTab
        })

        // Default Sort: Team Name Ascending
        return result.sort((a, b) => (a.name_ko || '').localeCompare(b.name_ko || ''))
    }, [initialTeams, searchQuery, selectedTour, selectedRegion, activeTab])

    const handleDownload = () => {
        setAlertState({ isOpen: true, title: '알림', message: '엑셀 다운로드 기능은 준비 중입니다.' })
    }

    const handleTeamClick = (teamId: string) => {
        setSelectedTeamId(teamId)
        setIsModalOpen(true)
    }

    const selectedTeamData = useMemo(() => {
        return initialTeams.find(t => t.id === selectedTeamId)
    }, [initialTeams, selectedTeamId])

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

            {/* Status Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit">
                {['ALL', 'WAITING'].map((tab) => {
                    const count = tab === 'WAITING'
                        ? initialTeams.filter(t => t.status === 'WAITING').length
                        : initialTeams.length
                    const label = tab === 'ALL' ? '전체' : '대기팀'

                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            {label} <span className="ml-1 opacity-60 text-xs">{count}</span>
                        </button>
                    )
                })}
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

                {/* Region Filter */}
                <div className="w-full md:w-32">
                    <select
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[hsl(var(--primary))]"
                    >
                        <option value="">전체 지역</option>
                        {regions.map(r => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
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

            <div className="flex justify-end text-sm text-gray-500 mb-2">
                총 {filteredTeams.length}개 팀
            </div>

            <TeamsTable
                teams={filteredTeams}
                onTeamClick={handleTeamClick}
                enableInlineStatusEditing={enableInlineStatusEditing}
                teamCounts={initialTeams.reduce((acc, team) => {
                    const key = team.name_ko + (team.manager_phone || '') // Unique key by name+phone to differentiate different teams with same name? Or just name? User said "Participating Tournaments Count". Same name usually means same team. 
                    // Let's use name_ko for now as primary grouper, or better: name_ko + manager_name? 
                    // Actually, simpler: Just count by name_ko.
                    acc[team.name_ko] = (acc[team.name_ko] || 0) + 1
                    return acc
                }, {} as Record<string, number>)}
            />

            <TeamDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                teamId={selectedTeamId}
                teamName={selectedTeamData?.name_ko || ''}
                teamData={selectedTeamData}
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
