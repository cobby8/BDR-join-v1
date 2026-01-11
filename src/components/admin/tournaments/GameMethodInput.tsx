'use client'

import { useState, useEffect } from 'react'

import { AlignLeft, Plus, Save, RotateCcw, X, Check, Copy, Settings2 } from 'lucide-react'

interface GameMethodInputProps {
    value: string
    onChange: (value: string) => void
}

interface Preset {
    id: string
    label: string
    value: string
}

const DEFAULT_PRESETS: Preset[] = [
    { id: 'm1', label: '3팀 2개조', value: '3팀 2개조 / 조별 1위간 결승전' },
    { id: 'm2', label: '4팀 풀리그', value: '4팀 1개조 / 풀리그 방식으로 순위 결정' },
    { id: 'm3', label: '토너먼트', value: '전 경기 토너먼트 진행 (패자부활전 없음)' },
]

export default function GameMethodInput({ value, onChange }: GameMethodInputProps) {
    const [presets, setPresets] = useState<Preset[]>([])
    const [isOpen, setIsOpen] = useState(false) // Manage Modal
    const [isCopyOpen, setIsCopyOpen] = useState(false) // Quick Select
    const [newPresetVal, setNewPresetVal] = useState('')

    // Load presets
    useEffect(() => {
        const saved = localStorage.getItem('bdr_admin_gamemethod_presets')
        if (saved) {
            setPresets(JSON.parse(saved))
        } else {
            setPresets(DEFAULT_PRESETS)
        }
    }, [])

    const savePresets = (newPresets: Preset[]) => {
        setPresets(newPresets)
        localStorage.setItem('bdr_admin_gamemethod_presets', JSON.stringify(newPresets))
    }

    const handleAddPreset = () => {
        if (!newPresetVal.trim()) return

        // Check duplicate
        if (presets.some(p => p.value === newPresetVal.trim())) {
            alert('이미 존재하는 프리셋입니다.')
            return
        }

        const newPreset: Preset = {
            id: Date.now().toString(),
            label: newPresetVal.trim().length > 10 ? newPresetVal.trim().slice(0, 10) + '...' : newPresetVal.trim(),
            value: newPresetVal.trim()
        }

        const next = [newPreset, ...presets]
        savePresets(next)
        setNewPresetVal('')
    }

    const removePreset = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const next = presets.filter(p => p.id !== id)
        savePresets(next)
    }

    const resetPresets = () => {
        if (confirm('모든 프리셋을 초기화하시겠습니까?')) {
            savePresets(DEFAULT_PRESETS)
        }
    }

    return (
        <div className="relative">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        className="w-full px-3 py-2 pl-9 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="예: 3팀 2개조 / 조별 1위간 결승전"
                    />
                    <AlignLeft className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>

                {/* Copy / Quick Select */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setIsCopyOpen(!isCopyOpen)}
                        className={`p-2 rounded-xl border transition-all ${isCopyOpen ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                        title="프리셋 선택"
                    >
                        <Copy className="w-5 h-5" />
                    </button>
                    {isCopyOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsCopyOpen(false)} />
                            <div className="absolute right-0 top-full mt-2 w-72 z-20 bg-white rounded-xl shadow-lg border border-gray-100 p-2 animate-in fade-in zoom-in-95 duration-200">
                                <p className="text-xs font-bold text-gray-400 px-2 py-1 mb-1">프리셋 선택</p>
                                {presets.length === 0 ? (
                                    <div className="text-center py-4 text-xs text-gray-400">저장된 프리셋이 없습니다.</div>
                                ) : (
                                    <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                                        {presets.map(p => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => {
                                                    onChange(p.value)
                                                    setIsCopyOpen(false)
                                                }}
                                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
                                            >
                                                <div className="font-medium truncate">{p.label}</div>
                                                <div className="text-xs text-gray-400 truncate">{p.value}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Settings / Manage */}
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="p-2 rounded-xl border bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all"
                    title="프리셋 관리"
                >
                    <Settings2 className="w-5 h-5" />
                </button>
            </div>

            {/* Centered Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setIsOpen(false)}>
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <AlignLeft className="w-4 h-4 text-blue-600" />
                                대회 방식 프리셋 관리
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

                        <div className="p-4 space-y-4">
                            {/* Input Form */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newPresetVal}
                                    onChange={(e) => setNewPresetVal(e.target.value)}
                                    className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                    placeholder="새 방식 입력 (예: 4팀 풀리그)"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            handleAddPreset()
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddPreset}
                                    className="px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-colors shrink-0"
                                >
                                    추가
                                </button>
                            </div>

                            {/* List */}
                            <div className="space-y-1.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                                {presets.length === 0 ? (
                                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        <p className="text-xs text-gray-400">저장된 프리셋이 없습니다.</p>
                                    </div>
                                ) : (
                                    presets.map(preset => (
                                        <div
                                            key={preset.id}
                                            onClick={() => {
                                                onChange(preset.value)
                                                setIsOpen(false)
                                            }}
                                            className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${value === preset.value
                                                ? 'bg-blue-50 border-blue-200 shadow-sm'
                                                : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-sm'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${value === preset.value ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500'
                                                    }`}>
                                                    {value === preset.value ? <Check className="w-4 h-4" /> : <AlignLeft className="w-4 h-4" />}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className={`text-sm truncate ${value === preset.value ? 'font-bold text-gray-900' : 'text-gray-900 font-medium'}`}>
                                                        {preset.label}
                                                    </p>
                                                    <p className="text-xs text-gray-400 truncate">
                                                        {preset.value}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => removePreset(preset.id, e)}
                                                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                title="삭제"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
