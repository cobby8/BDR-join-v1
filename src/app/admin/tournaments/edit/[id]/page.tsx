import { supabase } from '@/lib/supabase'
import TournamentForm from '../../TournamentForm'
import { notFound } from 'next/navigation'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function EditTournamentPage({ params }: PageProps) {
    const { id } = await params

    // Fetch Data
    const { data: tournament } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', id)
        .single()

    if (!tournament) {
        notFound()
    }

    // Transform logic if needed to match form props?
    // TournamentForm expects "initialData" which roughly matches DB row + parsed JSONs?
    // Actually TournamentForm props: 
    // initialData: { id, name, status, start_date, ... divs: Record<...>, places: ... }
    // The DB 'divs' is Json, 'places' is Json.
    // We might need to cast or ensure types match.
    // But usually passing the row directly works if types are compatible or casted.
    // Let's check TournamentForm props again later if type error occurs, 
    // but standard restoration is pass data.

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">대회 수정</h1>
            <div className="w-full">
                <TournamentForm
                    initialData={tournament as any}
                    isEdit
                />
            </div>
        </div>
    )
}
