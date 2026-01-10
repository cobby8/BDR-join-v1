'use server'

import { createClient } from '@/utils/supabase/server'

export interface DashboardMetrics {
    summary: {
        totalTournaments: number
        totalTeams: number
        pendingTeams: number
        totalRevenue: number
    }
    regionStats: { name: string; value: number }[]
    tournamentStats: {
        name: string;
        teamCount: number;
        revenue: number;
        status: string;
    }[]
}

export async function getDashboardMetrics(filters?: { year?: string; status?: string }): Promise<DashboardMetrics> {
    const supabase = await createClient()

    // Query Builder for Tournaments
    let query = supabase
        .from('tournaments')
        .select('id, name, status, entry_fee, start_date')
        .order('start_date', { ascending: false })

    // Apply Year Filter (based on start_date)
    if (filters?.year) {
        const start = `${filters.year}-01-01`
        const end = `${filters.year}-12-31`
        query = query.gte('start_date', start).lte('start_date', end)
    }

    // Apply Status Filter
    if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
    }

    const { data: tournaments } = await query

    // Fetch Teams (We need to fetch ALL teams to calculate accurately, or filter by tournament_ids)
    // If we filter tournaments, we should only fetch teams for those tournaments to save bandwidth
    const tournamentIds = tournaments?.map(t => t.id) || []

    const { data: teams } = await supabase
        .from('teams')
        .select(`
            id, 
            tournament_id, 
            status, 
            payment_status, 
            province, 
            city
        `)
        .in('tournament_id', tournamentIds)

    // Processing Data
    const summary = {
        totalTournaments: tournaments?.length || 0,
        totalTeams: teams?.length || 0,
        pendingTeams: teams?.filter(t => t.status === 'pending').length || 0,
        totalRevenue: 0
    }

    const regionMap = new Map<string, number>()
    const tourMap = new Map<string, { count: number; revenue: number }>()

    teams?.forEach(team => {
        // Region (Filter out '미지정' or empty)
        const region = team.province
        if (region && region !== '미지정') {
            regionMap.set(region, (regionMap.get(region) || 0) + 1)
        }

        if (team.tournament_id) {
            const current = tourMap.get(team.tournament_id) || { count: 0, revenue: 0 }
            current.count += 1

            if (team.payment_status === 'paid') {
                const tour = tournaments?.find(t => t.id === team.tournament_id)
                const fee = tour?.entry_fee ? Number(String(tour.entry_fee).replace(/[^0-9]/g, '')) : 0
                current.revenue += fee
                summary.totalRevenue += fee
            }
            tourMap.set(team.tournament_id, current)
        }
    })

    // Format Region Stats
    const regionStats = Array.from(regionMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)

    // Format Tournament Stats & Limit to Top 10
    const tournamentStats = tournaments?.map(t => {
        const stats = tourMap.get(t.id) || { count: 0, revenue: 0 }
        return {
            name: t.name,
            teamCount: stats.count,
            revenue: stats.revenue,
            status: t.status || '-'
        }
    }) || []

    return {
        summary,
        regionStats,
        tournamentStats
    }
}
