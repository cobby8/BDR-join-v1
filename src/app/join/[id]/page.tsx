import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import RegistrationForm from './RegistrationForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default async function JoinPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { data: tour } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', id)
        .single()

    if (!tour) {
        notFound()
    }

    // Fetch team counts separately per division to determine waiting status
    // Status 'APPLIED' and 'CONFIRMED' count towards capacity. 'WAITING' and 'CANCELED' do not.
    // Assuming 'status' column is ready. If legacy 'pending' exists, we treat it as APPLIED.
    const { data: teams } = await supabase
        .from('teams')
        .select('division, status')
        .eq('tournament_id', id)
        .in('status', ['APPLIED', 'CONFIRMED', 'pending']) // Include 'pending' for backward compatibility

    // Aggregation: { "DivisionName": count }
    const divisionCounts: Record<string, number> = {}
    teams?.forEach((t: any) => {
        if (t.division) {
            divisionCounts[t.division] = (divisionCounts[t.division] || 0) + 1
        }
    })

    return (
        <div className="max-w-[800px] mx-auto py-8 px-4">
            <Link href="/" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors font-medium text-sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                대회 목록으로 돌아가기
            </Link>

            <div className="mb-8 bg-white rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden">
                {/* Poster Image */}
                {tour.poster_url && (
                    <div className="relative w-full border-b border-gray-100">
                        <Image
                            src={tour.poster_url}
                            alt={tour.name}
                            width={0}
                            height={0}
                            sizes="100vw"
                            className="w-full h-auto"
                            priority
                        />
                    </div>
                )}

                <div className="p-6 md:p-8 relative z-10">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50/50 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
                    <div className="flex flex-wrap gap-2 items-center mb-3 relative z-10">
                        <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${tour.status === '접수중' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                            }`}>
                            {tour.status}
                        </span>
                        {tour.entry_fee && <span className="text-gray-500 text-xs font-medium">참가비: {tour.entry_fee}</span>}
                    </div>

                    <h1 className="text-3xl font-extrabold text-gray-900 mb-3 break-keep leading-tight relative z-10">{tour.name}</h1>
                    <div className="flex flex-wrap gap-4 text-gray-500 text-sm relative z-10">
                        <span>
                            📅 {tour.start_date ? new Date(tour.start_date).toLocaleDateString() : '일정 미정'} 시작
                        </span>
                    </div>
                </div>

                {/* Details Image (Tournament Guidelines) */}
                {tour.details_url && (
                    <div className="border-t border-gray-100">
                        <details className="group">
                            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors font-bold text-gray-700 select-none">
                                <span>📜 대회 요강 확인하기</span>
                                <span className="transform group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="p-4 bg-gray-50/50 flex justify-center">
                                <div className="relative w-full max-w-2xl">
                                    <Image
                                        src={tour.details_url}
                                        alt="대회 요강"
                                        width={800}
                                        height={2000} // Approximate height, responsive via CSS
                                        className="w-full h-auto rounded-xl shadow-sm"
                                        style={{ width: '100%', height: 'auto' }}
                                    />
                                </div>
                            </div>
                        </details>
                    </div>
                )}
            </div>

            <RegistrationForm tournament={tour as any} divisionCounts={divisionCounts} />
        </div>
    )
}
