'use client'

import { useState, useEffect } from 'react'
import { X, Check, Users, Trophy, Layers } from 'lucide-react'

// Define types locally if not exported, or just use any/props
interface AdminDivision {
    id: string
    name: string
    divisions: string[]
}

interface DivisionGeneratorModalProps {
    isOpen: boolean
    onClose: () => void
    adminCats: AdminDivision[]
    onGenerate: (gender: string, categoryName: string, selectedDivisions: string[]) => void
}

export default function DivisionGeneratorModal({ isOpen, onClose, adminCats, onGenerate }: DivisionGeneratorModalProps) {
    const [gender, setGender] = useState<'남성' | '여성' | '혼성'>('남성')
    const [selectedCatId, setSelectedCatId] = useState<string>('')
    const [selectedDivisions, setSelectedDivisions] = useState<string[]>([])

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setGender('남성')
            setSelectedCatId('')
            setSelectedDivisions([])
        }
    }, [isOpen])

    // Auto-select first category if none selected? No, let user choose.

    const handleCatSelect = (id: string) => {
        if (selectedCatId === id) return
        setSelectedCatId(id)
        setSelectedDivisions([]) // Reset divisions when category changes
    }

    const toggleDivision = (div: string) => {
        setSelectedDivisions(prev =>
            prev.includes(div) ? prev.filter(d => d !== div) : [...prev, div]
        )
    }

    const handleGenerate = () => {
        const cat = adminCats.find(c => c.id === selectedCatId)
        if (!cat) return

        onGenerate(gender, cat.name, selectedDivisions)
        onClose()
    }

    const selectedCat = adminCats.find(c => c.id === selectedCatId)

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <Layers className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">새 종별 추가</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Step 1: Gender */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <Users className="w-3 h-3" /> Step 1. 성별 선택
                        </label>
                        <div className="flex p-1 bg-gray-100 rounded-xl">
                            {['남성', '여성', '혼성'].map((g) => (
                                <button
                                    key={g}
                                    type="button"
                                    onClick={() => setGender(g as any)}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${gender === g
                                            ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Step 2: Category */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <Trophy className="w-3 h-3" /> Step 2. 종별 템플릿
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {adminCats.map(ac => (
                                <button
                                    key={ac.id}
                                    type="button"
                                    onClick={() => handleCatSelect(ac.id)}
                                    className={`px-4 py-2 text-sm font-bold rounded-xl border transition-all ${selectedCatId === ac.id
                                            ? 'bg-blue-600 text-white border-blue-600 ring-4 ring-blue-100'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-500'
                                        }`}
                                >
                                    {ac.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Step 3: Divisions */}
                    <div className={`space-y-3 transition-all duration-300 ${!selectedCatId ? 'opacity-30 pointer-events-none blur-[1px]' : ''}`}>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <Layers className="w-3 h-3" /> Step 3. 디비전 선택
                            {selectedDivisions.length > 0 && <span className="text-blue-600 ml-1">({selectedDivisions.length}개)</span>}
                        </label>

                        {!selectedCat ? (
                            <div className="h-24 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50 text-gray-300 text-sm">
                                종별을 먼저 선택해주세요
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {selectedCat.divisions.map(div => (
                                    <button
                                        key={div}
                                        type="button"
                                        onClick={() => toggleDivision(div)}
                                        className={`px-3 py-1.5 text-sm font-bold rounded-lg border transition-all flex items-center gap-1.5 ${selectedDivisions.includes(div)
                                                ? 'bg-blue-50 text-blue-700 border-blue-200 ring-2 ring-blue-100'
                                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        {selectedDivisions.includes(div) && <Check className="w-3 h-3" />}
                                        {div}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-50 bg-gray-50/30">
                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={!selectedCatId || selectedDivisions.length === 0}
                        className="w-full py-4 bg-gray-900 text-white text-lg font-bold rounded-xl hover:bg-black shadow-lg shadow-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <span>생성하기</span>
                        {selectedDivisions.length > 0 && (
                            <span className="bg-white/20 px-2 py-0.5 rounded text-sm text-white/90">
                                {selectedDivisions.length}개 디비전
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
