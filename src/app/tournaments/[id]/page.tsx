import { supabase } from '@/lib/supabase'
import React from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Calendar, MapPin, Trophy, Users, Building2, ExternalLink, Clock, FileText } from 'lucide-react'
import JoinButton from './JoinButton'
import { format } from 'date-fns'

// Helper to format money (handles number or string)
const formatMoney = (value: string | number) => {
    if (!value) return ''
    const num = typeof value === 'string' ? parseInt(value.replace(/[^0-9]/g, ''), 10) : value
    return isNaN(num) ? value.toString() : num.toLocaleString()
}

// Helper to safely parse places
const getPlaceName = (p: any) => {
    if (typeof p === 'string') return p
    if (typeof p === 'object' && p?.name) return p.name
    return '장소 미정'
}

const formatDate = (dateString: string) => {
    if (!dateString) return ''
    return dateString.split('T')[0].replace(/-/g, '. ')
}

const formatRegDate = (s?: string, e?: string) => {
    if (!s && !e) return '일정 미정'
    const start = s ? formatDate(s) : '?'
    const end = e ? formatDate(e) : '?'
    return `${start} ~ ${end}`
}

export const dynamic = 'force-dynamic'

// Define types locally to avoid DB type conflicts
interface Tournament {
    id: string
    name: string
    status: string
    start_date: string
    end_date: string
    reg_start_at?: string
    reg_end_at?: string
    poster_url?: string
    entry_fee?: string | number
    bank_name?: string
    account_number?: string
    account_holder?: string
    organizer?: string
    host?: string
    sponsors?: string
    awards?: string
    details_url?: string
    game_time?: string
    game_ball?: string
    game_method?: string
    places?: any
    divs?: any
    max_teams?: number
    current_teams?: number
    gender?: string
    teams: { count: number; status?: string }[]
}

export default async function TournamentSyllabusPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const { id } = await params
    const sp = await searchParams
    const cloneTeamId = typeof sp.clone_team_id === 'string' ? sp.clone_team_id : undefined

    const { data: rawData } = await supabase
        .from('tournaments')
        .select('*, teams(status)')
        .eq('id', id)
        .single()

    const tourData = rawData as any

    const tour: Tournament | null = tourData ? {
        ...tourData,
        teams: [{
            count: tourData.teams?.filter((team: any) => {
                const s = team.status?.toLowerCase() || 'applied'
                return ['applied', 'confirmed', 'waiting', 'pending'].includes(s)
            }).length || 0
        }]
    } : null

    if (!tour) {
        notFound()
    }

    // Parse places
    let placesList: string[] = []
    try {
        const rawPlaces = typeof tour.places === 'string' ? JSON.parse(tour.places) : tour.places
        if (Array.isArray(rawPlaces)) {
            placesList = rawPlaces.map(getPlaceName)
        }
    } catch (e) {
        placesList = ['장소 정보 없음']
    }

    // Status Badge Color
    const getStatusColor = (status: string) => {
        switch (status) {
            case '접수중': return 'bg-blue-600 text-white'
            case '마감임박': return 'bg-red-500 text-white animate-pulse'
            case '마감': return 'bg-gray-800 text-gray-300'
            case '준비중': return 'bg-yellow-500 text-white'
            case '대기접수': return 'bg-green-600 text-white'
            default: return 'bg-gray-200 text-gray-600'
        }
    }

    // Calculate total team stats
    const currentTeamsCount = (tour as any).teams?.[0]?.count || 0
    let maxTeamsCount = tour.max_teams || 0

    // Fallback calculation for maxTeams if db value is 0 (backward compatibility)
    if (maxTeamsCount === 0 && tour.divs) {
        Object.values(tour.divs).forEach((divs: any) => {
            if (Array.isArray(divs)) {
                divs.forEach((d: any) => {
                    if (typeof d === 'object') {
                        maxTeamsCount += (d.cap || d.max_teams || 0)
                    }
                })
            }
        })
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            {/* 1. Hero / Header Section */}
            <div className="relative bg-white shadow-sm overflow-hidden rounded-b-3xl">
                {/* Background Blur */}
                <div className="absolute inset-0 z-0">
                    {tour.poster_url ? (
                        <Image
                            src={tour.poster_url}
                            alt="Background"
                            fill
                            className="object-cover opacity-10 blur-xl scale-110"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/90" />
                </div>

                <div className="relative z-10 max-w-4xl mx-auto px-4 pt-8 pb-10">
                    <Link href="/" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors font-medium text-sm">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        목록으로
                    </Link>

                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Basic Info */}
                        <div className="flex-1 space-y-5 w-full">
                            <div className="flex flex-wrap gap-2 items-center">
                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(tour.status)}`}>
                                    {tour.status}
                                </span>
                                {tour.gender && (
                                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                        {tour.gender === 'male' ? '남성부' : tour.gender === 'female' ? '여성부' : '혼성'}
                                    </span>
                                )}
                                {/* Dynamic Category & Division Badges */}
                                {tour.divs && Object.entries(tour.divs).map(([catName, divs]: [string, any]) => (
                                    <React.Fragment key={catName}>
                                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-gray-50 text-gray-600 border border-gray-200">
                                            {catName}
                                        </span>
                                        {Array.isArray(divs) && divs.map((d: any, idx: number) => (
                                            <span key={idx} className="px-3 py-1 text-xs font-bold rounded-full bg-white text-gray-500 border border-gray-200">
                                                {typeof d === 'string' ? d : d.name}
                                            </span>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </div>

                            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 break-keep leading-tight">
                                {tour.name}
                            </h1>

                            <div className="space-y-6 pt-2">
                                {/* Place */}
                                <div className="flex items-start gap-4">
                                    <div className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5 text-gray-400">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-400 mb-1">대회장소</p>
                                        <p className="text-base font-medium text-gray-700 break-keep">
                                            {placesList.join(', ')}
                                        </p>
                                    </div>
                                </div>

                                {/* Game Schedule (New) */}
                                <div className="flex items-start gap-4">
                                    <div className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5 text-gray-400">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-400 mb-1">대회일정</p>
                                        <p className="text-base font-medium text-gray-700">
                                            {formatDate(tour.start_date)} {tour.end_date && tour.end_date !== tour.start_date && `~ ${formatDate(tour.end_date)}`}
                                        </p>
                                    </div>
                                </div>

                                {/* Registration Period */}
                                <div className="flex items-start gap-4">
                                    <div className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5 text-gray-400">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-400 mb-1">접수기간</p>
                                        <p className="text-base font-medium text-gray-700">
                                            {formatRegDate(tour.reg_start_at, tour.reg_end_at)}
                                        </p>
                                    </div>
                                </div>

                                {/* Recruitment Status (Cleaned up) */}
                                <div className="flex items-start gap-4">
                                    <div className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5 text-gray-400">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-400 mb-2">모집현황</p>

                                        {/* Status Bar */}
                                        <div className="flex items-center gap-4 mb-2">
                                            <div className="text-base font-medium">
                                                <span className="text-blue-600 font-bold">
                                                    {currentTeamsCount > 0 ? currentTeamsCount : (tour.current_teams || 0)}팀
                                                </span>
                                                <span className="text-gray-400 mx-1">/</span>
                                                <span className="text-gray-600">{maxTeamsCount > 0 ? maxTeamsCount : (tour.max_teams || 0)}팀</span>
                                            </div>
                                            <div className="flex-1 max-w-[120px] h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full"
                                                    style={{ width: `${Math.min(((currentTeamsCount || tour.current_teams || 0) / ((maxTeamsCount || tour.max_teams || 1))) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Poster Image (Float Right, Match Height) */}
                        {tour.poster_url && (
                            <div className="w-full md:w-[320px] shrink-0 rounded-2xl overflow-hidden shadow-lg border border-gray-100 bg-white aspect-[3/4] md:aspect-auto md:h-auto relative self-stretch">
                                <Image
                                    src={tour.poster_url}
                                    alt={tour.name}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. Content Body */}
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
                {/* Detailed Info (New Structure) */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <FileText className="w-6 h-6 text-gray-500" />
                        <h2 className="text-xl font-bold text-gray-900">세부 정보</h2>
                    </div>

                    <div className="bg-gray-50/50 rounded-xl p-6 border border-gray-100 space-y-6">
                        {/* Structured Info List */}
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

                        {/* Free Text Divider (if both exist) */}
                        {tour.awards && (tour.game_method || tour.game_time || tour.game_ball) && (
                            <div className="border-t border-gray-200 my-4"></div>
                        )}

                        {/* Free Text (Awards/Syllabus) */}
                        {tour.awards && (
                            <pre className="whitespace-pre-wrap text-gray-900 leading-relaxed font-sans text-sm md:text-base">
                                {tour.awards}
                            </pre>
                        )}
                    </div>
                </section>

                {/* External Link (Details) */}
                {tour.details_url && (
                    <div className="flex justify-end">
                        <a
                            href={tour.details_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg shadow-gray-200"
                        >
                            <span>상세 요강 보기 (외부 링크)</span>
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                )}

                {/* Sponsors */}
                {tour.sponsors && (
                    <div className="text-center py-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Sponsored By</p>
                        <p className="text-lg font-bold text-gray-600">{tour.sponsors}</p>
                    </div>
                )}
            </div>

            {/* 3. Sticky Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:p-6 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                    <div className="hidden md:block">
                        <p className="text-xs font-bold text-gray-500">참가비</p>
                        <p className="font-bold text-lg text-gray-900">{tour.entry_fee ? `${formatMoney(tour.entry_fee)}원` : '별도 문의'}</p>
                    </div>

                    <JoinButton
                        id={id}
                        status={tour.status}
                        cloneTeamId={cloneTeamId}
                    />
                </div>
            </div>
        </div>
    )
}
