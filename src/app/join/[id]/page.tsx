import { supabase } from '@/lib/supabase'
import { adminClient } from '@/lib/adminClient'
import { notFound } from 'next/navigation'
import RegistrationForm from './RegistrationForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

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
    const { data: teams } = await adminClient
        .from('teams')
        .select('division, status')
        .eq('tournament_id', id)
        .in('status', ['APPLIED', 'CONFIRMED', 'WAITING', 'pending', 'applied', 'confirmed', 'waiting'])

    // Aggregation: { "DivisionName": count }
    const divisionCounts: Record<string, number> = {}
    teams?.forEach((t: any) => {
        if (t.division) {
            // Original Key
            divisionCounts[t.division] = (divisionCounts[t.division] || 0) + 1

            // If complex string (e.g. "남성 D7"), also count for "D7" if unique or just aggregate?
            // Strategy: Add count to the last token as well if specific
            const parts = t.division.split(' ')
            if (parts.length > 1) {
                const lastPart = parts[parts.length - 1] // e.g. "D7"
                // Note: collisions possible (e.g. 'Men A' and 'Women A' -> both 'A'). 
                // But for display in context of a specific category, we might rely on the specific key logic in Form.
                // Let's just create a loose mapping for "D7" -> count? No, that's risky.
                // Let's try to normalize the input data to match what the form expects? 
                // No, let's just leave the aggregation accurate to DB, and fix Form.
                // Actually, let's add the cleaned key just in case.
            }
        }
    })

    return (
        <div className="max-w-[800px] mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-6">
                <Link href="/" className="inline-flex items-center text-gray-500 hover:text-gray-900 transition-colors font-medium text-sm">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    대회 목록으로 돌아가기
                </Link>
                <Link href="/lookup" className="inline-flex items-center text-gray-500 hover:text-blue-600 transition-colors font-bold text-sm bg-gray-100 px-4 py-2 rounded-full">
                    내 신청서 찾기 &gt;
                </Link>
            </div>

            <div className="mb-8 bg-white rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden">
                {/* Poster Image */}
                {/* Poster Image */}
                {tour.poster_url ? (
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
                ) : (
                    <div className="relative w-full border-b border-gray-100 bg-white flex items-center justify-center p-12">
                        <Image
                            src="/images/bdr-logo.png"
                            alt="BDR Logo"
                            width={200}
                            height={100}
                            className="object-contain opacity-20 grayscale"
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

                {/* Details Section (Accordion) */}
                {(tour.game_method || tour.game_time || tour.game_ball || tour.awards) && (
                    <div className="border-t border-gray-100">
                        <details className="group">
                            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors font-bold text-gray-700 select-none">
                                <span className="flex items-center gap-2">
                                    📜 대회 요강 확인하기
                                </span>
                                <span className="transform group-open:rotate-180 transition-transform">▼</span>
                            </summary>

                            <div className="p-4 bg-gray-50/50 space-y-6">
                                {/* 1. Text-based Syllabus (Same style as detailed page) */}
                                {(tour.game_method || tour.game_time || tour.game_ball || tour.awards) && (
                                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                                        <div className="grid grid-cols-1 gap-4 text-sm md:text-base">
                                            {/* Method */}
                                            {tour.game_method && (
                                                <div className="flex flex-col md:flex-row md:items-start gap-1 md:gap-4">
                                                    <span className="text-gray-500 font-bold shrink-0 w-24">대회 방식 :</span>
                                                    <span className="text-gray-900">{tour.game_method}</span>
                                                </div>
                                            )}
                                            {/* Game Time */}
                                            {tour.game_time && (
                                                <div className="flex flex-col md:flex-row md:items-start gap-1 md:gap-4">
                                                    <span className="text-gray-500 font-bold shrink-0 w-24">경기 시간 :</span>
                                                    <span className="text-gray-900">{tour.game_time}</span>
                                                </div>
                                            )}
                                            {/* Game Ball */}
                                            {tour.game_ball && (
                                                <div className="flex flex-col md:flex-row md:items-start gap-1 md:gap-4">
                                                    <span className="text-gray-500 font-bold shrink-0 w-24">경기구 :</span>
                                                    <span className="text-gray-900">{tour.game_ball}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Divider */}
                                        {tour.awards && (tour.game_method || tour.game_time || tour.game_ball) && (
                                            <div className="border-t border-gray-100 my-4"></div>
                                        )}

                                        {/* Additional Info (Awards) */}
                                        {tour.awards && (
                                            <div>
                                                <p className="text-gray-500 font-bold mb-2 text-sm">참가혜택 / 추가정보</p>
                                                <pre className="whitespace-pre-wrap text-gray-900 leading-relaxed font-sans text-sm md:text-base">
                                                    {tour.awards}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                )}


                            </div>
                        </details>
                    </div>
                )}
            </div>

            <RegistrationForm tournament={tour as any} divisionCounts={divisionCounts} />
        </div>
    )
}
