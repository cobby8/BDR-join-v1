'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Calendar, MapPin, DollarSign, Users, Trophy, Image as ImageIcon, Plus, Trash2, Save, X, Check, Search, AlertCircle, RefreshCcw, Copy, Settings2, Link as LinkIcon, Upload, CreditCard, Wand2 } from 'lucide-react'
import Image from 'next/image'
import PlaceSearchModal, { Place } from '@/components/admin/tournaments/PlaceSearchModal'
import ImageUpload from '@/components/common/ImageUpload'
// Removed uuid import
import PasswordPromptModal from '@/components/common/PasswordPromptModal'
import TournamentCopyModal from '@/components/admin/tournaments/TournamentCopyModal'
import ConfirmModal from '@/components/common/ConfirmModal'
import GameTimeInput from '@/components/admin/tournaments/GameTimeInput'
import GameBallInput from '@/components/admin/tournaments/GameBallInput'
import GameMethodInput from '@/components/admin/tournaments/GameMethodInput'
import PaymentInfoInput, { PaymentInfo } from '@/components/admin/tournaments/PaymentInfoInput'
import DivisionGeneratorModal from '@/components/admin/tournaments/DivisionGeneratorModal'

// Types
interface Division {
    name: string
    cap: number
}

interface Category {
    name: string
    divisions: Division[]
}

interface AdminDivision {
    id: string
    name: string         // e.g. "초등부", "일반부"
    divisions: string[]  // e.g. ["1학년", "2학년"] or ["디비전3", "디비전4"]
    ages: string[]       // e.g. ["8세", "9세"] (optional)
}

// Generator State
interface GeneratorState {
    gender: '남성' | '여성' | '혼성'
    selectedCatId: string
    selectedDivisions: string[]
    selectedAges: string[]
}

const normalizeCatName = (name: string) => {
    return name.replace(/^(남성|여성|혼성)\s*/, '').trim()
}

export default function TournamentForm({
    initialData,
    isEdit = false
}: {
    initialData?: any
    isEdit?: boolean
}) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [isMapOpen, setIsMapOpen] = useState(false)
    const [placeInput, setPlaceInput] = useState('')

    // Form State
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        start_date: initialData?.start_date ? initialData.start_date.split('T')[0] : '', // Fix: Parsing safe date
        end_date: initialData?.end_date ? initialData.end_date.split('T')[0] : '',       // Fix: Parsing safe date
        reg_start_at: initialData?.reg_start_at ? new Date(initialData.reg_start_at).toISOString().slice(0, 16) : '',
        reg_end_at: initialData?.reg_end_at ? new Date(initialData.reg_end_at).toISOString().slice(0, 16) : '',
        status: initialData?.status || '준비중',
        poster_url: initialData?.poster_url || '',
        details_url: initialData?.details_url || '',
        entry_fee: initialData?.entry_fee || '',
        bank_name: initialData?.bank_name || '',
        account_number: initialData?.account_number || '',
        account_holder: initialData?.account_holder || '',
        organizer: initialData?.organizer || '',
        host: initialData?.host || '',
        sponsors: initialData?.sponsors || '',
        awards: initialData?.awards || '',
        gender: initialData?.gender || 'mixed',
        game_time: initialData?.game_time || '',
        game_ball: initialData?.game_ball || '',
        game_method: initialData?.game_method || '',
        max_teams: initialData?.max_teams || 0
    })

    const [places, setPlaces] = useState<(string | Place)[]>(() => {
        if (!initialData?.places) return []
        try {
            const parsed = typeof initialData.places === 'string'
                ? JSON.parse(initialData.places)
                : initialData.places
            // Ensure compatibility with old string[] format
            return Array.isArray(parsed) ? parsed : []
        } catch {
            return []
        }
    })

    const [categories, setCategories] = useState<Category[]>(() => {
        if (!initialData?.divs) return []
        // Convert old Map/Object structure to Array
        // Expected DB Format: { "초등부": ["1학년", "2학년"], ... }
        return Object.entries(initialData.divs).map(([name, divs]: [string, any]) => ({
            name,
            divisions: Array.isArray(divs)
                ? divs.map(d => typeof d === 'string' ? { name: d, cap: 0 } : { ...d, cap: d.cap || d.max_teams || 0 })
                : []
        }))
    })



    // Admin Categories for Generator
    const [adminCats, setAdminCats] = useState<AdminDivision[]>([])
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false)

    // Handle Generate from Modal
    const handleGenerateDivisions = (gender: string, categoryName: string, selectedDivisions: string[]) => {
        const fullCatName = `${gender} ${categoryName}`.trim()

        const newCat: Category = {
            name: fullCatName,
            divisions: selectedDivisions.map(divName => ({
                name: divName,
                cap: 0 // Default cap
            }))
        }

        setCategories(prev => [...prev, newCat])
    }

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [isDeleteLoading, setIsDeleteLoading] = useState(false)

    // Alert/Confirm State
    const [alertState, setAlertState] = useState<{ isOpen: boolean, title: string, message: string, onOk?: () => void }>({ isOpen: false, title: '', message: '' })

    // Copy Modal
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [pendingLoadData, setPendingLoadData] = useState<any>(null)

    // Load Admin Categories
    useEffect(() => {
        const fetchAdminCats = async () => {
            const { data, error } = await supabase
                .from('admin_categories')
                .select('*')
                .order('created_at', { ascending: true })

            if (data) setAdminCats(data as AdminDivision[])
        }
        fetchAdminCats()
    }, [])

    // Sync Generator State with Categories - REMOVED

    /* -------------------------------------------------------------------------- */
    /*                                 Place Logic                                */
    /* -------------------------------------------------------------------------- */
    const addPlace = () => {
        if (!placeInput.trim()) return
        setPlaces([...places, placeInput.trim()])
        setPlaceInput('')
    }

    const removePlace = (index: number) => {
        setPlaces(places.filter((_, i) => i !== index))
    }

    const handlePlaceSelect = (place: Place) => {
        setPlaces([...places, place])
        setIsMapOpen(false)
    }

    /* -------------------------------------------------------------------------- */
    /*                               Category Logic                               */
    /* -------------------------------------------------------------------------- */
    const addCategory = () => {
        setCategories([...categories, { name: '', divisions: [] }])
    }

    const removeCategory = (index: number) => {
        setCategories(categories.filter((_, i) => i !== index))
    }

    const handleCategoryNameChange = (index: number, name: string) => {
        const newCats = [...categories]
        newCats[index].name = name
        setCategories(newCats)
    }

    const addDivision = (catIndex: number) => {
        const newCats = [...categories]
        newCats[catIndex].divisions.push({ name: '', cap: 0 })
        setCategories(newCats)
    }

    const removeDivision = (catIndex: number, divIndex: number) => {
        const newCats = [...categories]
        newCats[catIndex].divisions.splice(divIndex, 1)
        setCategories(newCats)
    }

    const updateDivision = (catIndex: number, divIndex: number, field: keyof Division, value: string | number) => {
        const newCats = [...categories]
        newCats[catIndex].divisions[divIndex] = {
            ...newCats[catIndex].divisions[divIndex],
            [field]: value
        }
        setCategories(newCats)
    }

    /* -------------------------------------------------------------------------- */
    /*                               Generator Logic                              */
    /* -------------------------------------------------------------------------- */
    /* -------------------------------------------------------------------------- */
    /*                               Generator Logic                              */
    /* -------------------------------------------------------------------------- */
    // Generator helpers removed - Moved to Floating Modal


    /* -------------------------------------------------------------------------- */
    /*                              Submission Logic                              */
    /* -------------------------------------------------------------------------- */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Validate
            if (!formData.name) throw new Error('대회명은 필수입니다.')
            if (categories.length === 0) throw new Error('최소 1개 이상의 종별을 생성해주세요.')

            // Transform categories to DB format
            const divsMap: Record<string, Division[]> = {}
            categories.forEach(cat => {
                if (!cat.name) return
                // Filter empty divisions
                const validDivs = cat.divisions.filter(d => d.name.trim() !== '')
                if (validDivs.length > 0) {
                    divsMap[cat.name] = validDivs
                }
            })

            // Calculate Total Cap
            let totalCap = 0
            categories.forEach(cat => {
                cat.divisions.forEach(div => {
                    totalCap += (Number(div.cap) || 0)
                })
            })

            // Exclude max_teams from payload as it's not in DB
            const { max_teams, ...restFormData } = formData

            const payload = {
                ...restFormData,
                places: JSON.stringify(places),
                divs: divsMap,
                updated_at: new Date().toISOString()
            }

            if (isEdit) {
                const { error } = await supabase
                    .from('tournaments')
                    .update(payload)
                    .eq('id', initialData.id)

                if (error) throw error
                // alert('수정되었습니다.')
                router.refresh()
                router.push('/admin/tournaments')
            } else {
                const { error } = await supabase
                    .from('tournaments')
                    .insert([{ ...payload, created_at: new Date().toISOString() }])

                if (error) throw error
                // alert('생성되었습니다.')
                router.push('/admin/tournaments')
            }

        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteTrigger = () => {
        setShowDeleteModal(true)
    }

    const handleDeleteConfirm = async () => {
        setIsDeleteLoading(true)
        try {
            const { error } = await supabase
                .from('tournaments')
                .delete()
                .eq('id', initialData.id)

            if (error) throw error
            router.push('/admin/tournaments')
        } catch (error: any) {
            alert(error.message)
            setIsDeleteLoading(false)
            setShowDeleteModal(false)
        }
    }

    // Load Data Logic
    const handleLoadData = (tour: any) => {
        setPendingLoadData(tour)
        setIsCopyModalOpen(false)
        setIsConfirmOpen(true)
    }

    const executeLoadData = () => {
        if (!pendingLoadData) return

        const d = pendingLoadData
        setFormData({
            name: d.name + ' (복사됨)',
            start_date: d.start_date ? d.start_date.split('T')[0] : '', // Fix: Parsing safe date
            end_date: d.end_date ? d.end_date.split('T')[0] : '',       // Fix: Parsing safe date
            reg_start_at: d.reg_start_at ? new Date(d.reg_start_at).toISOString().slice(0, 16) : '',
            reg_end_at: d.reg_end_at ? new Date(d.reg_end_at).toISOString().slice(0, 16) : '',
            status: '준비중',
            poster_url: d.poster_url,
            details_url: d.details_url,
            entry_fee: d.entry_fee,
            bank_name: d.bank_name,
            account_number: d.account_number,
            account_holder: d.account_holder,
            organizer: d.organizer,
            host: d.host,
            sponsors: d.sponsors,
            awards: d.awards,
            gender: d.gender || 'mixed',
            game_time: d.game_time,
            game_ball: d.game_ball,
            game_method: d.game_method,
            max_teams: d.max_teams || 0
        })

        // Places
        try {
            const parsedPlaces = typeof d.places === 'string' ? JSON.parse(d.places) : d.places
            setPlaces(Array.isArray(parsedPlaces) ? parsedPlaces : [])
        } catch {
            setPlaces([])
        }

        // Divisions
        if (d.divs) {
            const parsedCats = Object.entries(d.divs).map(([name, divs]: [string, any]) => ({
                name,
                divisions: Array.isArray(divs)
                    ? divs.map(val => typeof val === 'string' ? { name: val, cap: 0 } : { ...val, cap: val.cap || val.max_teams || 0 })
                    : []
            }))
            setCategories(parsedCats)
        }

        setIsConfirmOpen(false)
        setPendingLoadData(null)
    }

    return (
        <form onSubmit={handleSubmit} className="w-full px-4 md:px-8 pb-32 max-w-[1920px] mx-auto min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-8 mb-4 border-b border-gray-100">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        {isEdit ? '대회 수정' : '새 대회 만들기'}
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">
                        대회의 기본 정보와 모집 요강을 설정하세요.
                    </p>
                </div>
                {!isEdit && (
                    <button
                        type="button"
                        onClick={() => setIsCopyModalOpen(true)}
                        className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 shadow-sm"
                    >
                        <Copy className="w-4 h-4" />
                        이전 대회 불러오기
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

                {/* Column 1: Basic Info & Payment */}
                <div className="space-y-6">
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

                    {/* 2. Payment Info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
                        <PaymentInfoInput
                            data={{
                                entry_fee: formData.entry_fee,
                                bank_name: formData.bank_name,
                                account_number: formData.account_number,
                                account_holder: formData.account_holder
                            }}
                            onChange={(updated) => setFormData(prev => ({ ...prev, ...updated }))}
                        />
                    </div>
                </div>

                {/* Column 2: Places, Syllabus, Media */}
                <div className="space-y-6">
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
                                            {isObj && (p as Place).address && (
                                                <div className="text-xs text-gray-500 truncate mt-0.5">
                                                    {(p as Place).address}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removePlace(idx)}
                                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )
                            })}
                            {places.length === 0 && <span className="text-sm text-gray-400 italic block text-center py-4">등록된 경기장이 없습니다.</span>}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/80 space-y-4">
                        <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
                            <h2 className="text-lg font-bold text-gray-900">상세 정보</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5">주최 (Organizer)</label>
                                    <input
                                        type="text"
                                        value={formData.organizer || ''}
                                        onChange={e => setFormData({ ...formData, organizer: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="예: BDR"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5">주관 (Host)</label>
                                    <input
                                        type="text"
                                        value={formData.host || ''}
                                        onChange={e => setFormData({ ...formData, host: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="예: BDR 운영위원회"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">후원사 (Sponsors)</label>
                                <input
                                    type="text"
                                    value={formData.sponsors || ''}
                                    onChange={e => setFormData({ ...formData, sponsors: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="예: 나이키, 아디다스"
                                />
                            </div>
                            {/* Game Info with Presets */}
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5">경기 시간 (Game Time)</label>
                                    <GameTimeInput
                                        value={formData.game_time || ''}
                                        onChange={val => setFormData({ ...formData, game_time: val })}
                                    />
                                </div>
                                <div className="border-t border-dashed border-gray-100 pt-6">
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5">경기구 (Game Ball)</label>
                                    <GameBallInput
                                        value={formData.game_ball || ''}
                                        onChange={val => setFormData({ ...formData, game_ball: val })}
                                    />
                                </div>
                                <div className="border-t border-dashed border-gray-100 pt-6">
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5">대회 방식 (Method)</label>
                                    <GameMethodInput
                                        value={formData.game_method || ''}
                                        onChange={val => setFormData({ ...formData, game_method: val })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">추가 정보 (Additional Info)</label>
                                <textarea
                                    value={formData.awards || ''}
                                    onChange={e => setFormData({ ...formData, awards: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[100px]"
                                    placeholder={'우승: 500,000원\n준우승: 300,000원'}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Media Info (Poster & Details URL) */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/80 space-y-4">
                        <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
                            <Upload className="w-5 h-5 text-gray-600" />
                            <h2 className="text-lg font-bold text-gray-900">미디어 설정</h2>
                        </div>
                        <div className="space-y-4">
                            <ImageUpload
                                label="대회 포스터 (비율 3:4 권장, 최대 5MB)"
                                bucket="tournaments"
                                value={formData.poster_url}
                                onChange={(url) => setFormData(prev => ({ ...prev, poster_url: url }))}
                                className="w-full"
                            />

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-2">
                                    <LinkIcon className="w-4 h-4" />
                                    외부 상세 페이지 링크 (상세 요강)
                                </label>
                                <input
                                    type="url"
                                    value={formData.details_url}
                                    onChange={e => setFormData({ ...formData, details_url: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-gray-400"
                                    placeholder="예: https://notion.so/..., https://blog.naver.com/..."
                                />
                                <p className="text-[10px] text-gray-400 mt-1">
                                    * 상세 요강 이미지가 아닌, 노션이나 블로그 등 외부 링크를 입력해주세요.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Column 3: Divisions */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/80 min-h-[600px] flex flex-col">
                        <div className="flex justify-between items-center border-b border-gray-50 pb-4 mb-4">
                            <div className="flex items-center gap-2">
                                <Settings2 className="w-6 h-6 text-gray-800" />
                                <h2 className="text-xl font-bold text-gray-900">종별 및 디비전 구성</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsGeneratorOpen(true)}
                                className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center hover:bg-black shadow-lg shadow-gray-200 transition-all transform hover:scale-105"
                                title="새 종별 추가"
                            >
                                <Plus className="w-5 h-5" />
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
                                // Admin Category Match
                                const adminCat = adminCats.find(ac => normalizeCatName(cat.name) === ac.name)
                                const divisionsOptions = adminCat?.divisions || []

                                return (
                                    <div key={cIdx} className="border border-gray-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
                                        {/* Card Header */}
                                        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100">
                                            <div className="flex items-center gap-4">
                                                <input
                                                    value={cat.name}
                                                    onChange={(e) => handleCategoryNameChange(cIdx, e.target.value)}
                                                    className="text-lg font-bold text-gray-900 bg-transparent outline-none focus:ring-0 placeholder-gray-400"
                                                    placeholder="종별 이름 (예: 남성 일반부)"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeCategory(cIdx)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="p-6">
                                            {/* Divisions List */}
                                            <div className="space-y-3">
                                                {cat.divisions.map((div, dIdx) => (
                                                    <div key={dIdx} className="relative flex flex-col p-3 rounded-lg bg-white border border-gray-200 shadow-sm hover:border-blue-400 transition-all group/item">
                                                        {/* Row 1: Category, Division, Delete */}
                                                        <div className="flex items-center justify-between gap-2 mb-2">
                                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                <div className="min-w-0 flex-1">
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
                                                                            className="w-full text-sm font-bold text-gray-900 border-none p-0 focus:ring-0 bg-transparent placeholder-gray-300"
                                                                            placeholder="이름"
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeDivision(cIdx, dIdx)}
                                                                className="text-gray-300 hover:text-red-500 transition-all shrink-0 p-1"
                                                                title="삭제"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>

                                                        {/* Row 2: Team Count */}
                                                        <div className="flex items-center justify-end">
                                                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-100 w-full">
                                                                <span className="text-xs font-bold text-gray-400 uppercase shrink-0">참가팀수</span>
                                                                <input
                                                                    type="number"
                                                                    value={div.cap}
                                                                    onChange={(e) => updateDivision(cIdx, dIdx, 'cap', parseInt(e.target.value) || 0)}
                                                                    className="w-full bg-transparent text-right text-sm font-bold text-gray-900 outline-none p-0"
                                                                />
                                                                <span className="text-xs font-bold text-gray-400 shrink-0">팀</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {cat.divisions.length === 0 && (
                                                    <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-xl">
                                                        생성된 디비전이 없습니다.
                                                    </div>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() => addDivision(cIdx)}
                                                    className="w-full py-3 border border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    디비전 직접 추가
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
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
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                    >
                        취소
                    </button>
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

            <PasswordPromptModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteConfirm}
                title="대회 삭제 (복구 불가)"
                description="정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                isLoading={isDeleteLoading}
            />

            <TournamentCopyModal
                isOpen={isCopyModalOpen}
                onClose={() => setIsCopyModalOpen(false)}
                onSelect={handleLoadData}
            />

            <DivisionGeneratorModal
                isOpen={isGeneratorOpen}
                onClose={() => setIsGeneratorOpen(false)}
                adminCats={adminCats}
                onGenerate={handleGenerateDivisions}
            />

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={executeLoadData}
                title="설정 불러오기"
                description="현재 작성 중인 내용이 덮어씌워질 수 있습니다. 진행하시겠습니까?"
                confirmText="불러오기"
            />

            <ConfirmModal
                isOpen={alertState.isOpen}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={() => {
                    if (alertState.onOk) alertState.onOk()
                    setAlertState(prev => ({ ...prev, isOpen: false }))
                }}
                title={alertState.title}
                description={alertState.message}
                variant="alert"
            />
        </form >
    )
}
