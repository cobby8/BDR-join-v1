'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Trophy, CalendarClock, AlertCircle } from 'lucide-react'

interface Props {
    tournamentId: string
    refreshTrigger?: number // To trigger refetch when bracket is regenerated
}

interface Match {
    id: string
    stage: 'group' | 'knockout'
    group_id: string
    round_number: number
    match_number: number
    home_team: { name: string, id: string } | null
    away_team: { name: string, id: string } | null
    home_score: number
    away_score: number
    status: string
}

interface Group {
    id: string
    name: string
    matches: Match[]
}

export default function BracketViewer({ tournamentId, refreshTrigger }: Props) {
    const [groups, setGroups] = useState<Group[]>([])
    const [knockoutMatches, setKnockoutMatches] = useState<Match[]>([])
    const [loading, setLoading] = useState(true)
    const [bracketId, setBracketId] = useState<string | null>(null)

    // Singleton used directly

    useEffect(() => {
        const fetchBracket = async () => {
            setLoading(true)
            // 1. Get Active Bracket
            const { data: brackets } = await supabase
                .from('brackets')
                .select('id')
                .eq('tournament_id', tournamentId)
                .order('created_at', { ascending: false })
                .limit(1)

            if (!brackets || brackets.length === 0) {
                setLoading(false)
                return
            }

            const activeBracketId = brackets[0].id
            setBracketId(activeBracketId)

            // 2. Get Groups
            const { data: groupsData } = await supabase
                .from('groups')
                .select('*')
                .eq('bracket_id', activeBracketId)
                .order('order_index')

            // 3. Get Matches
            const { data: matchesData } = await supabase
                .from('matches')
                .select(`
                    *,
                    home_team:home_team_id(id, name),
                    away_team:away_team_id(id, name)
                `)
                .eq('bracket_id', activeBracketId)
                .order('match_number')

            if (matchesData) {
                // Organize matches by Group
                const groupMap: Record<string, Group> = {}
                groupsData?.forEach((g: any) => {
                    groupMap[g.id] = { ...g, matches: [] }
                })

                const knockouts: Match[] = []

                matchesData.forEach((m: any) => {
                    if (m.stage === 'group' && m.group_id && groupMap[m.group_id]) {
                        groupMap[m.group_id].matches.push(m)
                    } else if (m.stage === 'knockout') {
                        knockouts.push(m)
                    }
                })

                setGroups(Object.values(groupMap))
                setKnockoutMatches(knockouts)
            }
            setLoading(false)
        }

        fetchBracket()
    }, [tournamentId, refreshTrigger])

    if (loading) return <div className="p-8 text-center text-gray-400">Loading bracket...</div>
    if (!bracketId) return <div className="p-8 text-center text-gray-400">생성된 대진표가 없습니다.</div>

    return (
        <div className="space-y-8 mt-8">
            {/* Group Stage */}
            {groups.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <CalendarClock className="w-5 h-5" />
                        조별 예선 (Group Stage)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groups.map(group => (
                            <div key={group.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-bold text-gray-800">
                                    {group.name}
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {group.matches.map((match) => (
                                        <div key={match.id} className="px-4 py-3 flex justify-between items-center text-sm">
                                            <div className="w-1/3 text-right truncate font-medium">
                                                {match.home_team?.name || 'TBD'}
                                            </div>
                                            <div className="px-3 text-center text-gray-400 font-bold">VS</div>
                                            <div className="w-1/3 text-left truncate font-medium">
                                                {match.away_team?.name || 'TBD'}
                                            </div>
                                        </div>
                                    ))}
                                    {group.matches.length === 0 && (
                                        <div className="p-4 text-center text-gray-400 text-xs">경기 없음</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Knockout Stage Placeholder */}
            <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    본선 토너먼트 (Knockout Stage)
                </h3>
                {knockoutMatches.length > 0 ? (
                    <div className="p-4 bg-white border border-gray-200 rounded-xl">
                        {/* Render Tree Here */}
                        {knockoutMatches.map(m => (
                            <div key={m.id}>{m.round_number}강 매치</div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 bg-gray-50 border border-gray-200 rounded-xl text-center text-gray-500 flex flex-col items-center">
                        <AlertCircle className="w-8 h-8 text-gray-300 mb-2" />
                        <p>조별 예선 진행 후 본선 대진표가 생성됩니다.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
