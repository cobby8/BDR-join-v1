'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendSms } from '@/lib/solapi'

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
    const cleanPhone = managerPhone?.replace(/-/g, '')

    const [playersRes, historyRes] = await Promise.all([
        // 1. Fetch Players
        supabase
            .from('players')
            .select('*')
            .eq('team_id', teamId)
            .order('back_number', { ascending: true }),

        // 2. Fetch History (only if phone exists)
        managerPhone
            ? supabase
                .from('teams')
                .select('id, created_at, category, division, payment_status, status, tournaments(name, status, start_date, end_date, places)')
                .or(`manager_phone.eq.${cleanPhone},manager_phone.eq.${managerPhone}`)
                .order('created_at', { ascending: false })
            : Promise.resolve({ data: [], error: null })
    ])

    if (playersRes.error || historyRes.error) {
        return { error: playersRes.error?.message || historyRes.error?.message }
    }

    return {
        players: playersRes.data,
        history: historyRes.data || []
    }
}

export async function notifyWaitingTeam(teamId: string) {
    const supabase = await createClient()

    // Fetch Team Info
    const { data: team, error } = await supabase
        .from('teams')
        .select('manager_phone, name_ko, tournaments(name)')
        .eq('id', teamId)
        .single()

    if (error || !team) {
        return { error: '팀 정보를 찾을 수 없습니다.' }
    }

    const { manager_phone, name_ko, tournaments } = team
    if (!manager_phone) {
        return { error: '대표자 연락처가 없습니다.' }
    }

    const tournamentName = (tournaments as any)?.name || '대회'
    const message = `[BDR] '${tournamentName}' ${name_ko}팀 대기 접수 안내\n빈 자리가 발생하여 참가 신청이 가능합니다. 24시간 내에 확정 바랍니다.`

    // Send SMS
    const res = await sendSms(manager_phone, message)

    if (res.success) {
        return { success: true, message: '알림 문자를 발송했습니다.' }
    } else {
        return { error: '문자 발송 실패: ' + res.error }
    }
}
