'use server'

import { createClient } from '@/lib/supabase/server'

export interface MyTeam {
    id: string
    tournament_id: string
    name_ko: string
    division: string
    category: string
    status: string
    payment_status: string
    created_at: string
    tournaments: {
        name: string
    } | null
}

export async function findMyTeams(name: string, phone: string) {
    const supabase = await createClient()

    if (!name || !phone) {
        return { success: false, error: '이름과 전화번호를 입력해주세요.' }
    }

    try {
        const { data, error } = await supabase
            .from('teams')
            .select(`
                id,
                tournament_id,
                name_ko,
                division,
                category,
                status,
                payment_status,
                created_at,
                tournaments (
                    name
                )
            `)
            .eq('manager_name', name)
            .eq('manager_phone', phone)
            .order('created_at', { ascending: false })

        if (error) throw error

        return { success: true, data: data as unknown as MyTeam[] }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function getTeamDetails(teamId: string) {
    const supabase = await createClient()

    try {
        const { data: team, error } = await supabase
            .from('teams')
            .select(`
                *,
                players (*)
            `)
            .eq('id', teamId)
            .single()

        if (error) throw error
        return { success: true, data: team }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}
