import { getDashboardMetrics } from '@/app/actions/dashboard'
import DashboardClient from './dashboard/DashboardClient'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
    // 1. Fetch Initial Data (Default: Current Year)
    const currentYear = new Date().getFullYear().toString()
    const initialData = await getDashboardMetrics({ year: currentYear })

    return <DashboardClient initialData={initialData} />
}
