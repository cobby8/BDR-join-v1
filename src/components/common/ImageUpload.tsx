'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Upload, X, Loader2 } from 'lucide-react'
import ConfirmModal from '@/components/common/ConfirmModal'

interface ImageUploadProps {
    value?: string
    onChange: (url: string) => void
    label: string
    bucket?: string
    className?: string
}

export default function ImageUpload({ value, onChange, label, bucket = 'images', className = '' }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string }>({
        isOpen: false,
        title: '',
        message: ''
    })
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
    const [dragging, setDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const processFile = async (file: File) => {
        if (!file) return

        // Basic validation
        if (!file.type.startsWith('image/')) {
            setAlertState({ isOpen: true, title: '오류', message: '이미지 파일만 업로드 가능합니다.' })
            return
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            setAlertState({ isOpen: true, title: '오류', message: '파일 크기는 5MB 이하여야 합니다.' })
            return
        }

        try {
            setUploading(true)

            // Create unique file name
            const fileExt = file.name.split('.').pop()
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
            const filePath = `${fileName}`

            // Upload to Supabase
            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file)

            if (uploadError) {
                throw uploadError
            }

            // Get Public URL
            const { data } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath)

            if (data.publicUrl) {
                onChange(data.publicUrl)
            }
        } catch (error: any) {
            console.error('Upload Error:', error)
            setAlertState({ isOpen: true, title: '오류', message: '이미지 업로드에 실패했습니다. (버킷이 존재하는지 확인해주세요)' })
        } finally {
            setUploading(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0])
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragging(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0])
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setDragging(false)
    }

    const handleRemove = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDeleteConfirmOpen(true)
    }

    const executeRemove = () => {
        onChange('')
        // Optional: Delete from storage if needed, but usually kept or handled by policy
        setIsDeleteConfirmOpen(false)
    }

    return (
        <div className={className}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>

            {value ? (
                <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-video md:aspect-[21/9] flex items-center justify-center">
                    <img src={value} alt="Preview" className="w-full h-full object-contain" />
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                        relative w-full aspect-video md:aspect-[21/9] flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all cursor-pointer space-y-3
                        ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'}
                    `}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    {uploading ? (
                        <div className="flex flex-col items-center justify-center text-blue-600">
                            <Loader2 className="w-8 h-8 animate-spin mb-3" />
                            <span className="text-sm font-bold">업로드 중...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-gray-500 text-center">
                            <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                                <Upload className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-sm font-bold text-gray-700">클릭 또는 드래그하여 이미지 업로드</p>
                            <p className="text-xs text-gray-400 mt-1">최대 5MB, JPG/PNG</p>
                        </div>
                    )}
                </div>
            )}

            <ConfirmModal
                isOpen={alertState.isOpen}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                title={alertState.title}
                description={alertState.message}
                variant="alert"
            />

            <ConfirmModal
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={executeRemove}
                title="이미지 삭제"
                description="이미지를 삭제하시겠습니까?"
                isDangerous={true}
                confirmText="삭제"
            />
        </div>
    )
}
