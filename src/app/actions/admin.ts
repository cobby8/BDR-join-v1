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
