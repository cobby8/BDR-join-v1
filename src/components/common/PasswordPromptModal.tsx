'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Eye, EyeOff, Loader2 } from 'lucide-react'

interface PasswordPromptModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (password: string) => Promise<void> | void
    title?: string
    description?: string
    isLoading?: boolean
}

export default function PasswordPromptModal({
    isOpen,
    onClose,
    onConfirm,
    title = '관리자 확인',
    description = '작업을 계속하려면 비밀번호를 입력하세요.',
    isLoading = false
}: PasswordPromptModalProps) {
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isOpen) {
            setPassword('')
            setShowPassword(false)
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!password.trim()) return
        await onConfirm(password)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-md bg-[#1a1a1a] text-white rounded-3xl p-8 shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border border-gray-800"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                        <p className="text-sm text-gray-400">{description}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-white/10"
                        disabled={isLoading}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full h-14 px-4 bg-[#2a2a2a] border-2 border-transparent focus:border-blue-500 rounded-xl text-white placeholder-gray-500 outline-none transition-all text-lg"
                            placeholder="비밀번호 입력"
                            disabled={isLoading}
                            autoComplete="current-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>

                    <div className="flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-3 rounded-xl font-bold text-gray-400 hover:bg-white/5 transition-colors"
                            disabled={isLoading}
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={!password.trim() || isLoading}
                            className="px-6 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all flex items-center gap-2"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            확인
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
