import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import RegistrationForm from './RegistrationForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function JoinPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { data: tour } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', id)
        .single()

    if (!tour) {
        notFound()
    }

    return (
        <div className="max-w-[800px] mx-auto py-8 px-4">
            <Link href="/" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors font-medium text-sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                대회 목록으로 돌아가기
            </Link>

            <div className="mb-8 p-6 md:p-8 bg-white rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50/50 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
                <div className="relative z-10">
                    <div className="flex flex-wrap gap-2 items-center mb-3">
                        <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${tour.status === '접수중' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                            }`}>
                            {tour.status}
                        </span>
                        {tour.entry_fee && <span className="text-gray-500 text-xs font-medium">참가비: {tour.entry_fee}</span>}
                    </div>

                    <h1 className="text-3xl font-extrabold text-gray-900 mb-3 break-keep leading-tight">{tour.name}</h1>
                    <div className="flex flex-wrap gap-4 text-gray-500 text-sm">
                        <span>
                            📅 {tour.start_date ? new Date(tour.start_date).toLocaleDateString() : '일정 미정'} 시작
                        </span>
                    </div>
                </div>
            </div>

            <RegistrationForm tournament={tour as any} />
        </div>
    )
}
