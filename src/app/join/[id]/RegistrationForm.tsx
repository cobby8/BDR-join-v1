'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, ArrowRight, Check, X, Copy, RefreshCcw, AlertCircle, Shirt, ChevronDown, Eye, EyeOff } from 'lucide-react'
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


/* ================= MAIN COMPONENT ================= */

export default function RegistrationForm({ tournament }: { tournament: any }) {
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
                            players: (t.players || []).map((p: any) => ({
                                id: p.id,
                                name: p.name,
                                backNumber: p.back_number,
                                position: p.position,
                                birth: p.birth_date,
                                isElite: p.is_elite,
                                isValid: true
                            }))
                        }))
                        if (cloneTeamId) alert('기존 신청 정보를 불러왔습니다. 내용을 확인해주세요.')
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
            const invalidPlayers = formData.players.filter(p => !p.isValid)
            if (invalidPlayers.length > 0) return '오류가 있는 선수 정보를 수정해주세요.'
        }
        return null
    }

    const handleNext = () => {
        const error = validateStep(step)
        if (error) {
            alert(error)
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
    const handleSubmit = async () => {
        if (!confirm(isEditMode ? '수정된 내용을 저장하시겠습니까?' : '신청서를 제출하시겠습니까?')) return

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

            if (res.success) {
                setStep(4) // Success Screen
            } else {
                alert((isEditMode ? '수정 실패: ' : '제출 실패: ') + res.error)
            }
        } catch (e: any) {
            alert('오류 발생: ' + e.message)
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
                            if (!formData.province) return alert('시/도를 먼저 선택해주세요.')
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
                            {(divs[formData.category] || []).map((div: string) => {
                                const capKey = `${div}`
                                const capKey2 = `${formData.category} ${div}`.trim()
                                const cap = caps[capKey] || caps[capKey2] || '-'

                                return (
                                    <button
                                        key={div}
                                        type="button"
                                        onClick={() => updateField('division', div)}
                                        className={`p-4 rounded-xl border-2 font-bold text-left transition-all flex justify-between ${formData.division === div
                                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                                            : 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <span>{div}</span>
                                        <span className="text-xs font-normal opacity-70">정원: {cap}팀</span>
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
                <p className="text-xs text-gray-500 mb-3">형식: <b>이름/등번호/포지션/생년월일(6자리)/선출여부(선출/비선출)</b></p>
                <textarea
                    className="w-full h-32 p-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 resize-none font-mono"
                    placeholder={`홍길동/7/G/010101/비선출\n강백호/10/PF/000202/선출`}
                    onBlur={(e) => {
                        if (e.target.value.trim()) {
                            if (confirm('입력한 내용으로 명단을 덮어쓰시겠습니까?')) {
                                const parsed = parseRosterText(e.target.value)
                                updateField('players', parsed)
                                e.target.value = '' // clear after paste
                            }
                        }
                    }}
                />
            </div>

            {/* List */}
            <div className="space-y-3">
                {formData.players.map((p, idx) => (
                    <div key={idx} className={`flex items-center gap-2 p-3 rounded-xl border ${p.isValid ? 'bg-white border-gray-100' : 'bg-red-50 border-red-100'}`}>
                        <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full font-bold text-xs text-gray-500">
                            {p.backNumber || '-'}
                        </div>
                        <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                            <span className="font-bold text-gray-900 truncate">{p.name || '(이름없음)'}</span>
                            <span className="text-gray-500">{p.position} / {p.birth}</span>
                            <span className={`${p.isElite ? 'text-red-500 font-bold' : 'text-gray-400'}`}>{p.isElite ? '선출' : '비선출'}</span>
                            {!p.isValid && <span className="text-red-500 text-xs sm:col-span-4">{p.error}</span>}
                        </div>
                        <button
                            type="button"
                            onClick={() => updateField('players', formData.players.filter((_, i) => i !== idx))}
                            className="p-2 text-gray-400 hover:text-red-500"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                {formData.players.length === 0 && (
                    <div className="text-center py-8 text-gray-300 text-sm">
                        위 입력창에 선수 명단을 붙여넣으세요.
                    </div>
                )}
            </div>
            <button
                type="button"
                onClick={() => updateField('players', [...formData.players, { id: Date.now().toString(), name: '', backNumber: '', position: '', birth: '', isElite: false, isValid: false, error: '직접 입력' }])}
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

            {/* Bank info only for new apps or if unpaid? Keep it for reference. */}
            <div className="bg-blue-50 p-6 rounded-2xl mb-8 max-w-sm mx-auto">
                <div className="text-blue-900 font-bold mb-1">{tournament.bank_name || '은행정보 없음'}</div>
                <div className="text-2xl font-extrabold text-blue-600 mb-2 tracking-wide font-mono">
                    {tournament.account_number || '-'}
                </div>
                <div className="text-blue-800/70 text-sm">예금주: {tournament.account_holder || '예금주'}</div>
                {tournament.entry_fee && (
                    <div className="mt-4 pt-4 border-t border-blue-100 flex justify-between items-center">
                        <span className="text-blue-800 text-sm">입금 금액</span>
                        <span className="text-xl font-bold text-blue-700">{tournament.entry_fee}</span>
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
                    className="flex-[2] py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:bg-blue-300 flex items-center justify-center gap-2"
                >
                    {isLoading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : (step === 3 ? (isEditMode ? '수정 완료' : '신청서 제출하기') : '다음')}
                </button>
            </div>
        </div>
    )
}
