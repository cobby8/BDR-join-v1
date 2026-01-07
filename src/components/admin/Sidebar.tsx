'use client'

import Link from 'next/link'
import { LayoutDashboard, Users, Trophy, Settings, RefreshCw } from 'lucide-react'
// LogoutButton is in src/app/admin/layout/LogoutButton (if it was separate) BUT
// looking at layout.tsx, it imported from './LogoutButton'.
// If Sidebar is in components/admin/Sidebar, and LogoutButton is in app/admin, we can't import it easily if it's not a shared component.
// BETTER: pass it as children. Sidebar already accepts children.
// So we just remove the import in Sidebar and rely on children.
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { syncGoogleSheet } from '@/app/actions/admin'

export default function Sidebar({ children }: { children?: React.ReactNode }) {
    const pathname = usePathname()
    const [isSyncing, setIsSyncing] = useState(false)

    const handleSync = async () => {
        if (!confirm('구글 시트의 데이터로 DB를 동기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) return

        setIsSyncing(true)
        try {
            const result = await syncGoogleSheet()
            if (result.success) {
                alert('동기화가 완료되었습니다.')
                window.location.reload()
            } else {
                alert('동기화 실패: ' + result.error)
            }
        } catch (e) {
            alert('오류가 발생했습니다.')
        } finally {
            setIsSyncing(false)
        }
    }

    const isActive = (path: string) => pathname === path

    return (
        <aside className="w-full md:w-64 bg-white border-r border-gray-200 p-4 flex flex-col">
            <div className="mb-8 px-2 flex items-center gap-2 text-[hsl(var(--primary))]">
                <Trophy className="w-6 h-6" />
                <span className="font-bold text-xl">BDR Admin</span>
            </div>

            <nav className="flex-1 space-y-1">
                <Link
                    href="/admin"
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive('/admin') ? 'bg-blue-50 text-[hsl(var(--primary))]' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                >
                    <LayoutDashboard className={`w-5 h-5 ${isActive('/admin') ? 'text-[hsl(var(--primary))]' : 'text-gray-400'}`} />
                    대시보드
                </Link>
                <Link
                    href="/admin/tournaments"
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive('/admin/tournaments') || pathname.startsWith('/admin/tournaments') ? 'bg-blue-50 text-[hsl(var(--primary))]' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                >
                    <Trophy className={`w-5 h-5 ${isActive('/admin/tournaments') || pathname.startsWith('/admin/tournaments') ? 'text-[hsl(var(--primary))]' : 'text-gray-400'}`} />
                    대회 관리
                </Link>
                <Link
                    href="/admin/teams"
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive('/admin/teams') || pathname.startsWith('/admin/teams') ? 'bg-blue-50 text-[hsl(var(--primary))]' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                >
                    <Users className={`w-5 h-5 ${isActive('/admin/teams') || pathname.startsWith('/admin/teams') ? 'text-[hsl(var(--primary))]' : 'text-gray-400'}`} />
                    참가팀 관리
                </Link>
                <Link
                    href="/admin/settings"
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive('/admin/settings') ? 'bg-blue-50 text-[hsl(var(--primary))]' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                >
                    <Settings className={`w-5 h-5 ${isActive('/admin/settings') ? 'text-[hsl(var(--primary))]' : 'text-gray-400'}`} />
                    설정
                </Link>
            </nav>

            <div className="pt-4 border-t border-gray-100 space-y-2">
                <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-green-700 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? '동기화 중...' : '구글 시트 동기화'}
                </button>
                {children}
            </div>
        </aside>
    )
}
