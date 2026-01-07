import { supabase } from '@/lib/supabase'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
    // Fetch all teams to aggregate representatives
    const { data: teams } = await supabase
        .from('teams')
        .select('id, name_ko, manager_name, manager_phone, created_at')
        .order('created_at', { ascending: false })

    // Fetch tournaments to view/aggregate used divisions
    const { data: tournaments } = await supabase
        .from('tournaments')
        .select('id, name, divs')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">설정 및 관리</h1>
            <SettingsClient
                initialTeams={teams || []}
                initialTournaments={tournaments || []}
            />
        </div>
    )
}
