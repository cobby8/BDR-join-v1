'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function upsertPlayer(player: any) {
    const supabase = await createClient()

    // Check duplicate back number (if team_id is present)
    if (player.team_id && player.back_number) {
        // Exclude current player from check (if editing)
        let query = supabase
            .from('players')
            .select('id')
            .eq('team_id', player.team_id)
            .eq('back_number', player.back_number)

        if (player.id) {
            query = query.neq('id', player.id)
        }

        const { data: duplicate } = await query.single()

        if (duplicate) {
            return { error: '이미 존재하는 등번호입니다.' }
        }
    }

    const { error } = await supabase.from('players').upsert(player)

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/admin/teams/${player.team_id}`)
    return { success: true }
}

export async function deletePlayer(id: string, teamId: string) {
    const supabase = await createClient()

    const { error } = await supabase.from('players').delete().eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/admin/teams/${teamId}`)
    return { success: true }
}

export async function updateTeamInfo(teamId: string, data: any) {
    const supabase = await createClient()

    const { error } = await supabase.from('teams').update(data).eq('id', teamId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/admin/teams/${teamId}`)
    return { success: true }
}
