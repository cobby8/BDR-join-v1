'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, X } from 'lucide-react'

interface AdminCategory {
    id: string
    name: string
    divisions: string[]
    ages: string[]
}

export default function CategoryManager() {
    const [categories, setCategories] = useState<AdminCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [newCatName, setNewCatName] = useState('')

    // Fetch
    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('admin_categories')
                .select('*')
                .order('created_at', { ascending: true })

            if (error) throw error
            setCategories(data || [])
        } catch (e) {
            console.error(e)
            // alert('데이터 로딩 실패')
        } finally {
            setLoading(false)
        }
    }

    // Handlers
    const addCategory = async () => {
        if (!newCatName.trim()) return
        try {
            const { data, error } = await supabase
                .from('admin_categories')
                .insert([{ name: newCatName, divisions: [], ages: [] }] as any)
                .select()
                .single()

            if (error) throw error
            setCategories([...categories, data])
            setNewCatName('')
        } catch (e: any) {
            alert('추가 실패: ' + e.message)
        }
    }

    const deleteCategory = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return
        try {
            const { error } = await supabase.from('admin_categories').delete().eq('id', id)
            if (error) throw error
            setCategories(categories.filter(c => c.id !== id))
        } catch (e: any) {
            alert('삭제 실패: ' + e.message)
        }
    }

    const updateCategory = async (id: string, field: 'divisions' | 'ages', value: string[]) => {
        // Optimistic update
        const updated = categories.map(c => c.id === id ? { ...c, [field]: value } : c)
        setCategories(updated)

        try {
            const { error } = await supabase
                .from('admin_categories')
                .update({ [field]: value } as unknown as any)
                .eq('id', id)
            if (error) throw error
        } catch (e: any) {
            console.error(e)
            alert('저장 실패')
            fetchCategories() // Revert
        }
    }

    // Tag Input Helper
    const removeItem = (catId: string, field: 'divisions' | 'ages', item: string) => {
        const cat = categories.find(c => c.id === catId)
        if (!cat) return
        const newValue = cat[field].filter(i => i !== item)
        updateCategory(catId, field, newValue)
    }

    const addItem = (catId: string, field: 'divisions' | 'ages', item: string) => {
        if (!item.trim()) return
        const cat = categories.find(c => c.id === catId)
        if (!cat) return
        if (cat[field].includes(item)) return
        const newValue = [...cat[field], item]
        updateCategory(catId, field, newValue)
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">종별 및 디비전 목록</h2>
                    <p className="text-gray-500 text-sm">대회 생성 시 '기본값'으로 불러올 구성을 관리합니다.</p>
                </div>
            </div>

            {/* Add New Category */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <label className="block text-sm font-bold text-gray-700 mb-2">새 종별 추가</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newCatName}
                        onChange={e => setNewCatName(e.target.value)}
                        placeholder="예: 일반부, 대학부, 여성부"
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 font-medium"
                        onKeyDown={e => e.key === 'Enter' && addCategory()}
                    />
                    <button
                        onClick={addCategory}
                        className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> 추가
                    </button>
                </div>
            </div>

            {/* Category List */}
            <div className="space-y-6">
                {loading ? (
                    <div className="text-center py-10 text-gray-400">Loading...</div>
                ) : categories.map((cat) => (
                    <div key={cat.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">{cat.name}</h3>
                            <button
                                onClick={() => deleteCategory(cat.id)}
                                className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 grid md:grid-cols-2 gap-8">
                            {/* Divisions */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-blue-900 uppercase">디비전 (Divisions)</label>
                                <div className="flex flex-wrap gap-2 mb-2 min-h-[40px]">
                                    {cat.divisions.map(div => (
                                        <span key={div} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold flex items-center gap-2">
                                            {div}
                                            <button onClick={() => removeItem(cat.id, 'divisions', div)} className="hover:text-red-500">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="추가 (Enter)"
                                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white transition-colors outline-none"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                addItem(cat.id, 'divisions', e.currentTarget.value)
                                                e.currentTarget.value = ''
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Ages */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-indigo-900 uppercase">연령/옵션 (Ages/Options)</label>
                                <div className="flex flex-wrap gap-2 mb-2 min-h-[40px]">
                                    {cat.ages.map(age => (
                                        <span key={age} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold flex items-center gap-2">
                                            {age}
                                            <button onClick={() => removeItem(cat.id, 'ages', age)} className="hover:text-red-500">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="추가 (Enter)"
                                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white transition-colors outline-none"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                addItem(cat.id, 'ages', e.currentTarget.value)
                                                e.currentTarget.value = ''
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
