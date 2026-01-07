'use client'

import { useState } from 'react'
import { ArrowLeft, Search, Loader2, ChevronRight, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { findMyTeams, MyTeam } from '@/app/actions/lookup'

export default function LookupPage() {
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState<MyTeam[]>([])
    const [searched, setSearched] = useState(false)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || !phone) return

        setLoading(true)
        setSearched(false)
        setResults([])

        try {
            const res = await findMyTeams(name, phone)
            if (res.success && res.data) {
                setResults(res.data)
            } else {
                alert(res.error || '조회 중 오류가 발생했습니다.')
            }
        } finally {
            setLoading(false)
            setSearched(true)
        }
    }

    return (
        <div className="max-w-md mx-auto py-8 px-4">
            <Link href="/" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors font-medium text-sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                메인으로
            </Link>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">내 신청서 찾기</h1>
                <p className="text-gray-500 text-sm mb-6">신청 시 입력한 정보로 조회할 수 있습니다.</p>

                <form onSubmit={handleSearch} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">이름 (대표자)</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
                            placeholder="예: 홍길동"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">연락처</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
                            placeholder="숫자만 입력 (01012345678)"
                            maxLength={11}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !name || !phone}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-100 disabled:shadow-none"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                        조회하기
                    </button>
                </form>
            </div>

            {searched && (
                <div className="space-y-4 animate-in slide-in-from-bottom-2 fade-in duration-500">
                    <h2 className="font-bold text-gray-900 px-2 flex justify-between items-center">
                        <span>조회 결과</span>
                        <span className="text-blue-600">{results.length}건</span>
                    </h2>

                    {results.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            일치하는 신청 내역이 없습니다.<br />
                            정보를 다시 확인해주세요.
                        </div>
                    ) : (
                        results.map(team => (
                            <div key={team.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-200 transition-colors group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-8 -mt-8 opacity-50"></div>

                                <div className="relative z-10">
                                    <div className="text-xs font-bold text-blue-600 mb-1 flex items-center gap-1">
                                        {team.tournaments?.name || '알 수 없는 대회'}
                                    </div>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{team.name_ko}</h3>
                                            <div className="text-sm text-gray-500">{team.category} / {team.division}</div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`text-xs px-2 py-1 rounded-md font-bold ${team.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                team.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                {team.status === 'confirmed' ? '확정됨' : team.status === 'cancelled' ? '취소됨' : '대기중'}
                                            </span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${team.payment_status === 'paid' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-white text-gray-400 border-gray-200'
                                                }`}>
                                                {team.payment_status === 'paid' ? '결제완료' : '미결제'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-3 border-t border-gray-50">
                                        <Link
                                            href={`/view/${team.id}`}
                                            className="flex-1 py-2 text-sm text-center rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 font-medium flex items-center justify-center gap-1"
                                        >
                                            <ExternalLink className="w-3 h-3" /> 팀 페이지
                                        </Link>
                                        <Link
                                            href={`/join/${team.tournament_id}?edit_team_id=${team.id}`}
                                            className="flex-1 py-2 text-sm text-center rounded-lg border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-300 font-medium"
                                        >
                                            수정
                                        </Link>
                                        <Link
                                            href={`/?clone_from=${team.id}`}
                                            className="flex-1 py-2 text-sm text-center rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold border border-blue-100"
                                        >
                                            다른 대회 신청
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
