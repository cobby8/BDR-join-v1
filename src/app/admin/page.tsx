import { supabase } from '@/lib/supabase'
import { Trophy, Users, AlertCircle } from 'lucide-react'

// Mock dashboard stats (replace with real queries later)
async function getStats() {
    const { count: tournamentCount } = await supabase.from('tournaments').select('*', { count: 'exact', head: true })
    const { count: teamCount } = await supabase.from('teams').select('*', { count: 'exact', head: true })
    const { count: pendingCount } = await supabase.from('teams').select('*', { count: 'exact', head: true }).eq('status', 'pending')

    return {
        tournaments: tournamentCount || 0,
        teams: teamCount || 0,
        pending: pendingCount || 0
    }
}

export default async function AdminDashboard() {
    const stats = await getStats()

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-xl">
                            <Trophy className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">진행 중인 대회</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.tournaments}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-50 rounded-xl">
                            <Users className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">총 참가팀</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.teams}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-50 rounded-xl">
                            <AlertCircle className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">접수 대기</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity or Placeholder */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-64 flex items-center justify-center text-gray-400">
                여기에 최근 활동 내역이나 차트가 들어갈 예정입니다.
            </div>
        </div>
    )
}
