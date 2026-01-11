'use client'

import { useState, useEffect } from 'react'
import { Clock, Plus, Settings2, Save, RotateCcw, X, Check, Copy } from 'lucide-react'

interface GameTimeInputProps {
    value: string
    onChange: (value: string) => void
}

interface Preset {
    id: string
    label: string
    value: string
}

const DEFAULT_PRESETS: Preset[] = [
    { id: 'p1', label: '7분 4Q', value: '7분 4Q' },
    { id: 'p2', label: '10분 4Q', value: '10분 4Q' },
    { id: 'p3', label: '8분 4Q', value: '8분 4Q' },
    { id: 'p4', label: '12분 4Q', value: '12분 4Q' },
]

export default function GameTimeInput({ value, onChange }: GameTimeInputProps) {
    const [presets, setPresets] = useState<Preset[]>([])
    const [isBuilderOpen, setIsBuilderOpen] = useState(false) // This is now the Modal state
    const [isCopyOpen, setIsCopyOpen] = useState(false) // Quick Select state

    // Builder State
    const [type, setType] = useState<'4Q' | '2H'>('4Q')
    const [time, setTime] = useState('7')
    const [deadTimeType, setDeadTimeType] = useState<'none' | '1min' | '4q_2min' | 'all' | 'custom'>('none')
    const [deadTimeCustom, setDeadTimeCustom] = useState('')

    // Load presets
    useEffect(() => {
        const saved = localStorage.getItem('bdr_admin_gametime_presets')
        if (saved) {
            setPresets(JSON.parse(saved))
        } else {
            setPresets(DEFAULT_PRESETS)
        }
    }, [])

    const savePresets = (newPresets: Preset[]) => {
        setPresets(newPresets)
        localStorage.setItem('bdr_admin_gametime_presets', JSON.stringify(newPresets))
    }

    const generateString = () => {
        let str = `${time}분 ${type}`

        let deadStr = ''
        switch (deadTimeType) {
            case '1min': deadStr = '1분 데드'; break;
            case '4q_2min': deadStr = '4Q 2분 데드'; break;
            case 'all': deadStr = '올데드'; break;
            case 'custom': deadStr = deadTimeCustom; break;
        }

        if (deadStr) {
            str += ` / ${deadStr}`
        }
        return str
    }

    const handleApply = () => {
        const str = generateString()
        onChange(str)
    }

    const handleSavePreset = () => {
        const str = generateString()
        const newPreset: Preset = {
            id: Date.now().toString(),
            label: str,
            value: str
        }

        // Add to beginning
        const next = [newPreset, ...presets]
        savePresets(next)
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
        <div className="space-y-2">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        className="w-full px-3 py-2 pl-9 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="예: 7분 4Q / 1분 데드"
                    />
                    <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>

                {/* Helpers (Copy / Settings) */}

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
                                                onClick={() => {
                                                    onChange(p.value)
                                                    setIsCopyOpen(false)
                                                }}
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

                {/* Settings / Open Builder Modal */}
                <button
                    type="button"
                    onClick={() => setIsBuilderOpen(true)}
                    className="p-2 rounded-xl border bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all"
                    title="프리셋 관리 및 빌더"
                >
                    <Settings2 className="w-5 h-5" />
                </button>
            </div>

            {/* Centered Modal (Builder + Presets) */}
            {isBuilderOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setIsBuilderOpen(false)}>
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-600" />
                                경기 시간 설정 및 프리셋
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
                                    onClick={() => setIsBuilderOpen(false)}
                                    className="p-1.5 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* 1. Current Setting Builder */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Time & Type */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 block">경기 방식</label>
                                        <div className="flex gap-2">
                                            <div className="flex rounded-lg bg-gray-100 p-1 flex-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setType('4Q')}
                                                    className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${type === '4Q' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                                >
                                                    쿼터제 (4Q)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setType('2H')}
                                                    className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${type === '2H' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                                >
                                                    전후반 (2H)
                                                </button>
                                            </div>
                                            <div className="w-20">
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={time}
                                                        onChange={e => setTime(e.target.value)}
                                                        className="w-full pl-2 pr-6 py-1.5 text-sm border border-gray-200 rounded-lg text-center font-bold outline-none focus:border-blue-500"
                                                    />
                                                    <span className="absolute right-2 top-1.5 text-xs text-gray-400 font-bold">분</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dead Time */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 block">데드 타임 설정</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {[
                                                { k: 'none', l: '없음' },
                                                { k: '1min', l: '1분 데드' },
                                                { k: '4q_2min', l: '4Q 2분' },
                                                { k: 'all', l: '올데드' },
                                                { k: 'custom', l: '직접입력' },
                                            ].map(opt => (
                                                <button
                                                    key={opt.k}
                                                    type="button"
                                                    onClick={() => setDeadTimeType(opt.k as any)}
                                                    className={`px-2 py-1.5 text-xs rounded-lg border transition-all ${deadTimeType === opt.k
                                                        ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {opt.l}
                                                </button>
                                            ))}
                                        </div>
                                        {deadTimeType === 'custom' && (
                                            <input
                                                type="text"
                                                value={deadTimeCustom}
                                                onChange={e => setDeadTimeCustom(e.target.value)}
                                                placeholder="예: 4쿼터 1분 데드"
                                                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg animate-in fade-in outline-none focus:border-blue-500"
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Preview & Actions */}
                                <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="text-base font-bold text-gray-900">
                                        {generateString()}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={handleSavePreset}
                                            className="px-3 py-2 text-xs bg-white text-gray-700 font-bold rounded-lg border border-gray-200 hover:bg-gray-100 flex items-center gap-1.5 shadow-sm"
                                        >
                                            <Save className="w-3.5 h-3.5" />
                                            프리셋 저장
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleApply()
                                                setIsBuilderOpen(false)
                                            }}
                                            className="px-4 py-2 text-xs bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 flex items-center gap-1.5"
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                            적용하기
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Preset List */}
                            <div className="border-t border-gray-100 pt-4">
                                <label className="text-xs font-bold text-gray-500 block mb-3">저장된 프리셋</label>
                                <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto custom-scrollbar">
                                    {presets.length === 0 ? (
                                        <p className="text-xs text-gray-400 w-full text-center py-2">저장된 프리셋이 없습니다.</p>
                                    ) : (
                                        presets.map(preset => (
                                            <div
                                                key={preset.id}
                                                onClick={() => {
                                                    onChange(preset.value)
                                                    setIsBuilderOpen(false)
                                                }}
                                                className="group relative cursor-pointer px-3 py-2 text-sm bg-white hover:bg-blue-50 text-gray-700 rounded-xl transition-all border border-gray-200 hover:border-blue-200 shadow-sm select-none"
                                            >
                                                {preset.label}
                                                <button
                                                    onClick={(e) => removePreset(preset.id, e)}
                                                    className="absolute -top-1.5 -right-1.5 bg-gray-200 text-gray-500 group-hover:bg-red-500 group-hover:text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
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
