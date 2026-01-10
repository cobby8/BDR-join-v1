import Link from 'next/link'
import Image from 'next/image'
import { Copy, Trophy } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import TournamentCard from '@/components/TournamentCard'

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
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('*, teams(count)')
    .in('status', ['접수중', '대기접수', '마감임박'])
    .order('start_date', { ascending: true }) // Upcoming first

  const sp = await searchParams
  const cloneFrom = sp.clone_from

  return (
    <div className="max-w-screen-lg mx-auto py-10 px-6">
      <header className="mb-10 flex justify-between items-end border-b border-gray-100 pb-6">
        <div className="flex items-center gap-3">
          <Image
            src="/images/bdr-logo.png"
            alt="BDR Logo"
            width={135}
            height={68}
            className="object-contain"
          />
          <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">
            참가신청서
          </h1>
        </div>
        <Link href="/lookup" className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors bg-gray-50 px-4 py-2 rounded-full">
          내 신청서 찾기 &gt;
        </Link>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {((tournaments as unknown as any[]) || []).map((tour: any) => (
          <TournamentCard key={tour.id} tour={tour} cloneFrom={cloneFrom} />
        ))}

        {(!tournaments || tournaments.length === 0) && (
          <div className="col-span-full text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 font-medium text-lg">현재 접수 중인 대회가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  )
}
