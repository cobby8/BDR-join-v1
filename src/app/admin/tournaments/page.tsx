import { supabase } from '@/lib/supabase'
import TournamentListClient from './TournamentListClient'

export default async function AdminTournaments() {
    const { data: tournaments } = await supabase
        .from('tournaments')
        .select('*, teams(count)')
        .order('created_at', { ascending: false })

    return <TournamentListClient tournaments={tournaments || []} />
}
