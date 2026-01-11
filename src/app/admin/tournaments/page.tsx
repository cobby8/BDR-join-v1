import { supabase } from '@/lib/supabase'
import TournamentListClient from './TournamentListClient'

export const dynamic = 'force-dynamic'

export default async function AdminTournaments() {
    const { data: tournamentsData } = await supabase
        .from('tournaments')
        .select('*, teams(status)')
        .order('created_at', { ascending: false })

    const tournaments = tournamentsData?.map((t: any) => ({
        ...t,
        teams: [{
            count: t.teams?.filter((team: any) => {
                const s = team.status?.toLowerCase() || 'applied'
                return ['applied', 'confirmed', 'waiting', 'pending'].includes(s)
            }).length || 0
        }]
    }))

    return <TournamentListClient tournaments={(tournaments as any) || []} />
}
