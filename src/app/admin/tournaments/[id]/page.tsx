import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import TeamsManagementClient from '@/app/admin/teams/TeamsManagementClient'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function AdminTournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    // Fetch tournament details
    const { data: tournament } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', id)
        .single()

    if (!tournament) {
        notFound()
    }

    // Fetch teams for this tournament
    const { data: teams } = await supabase
        .from('teams')
        .select(`
            *,
            tournaments (name)
        `)
        .eq('tournament_id', id)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <Link href="/admin/tournaments" className="inline-flex items-center text-gray-500 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4 mr-1" />
                대회 목록으로
            </Link>

            <TeamsManagementClient
                initialTeams={(teams as any) || []}
                hideTournamentFilter={true}
                title={`${tournament.name} - 참가팀 관리`}
            />
        </div>
    )
}
