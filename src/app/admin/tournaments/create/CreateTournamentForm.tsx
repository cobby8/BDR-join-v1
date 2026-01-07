'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, X, Trash2 } from 'lucide-react'
import Link from 'next/link'

// Define the shape of our dynamic JSON fields
interface Division {
    name: string
    cap: number
}

interface Category {
    name: string
    divisions: Division[]
}

export default function CreateTournamentForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    // Dynamic State for JSON fields
    const [categories, setCategories] = useState<Category[]>([])
    const [places, setPlaces] = useState<string[]>([])
    const [placeInput, setPlaceInput] = useState('')

    // Helpers for Categories/Divisions
    const addCategory = () => {
        setCategories([...categories, { name: '', divisions: [] }])
    }

    const removeCategory = (idx: number) => {
        setCategories(categories.filter((_, i) => i !== idx))
    }

    const updateCategoryName = (idx: number, name: string) => {
        const newCats = [...categories]
        newCats[idx].name = name
        setCategories(newCats)
    }

    const addDivision = (catIdx: number) => {
        const newCats = [...categories]
        newCats[catIdx].divisions.push({ name: '', cap: 0 })
        setCategories(newCats)
    }

    const removeDivision = (catIdx: number, divIdx: number) => {
        const newCats = [...categories]
        newCats[catIdx].divisions.splice(divIdx, 1)
        setCategories(newCats)
    }

    const updateDivision = (catIdx: number, divIdx: number, field: keyof Division, value: string | number) => {
        const newCats = [...categories]
        newCats[catIdx].divisions[divIdx] = {
            ...newCats[catIdx].divisions[divIdx],
            [field]: value
        }
        setCategories(newCats)
    }

    // Helpers for Places
    const addPlace = () => {
        if (!placeInput.trim()) return
        setPlaces([...places, placeInput.trim()])
        setPlaceInput('')
    }
    const removePlace = (idx: number) => {
        setPlaces(places.filter((_, i) => i !== idx))
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)


        // Construct JSONB structures
        // divs: { "일반부": ["A", "B"], ... }
        // div_caps: { "A": 12, "B": 16, ... } -> Note: flatten caps might be ambiguous if same div name exists in diff cat. 
        // Legacy system seems to treat div names as unique or context-aware. 
        // Let's follow schema comment: { "A": 16, "B": 12 }

        const divsObj: Record<string, string[]> = {}
        const divCapsObj: Record<string, number> = {}

        categories.forEach(cat => {
            if (cat.name) {
                divsObj[cat.name] = cat.divisions.map(d => d.name).filter(Boolean)
                cat.divisions.forEach(d => {
                    if (d.name) divCapsObj[d.name] = Number(d.cap) || 0
                })
            }
        })

        const payload = {
            name: formData.get('name') as string,
            status: formData.get('status') as string,
            start_date: formData.get('start_date') || null,
            end_date: formData.get('end_date') || null,
            reg_start_at: formData.get('reg_start_at') || null,
            reg_end_at: formData.get('reg_end_at') || null,
            details_url: formData.get('details_url') || null,
            divs: divsObj,
            div_caps: divCapsObj,
            places: places
        }

        const { error } = await supabase.from('tournaments').insert(payload)

        if (error) {
            alert('대회 생성 실패: ' + error.message)
            setLoading(false)
        } else {
            router.push('/admin/tournaments')
            router.refresh()
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold border-b pb-2">기본 정보</h2>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">대회명 *</label>
                    <input name="name" required className="w-full input-field" placeholder="예: 제5회 BDR 배 농구대회" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">상태</label>
                        <select name="status" className="w-full input-field">
                            <option value="준비중">준비중</option>
                            <option value="접수중">접수중</option>
                            <option value="마감">마감</option>
                            <option value="종료">종료</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">상세 페이지 URL</label>
                        <input name="details_url" className="w-full input-field" placeholder="https://..." />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">대회 시작일</label>
                        <input type="date" name="start_date" className="w-full input-field" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">대회 종료일</label>
                        <input type="date" name="end_date" className="w-full input-field" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">접수 시작일시</label>
                        <input type="datetime-local" name="reg_start_at" className="w-full input-field" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">접수 종료일시</label>
                        <input type="datetime-local" name="reg_end_at" className="w-full input-field" />
                    </div>
                </div>
            </div>

            {/* Places */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold border-b pb-2">장소 (체육관)</h2>
                <div className="flex gap-2">
                    <input
                        value={placeInput}
                        onChange={(e) => setPlaceInput(e.target.value)}
                        className="flex-1 input-field"
                        placeholder="체육관 이름"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPlace())}
                    />
                    <button type="button" onClick={addPlace} className="bg-gray-100 px-4 rounded-xl hover:bg-gray-200">
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {places.map((place, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                            {place}
                            <button type="button" onClick={() => removePlace(idx)}><X className="w-3 h-3" /></button>
                        </span>
                    ))}
                </div>
            </div>

            {/* Divisions & Caps */}
            <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                    <h2 className="text-lg font-bold">종별 및 디비전 설정</h2>
                    <button type="button" onClick={addCategory} className="text-sm text-blue-600 font-bold flex items-center gap-1">
                        <Plus className="w-4 h-4" /> 종별 추가
                    </button>
                </div>

                {categories.map((cat, catIdx) => (
                    <div key={catIdx} className="bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-200">
                        <div className="flex items-center gap-2">
                            <input
                                value={cat.name}
                                onChange={(e) => updateCategoryName(catIdx, e.target.value)}
                                placeholder="종별 이름 (예: 일반부)"
                                className="flex-1 font-bold bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none py-1"
                            />
                            <button type="button" onClick={() => removeCategory(catIdx)} className="text-red-500 p-1 hover:bg-red-50 rounded">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="pl-4 space-y-2">
                            {cat.divisions.map((div, divIdx) => (
                                <div key={divIdx} className="flex gap-2 items-center">
                                    <span className="text-gray-400 text-sm">└</span>
                                    <input
                                        value={div.name}
                                        onChange={(e) => updateDivision(catIdx, divIdx, 'name', e.target.value)}
                                        placeholder="디비전 (예: A)"
                                        className="w-24 input-field-sm"
                                    />
                                    <input
                                        type="number"
                                        value={div.cap || ''}
                                        onChange={(e) => updateDivision(catIdx, divIdx, 'cap', e.target.value)}
                                        placeholder="CAP"
                                        className="w-20 input-field-sm"
                                    />
                                    <span className="text-sm text-gray-500">팀</span>
                                    <button type="button" onClick={() => removeDivision(catIdx, divIdx)} className="text-gray-400 hover:text-red-500">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={() => addDivision(catIdx)} className="text-xs text-blue-500 flex items-center gap-1 ml-4 mt-2">
                                <Plus className="w-3 h-3" /> 디비전 추가
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="pt-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[hsl(var(--primary))] text-white font-bold py-4 rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                    {loading ? '생성 중...' : '대회 생성하기'}
                </button>
            </div>

            <style jsx>{`
                .input-field {
                    @apply px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[hsl(var(--primary))] focus:ring-1 focus:ring-[hsl(var(--primary))];
                }
                .input-field-sm {
                    @apply px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[hsl(var(--primary))];
                }
            `}</style>
        </form>
    )
}
