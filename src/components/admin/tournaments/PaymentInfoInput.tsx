'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Copy, Settings2, Check, RotateCcw, X, Save } from 'lucide-react'

// Types
export interface PaymentInfo {
    entry_fee: string
    bank_name: string
    account_number: string
    account_holder: string
}

interface PaymentInfoInputProps {
    data: PaymentInfo
    onChange: (data: Partial<PaymentInfo>) => void
}

interface PaymentPreset {
    id: string
    label: string
    data: PaymentInfo
}

const DEFAULT_PRESETS: PaymentPreset[] = []

export default function PaymentInfoInput({ data, onChange }: PaymentInfoInputProps) {
    const [presets, setPresets] = useState<PaymentPreset[]>([])
    const [isOpen, setIsOpen] = useState(false) // Modal state
    const [isCopyOpen, setIsCopyOpen] = useState(false) // Copy popover state

    // Form states for Modal
    const [form, setForm] = useState<PaymentInfo>({
        entry_fee: '',
        bank_name: '',
        account_number: '',
        account_holder: ''
    })
    const [presetName, setPresetName] = useState('')

    // Load presets
    useEffect(() => {
        const saved = localStorage.getItem('bdr_admin_payment_presets')
        if (saved) {
            setPresets(JSON.parse(saved))
        }
    }, [])

    const savePresets = (newPresets: PaymentPreset[]) => {
        setPresets(newPresets)
        localStorage.setItem('bdr_admin_payment_presets', JSON.stringify(newPresets))
    }

    const handleAddPreset = () => {
        if (!presetName.trim()) {
            alert('프리셋 이름을 입력해주세요.')
            return
        }

        const newPreset: PaymentPreset = {
            id: Date.now().toString(),
            label: presetName.trim(),
            data: { ...form }
        }

        const next = [newPreset, ...presets]
        savePresets(next)
        setPresetName('')
    }

    const removePreset = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const next = presets.filter(p => p.id !== id)
        savePresets(next)
    }

    const applyPreset = (preset: PaymentPreset) => {
        onChange(preset.data)
        setIsCopyOpen(false)
    }

    const resetPresets = () => {
        if (confirm('모든 프리셋을 초기화하시겠습니까?')) {
            savePresets([])
        }
    }

    // Helper to sync modal form with current data when opening
    useEffect(() => {
        if (isOpen) {
            setForm({ ...data })
        }
    }, [isOpen, data])

    return (
        <div className="space-y-4">
            {/* Header / Actions */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-gray-500" />
                    <h3 className="font-bold text-gray-700">참가비 및 입금 정보</h3>
                </div>
                <div className="flex gap-2">
                    {/* Copy Button (Quick Select) */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIsCopyOpen(!isCopyOpen)}
                            className={`p-2 rounded-lg border transition-all ${isCopyOpen ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                            title="프리셋 불러오기"
                        >
                            <Copy className="w-4 h-4" />
                        </button>

                        {/* Quick Select Popover */}
                        {isCopyOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsCopyOpen(false)} />
                                <div className="absolute right-0 top-full mt-2 w-64 z-20 bg-white rounded-xl shadow-lg border border-gray-100 p-2 animate-in fade-in zoom-in-95 duration-200">
                                    <p className="text-xs font-bold text-gray-400 px-2 py-1 mb-1">프리셋 선택</p>
                                    {presets.length === 0 ? (
                                        <div className="text-center py-4 text-xs text-gray-400">저장된 프리셋이 없습니다.</div>
                                    ) : (
                                        <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                                            {presets.map(p => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => applyPreset(p)}
                                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors truncate"
                                                >
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Settings Button (Manage) */}
                    <button
                        type="button"
                        onClick={() => setIsOpen(true)}
                        className="p-2 rounded-lg border bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all"
                        title="프리셋 관리"
                    >
                        <Settings2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Entry Fee */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">참가비</label>
                    <input
                        type="text"
                        value={data.entry_fee}
                        onChange={e => onChange({ entry_fee: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-all"
                        placeholder="예: 300000"
                    />
                </div>

                {/* Bank Name */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">은행명</label>
                    <input
                        type="text"
                        value={data.bank_name}
                        onChange={e => onChange({ bank_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-all"
                        placeholder="예: 카카오뱅크"
                    />
                </div>

                {/* Account Number */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">계좌번호</label>
                    <input
                        type="text"
                        value={data.account_number}
                        onChange={e => onChange({ account_number: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-all"
                        placeholder="예: 3333-01-2345678"
                    />
                </div>

                {/* Account Holder */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">예금주</label>
                    <input
                        type="text"
                        value={data.account_holder}
                        onChange={e => onChange({ account_holder: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-all"
                        placeholder="예: 홍길동"
                    />
                </div>
            </div>

            {/* Management Modal (Centered) */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setIsOpen(false)}>
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <Settings2 className="w-4 h-4 text-blue-600" />
                                결제 정보 프리셋 관리
                            </h4>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={resetPresets}
                                    className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-red-50"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    초기화
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="p-4 space-y-6">
                            {/* Make New Preset */}
                            <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <p className="text-xs font-bold text-gray-500">현재 입력된 정보로 프리셋 만들기</p>
                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                                    <div><span className="text-gray-400">참가비:</span> {data.entry_fee || '-'}</div>
                                    <div><span className="text-gray-400">은행:</span> {data.bank_name || '-'}</div>
                                    <div className="col-span-2 truncate"><span className="text-gray-400">계좌:</span> {data.account_number || '-'} ({data.account_holder || '-'})</div>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={presetName}
                                        onChange={e => setPresetName(e.target.value)}
                                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-500 bg-white"
                                        placeholder="프리셋 이름 (예: 기본 계좌)"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setForm(data) // Capture current main form data
                                            handleAddPreset()
                                        }}
                                        className="px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-black transition-colors"
                                    >
                                        저장
                                    </button>
                                </div>
                            </div>

                            {/* Preset List */}
                            <div>
                                <p className="text-xs font-bold text-gray-500 mb-2">저장된 프리셋 목록 ({presets.length})</p>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                                    {presets.length === 0 ? (
                                        <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl">
                                            <p className="text-xs text-gray-400">저장된 프리셋이 없습니다.</p>
                                        </div>
                                    ) : (
                                        presets.map(p => (
                                            <div key={p.id} className="group relative flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 truncate">{p.label}</p>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {p.data.entry_fee && `${Number(p.data.entry_fee).toLocaleString()}원 / `}
                                                        {p.data.bank_name} {p.data.account_number}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            applyPreset(p)
                                                            setIsOpen(false)
                                                        }}
                                                        className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded hover:bg-blue-100 transition-colors"
                                                    >
                                                        적용
                                                    </button>
                                                    <button
                                                        onClick={(e) => removePreset(p.id, e)}
                                                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
