'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Trophy, MapPin, Clock, Users, FileText } from 'lucide-react'

interface TournamentCardProps {
    tour: any
    cloneFrom?: string
}

export default function TournamentCard({ tour, cloneFrom }: TournamentCardProps) {
    const currentTeams = tour.teams?.[0]?.count || 0

    // Calculate maxTeams from divs if available
    let maxTeams = 0
    let divsObj = tour.divs
    if (typeof divsObj === 'string') {
        try { divsObj = JSON.parse(divsObj) } catch (e) { }
    }

    if (divsObj) {
        Object.values(divsObj).forEach((divs: any) => {
            if (Array.isArray(divs)) {
                divs.forEach((d: any) => {
                    const cap = typeof d === 'object' ? (d.cap || d.max_teams || 0) : 0
                    maxTeams += Number(cap)
                })
            }
        })
    } else {
        // Fallback to div_caps if divs is missing
        const caps = typeof tour.div_caps === 'string' ? JSON.parse(tour.div_caps) : (tour.div_caps || {})
        maxTeams = Object.values(caps).reduce((a: any, b: any) => (Number(a) || 0) + (Number(b) || 0), 0)
    }

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
        const displayDivs = divArray.map((d: any) => typeof d === 'string' ? d : d.name).join(', ');
        return `${cat} ${displayDivs}`.trim();
    }).join(' / ') || '전체 종별'

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
        <Link
            href={cloneFrom ? `/join/${tour.id}?clone_team_id=${cloneFrom}` : `/tournaments/${tour.id}`}
            className="group flex flex-col bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-blue-400 hover:-translate-y-1 transition-all overflow-hidden"
        >
            {/* Image Section */}
            <div className="relative w-full aspect-[2/1] bg-gray-100 overflow-hidden border-b border-gray-100">
                {tour.poster_url ? (
                    <Image
                        src={tour.poster_url}
                        alt={tour.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="relative w-full h-full bg-white flex items-center justify-center p-12">
                        <Image
                            src="/images/bdr-logo.png"
                            alt="BDR Logo"
                            fill
                            className="object-contain opacity-20 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                        />
                    </div>
                )}
            </div>

            {/* Card Header */}
            <div className="p-6 pb-4">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold shrink-0 ${tour.status === '마감' ? 'bg-gray-100 text-gray-500' : 'bg-blue-600 text-white'
                                }`}>
                                {tour.status}
                            </span>
                            {Number(maxTeams) > 0 && (currentTeams / Number(maxTeams)) >= 0.9 && tour.status !== '마감' && currentTeams < Number(maxTeams) && (
                                <span className="inline-flex px-3 py-1.5 rounded-full text-xs font-bold bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/30">
                                    마감임박
                                </span>
                            )}

                            {/* Tournament Guidelines Badge (Client-side interactive) */}
                            {tour.details_url && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        window.open(tour.details_url, '_blank')
                                    }}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-gray-900 text-white hover:bg-gray-700 transition-colors shrink-0 z-10 relative"
                                >
                                    <FileText className="w-3 h-3" />
                                    대회요강
                                </button>
                            )}

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
}
