'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { getDashboardMetrics, DashboardMetrics } from '@/app/actions/dashboard'
import { RegionPieChart, TournamentRevenueChart, TournamentTeamChart } from './Charts'
import { Trophy, Users, AlertCircle, TrendingUp, Filter, Calendar, Info } from 'lucide-react'

// Define colors/styles for consistency
const StatCard = ({ title, value, subtext, icon: Icon, colorClass, bgClass }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${bgClass}`}>
                <Icon className={`w-6 h-6 ${colorClass}`} />
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <div className="flex items-baseline gap-1 mt-1">
                    <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
                    {subtext && <span className="text-sm font-normal text-gray-500">{subtext}</span>}
                </div>
            </div>
        </div>
    </div>
)

interface Props {
    initialData: DashboardMetrics
}

export default function DashboardClient({ initialData }: Props) {
    const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString())
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [data, setData] = useState<DashboardMetrics>(initialData)
    const [isLoading, setIsLoading] = useState(false)

    // Helper to fetch data
    const refreshData = async () => {
        setIsLoading(true)
        try {
            const newData = await getDashboardMetrics({
                year: filterYear,
                status: filterStatus === 'all' ? undefined : filterStatus
            })
            setData(newData)
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    // Effect: Refetch on filter change
    useEffect(() => {
        refreshData()
    }, [filterYear, filterStatus])

    // Memoize Top 10 for charts to solve overlap
    const top10Stats = useMemo(() => {
        // Sort by teamCount descending
        const sorted = [...data.tournamentStats].sort((a, b) => b.teamCount - a.teamCount)
        return sorted.slice(0, 10)
    }, [data.tournamentStats])

    return (
        <div className="space-y-6">
            {/* Header / Filter Row */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>

                <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 pl-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">필터</span>
                    </div>

                    <div className="h-4 w-px bg-gray-200"></div>

                    <select
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                        className="text-sm font-bold text-gray-700 bg-transparent border-none focus:ring-0 cursor-pointer"
                    >
                        <option value="2026">2026년</option>
                        <option value="2025">2025년</option>
                        <option value="2024">2024년</option>
                    </select>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="text-sm font-bold text-gray-700 bg-transparent border-none focus:ring-0 cursor-pointer"
                    >
                        <option value="all">전체 상태</option>
                        <option value="접수중">접수중</option>
                        <option value="마감">마감</option>
                        <option value="종료">종료</option>
                    </select>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="검색된 대회"
                    value={data.summary.totalTournaments}
                    icon={Trophy}
                    colorClass="text-blue-600"
                    bgClass="bg-blue-50"
                />
                <StatCard
                    title="총 참가팀"
                    value={data.summary.totalTeams}
                    icon={Users}
                    colorClass="text-green-600"
                    bgClass="bg-green-50"
                />
                <StatCard
                    title="접수 대기"
                    value={data.summary.pendingTeams}
                    icon={AlertCircle}
                    colorClass="text-orange-600"
                    bgClass="bg-orange-50"
                />
                <StatCard
                    title="예상 매출 (입금완료)"
                    value={(data.summary.totalRevenue / 10000).toLocaleString()}
                    subtext="만원"
                    icon={TrendingUp}
                    colorClass="text-indigo-600"
                    bgClass="bg-indigo-50"
                />
            </div>

            {/* Charts Section */}
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-opacity duration-200 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                {/* 1. Region Distribution */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-900">지역별 참가팀 분포</h3>
                        <p className="text-sm text-gray-500">가장 많이 참가하는 지역 TOP 10 (미지정 제외)</p>
                    </div>
                    <div className="h-64">
                        {/* Slice region stats too if needed, but pie chart handles it better usually. Let's slice to top 8 for clarity */}
                        <RegionPieChart data={data.regionStats.slice(0, 8)} />
                    </div>
                </div>

                {/* 2. Tournament Revenue */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-900">대회별 매출 TOP 10</h3>
                        <p className="text-sm text-gray-500">입금 완료 건 기준 (상위 10개 대회)</p>
                    </div>
                    <div className="h-64">
                        <TournamentRevenueChart data={top10Stats} />
                    </div>
                </div>

                {/* 3. Tournament Participation (Full Width) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-900">대회별 참가팀 수 TOP 10</h3>
                        <p className="text-sm text-gray-500">인기 대회 순위 (상위 10개)</p>
                    </div>
                    <div className="h-64">
                        <TournamentTeamChart data={top10Stats} />
                    </div>
                </div>
            </div>

            {/* Empty State / Hint if no revenue */}
            {data.summary.totalRevenue === 0 && !isLoading && (
                <div className="bg-blue-50 p-4 rounded-xl flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                        <p className="font-bold">매출 데이터가 보이지 않나요?</p>
                        <p className="mt-1">
                            대회 설정에서 <strong>참가비(Entry Fee)</strong>가 0원으로 설정되어 있거나, 아직 <strong>입금 완료(Paid)</strong> 처리된 팀이 없을 수 있습니다.
                            <br />대회 관리 페이지에서 정보를 업데이트해주세요.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
