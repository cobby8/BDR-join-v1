'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, X, Trash2, Calendar, MapPin, Link as LinkIcon, Upload, Check, Settings2, RefreshCcw, Search, CreditCard } from 'lucide-react'
import ImageUpload from '@/components/common/ImageUpload'
import Link from 'next/link'
import { deleteTournament } from '@/app/actions/admin'
import PlaceSearchModal from '@/components/admin/tournaments/PlaceSearchModal'

interface Division {
    name: string
    cap: number
}

interface Category {
    name: string
    divisions: Division[]
}

interface Place {
    name: string
    address: string
    lat: number
    lng: number
}

interface AdminCategory {
    id: string
    name: string
    divisions: string[] // Standard divisions
    ages: string[]      // Generator ages
}

interface TournamentFormProps {
    initialData?: {
        id?: string
        name: string
        status: string
        gender?: string
        start_date: string | null
        end_date: string | null
        reg_start_at: string | null
        reg_end_at: string | null
        details_url: string | null
        poster_url: string | null
        divs: Record<string, string[]>
        div_caps: Record<string, number>
        places: (string | Place)[]
        entry_fee?: string | null
        bank_name?: string | null
        account_number?: string | null
        account_holder?: string | null
    }
    isEdit?: boolean
}

import PasswordPromptModal from '@/components/common/PasswordPromptModal'

export default function TournamentForm({ initialData, isEdit = false }: TournamentFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [isDeleteLoading, setIsDeleteLoading] = useState(false)

    // Dynamic State
    const [categories, setCategories] = useState<Category[]>([])
    const [places, setPlaces] = useState<(string | Place)[]>(initialData?.places || [])
    const [placeInput, setPlaceInput] = useState('')
    const [isMapOpen, setIsMapOpen] = useState(false)

    // Admin Settings State
    const [adminCats, setAdminCats] = useState<AdminCategory[]>([])
    const [isSettingsLoaded, setIsSettingsLoaded] = useState(false)

    // Form Data State
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        status: initialData?.status || '준비중',
        gender: initialData?.gender || 'mixed', // Add gender
        start_date: initialData?.start_date ? new Date(initialData.start_date).toISOString().split('T')[0] : '',
        end_date: initialData?.end_date ? new Date(initialData.end_date).toISOString().split('T')[0] : '',
        reg_start_at: initialData?.reg_start_at ? new Date(initialData.reg_start_at).toISOString().slice(0, 16) : '',
        reg_end_at: initialData?.reg_end_at ? new Date(initialData.reg_end_at).toISOString().slice(0, 16) : '',
        details_url: initialData?.details_url || '',
        poster_url: initialData?.poster_url || '',
        entry_fee: initialData?.entry_fee || '',
        bank_name: initialData?.bank_name || '',
        account_number: initialData?.account_number || '',
        account_holder: initialData?.account_holder || ''
    })

    // Fetch Admin Categories
    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase.from('admin_categories').select('*')
            if (data) {
                setAdminCats(data as unknown as AdminCategory[])
            }
            setIsSettingsLoaded(true)
        }
        fetchSettings()
    }, [])

    // Initialize Categories from Props
    useEffect(() => {
        if (initialData?.divs) {
            const loadedCats: Category[] = []

            Object.entries(initialData.divs).forEach(([catName, divNames]) => {
                const divisions = divNames.map(dName => ({
                    name: dName,
                    cap: initialData.div_caps?.[dName] || 0
                }))
                loadedCats.push({ name: catName, divisions })
            })
            setCategories(loadedCats)
        }
    }, [initialData])

    // Handlers
    const addCategory = () => {
        if (!isSettingsLoaded) return
        const defaultName = adminCats.length > 0 ? adminCats[0].name : '새 종별'
        setCategories([...categories, { name: defaultName, divisions: [] }])
    }

    const removeCategory = (index: number) => {
        const newCats = [...categories]
        newCats.splice(index, 1)
        setCategories(newCats)
        const newGens = { ...generators }
        delete newGens[index]
        setGenerators(newGens)
    }

    const handleCategoryNameChange = (index: number, name: string) => {
        const newCats = [...categories]
        newCats[index].name = name
        setCategories(newCats)
    }

    const addDivision = (catIndex: number, divName: string = '') => {
        const newCats = [...categories]
        const catName = newCats[catIndex].name

        // Find admin setting for this category to get standard divisions
        const adminCat = adminCats.find(c => c.name === catName)
        const standardDivs = adminCat?.divisions || []

        const defaultName = divName || (standardDivs[0] || 'New Division')

        newCats[catIndex].divisions.push({ name: defaultName, cap: 12 })
        setCategories(newCats)
    }

    const removeDivision = (catIndex: number, divIndex: number) => {
        const newCats = [...categories]
        newCats[catIndex].divisions.splice(divIndex, 1)
        setCategories(newCats)
    }

    const updateDivision = (catIndex: number, divIndex: number, field: 'name' | 'cap', value: string | number) => {
        const newCats = [...categories]
        if (field === 'name') newCats[catIndex].divisions[divIndex].name = value as string
        if (field === 'cap') newCats[catIndex].divisions[divIndex].cap = value as number
        setCategories(newCats)
    }

    // Generator State
    interface GeneratorState {
        gender: string // '남성' | '여성' | '혼성'
        selectedCatId: string // AdminCategory.id
        selectedDivisions: string[]
        selectedAges: string[]
    }
    const [generators, setGenerators] = useState<Record<number, GeneratorState>>({})

    const getGen = (cIdx: number): GeneratorState => {
        return generators[cIdx] || {
            gender: '남성',
            selectedCatId: '',
            selectedDivisions: [],
            selectedAges: []
        }
    }

    const updateGenerator = (cIdx: number, field: keyof GeneratorState, value: string | string[]) => {
        setGenerators(prev => {
            const current = prev[cIdx] || {
                gender: '남성',
                selectedCatId: '',
                selectedDivisions: [],
                selectedAges: []
            }
            return {
                ...prev,
                [cIdx]: { ...current, [field]: value }
            }
        })
    }

    const toggleGeneratorItem = (cIdx: number, field: 'selectedDivisions' | 'selectedAges', item: string) => {
        const current = getGen(cIdx)
        const list = current[field]
        const newList = list.includes(item)
            ? list.filter(i => i !== item)
            : [...list, item]
        updateGenerator(cIdx, field, newList)
    }

    const applyGenerator = (cIdx: number) => {
        const gen = getGen(cIdx)
        const currentCat = categories[cIdx]

        // Validation
        if (!gen.selectedCatId) {
            alert('종별을 선택해주세요.')
            return
        }
        if (gen.selectedDivisions.length === 0) {
            alert('디비전을 최소 하나 이상 선택해주세요.')
            return
        }

        // Find Admin Category to get the name if needed, but we used selectedCatId to filter options
        // actually we want to use the Admin Category Name for the main category?
        // Wait, the user said "Category Selection" determines the options.
        // And the "Category" in the list (categories[cIdx]) is what we are building.
        // Usually we want to set categories[cIdx].name to the selected category name if it's "New Category"
        // But the user might want to mix?
        // Let's assume if it's "새 종별", we update it.
        const adminCat = adminCats.find(ac => ac.id === gen.selectedCatId)
        if (!adminCat) return

        const newCats = [...categories]
        // Update category name if it's generic
        if (newCats[cIdx].name === '새 종별' || newCats[cIdx].name === 'New Category') {
            newCats[cIdx].name = adminCat.name
        }

        // Generate Combinations
        // Format: [Gender] Division Age (e.g. 남성 i1 U10) or just i1 U10 depending on gender?
        // User didn't specify format, but said "Gender selection first".
        // Let's include gender in the name if it's not the default or maybe always?
        // Let's use "${Gender} ${Division} ${Age}" to be safe and explicit.

        const generatedNames: string[] = []

        // Cartesian Product: Divisions x Ages
        // If Ages is empty, just Divisions
        const ages = gen.selectedAges.length > 0 ? gen.selectedAges : ['']

        gen.selectedDivisions.forEach(div => {
            ages.forEach(age => {
                // Construct Name
                // If Gender is '남성' maybe omit? No, let's keep it explicit for now or make it a prefix.
                // Actually, often "Youth" doesn't need "Male" if it's implicit, but checking the boxes is safer.
                // Let's try: "i1 U12" (if gender is handled by category?)
                // NO, the user requested Gender Selection.
                // Maybe the output should be: "남성 i1 U10"

                const parts = []
                if (gen.gender === '여성') {
                    parts.push(`${div}W`)
                } else {
                    if (gen.gender) parts.push(gen.gender)
                    parts.push(div)
                }

                if (age) parts.push(age)

                const combinedName = parts.join(' ')
                generatedNames.push(combinedName)
            })
        })

        // Add to divisions list
        generatedNames.forEach(name => {
            if (!newCats[cIdx].divisions.some(d => d.name === name)) {
                newCats[cIdx].divisions.push({ name: name, cap: 12 })
            }
        })

        // Sort by name (simple sort)
        newCats[cIdx].divisions.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))

        setCategories(newCats)
        // Reset selections? Maybe keep them for rapid addition? Let's keep them.
    }

    // Place Handlers
    const addPlace = () => {
        if (!placeInput.trim()) return
        const isDuplicate = places.some(p => {
            if (typeof p === 'string') return p === placeInput.trim()
            return p.name === placeInput.trim()
        })

        if (!isDuplicate) {
            setPlaces([...places, placeInput.trim()])
        }
        setPlaceInput('')
    }

    const handlePlaceSelect = (place: Place) => {
        const isDuplicate = places.some(p => {
            if (typeof p === 'string') return p === place.name
            return p.name === place.name
        })

        if (!isDuplicate) {
            setPlaces([...places, place])
        }
    }

    const removePlace = (idx: number) => {
        setPlaces(places.filter((_, i) => i !== idx))
    }

    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deletePassword, setDeletePassword] = useState('')

    const handleDeleteTrigger = () => {
        if (!initialData?.id) return
        setShowDeleteModal(true)
    }

    const handleDeleteConfirm = async (password: string) => {
        if (!initialData?.id) return

        if (!process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
            alert('환경변수 설정 오류: 관리자 비밀번호가 설정되지 않았습니다.')
            return
        }

        if (password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
            alert('비밀번호가 일치하지 않습니다.')
            return
        }

        try {
            setIsDeleteLoading(true)
            const res = await deleteTournament(initialData.id)
            if (res.success) {
                alert('삭제되었습니다.')
                router.push('/admin')
            } else {
                alert('삭제 실패: ' + res.error)
            }
        } catch (e: any) {
            console.error(e)
            alert('오류가 발생했습니다: ' + e.message)
        } finally {
            setIsDeleteLoading(false)
            setShowDeleteModal(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const divsObj: Record<string, string[]> = {}
        const divCapsObj: Record<string, number> = {}

        categories.forEach(cat => {
            if (!cat.name) return
            const validDivs = cat.divisions.filter(d => d.name)
            if (validDivs.length > 0) {
                divsObj[cat.name] = validDivs.map(d => d.name)
                validDivs.forEach(d => {
                    divCapsObj[d.name] = d.cap
                })
            }
        })

        const payload = {
            ...formData,
            divs: divsObj,
            div_caps: divCapsObj,
            places: places
        }

        try {
            if (isEdit && initialData?.id) {
                const { error } = await supabase.from('tournaments')
                    .update(payload as any).eq('id', initialData.id)
                if (error) throw error
                alert('수정되었습니다.')
                router.refresh()
            } else {
                const { error } = await supabase.from('tournaments').insert(payload as any)
                if (error) throw error
                router.push('/admin')
            }
        } catch (err: any) {
            console.error(err)
            alert('오류: ' + err.message)
        } finally {
            setLoading(false)
        }
    }



    return (
        <form onSubmit={handleSubmit} className="w-full px-4 md:px-8 pb-32 max-w-[1920px] mx-auto min-h-screen">
            <div className="flex items-center gap-4 py-6 border-b border-gray-100 mb-6 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
                <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-gray-500" />
                </Link>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900">{isEdit ? '대회 수정' : '새 대회 만들기'}</h1>
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-500 font-medium">Coming Soon / {isEdit ? 'Edit' : 'New'}</span>
                </div>
                <div className="ml-auto flex gap-3">
                    <Link href="/admin/settings/categories" target="_blank" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                        <Settings2 className="w-3 h-3" /> 종별 설정 관리
                    </Link>
                    <button
                        type="button"
                        onClick={() => router.refresh()}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400"
                    >
                        <RefreshCcw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Column (Fixed Width) */}
                <div className="lg:w-[380px] xl:w-[420px] flex-shrink-0 space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/80 space-y-5">
                        <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-bold text-gray-900">기본 정보</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">대회명</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-gray-900 transition-all"
                                    placeholder="예: 2026 BDR 윈터컵"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">대회 상태</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="준비중">준비중</option>
                                    <option value="접수중">접수중</option>
                                    <option value="대기접수">대기접수</option>
                                    <option value="마감임박">마감임박</option>
                                    <option value="마감">마감</option>
                                    <option value="종료">종료</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">대회 성별</label>
                                <select
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="mixed">혼성 (구분없음)</option>
                                    <option value="male">남자</option>
                                    <option value="female">여자</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1.5">시작일</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.start_date}
                                        onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1.5">종료일</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.end_date}
                                        onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50"
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
                                <h3 className="text-xs font-bold text-blue-800 flex items-center gap-1">
                                    <Check className="w-3 h-3" /> 접수 기간 설정
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-blue-600 mb-1">접수 시작</label>
                                        <input
                                            type="datetime-local"
                                            value={formData.reg_start_at}
                                            onChange={e => setFormData({ ...formData, reg_start_at: e.target.value })}
                                            className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-blue-600 mb-1">접수 종료</label>
                                        <input
                                            type="datetime-local"
                                            value={formData.reg_end_at}
                                            onChange={e => setFormData({ ...formData, reg_end_at: e.target.value })}
                                            className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Info (New) */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/80 space-y-4">
                        <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
                            <CreditCard className="w-5 h-5 text-green-600" />
                            <h2 className="text-lg font-bold text-gray-900">참가비 및 입금 정보</h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">참가비 (팀당)</label>
                                <input
                                    type="text"
                                    value={formData.entry_fee}
                                    onChange={e => setFormData({ ...formData, entry_fee: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                    placeholder="예: 200,000원"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5">은행명</label>
                                    <input
                                        type="text"
                                        value={formData.bank_name}
                                        onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50"
                                        placeholder="예: 카카오"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5">예금주</label>
                                    <input
                                        type="text"
                                        value={formData.account_holder}
                                        onChange={e => setFormData({ ...formData, account_holder: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50"
                                        placeholder="예: 홍길동"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">계좌번호 (하이픈 없이)</label>
                                <input
                                    type="text"
                                    value={formData.account_number}
                                    onChange={e => setFormData({ ...formData, account_number: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none font-mono"
                                    placeholder="123456789012"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Places Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/80 space-y-4">
                        <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
                            <MapPin className="w-5 h-5 text-orange-600" />
                            <h2 className="text-lg font-bold text-gray-900">경기장 정보</h2>
                        </div>

                        <div className="flex gap-2">
                            <input
                                value={placeInput}
                                onChange={e => setPlaceInput(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all shadow-sm"
                                placeholder="체육관 이름 직접 입력"
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPlace())}
                            />
                            <button
                                type="button"
                                onClick={addPlace}
                                className="bg-gray-100 text-gray-600 px-3 rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsMapOpen(true)}
                            className="w-full bg-orange-50 text-orange-700 font-bold py-2.5 rounded-xl border border-orange-100 hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
                        >
                            <Search className="w-4 h-4" />
                            <span>TMap으로 경기장 검색</span>
                        </button>

                        <div className="space-y-2">
                            {places.map((p, idx) => {
                                const isObj = typeof p === 'object'
                                return (
                                    <div key={idx} className="bg-white border border-gray-100 p-3 rounded-xl flex items-start gap-3 shadow-sm group hover:border-orange-100 transition-all">
                                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg shrink-0">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-gray-900 text-sm truncate">
                                                {isObj ? (p as Place).name : p as string}
                                            </div>
                                            {isObj && (
                                                <div className="text-xs text-gray-500 truncate">{(p as Place).address}</div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removePlace(idx)}
                                            className="text-gray-300 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )
                            })}
                            {places.length === 0 && <span className="text-sm text-gray-400 italic block text-center py-4">등록된 경기장이 없습니다.</span>}
                        </div>
                    </div>

                    {/* Media Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/80 space-y-4">
                        <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
                            <LinkIcon className="w-5 h-5 text-purple-600" />
                            <h2 className="text-lg font-bold text-gray-900">미디어 & 링크</h2>
                        </div>

                        <div className="space-y-6">
                            <ImageUpload
                                label="대회 포스터"
                                bucket="tournaments"
                                value={formData.poster_url}
                                onChange={(url) => setFormData(prev => ({ ...prev, poster_url: url }))}
                                className="w-full"
                            />

                            <ImageUpload
                                label="상세 요강 (이미지)"
                                bucket="tournaments"
                                value={formData.details_url}
                                onChange={(url) => setFormData(prev => ({ ...prev, details_url: url }))}
                                className="w-full"
                            />
                        </div>

                        <div className="pt-4 border-t border-gray-50">
                            <label className="block text-xs font-bold text-gray-400 mb-1.5">외부 링크 (Notion 등)</label>
                            <input
                                type="text"
                                value={formData.details_url}
                                onChange={e => setFormData({ ...formData, details_url: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Division Settings (Fluid) */}
                <div className="flex-1 min-w-0 flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/80 min-h-[600px] flex flex-col">
                        <div className="flex justify-between items-center border-b border-gray-50 pb-4 mb-4">
                            <div className="flex items-center gap-2">
                                <Settings2 className="w-6 h-6 text-gray-800" />
                                <h2 className="text-xl font-bold text-gray-900">종별 및 디비전 구성</h2>
                            </div>
                            <button
                                type="button"
                                onClick={addCategory}
                                className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black shadow-lg shadow-gray-200 flex items-center gap-2 transition-all transform hover:scale-105"
                            >
                                <Plus className="w-4 h-4" /> 새 종별 추가
                            </button>
                        </div>

                        <div className="space-y-6 flex-1">
                            {categories.length === 0 && (
                                <div className="h-64 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                                    <div className="p-4 bg-white rounded-full shadow-sm mb-3">
                                        <Plus className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <p className="font-medium animate-pulse">우측 상단 버튼을 눌러 종별을 추가하세요</p>
                                </div>
                            )}

                            {categories.map((cat, cIdx) => {
                                const adminCat = adminCats.find(ac => ac.name === cat.name)
                                const divisionsOptions = adminCat?.divisions || []
                                const hasGenerator = adminCat && adminCat.divisions.length > 0 && adminCat.ages.length > 0

                                return (
                                    <div key={cIdx} className="border border-gray-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">

                                        {/* Category Header Bar: Gender Selection */}
                                        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-gray-500 mr-2">성별</span>
                                                    <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                                                        {['남성', '여성'].map(g => (
                                                            <button
                                                                key={g}
                                                                type="button"
                                                                onClick={() => {
                                                                    updateGenerator(cIdx, 'gender', g)
                                                                    const gen = getGen(cIdx)
                                                                    if (gen.selectedCatId) {
                                                                        const targetCat = adminCats.find(ac => ac.id === gen.selectedCatId)
                                                                        if (targetCat) {
                                                                            handleCategoryNameChange(cIdx, `${g} ${targetCat.name}`)
                                                                        }
                                                                    }
                                                                }}
                                                                className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${getGen(cIdx).gender === g
                                                                    ? 'bg-blue-600 text-white shadow-sm'
                                                                    : 'text-gray-500 hover:text-blue-600 hover:bg-gray-50'
                                                                    }`}
                                                            >
                                                                {g}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="h-4 w-px bg-gray-300 mx-2"></div>
                                                <span className="text-lg font-bold text-gray-900">
                                                    {cat.name}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeCategory(cIdx)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                title="종별 삭제"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="p-6">
                                            {/* Generic Division Generator */}
                                            <div className="mb-8 p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                                                <div className="flex flex-col gap-6">

                                                    {/* Step 1: Category Selection */}
                                                    <div className="space-y-2">
                                                        <span className="text-xs font-bold text-blue-900 uppercase tracking-wide flex items-center gap-1">
                                                            Step 1. 종별 선택
                                                        </span>
                                                        <div className="flex flex-wrap gap-2">
                                                            {adminCats.map(ac => {
                                                                const isSelected = getGen(cIdx).selectedCatId === ac.id
                                                                return (
                                                                    <button
                                                                        key={ac.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            updateGenerator(cIdx, 'selectedCatId', ac.id)
                                                                            updateGenerator(cIdx, 'selectedDivisions', [])
                                                                            updateGenerator(cIdx, 'selectedAges', [])

                                                                            // Auto-update Category Name
                                                                            const gen = getGen(cIdx)
                                                                            const newName = `${gen.gender} ${ac.name}`
                                                                            handleCategoryNameChange(cIdx, newName)
                                                                        }}
                                                                        className={`px-4 py-2 text-sm font-bold rounded-xl border transition-all shadow-sm ${isSelected
                                                                            ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-200'
                                                                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                                                                            }`}
                                                                    >
                                                                        {ac.name}
                                                                    </button>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>

                                                    {getGen(cIdx).selectedCatId && (() => {
                                                        const targetCat = adminCats.find(ac => ac.id === getGen(cIdx).selectedCatId)
                                                        if (!targetCat) return null
                                                        return (
                                                            <>
                                                                <div className="w-full h-px bg-blue-200/50"></div>

                                                                {/* Step 3: Divisions */}
                                                                {targetCat.divisions.length > 0 && (
                                                                    <div className="space-y-2">
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">Step 2. 디비전 (다중선택)</span>
                                                                            <span className="text-xs font-medium text-blue-600">{getGen(cIdx).selectedDivisions.length}개 선택됨</span>
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {targetCat.divisions.map(div => {
                                                                                const isSelected = getGen(cIdx).selectedDivisions.includes(div)
                                                                                return (
                                                                                    <button
                                                                                        key={div}
                                                                                        type="button"
                                                                                        onClick={() => toggleGeneratorItem(cIdx, 'selectedDivisions', div)}
                                                                                        className={`px-3 py-1.5 text-sm font-bold rounded-lg border transition-all ${isSelected
                                                                                            ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-200 shadow-sm'
                                                                                            : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                                                                                            }`}
                                                                                    >
                                                                                        {div}
                                                                                    </button>
                                                                                )
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Step 4: Ages */}
                                                                {targetCat.ages.length > 0 && (
                                                                    <div className="space-y-2">
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide">Step 3. 연령 (다중선택)</span>
                                                                            <span className="text-xs font-medium text-indigo-600">{getGen(cIdx).selectedAges.length}개 선택됨</span>
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {targetCat.ages.map(age => {
                                                                                const isSelected = getGen(cIdx).selectedAges.includes(age)
                                                                                return (
                                                                                    <button
                                                                                        key={age}
                                                                                        type="button"
                                                                                        onClick={() => toggleGeneratorItem(cIdx, 'selectedAges', age)}
                                                                                        className={`px-3 py-1.5 text-sm font-bold rounded-lg border transition-all ${isSelected
                                                                                            ? 'bg-indigo-500 text-white border-indigo-500 ring-2 ring-indigo-200 shadow-sm'
                                                                                            : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                                                                                            }`}
                                                                                    >
                                                                                        {age}
                                                                                    </button>
                                                                                )
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Generate Action */}
                                                                <div className="pt-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => applyGenerator(cIdx)}
                                                                        className="w-full py-3 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black shadow-lg shadow-gray-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                                                    >
                                                                        <Plus className="w-4 h-4" />
                                                                        <span>선택한 조합으로 디비전 생성하기</span>
                                                                    </button>
                                                                    <p className="text-center text-xs text-gray-400 mt-2">
                                                                        {getGen(cIdx).selectedDivisions.length > 0
                                                                            ? `예상 생성 결과: ${getGen(cIdx).selectedDivisions.length * (getGen(cIdx).selectedAges.length || 1)}개 디비전 (${getGen(cIdx).gender} ${targetCat.name} ...)`
                                                                            : '생성할 디비전을 선택해주세요'}
                                                                    </p>
                                                                </div>
                                                            </>
                                                        )
                                                    })()}
                                                </div>
                                            </div>

                                            {/* Division List Grid - Validated for Width */}
                                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                                {cat.divisions.map((div, dIdx) => (
                                                    <div key={dIdx} className="relative flex flex-col p-3 rounded-xl bg-white border border-gray-200 shadow-sm hover:border-blue-400 hover:shadow-md transition-all group/item">

                                                        <div className="flex justify-between items-start mb-2">
                                                            {/* Division Name Input */}
                                                            {(divisionsOptions.length > 0) ? (
                                                                <select
                                                                    value={div.name}
                                                                    onChange={(e) => updateDivision(cIdx, dIdx, 'name', e.target.value)}
                                                                    className="w-full text-sm font-bold text-gray-900 border-none p-0 focus:ring-0 bg-transparent cursor-pointer"
                                                                >
                                                                    {divisionsOptions.map(opt => (
                                                                        <option key={opt} value={opt}>{opt}</option>
                                                                    ))}
                                                                    {!divisionsOptions.includes(div.name) && <option value={div.name}>{div.name}</option>}
                                                                </select>
                                                            ) : (
                                                                <input
                                                                    type="text"
                                                                    value={div.name}
                                                                    onChange={(e) => updateDivision(cIdx, dIdx, 'name', e.target.value)}
                                                                    className="w-full text-base font-bold text-gray-900 border-none p-0 focus:ring-0 bg-transparent placeholder-gray-300"
                                                                    placeholder="이름"
                                                                />
                                                            )}

                                                            <button
                                                                type="button"
                                                                onClick={() => removeDivision(cIdx, dIdx)}
                                                                className="opacity-0 group-hover/item:opacity-100 text-gray-300 hover:text-red-500 transition-all absolute top-2 right-2"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>

                                                        {/* Cap Input */}
                                                        <div className="flex items-center gap-2 mt-auto">
                                                            <div className="flex-1 flex items-center gap-2 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
                                                                <span className="text-[10px] font-bold text-gray-400 uppercase">참가팀수</span>
                                                                <input
                                                                    type="number"
                                                                    value={div.cap}
                                                                    onChange={(e) => updateDivision(cIdx, dIdx, 'cap', parseInt(e.target.value) || 0)}
                                                                    className="w-full bg-transparent text-right text-sm font-bold text-gray-700 outline-none p-0"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Add Button */}
                                                <button
                                                    type="button"
                                                    onClick={() => addDivision(cIdx)}
                                                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all font-medium min-h-[90px]"
                                                >
                                                    <div className="p-2 bg-gray-100 rounded-full group-hover:bg-blue-100 transition-colors">
                                                        <Plus className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-xs font-bold">직접 추가</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/80 space-y-4 lg:hidden">
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-md border-t border-gray-200 z-50 flex justify-center gap-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <div className="w-full max-w-[1920px] px-4 md:px-8 flex gap-4">
                    {isEdit && (
                        <button
                            type="button"
                            onClick={handleDeleteTrigger}
                            disabled={loading}
                            className="bg-red-50 text-red-500 px-6 py-3 rounded-xl font-bold hover:bg-red-100 transition-colors flex items-center gap-2"
                        >
                            <Trash2 className="w-5 h-5" />
                            삭제하기
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-black transition-all disabled:opacity-50 shadow-xl shadow-gray-200 text-lg flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95"
                    >
                        {loading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                        {loading ? '처리 중...' : (isEdit ? '변경 사항 저장' : '대회 생성 완료')}
                    </button>
                </div>
            </div>

            <style jsx>{`
                input[type="date"], input[type="datetime-local"] {
                    display: block;
                    -webkit-appearance: none;
                }
            `}</style>

            <PlaceSearchModal
                isOpen={isMapOpen}
                onClose={() => setIsMapOpen(false)}
                onSelect={handlePlaceSelect}
            />

            {/* Delete Confirmation Modal */}
            <PasswordPromptModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteConfirm}
                title="대회 삭제 (복구 불가)"
                description="정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                isLoading={isDeleteLoading}
            />
        </form >
    )
}
