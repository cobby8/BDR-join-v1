import { getTeamDetails } from '@/app/actions/lookup'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Props {
    params: Promise<{ id: string }>
}

export default async function AdminTeamDetailPage({ params }: Props) {
    const { id } = await params
    const res = await getTeamDetails(id)

    if (!res.success || !res.data) {
        return <div className="p-8 text-center text-red-500">팀 정보를 찾을 수 없습니다.</div>
    }

    const team = res.data

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <Link href="/admin/teams" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6">
                <ArrowLeft className="w-4 h-4" />
                목록으로 돌아가기
            </Link>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h1 className="text-2xl font-bold mb-2">{team.name_ko} ({team.name_en})</h1>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                        <span className="font-bold mr-2">대표자:</span> {team.manager_name}
                    </div>
                    <div>
                        <span className="font-bold mr-2">연락처:</span> {team.manager_phone}
                    </div>
                    <div>
                        <span className="font-bold mr-2">지역:</span> {team.province} {team.city}
                    </div>
                </div>
            </div>
        </div>
    )
}
