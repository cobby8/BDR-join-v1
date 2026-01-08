import { supabase } from '@/lib/supabase'
import TeamsManagementClient from './TeamsManagementClient'

// Fetch ALL teams for client-side filtering
async function getTeams() {
    const { data } = await supabase
        .from('teams')
        .select(`
            *,
            tournaments (name),
            players (count)
        `)
        .order('created_at', { ascending: false })

    return data || []
}

async function getTournaments() {
    const { data } = await supabase.from('tournaments').select('id, name').order('created_at', { ascending: false })
    return data || []
}

export default async function AdminTeamsPage() {
    const teams = await getTeams()
    const tournaments = await getTournaments()

    return <TeamsManagementClient initialTeams={teams as any} tournaments={tournaments} />
}
