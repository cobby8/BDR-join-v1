'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteTournament(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('tournaments').delete().eq('id', id)
    if (error) {
        return { error: error.message }
    }
    revalidatePath('/admin/tournaments')
    return { success: true }
}

export async function updateTeamStatus(teamId: string, field: string, value: string) {
    const supabase = await createClient()

    const payload: any = { [field]: value }

    // Auto-confirm logic
    if (field === 'payment_status' && value === 'paid') {
        payload.status = 'confirmed'
    }

    const { error } = await supabase.from('teams').update(payload).eq('id', teamId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/admin/teams/${teamId}`)
    return { success: true }
}

export async function syncGoogleSheet() {
    try {
        const { runSync } = await import('@/lib/googleSync')
        const result = await runSync()
        if (result.success) {
            revalidatePath('/admin/tournaments')
            revalidatePath('/admin/teams')
        }
        return result
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}
export async function updateTeamInfo(teamId: string, data: any) {
    const supabase = await createClient()
    const { error } = await supabase.from('teams').update(data).eq('id', teamId)
    if (error) return { error: error.message }
    revalidatePath(`/admin/teams`)
    return { success: true }
}

export async function updatePlayer(playerId: string, data: any) {
    const supabase = await createClient()
    const { error } = await supabase.from('players').update(data).eq('id', playerId)
    if (error) return { error: error.message }
    revalidatePath(`/admin/teams`)
    return { success: true }
}

export async function fetchTeamDetails(teamId: string, managerPhone: string) {
    const supabase = await createClient()

    // 1. Fetch Players
    const { data: players, error: pError } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', teamId)
        .order('back_number', { ascending: true })

    // 2. Fetch History (with phone normalization)
    // Ensure managerPhone is not null/undefined
    if (!managerPhone) return { players: players || [], history: [] }

    const cleanPhone = managerPhone.replace(/-/g, '')
    const { data: history, error: hError } = await supabase
        .from('teams')
        .select('id, created_at, category, division, payment_status, status, tournaments(name, status, start_date, end_date, places)')
        .or(`manager_phone.eq.${cleanPhone},manager_phone.eq.${managerPhone}`)
        .order('created_at', { ascending: false })

    if (pError || hError) {
        return { error: pError?.message || hError?.message }
    }

    return { players, history }
}
