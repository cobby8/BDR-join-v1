'use server'

import { createClient } from '@/utils/supabase/server'

export interface BracketSettings {
    groupCount: number
    advancePerGroup: number
}

// Helper: Generate Round Robin Matches
function generateRoundRobin(teamIds: string[]) {
    const matches: { home: string, away: string }[] = []
    const n = teamIds.length

    // Simple Round Robin for small groups (3-5 teams)
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            matches.push({ home: teamIds[i], away: teamIds[j] })
        }
    }
    return matches
}

export async function generateHybridBracket(tournamentId: string, settings: BracketSettings) {
    const supabase = await createClient()

    // 1. Fetch Approved Teams
    // Using 'approved' status. If you use 'paid', change logic here.
    const { data: teams, error: teamError } = await supabase
        .from('teams')
        .select('id, name')
        .eq('tournament_id', tournamentId)
        // .eq('status', 'approved') // Temporarily fetch ALL for testing if status logic isn't strict yet
        .order('created_at')

    if (teamError || !teams || teams.length === 0) {
        return { success: false, message: '참가팀을 불러올 수 없습니다.' }
    }

    if (teams.length < settings.groupCount) {
        return { success: false, message: `참가팀 수(${teams.length})가 조 개수(${settings.groupCount})보다 적습니다.` }
    }

    // 2. Create Bracket
    const { data: bracket, error: bracketError } = await supabase
        .from('brackets')
        .insert({
            tournament_id: tournamentId,
            type: 'hybrid',
            settings: settings,
            status: 'draft',
            title: '본선 대진표'
        })
        .select()
        .single()

    if (bracketError) throw bracketError

    // 3. Create Groups
    // Example: 4 groups -> ['A조', 'B조', 'C조', 'D조']
    const groupNames = Array.from({ length: settings.groupCount }, (_, i) =>
        String.fromCharCode(65 + i) + '조' // A, B, C...
    )

    const groupsToInsert = groupNames.map((name, index) => ({
        bracket_id: bracket.id,
        name,
        order_index: index
    }))

    const { data: createdGroups, error: groupError } = await supabase
        .from('groups')
        .insert(groupsToInsert)
        .select()

    if (groupError) throw groupError

    // 4. Distribute Teams (Random Shuffle)
    const shuffledTeams = [...teams].sort(() => Math.random() - 0.5)

    // Assign to groups: [GroupA: [], GroupB: [], ...]
    const groupDist: Record<string, string[]> = {}
    createdGroups.forEach(g => groupDist[g.id] = [])

    shuffledTeams.forEach((team, index) => {
        const groupIndex = index % settings.groupCount
        const groupId = createdGroups[groupIndex].id
        groupDist[groupId].push(team.id)
    })

    // 5. Generate Matches (Group Stage - Round Robin)
    const matchesToInsert: any[] = []

    for (const group of createdGroups) {
        const teamIds = groupDist[group.id]
        if (teamIds.length < 2) continue // Need at least 2 teams to match

        const matches = generateRoundRobin(teamIds)

        matches.forEach((m, idx) => {
            matchesToInsert.push({
                bracket_id: bracket.id,
                stage: 'group',
                group_id: group.id,
                round_number: 1, // Group stage usually just 1 round logic effectively
                match_number: idx + 1,
                home_team_id: m.home,
                away_team_id: m.away,
                status: 'scheduled'
            })
        })
    }

    // 6. Insert Matches
    if (matchesToInsert.length > 0) {
        const { error: matchError } = await supabase
            .from('matches')
            .insert(matchesToInsert)

        if (matchError) throw matchError
    }

    return { success: true, bracketId: bracket.id, message: '대진표가 생성되었습니다.' }
}
