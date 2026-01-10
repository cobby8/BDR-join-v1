'use server'

import { createClient } from '@/lib/supabase/server'

interface PlayerInput {
    name: string
    backNumber: string
    position: string
    birth: string // YYMMDD
    isElite: boolean
}

export interface ApplicationPayload {
    tournamentId: string
    teamNameKo: string
    teamNameEn?: string
    managerName: string
    managerPhone: string // 01012345678
    password?: string
    province: string
    city: string
    category: string
    division: string
    uniformHome?: string // Hex
    uniformAway?: string // Hex
    players: PlayerInput[]
}

export async function submitApplication(data: ApplicationPayload) {
    const supabase = await createClient()

    // 1. Validate (Basic)
    if (!data.tournamentId || !data.teamNameKo || !data.managerName || !data.managerPhone || !data.category || !data.division) {
        return { success: false, error: '필수 정보가 누락되었습니다.' }
    }
    if (data.players.length < 5) {
        return { success: false, error: '선수는 최소 5명 이상 등록해야 합니다.' }
    }


    // 1.5 Check Capacity & Determine Status
    const { data: tournament } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', data.tournamentId)
        .single()

    let initialStatus = 'APPLIED' // Default
    if (tournament) {
        // Fetch current count for this division
        const { count, error: countError } = await supabase
            .from('teams')
            .select('*', { count: 'exact', head: true })
            .eq('tournament_id', data.tournamentId)
            .eq('division', data.division)
            .in('status', ['APPLIED', 'CONFIRMED', 'pending'])

        if (!countError) {
            const caps = tournament.div_caps || {}
            const capKey = data.division
            const capKey2 = `${data.category} ${data.division}`.trim()
            const capStr = caps[capKey] || caps[capKey2] || '-'
            const cap = Number(capStr)

            if (!isNaN(cap) && (count || 0) >= cap) {
                initialStatus = 'WAITING'
            }
        }
    }

    // 2. Insert Team
    const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
            tournament_id: data.tournamentId,
            name_ko: data.teamNameKo,
            name_en: data.teamNameEn,
            manager_name: data.managerName,
            manager_phone: data.managerPhone,
            password: data.password || data.managerPhone.slice(-4), // Default password if needed
            province: data.province,
            city: data.city,
            category: data.category,
            division: data.division,
            uniform_home: data.uniformHome,
            uniform_away: data.uniformAway,
            status: initialStatus,
            payment_status: 'unpaid'
        })
        .select('id')
        .single()

    if (teamError) {
        console.error('Team Insert Error:', teamError)
        return { success: false, error: '팀 등록 중 오류가 발생했습니다: ' + teamError.message }
    }

    if (!team) {
        return { success: false, error: '팀 등록 실패' }
    }

    // 3. Insert Players
    const playersToInsert = data.players.map(p => ({
        team_id: team.id,
        name: p.name,
        back_number: p.backNumber,
        position: p.position,
        birth_date: p.birth,
        is_elite: p.isElite
    }))

    const { error: playerError } = await supabase
        .from('players')
        .insert(playersToInsert)

    if (playerError) {
        console.error('Player Insert Error:', playerError)
        // Cleanup team? ideally transactional, but Supabase doesn't support easy multi-table transactions via client
        // We might want to delete the team if player insert fails
        await supabase.from('teams').delete().eq('id', team.id)
        return { success: false, error: '선수 등록 중 오류가 발생했습니다.' }
    }

    return { success: true, teamId: team.id }
}

export async function updateApplication(teamId: string, data: ApplicationPayload) {
    const supabase = await createClient()

    // 1. Basic Validation
    if (!data.teamNameKo || !data.managerName || !data.managerPhone) {
        return { success: false, error: '필수 정보가 누락되었습니다.' }
    }

    // 2. Update Team
    const { error: teamError } = await supabase
        .from('teams')
        .update({
            name_ko: data.teamNameKo,
            name_en: data.teamNameEn,
            manager_name: data.managerName,
            manager_phone: data.managerPhone,
            province: data.province,
            city: data.city,
            category: data.category,
            division: data.division,
            uniform_home: data.uniformHome,
            uniform_away: data.uniformAway,
        })
        .eq('id', teamId)

    if (teamError) {
        console.error('Team Update Error:', teamError)
        return { success: false, error: '팀 정보 수정 실패: ' + teamError.message }
    }

    // 3. Update Players (Delete All & Re-insert Strategy for simplicity)
    // Transaction support is limited in client, so we do delete -> insert

    // Delete existing players
    const { error: deleteError } = await supabase
        .from('players')
        .delete()
        .eq('team_id', teamId)

    if (deleteError) {
        return { success: false, error: '선수 명단 수정 실패 (삭제 중 오류)' }
    }

    // Insert new players
    if (data.players.length > 0) {
        const playersToInsert = data.players.map(p => ({
            team_id: teamId,
            name: p.name,
            back_number: p.backNumber,
            position: p.position,
            birth_date: p.birth,
            is_elite: p.isElite
        }))

        const { error: insertError } = await supabase
            .from('players')
            .insert(playersToInsert)

        if (insertError) {
            console.error('Player Re-insert Error:', insertError)
            return { success: false, error: '선수 명단 등록 실패' }
        }
    }

    return { success: true }
}
