'use client'

import { useState } from 'react'
import { Search, MapPin, X, Loader2 } from 'lucide-react'

export interface Place {
    name: string
    address: string
    lat: number
    lng: number
}

interface PlaceSearchModalProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (place: Place) => void
}

export default function PlaceSearchModal({ isOpen, onClose, onSelect }: PlaceSearchModalProps) {
    const [keyword, setKeyword] = useState('')
    const [results, setResults] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    if (!isOpen) return null

    const handleSearch = async () => {
        if (!keyword.trim()) return

        setLoading(true)
        setError('')
        setResults([])

        try {
            const appKey = process.env.NEXT_PUBLIC_TMAP_APP_KEY
            if (!appKey) {
                throw new Error('TMap App Key가 설정되지 않았습니다 (.env.local 확인)')
            }

            const res = await fetch(`https://apis.openapi.sk.com/tmap/pois?version=1&searchKeyword=${encodeURIComponent(keyword)}&appKey=${appKey}`)

            if (!res.ok) {
                throw new Error('TMap API 호출 실패')
            }

            const data = await res.json()
            const pois = data.searchPoiInfo?.pois?.poi || []
            setResults(pois)
        } catch (e: any) {
            console.error(e)
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSelect = (poi: any) => {
        const place: Place = {
            name: poi.name,
            address: poi.upperAddrName + ' ' + poi.middleAddrName + ' ' + poi.lowerAddrName + ' ' + poi.detailAddrName,
            lat: parseFloat(poi.noorLat),
            lng: parseFloat(poi.noorLon)
        }
        onSelect(place)
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        경기장 검색 (TMap)
                    </h3>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-4 border-b border-gray-100 space-y-2">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="경기장 이름 또는 주소 입력"
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={handleSearch}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                        </button>
                    </div>
                    {error && <p className="text-xs text-red-500">{error} (직접 입력으로 대체해주세요)</p>}
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-gray-50/50">
                    {results.length > 0 ? (
                        results.map((poi, idx) => (
                            <button
                                key={`${poi.id}-${idx}`}
                                type="button"
                                onClick={() => handleSelect(poi)}
                                className="w-full text-left p-3 hover:bg-blue-50 rounded-xl transition-all group border border-transparent hover:border-blue-100"
                            >
                                <div className="font-bold text-gray-900 group-hover:text-blue-700">
                                    {poi.name}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {poi.upperAddrName} {poi.middleAddrName} {poi.lowerAddrName} {poi.detailAddrName}
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="text-center py-10 text-gray-400 text-sm">
                            {loading ? '검색 중...' : '검색 결과가 여기에 표시됩니다.'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
