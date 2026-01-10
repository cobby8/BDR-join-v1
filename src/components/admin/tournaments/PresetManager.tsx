'use client'

import { useState, useEffect } from 'react'
import { getPresets, savePreset, deletePreset } from '@/app/actions/admin'
import { Save, Trash2, Download, Plus, X, Settings } from 'lucide-react'
import ConfirmModal from '@/components/common/ConfirmModal'

interface PresetManagerProps {
    onLoad: (data: any) => void
    currentData: any
}

export default function PresetManager({ onLoad, currentData }: PresetManagerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [presets, setPresets] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [isSaveMode, setIsSaveMode] = useState(false)
    const [newPresetName, setNewPresetName] = useState('')
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string }>({
        isOpen: false,
        title: '',
        message: ''
    })

    useEffect(() => {
        if (isOpen) {
            loadPresets()
        }
    }, [isOpen])

    const loadPresets = async () => {
        setLoading(true)
        const res = await getPresets()
        if (res.data) {
            setPresets(res.data)
        }
        setLoading(false)
    }

    const handleSave = async () => {
        if (!newPresetName.trim()) {
            setAlertState({ isOpen: true, title: '알림', message: '프리셋 이름을 입력해주세요.' })
            return
        }

        // Extract repeatable data
        const presetData = {
            divs: currentData.divs,
            div_caps: currentData.div_caps,
            places: currentData.places,
            entry_fee: currentData.entry_fee,
            bank_name: currentData.bank_name,
            account_number: currentData.account_number,
            account_holder: currentData.account_holder
        }

        const res = await savePreset(newPresetName, presetData)
        if (res.success) {
            setAlertState({ isOpen: true, title: '성공', message: '프리셋이 저장되었습니다.' })
            setIsSaveMode(false)
            setNewPresetName('')
            loadPresets()
        } else {
            setAlertState({ isOpen: true, title: '오류', message: '저장 실패: ' + res.error })
        }
    }

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        setDeleteId(id)
        setIsOpen(false)
    }

    const executeDelete = async () => {
        if (!deleteId) return
        const res = await deletePreset(deleteId)
        if (res.success) {
            loadPresets()
        }
        setDeleteId(null)
    }

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors text-gray-700 shadow-sm"
            >
                <Settings className="w-4 h-4" />
                프리셋 관리
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-[340px] bg-white rounded-xl shadow-xl border border-gray-100 z-40 p-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-50">
                            <h3 className="font-bold text-gray-900">대회 설정 프리셋</h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Save Current */}
                        <div className="mb-6">
                            {!isSaveMode ? (
                                <button
                                    onClick={() => setIsSaveMode(true)}
                                    className="w-full flex items-center justify-center gap-2 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-colors"
                                >
                                    <Save className="w-4 h-4" />
                                    현재 설정 저장하기
                                </button>
                            ) : (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={newPresetName}
                                        onChange={(e) => setNewPresetName(e.target.value)}
                                        placeholder="프리셋 이름 (예: 정규대회 표준)"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSave}
                                            className="flex-1 py-1.5 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700"
                                        >
                                            저장
                                        </button>
                                        <button
                                            onClick={() => setIsSaveMode(false)}
                                            className="flex-1 py-1.5 bg-gray-100 text-gray-600 rounded-md text-xs font-bold hover:bg-gray-200"
                                        >
                                            취소
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* List */}
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            <p className="text-xs font-bold text-gray-400 mb-2 uppercase">저장된 프리셋</p>
                            {loading && <div className="text-center text-xs text-gray-400 py-4">로딩중...</div>}
                            {!loading && presets.length === 0 && (
                                <div className="text-center text-xs text-gray-400 py-4">저장된 프리셋이 없습니다.</div>
                            )}
                            {presets.map(p => (
                                <div key={p.id} className="group flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-100">
                                    <div className="flex-1 min-w-0 mr-3">
                                        <div className="font-bold text-gray-800 text-sm truncate">{p.name}</div>
                                        <div className="text-[10px] text-gray-400">
                                            {new Date(p.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => onLoad(p.data)}
                                            className="p-1.5 bg-white border border-gray-200 text-blue-600 rounded-md hover:border-blue-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                            title="불러오기"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteClick(e, p.id)}
                                            className="p-1.5 hover:bg-red-100 text-gray-400 hover:text-red-500 rounded-md transition-colors"
                                            title="삭제"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            <ConfirmModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={executeDelete}
                title="프리셋 삭제"
                description="선택한 프리셋을 삭제하시겠습니까?"
                isDangerous={true}
                confirmText="삭제"
            />

            <ConfirmModal
                isOpen={alertState.isOpen}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                title={alertState.title}
                description={alertState.message}
                variant="alert"
            />
        </div>
    )
}
