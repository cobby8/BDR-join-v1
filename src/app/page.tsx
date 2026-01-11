import Link from 'next/link'
import Image from 'next/image'
import { Copy } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import TournamentList from '@/components/TournamentList'

// Landing Page: Shows active tournaments
export const dynamic = 'force-dynamic'

interface Tournament {
  id: string
  name: string
  status: string // '접수중', '마감', '종료', '준비중'
  start_date: string
  reg_start_at?: string
  reg_end_at?: string
  divs: any
  div_caps: any
  places: any
  teams: { count: number }[]
}

export default async function LandingPage({ searchParams }: { searchParams: Promise<{ clone_from?: string }> }) {
  const { data: tournamentsData } = await supabase
    .from('tournaments')
    .select('*, teams(status)') // Fetch status to filter in memory
    .in('status', ['접수중', '대기접수', '마감임박'])
    .order('start_date', { ascending: true })

  const tournaments = tournamentsData?.map((t: any) => ({
    ...t,
    teams: [{
      count: t.teams.filter((team: any) => {
        const s = team.status?.toLowerCase() || 'applied'
        return ['applied', 'confirmed', 'waiting', 'pending'].includes(s)
      }).length
    }]
  }))

  const sp = await searchParams
  const cloneFrom = sp.clone_from

  return (
    <div className="max-w-screen-lg mx-auto py-6 px-4 md:px-6">
      <header className="mb-4 flex justify-between items-end border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <Image
            src="/images/bdr-logo.png"
            alt="BDR Logo"
            width={100}
            height={50}
            className="object-contain"
          />
          <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">
            대회목록
          </h1>
        </div>
      </header>

      {cloneFrom && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl mb-8 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <Copy className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-bold text-blue-800 text-sm">기존 신청 정보로 접수하기</h3>
            <p className="text-blue-600/80 text-xs mt-1">
              참가할 대회를 선택하면 기존 팀/선수 정보가 자동으로 입력됩니다.
            </p>
          </div>
        </div>
      )}

      <TournamentList tournaments={tournaments || []} cloneFrom={cloneFrom} />
    </div>
  )
}
