import Link from 'next/link'
import { Calendar, ChevronRight, Trophy, Copy, MapPin, Clock, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

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
    .order('created_at', { ascending: false })

  const sp = await searchParams
  const cloneFrom = sp.clone_from

  // Helper to format date
  const formatDate = (d: string) => {
    if (!d) return '미정'
    const date = new Date(d)
    return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}`
  }
  const formatRegDate = (s?: string, e?: string) => {
    if (!s && !e) return '일정 미정'
    const start = s ? formatDate(s) : '?'
    const end = e ? formatDate(e) : '?'
    return `${start} ~ ${end}`
  }

  return (
    <div className="max-w-screen-lg mx-auto py-10 px-6">
      <header className="mb-10 flex justify-between items-end border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">
            BDR 참가신청서
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
        {((tournaments as unknown as any[]) || []).map((tour: any) => {
          const currentTeams = tour.teams?.[0]?.count || 0
          const maxTeams = Object.values(tour.div_caps || {}).reduce((a: any, b: any) => (Number(a) || 0) + (Number(b) || 0), 0)

          let placeName = '장소 미정'
          try {
            const places = typeof tour.places === 'string' ? JSON.parse(tour.places) : tour.places
            if (Array.isArray(places) && places.length > 0) {
              const p = places[0]
              if (typeof p === 'string') placeName = p
              else if (typeof p === 'object' && p?.name) placeName = p.name
              else if (typeof p === 'object' && p?.address) placeName = p.address
            }
          } catch (e) { }

          const categorySummary = Object.entries(tour.divs || {}).map(([cat, divs]) => {
            const divArray = Array.isArray(divs) ? divs : [];
            const displayDivs = divArray.join(', ');
            return `${cat} ${displayDivs}`.trim();
          }).join(' / ') || '전체 종별'

          return (
            <Link
              key={tour.id}
              href={`/join/${tour.id}${cloneFrom ? `?clone_team_id=${cloneFrom}` : ''}`}
              className="group flex flex-col bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-blue-400 hover:-translate-y-1 transition-all overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-6 pb-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold shrink-0 ${tour.status === '마감' ? 'bg-gray-100 text-gray-500' : 'bg-blue-600 text-white'
                        }`}>
                        {tour.status}
                      </span>
                      <span className="text-base text-gray-700 font-bold truncate">
                        {categorySummary}
                      </span>
                    </div>
                  </div>
                  {/* Date at top-right */}
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(tour.start_date)}
                    </div>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-gray-900 leading-snug word-keep-all group-hover:text-blue-700 transition-colors mb-4">
                  {tour.name}
                </h2>

                {/* Info Grid */}
                <div className="space-y-2.5 text-sm text-gray-600 bg-gray-50 p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 w-20 shrink-0 text-gray-400 text-xs font-bold">
                      <MapPin className="w-3.5 h-3.5" />
                      대회장소
                    </div>
                    <div className="font-medium truncate flex-1">{placeName}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 w-20 shrink-0 text-gray-400 text-xs font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      접수기간
                    </div>
                    <div className="font-medium truncate flex-1">{formatRegDate(tour.reg_start_at, tour.reg_end_at)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 w-20 shrink-0 text-gray-400 text-xs font-bold">
                      <Users className="w-3.5 h-3.5" />
                      모집현황
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <span className="font-bold text-blue-600">{currentTeams}팀</span>
                      <span className="text-gray-300 text-xs">/</span>
                      <span className="text-gray-500">{Number(maxTeams) ? `${maxTeams}팀` : '제한없음'}</span>

                      {Number(maxTeams) > 0 && (
                        <div className="flex-1 h-2 bg-gray-200 rounded-full ml-auto max-w-[80px] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${currentTeams >= Number(maxTeams) ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min((currentTeams / Number(maxTeams)) * 100, 100)}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}

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
