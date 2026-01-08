import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">404</h1>
            <p className="text-gray-500">페이지를 찾을 수 없습니다.</p>
            <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                홈으로 돌아가기
            </Link>
        </div>
    )
}
