'use client'

import { X, AlertCircle } from 'lucide-react'

interface ConfirmModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    isDangerous?: boolean
    variant?: 'confirm' | 'alert'
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = '확인',
    cancelText = '취소',
    isDangerous = false,
    variant = 'confirm'
}: ConfirmModalProps) {
    if (!isOpen) return null

    const handleConfirm = () => {
        onConfirm()
        onClose()
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-3 rounded-full ${isDangerous ? 'bg-red-100' : 'bg-blue-100'}`}>
                            <AlertCircle className={`w-6 h-6 ${isDangerous ? 'text-red-600' : 'text-blue-600'}`} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                    </div>

                    <p className="text-gray-600 mb-6 leading-relaxed">
                        {description}
                    </p>

                    <div className="flex gap-3">
                        {variant !== 'alert' && (
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                {cancelText}
                            </button>
                        )}
                        <button
                            onClick={handleConfirm}
                            className={`flex-1 py-3 px-4 text-white font-bold rounded-xl transition-colors ${isDangerous
                                    ? 'bg-red-500 hover:bg-red-600'
                                    : 'bg-gray-900 hover:bg-black'
                                }`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
