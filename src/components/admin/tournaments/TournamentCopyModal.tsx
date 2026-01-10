import { useState, useEffect } from 'react'
import { getTournamentsForCopy } from '@/app/actions/admin'
import { X, Copy, Calendar, Trophy, Search } from 'lucide-react'

interface TournamentCopyModalProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (tournament: any) => void
}

export default function TournamentCopyModal({ isOpen, onClose, onSelect }: TournamentCopyModalProps) {
    const [tournaments, setTournaments] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        if (isOpen) {
            loadTournaments()
            setSearchTerm('')
        }
    }, [isOpen])

    useEffect(() => {
        if (!isOpen) return
        const timer = setTimeout(() => {
            loadTournaments(searchTerm)
        }, 300)
        return () => clearTimeout(timer)
    }, [searchTerm, isOpen])

    const loadTournaments = async (query?: string) => {
        setLoading(true)
        const res = await getTournamentsForCopy(query)
        if ('data' in res && res.data) {
            setTournaments(res.data)
        }
        setLoading(false)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Copy className="w-5 h-5 text-blue-600" />
                        기존 대회에서 가져오기
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-900">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="px-6 pt-4 pb-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="대회명 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {tournaments.map((tour) => (
                                <button
                                    key={tour.id}
                                    onClick={() => onSelect(tour)}
                                    className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                                >
                                    <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-white transition-colors">
                                        <Trophy className="w-6 h-6 text-gray-500 group-hover:text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900 mb-1 group-hover:text-blue-700">{tour.name}</h3>
                                        <div className="flex items-center gap-3 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {tour.start_date || '날짜 미정'}
                                            </span>
                                            {tour.entry_fee && (
                                                <span>• 참가비 {tour.entry_fee}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors">
                                        선택
                                    </div>
                                </button>
                            ))}
                            {tournaments.length === 0 && (
                                <div className="text-center py-10 text-gray-500">검색 결과가 없습니다.</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
