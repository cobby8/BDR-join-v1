'use client'

import Link from 'next/link'

interface JoinButtonProps {
    id: string
    status: string
    cloneTeamId?: string
}

export default function JoinButton({ id, status, cloneTeamId }: JoinButtonProps) {
    const joinUrl = `/join/${id}${cloneTeamId ? `?clone_team_id=${cloneTeamId}` : ''}`
    const isAvailable = status === '접수중' || status === '마감임박'

    return (
        <Link
            href={joinUrl}
            className={`flex-1 md:flex-none md:w-[320px] h-12 md:h-14 flex items-center justify-center rounded-xl font-bold text-lg transition-all shadow-lg active:scale-95 ${isAvailable
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
            aria-disabled={!isAvailable}
            onClick={(e) => {
                if (!isAvailable) {
                    e.preventDefault()
                }
            }}
        >
            {isAvailable ? '참가 신청하기' : `${status}된 대회입니다`}
        </Link>
    )
}
