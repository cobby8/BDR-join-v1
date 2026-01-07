'use client'

import { LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function LogoutButton() {
    return (
        <button
            onClick={async () => {
                await supabase.auth.signOut()
                window.location.href = '/login'
            }}
            className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 group text-left"
        >
            <LogOut className="w-5 h-5 group-hover:text-red-700" />
            로그아웃
        </button>
    )
}
