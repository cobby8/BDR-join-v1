'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, ArrowRight, Check, X, Copy, RefreshCcw, AlertCircle, Shirt, ChevronDown, Eye, EyeOff } from 'lucide-react'
import ConfirmModal from '@/components/common/ConfirmModal'
import { submitApplication, updateApplication } from '@/app/actions/join' // Ensure updateApplication is imported
import { useRouter, useSearchParams } from 'next/navigation'
import { KOREA_DIVISIONS } from '@/constants/korea-admin-divisions'
import { getTeamDetails } from '@/app/actions/lookup'

/* ================= UTILS & SUB-COMPONENTS ================= */

// --- 1. Jersey SVG Component ---
function JerseySVG({ color, label }: { color: string, label?: string }) {
    return (
        <div className="relative group transition-transform hover:scale-105 cursor-pointer">
            <svg width="100%" height="100%" viewBox="0 0 120 140" className="drop-shadow-md">
                <defs>
                    <filter id="shadow" x="-20%" y="-20%" width="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.1" />
                    </filter>
                </defs>
                <g filter="url(#shadow)">
                    {/* Jersey Body */}
                    <path
                        d="M35 10 L50 10 L54 22 L66 22 L70 10 L85 10 L85 34 L95 42 L95 130 L25 130 L25 42 L35 34 Z"
                        fill={color}
                        stroke="#111"
                        strokeWidth="1.5"
                    />
                    {/* Neck Line */}
                    <path d="M54 22 L60 28 L66 22" fill="none" stroke="#111" strokeWidth="2" />
                    {/* Number Slot (Visual only) */}
                    <rect x="38" y="60" width="44" height="8" rx="4" fill="rgba(255,255,255,0.25)" />
                    {/* Arm Lines */}
                    <path d="M35 34 L35 24" stroke="#111" strokeWidth="1" />
                    <path d="M85 34 L85 24" stroke="#111" strokeWidth="1" />
                </g>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-black/60 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
                    색상 변경
                </span>
            </div>
            <div className="absolute inset-x-0 bottom-4 text-center pointer-events-none">
                <span className="text-[10px] font-bold text-gray-500 bg-white/90 px-2 py-0.5 rounded-full backdrop-blur-sm border border-gray-200">
                    {label || 'HEX'}
                </span>
            </div>
        </div>
    )
}

// --- 2. Step Wizard UI Utility ---
function StepIndicator({ current, total }: { current: number; total: number }) {
    return (
        <div className="flex gap-1 mb-8">
            {Array.from({ length: total }).map((_, i) => (
                <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= current ? 'bg-blue-600' : 'bg-gray-100'
                        }`}
                />
            ))}
        </div>
    )
}

// --- 3. Roster Parser ---
interface Player {
    id: string // temp id
    name: string
    backNumber: string
    position: string
    birth: string
    isElite: boolean
    isValid?: boolean
    error?: string
}

function parseRosterText(text: string): Player[] {
    const lines = text.split('\n').filter(l => l.trim().length > 0)
    return lines.map(line => {
        // Format: 홍길동/7/G/010302/비선출
        const parts = line.split('/').map(s => s.trim())
        const [name, backNumber, position, birth, eliteStr] = parts

        const isElite = (eliteStr === '선출' || eliteStr === 'Y')
        let isValid = true
        let error = ''

        if (parts.length < 4) {
            isValid = false
            error = '형식 오류 (이름/번호/포지션/생년월일/선출여부)'
        }

        return {
            id: Math.random().toString(36).substr(2, 9),
            name: name || '',
            backNumber: backNumber || '',
            position: position || '',
            birth: birth || '',
            isElite,
            isValid,
            error
        }
    })
}


// ... imports

/* ================= MAIN COMPONENT ================= */

export default function RegistrationForm({ tournament, divisionCounts = {} }: { tournament: any; divisionCounts?: Record<string, number> }) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Check Search Params
    const cloneTeamId = searchParams.get('clone_team_id')
    const editTeamId = searchParams.get('edit_team_id')
    const isEditMode = !!editTeamId

    const [step, setStep] = useState(0) // 0:Info, 1:Div, 2:Uniform, 3:Roster, 4:Result
    const [isLoading, setIsLoading] = useState(false)
    const [isFetchingInfo, setIsFetchingInfo] = useState(false)

    // Modal State for Regions
    const [regionModal, setRegionModal] = useState<'none' | 'province' | 'city'>('none')
    const [showPassword, setShowPassword] = useState(false)

    // Alert & Confirm States
    const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string }>({
        isOpen: false,
        title: '',
        message: ''
    })
    const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false)
    const [rosterConfirmOpen, setRosterConfirmOpen] = useState(false)
    const [pendingRosterText, setPendingRosterText] = useState('')

    // Form State
    const [formData, setFormData] = useState({
        // Step 0: Base Info
        province: '',
        city: '',
        teamNameKo: '',
        teamNameEn: '',
        managerName: '',
        managerPhone: '',
        password: '',

        // Step 1: Category/Division
        category: '',
        division: '',

        // Step 2: Uniform
        uniformHome: '#ff0000',
        uniformAway: '#ffffff',

        // Step 3: Players
        players: [] as Player[]
    })

    // Load Data Effect (Clone OR Edit)
    useEffect(() => {
        const targetId = editTeamId || cloneTeamId
        if (targetId) {
            setIsFetchingInfo(true)
            getTeamDetails(targetId)
                .then(res => {
                    if (res.success && res.data) {
                        const t = res.data
                        setFormData(prev => ({
                            ...prev,
                            province: t.province || '',
                            city: t.city || '',
                            teamNameKo: t.name_ko,
                            teamNameEn: t.name_en || '',
                            managerName: t.manager_name,
                            managerPhone: t.manager_phone,
                            // Ensure existing selections are valid (though category/division logic in renderStep1 handles display)
                            category: t.category,
                            division: t.division,
                            uniformHome: t.uniform_home || '#ff0000',
                            uniformAway: t.uniform_away || '#ffffff',
                            players: ((t.players as unknown as any[]) || []).map((p: any) => ({
                                id: p.id,
                                name: p.name,
                                backNumber: p.back_number,
                                position: p.position,
                                birth: p.birth_date || p.birth || '',
                                isElite: p.is_elite,
                                isValid: true
                            }))
                        }))
                        if (cloneTeamId) {
                            setAlertState({ isOpen: true, title: '알림', message: '기존 신청 정보를 불러왔습니다. 내용을 확인해주세요.' })
                        }
                    }
                })
                .catch(err => console.error(err))
                .finally(() => setIsFetchingInfo(false))
        }
    }, [editTeamId, cloneTeamId])


    // Helper: Update Field
    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    // --- Validation Logic ---
    const validateStep = (currentStep: number) => {
        if (currentStep === 0) {
            if (!formData.province || !formData.city) return '지역(시/도 및 시/군/구)을 선택해주세요.'
            if (!formData.teamNameKo) return '팀명(한글)을 입력해주세요.'
            if (!formData.teamNameEn) return '팀명(영문)을 입력해주세요.'
            if (!formData.managerName) return '대표자 이름을 입력해주세요.'
            if (!formData.managerPhone || formData.managerPhone.length < 10) return '올바른 연락처를 입력해주세요.'
            if (!formData.password || formData.password.length < 4) return '비밀번호를 4자리 이상 입력해주세요.'
        }
        if (currentStep === 1) {
            if (!formData.category) return '종별을 선택해주세요.'
            if (!formData.division) return '디비전을 선택해주세요.'
        }
        if (currentStep === 3) {
            if (formData.players.length < 5) return '최소 5명의 선수를 등록해야 합니다.'

            // Check for valid flags
            const invalidPlayers = formData.players.filter(p => !p.isValid)
            if (invalidPlayers.length > 0) return '오류가 있는 선수 정보를 수정해주세요.'

            // 1. Back Number Check
            const backNumbers = formData.players.map(p => p.backNumber)
            const uniqueBackNumbers = new Set(backNumbers)
            if (backNumbers.length !== uniqueBackNumbers.size) return '등번호가 중복된 선수가 있습니다.'

            // 2. Name + Birth Check (Warning logic or Block logic? User said "Validation", implies blocking)
            const uniquePlayers = new Set(formData.players.map(p => `${p.name}-${p.birth}`))
            if (formData.players.length !== uniquePlayers.size) return '이름과 생년월일이 동일한 선수가 중복 등록되어 있습니다.'
        }
        return null
    }

    const handleNext = () => {
        const error = validateStep(step)
        if (error) {
            setAlertState({ isOpen: true, title: '알림', message: error })
            return
        }
        setStep(prev => prev + 1)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handlePrev = () => {
        setStep(prev => prev - 1)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // --- Submission ---
    const handleSubmit = () => {
        setSubmitConfirmOpen(true)
    }

    const executeSubmit = async () => {
        setIsLoading(true)
        try {
            const payload = {
                tournamentId: tournament.id,
                teamNameKo: formData.teamNameKo,
                teamNameEn: formData.teamNameEn,
                managerName: formData.managerName,
                managerPhone: formData.managerPhone,
                province: formData.province,
                city: formData.city,
                category: formData.category,
                division: formData.division,
                uniformHome: formData.uniformHome,
                uniformAway: formData.uniformAway,
                players: formData.players
            }

            let res
            if (isEditMode && editTeamId) {
                res = await updateApplication(editTeamId, payload)
            } else {
                res = await submitApplication(payload)
            }

            if (res?.success) {
                setStep(4) // Success Screen
            } else {
                setAlertState({ isOpen: true, title: '제출 실패', message: (isEditMode ? '수정 실패: ' : '제출 실패: ') + (res?.error || '알 수 없는 오류') })
            }
        } catch (e: any) {
            setAlertState({ isOpen: true, title: '오류', message: '오류 발생: ' + e.message })
        } finally {
            setIsLoading(false)
        }
    }

    // --- Renderers ---

    // Step 0: Basic Info
    const renderStep0 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            <h2 className="text-xl font-bold text-gray-900">① 팀 기본정보를 입력해주세요</h2>
            {isFetchingInfo && <div className="text-blue-500 text-sm animate-pulse">기존 정보를 불러오는 중입니다...</div>}

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">시/도</label>
                    <button
                        type="button"
                        onClick={() => setRegionModal('province')}
                        className={`w-full p-4 text-left border rounded-xl flex justify-between items-center transition-all ${formData.province ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' : 'bg-white border-gray-200 text-gray-400'
                            }`}
                    >
                        {formData.province || '선택'}
                        <ChevronDown className="w-4 h-4 opacity-50" />
                    </button>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">시/군/구</label>
                    <button
                        type="button"
                        onClick={() => {
                            if (!formData.province) {
                                setAlertState({ isOpen: true, title: '알림', message: '시/도를 먼저 선택해주세요.' })
                                return
                            }
                            setRegionModal('city')
                        }}
                        className={`w-full p-4 text-left border rounded-xl flex justify-between items-center transition-all ${formData.city ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' : 'bg-white border-gray-200 text-gray-400'
                            }`}
                    >
                        {formData.city || '선택'}
                        <ChevronDown className="w-4 h-4 opacity-50" />
                    </button>
                    {/* Region Selection Modal */}
                    {regionModal !== 'none' && (
                        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                            <div
                                className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 max-h-[80vh] flex flex-col"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-gray-900">
                                        {regionModal === 'province' ? '시/도를 선택해주세요' : `${formData.province} > 시/군/구 선택`}
                                    </h3>
                                    <button onClick={() => setRegionModal('none')} className="p-2 hover:bg-gray-100 rounded-full">
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>
                                <div className="overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3 p-1">
                                    {regionModal === 'province'
                                        ? Object.keys(KOREA_DIVISIONS).map(prov => (
                                            <button
                                                key={prov}
                                                onClick={() => {
                                                    updateField('province', prov)
                                                    updateField('city', '') // Reset city
                                                    setRegionModal('none')
                                                }}
                                                className={`p-4 rounded-xl font-bold text-sm transition-all ${formData.province === prov
                                                    ? 'bg-blue-600 text-white shadow-md transform scale-105'
                                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {prov}
                                            </button>
                                        ))
                                        : (KOREA_DIVISIONS[formData.province] || []).map(city => (
                                            <button
                                                key={city}
                                                onClick={() => {
                                                    updateField('city', city)
                                                    setRegionModal('none')
                                                }}
                                                className={`p-4 rounded-xl font-bold text-sm transition-all ${formData.city === city
                                                    ? 'bg-blue-600 text-white shadow-md transform scale-105'
                                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {city}
                                            </button>
                                        ))
                                    }
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">팀명 (한글)</label>
                <input
                    type="text"
                    placeholder="예: 슬로우"
                    value={formData.teamNameKo}
                    onChange={(e) => updateField('teamNameKo', e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">팀명 (영문) <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    placeholder="예: SLOW"
                    value={formData.teamNameEn}
                    onChange={(e) => updateField('teamNameEn', e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">대표자 이름</label>
                    <input
                        type="text"
                        placeholder="이름"
                        value={formData.managerName}
                        onChange={(e) => updateField('managerName', e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                        autoComplete="name"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">연락처</label>
                    <input
                        type="tel"
                        placeholder="01012345678"
                        maxLength={11}
                        value={formData.managerPhone}
                        onChange={(e) => updateField('managerPhone', e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                        autoComplete="tel"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">비밀번호 (신청서 수정/조회용) <span className="text-red-500">*</span></label>
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="4자리 이상 입력해주세요"
                        value={formData.password}
                        onChange={(e) => updateField('password', e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium pr-12"
                        autoComplete="new-password"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                </div>
                <p className="text-xs text-gray-500">※ 추후 신청서를 수정하거나 조회할 때 필요합니다. 꼭 기억해주세요.</p>
            </div>
        </div>
    )

    // Step 1: Category
    const renderStep1 = () => {
        // Parse divs from tournament JSON
        // divs: { "일반부": ["D3", "D4"], ... }
        const divs = tournament.divs && typeof tournament.divs === 'object' ? tournament.divs : {}
        // divCaps: { "D3": 16, "일반부 D3": 16 }
        const caps = tournament.div_caps || {}

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-bold text-gray-900">② 참가할 종별을 선택해주세요</h2>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">종별</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {Object.keys(divs).map(cat => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => { updateField('category', cat); updateField('division', ''); }}
                                className={`p-4 rounded-xl border-2 font-bold text-sm transition-all ${formData.category === cat
                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                    : 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                        {Object.keys(divs).length === 0 && <div className="text-gray-400 text-sm p-4">설정된 종별이 없습니다.</div>}
                    </div>
                </div>

                {formData.category && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                        <label className="text-sm font-bold text-gray-700">디비전 (모집정원 확인)</label>
                        <div className="grid grid-cols-1 gap-3">
                            {(divs[formData.category] || []).map((div: any) => {
                                const divName = typeof div === 'string' ? div : div.name
                                const divCap = typeof div === 'object' && div.cap ? div.cap : undefined

                                const capKey = `${divName}`
                                const capKey2 = `${formData.category} ${divName}`.trim()
                                const capStr = divCap || caps[capKey] || caps[capKey2] || '-'
                                const cap = Number(capStr)
                                // Calculate Current Count with smart matching
                                let current = divisionCounts[divName] ||
                                    divisionCounts[`${formData.category} ${divName}`] ||
                                    divisionCounts[`${formData.category}${divName}`] || 0

                                // If still 0, try finding keys that *end with* the division name (e.g. "남성 D7" matches "D7")
                                if (current === 0) {
                                    Object.keys(divisionCounts).forEach(key => {
                                        // Check if key ends with divName (e.g. "남성 D7" ends with "D7") and includes category part?
                                        // Logic: If DB is "남성 D7", and divName is "D7".
                                        if (key.endsWith(divName) || key.includes(divName)) {
                                            // Be careful of overlap (e.g. D7 matching D70). 
                                            // Split by space check is safer
                                            const parts = key.split(' ')
                                            if (parts.includes(divName)) {
                                                current += divisionCounts[key]
                                            }
                                        }
                                    })
                                }

                                const isFull = !isNaN(cap) && current >= cap

                                return (
                                    <button
                                        key={divName}
                                        type="button"
                                        onClick={() => updateField('division', divName)}
                                        className={`p-4 rounded-xl border-2 text-left transition-all flex justify-between items-center ${formData.division === divName
                                            ? (isFull ? 'border-orange-500 bg-orange-50 text-orange-900' : 'border-blue-600 bg-blue-50 text-blue-700')
                                            : 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-bold flex items-center gap-2">
                                                {divName}
                                                {isFull && (
                                                    <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-extrabold border border-orange-200">
                                                        대기접수
                                                    </span>
                                                )}
                                            </span>
                                            {isFull && <span className="text-xs text-orange-600/70 font-medium">정원 초과 (현재 {current}팀)</span>}
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-xs font-bold ${isFull ? 'text-orange-600' : 'opacity-70'}`}>
                                                {!isNaN(cap) ? `${current}/${cap}팀` : `정원: ${capStr}`}
                                            </span>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // Step 2: Uniform
    const renderStep2 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold text-gray-900">③ 유니폼 색상을 설정해주세요</h2>
            <p className="text-sm text-gray-500">심판진이 경기 중 식별하기 위해 필요합니다.</p>

            <div className="grid grid-cols-2 gap-8">
                {/* Home */}
                <div className="text-center space-y-4 relative group">
                    <label htmlFor="homeColor" className="block cursor-pointer">
                        <div className="w-32 h-40 mx-auto">
                            <JerseySVG color={formData.uniformHome} label="HOME" />
                        </div>
                    </label>
                    <div className="relative">
                        <input
                            id="homeColor"
                            type="color"
                            value={formData.uniformHome}
                            onChange={(e) => updateField('uniformHome', e.target.value)}
                            className="w-full h-12 cursor-pointer rounded-xl border border-gray-200 p-1 bg-white opacity-0 absolute inset-0 z-10"
                        />
                        <div className="w-full h-12 rounded-xl border border-gray-200 flex items-center justify-center gap-2 bg-white text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors pointer-events-none">
                            <div className="w-4 h-4 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: formData.uniformHome }}></div>
                            <span className="uppercase">{formData.uniformHome}</span>
                        </div>
                        <div className="mt-2 text-xs text-blue-500 font-medium">터치하여 색상 변경</div>
                    </div>
                </div>

                {/* Away */}
                <div className="text-center space-y-4 relative group">
                    <label htmlFor="awayColor" className="block cursor-pointer">
                        <div className="w-32 h-40 mx-auto">
                            <JerseySVG color={formData.uniformAway} label="AWAY" />
                        </div>
                    </label>
                    <div className="relative">
                        <input
                            id="awayColor"
                            type="color"
                            value={formData.uniformAway}
                            onChange={(e) => updateField('uniformAway', e.target.value)}
                            className="w-full h-12 cursor-pointer rounded-xl border border-gray-200 p-1 bg-white opacity-0 absolute inset-0 z-10"
                        />
                        <div className="w-full h-12 rounded-xl border border-gray-200 flex items-center justify-center gap-2 bg-white text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors pointer-events-none">
                            <div className="w-4 h-4 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: formData.uniformAway }}></div>
                            <span className="uppercase">{formData.uniformAway}</span>
                        </div>
                        <div className="mt-2 text-xs text-blue-500 font-medium">터치하여 색상 변경</div>
                    </div>
                </div>
            </div>
        </div>
    )

    // Step 3: Roster
    const renderStep3 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end">
                <h2 className="text-xl font-bold text-gray-900">④ 선수 명단 (최소 5명)</h2>
                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">현재 {formData.players.length}명</div>
            </div>

            {/* Paste Area */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <RefreshCcw className="w-4 h-4 text-blue-500" /> 일괄 명단 붙여넣기
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                    형식: <b>이름/등번호/포지션/생년월일(6자리)/선출여부</b> (예: 홍길동/7/G/010101/비선출)
                </p>
                <div className="relative">
                    <textarea
                        className="w-full h-32 p-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 resize-none font-mono mb-2"
                        placeholder={`홍길동/7/G/010101/비선출\n강백호/10/PF/000202/선출`}
                        value={pendingRosterText}
                        onChange={(e) => setPendingRosterText(e.target.value)}
                    />
                    <button
                        type="button"
                        onClick={() => {
                            if (pendingRosterText.trim()) {
                                setRosterConfirmOpen(true)
                            } else {
                                setAlertState({ isOpen: true, title: '알림', message: '명단을 입력해주세요.' })
                            }
                        }}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors"
                    >
                        명단 적용하기
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="space-y-3">
                {formData.players.map((p, idx) => (
                    <div key={idx} className={`flex flex-col sm:flex-row items-center gap-2 p-3 rounded-xl border ${p.isValid ? 'bg-white border-gray-100' : 'bg-red-50 border-red-100'}`}>
                        <div className="w-10 shrink-0">
                            <input
                                placeholder="NO"
                                value={p.backNumber}
                                onChange={(e) => {
                                    const newPlayers = [...formData.players]
                                    newPlayers[idx].backNumber = e.target.value
                                    updateField('players', newPlayers)
                                }}
                                className="w-full text-center bg-gray-100 rounded-lg py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex-1 grid grid-cols-4 gap-2 w-full">
                            <input
                                placeholder="이름"
                                value={p.name}
                                onChange={(e) => {
                                    const newPlayers = [...formData.players]
                                    newPlayers[idx].name = e.target.value
                                    updateField('players', newPlayers)
                                }}
                                className="col-span-1 border-b border-gray-200 focus:border-blue-500 focus:outline-none bg-transparent py-1 text-sm font-bold text-gray-900"
                            />
                            <input
                                placeholder="포지션"
                                value={p.position}
                                onChange={(e) => {
                                    const newPlayers = [...formData.players]
                                    newPlayers[idx].position = e.target.value
                                    updateField('players', newPlayers)
                                }}
                                className="col-span-1 border-b border-gray-200 focus:border-blue-500 focus:outline-none bg-transparent py-1 text-sm text-gray-600"
                            />
                            <input
                                placeholder="생년월일(6자리)"
                                maxLength={6}
                                value={p.birth}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, '')
                                    const newPlayers = [...formData.players]
                                    newPlayers[idx].birth = val
                                    updateField('players', newPlayers)
                                }}
                                className="col-span-1 border-b border-gray-200 focus:border-blue-500 focus:outline-none bg-transparent py-1 text-sm text-gray-600 tracking-wider"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    const newPlayers = [...formData.players]
                                    newPlayers[idx].isElite = !newPlayers[idx].isElite
                                    updateField('players', newPlayers)
                                }}
                                className={`col-span-1 text-sm font-bold ${p.isElite ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {p.isElite ? '선출' : '비선출'}
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => updateField('players', formData.players.filter((_, i) => i !== idx))}
                            className="p-2 text-gray-400 hover:text-red-500 self-end sm:self-center"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                {formData.players.length === 0 && (
                    <div className="text-center py-8 text-gray-300 text-sm">
                        위 입력창에 선수 명단을 붙여넣거나 직접 추가하세요.
                    </div>
                )}
            </div>
            <button
                type="button"
                onClick={() => updateField('players', [...formData.players, { id: Date.now().toString(), name: '', backNumber: '', position: '', birth: '', isElite: false, isValid: true, error: '' }])}
                className="w-full py-3 bg-white border border-dashed border-gray-300 rounded-xl text-gray-500 text-sm font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
                + 선수 직접 추가
            </button>
        </div>
    )

    // Step 4: Success
    const renderStep4 = () => (
        <div className="text-center py-12 animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 stroke-[3]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {isEditMode ? '수정이 완료되었습니다!' : '신청이 완료되었습니다!'}
            </h2>
            <p className="text-gray-500 mb-8">
                {isEditMode ? '변경된 정보를 확인해주세요.' : (
                    <>
                        아래 계좌로 참가비를 입금해주시면<br />
                        관리자 확인 후 확정됩니다.
                    </>
                )}
            </p>

            {/* Bank info */}
            <div className="bg-blue-50 p-6 rounded-2xl mb-8 max-w-sm mx-auto">
                <div className="text-blue-900 font-bold mb-1">{tournament.bank_name || '은행정보 없음'}</div>
                <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="text-2xl font-extrabold text-blue-600 tracking-wide font-mono">
                        {tournament.account_number || '-'}
                    </div>
                    {tournament.account_number && (
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(tournament.account_number)
                                setAlertState({ isOpen: true, title: '복사 완료', message: '계좌번호가 복사되었습니다.' })
                            }}
                            className="bg-white p-2 rounded-full shadow-sm border border-blue-100 hover:bg-blue-50 text-blue-500 transition-colors"
                        >
                            <Copy className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <div className="text-blue-800/70 text-sm">예금주: {tournament.account_holder || '예금주'}</div>
                {tournament.entry_fee && (
                    <div className="mt-4 pt-4 border-t border-blue-100 flex justify-between items-center">
                        <span className="text-blue-800 text-sm">입금 금액</span>
                        <span className="text-xl font-bold text-blue-700">
                            {Number(tournament.entry_fee).toLocaleString()}원
                        </span>
                    </div>
                )}
            </div>

            <div className="flex gap-3 justify-center">
                <button
                    onClick={() => router.push('/')}
                    className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                    홈으로 이동
                </button>
                <button
                    onClick={() => router.push('/lookup')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                >
                    {isEditMode ? '수정 내역 확인' : '신청내역 확인'}
                </button>
            </div>
        </div>
    )

    if (step === 4) return renderStep4()

    // Check waiting status for button
    // Ensure we handle object division correctly for waiting check logic too
    const currentDiv = typeof formData.division === 'string' ? formData.division : (formData.division as any)?.name

    // We need to find the cap for the current division
    let selectedDivCap = 0
    let selectedDivCapStr = '-'

    if (currentDiv) {
        // Try to find the division object from tournament.divs (if we can) or just check caps
        // Re-construct logic similar to renderStep1
        const capKey = `${currentDiv}`
        const capKey2 = `${formData.category} ${currentDiv}`.trim()
        selectedDivCapStr = tournament.div_caps?.[capKey] || tournament.div_caps?.[capKey2] || '-'
        selectedDivCap = Number(selectedDivCapStr)
    }

    const selectedDivCurrent = divisionCounts[currentDiv] || 0
    const isWaiting = !isNaN(selectedDivCap) && selectedDivCurrent >= selectedDivCap && currentDiv

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 p-6 md:p-8">
            <StepIndicator current={step} total={4} />

            {step === 0 && renderStep0()}
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            <div className="mt-10 pt-6 border-t border-gray-100 flex gap-3">
                {step > 0 && (
                    <button
                        type="button"
                        onClick={handlePrev}
                        className="flex-1 py-4 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors"
                    >
                        이전
                    </button>
                )}
                <button
                    type="button"
                    onClick={step === 3 ? handleSubmit : handleNext}
                    disabled={isLoading}
                    className={`flex-[2] py-4 rounded-xl text-white font-bold transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50
                        ${isWaiting && step === 3
                            ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200'
                            : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                        }`}
                >
                    {isLoading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : (
                        step === 3
                            ? (isEditMode ? '수정 완료' : (isWaiting ? '대기 접수하기' : '신청서 제출하기'))
                            : '다음'
                    )}
                </button>
            </div>

            {/* Modals */}
            <ConfirmModal
                isOpen={alertState.isOpen}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                title={alertState.title}
                description={alertState.message}
                variant="alert"
                confirmText="확인"
            />
            <ConfirmModal
                isOpen={submitConfirmOpen}
                onClose={() => setSubmitConfirmOpen(false)}
                onConfirm={executeSubmit}
                title={isEditMode ? "신청서 수정" : "신청서 제출"}
                description={isEditMode ? "입력하신 정보로 신청서를 수정하시겠습니까?" : "입력하신 정보로 참가신청서를 제출하시겠습니까?"}
                confirmText={isEditMode ? "수정하기" : "제출하기"}
            />
            <ConfirmModal
                isOpen={rosterConfirmOpen}
                onClose={() => setRosterConfirmOpen(false)}
                onConfirm={() => {
                    const parsed = parseRosterText(pendingRosterText);
                    setFormData(prev => ({ ...prev, players: [...prev.players, ...parsed] }));
                    setRosterConfirmOpen(false);
                    setPendingRosterText('');
                }}
                title="선수 명단 추가"
                description={`총 ${parseRosterText(pendingRosterText).length}명의 선수를 명단에 추가하시겠습니까?`}
                confirmText="추가하기"
            />
        </div>
    )
}
