'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Plus, Trash2, User } from 'lucide-react'
import Link from 'next/link'

interface Team {
    id: string
    name_ko: string
    name_en: string | null
    manager_name: string
    manager_phone: string
    category: string
    division: string
    payment_status: string
    status: string
    tournament_id: string
}

interface Player {
    id: string
    name: string
    back_number: string | null
    position: string | null
    birth_date: string | null
    is_elite: boolean
}

export default function TeamDetailClient({ teamId, initialTeam, initialPlayers }: { teamId: string, initialTeam: Team, initialPlayers: Player[] }) {
    const router = useRouter()
    const [team, setTeam] = useState<Team>(initialTeam)
    const [players, setPlayers] = useState<Player[]>(initialPlayers)
    const [loading, setLoading] = useState(false)
    const [newPlayer, setNewPlayer] = useState({ name: '', back_number: '', position: '', birth_date: '', is_elite: false })

    // Update Team Info
    const handleUpdateTeam = async () => {
        setLoading(true)
        const { error } = await supabase.from('teams').update({
            name_ko: team.name_ko,
            manager_name: team.manager_name,
            manager_phone: team.manager_phone,
            payment_status: team.payment_status,
            status: team.status
        }).eq('id', teamId)

        if (error) alert('팀 수정 실패: ' + error.message)
        else alert('팀 정보가 수정되었습니다.')
        setLoading(false)
    }

    // Add Player
    const handleAddPlayer = async () => {
        if (!newPlayer.name) return alert('이름을 입력해주세요.')

        const payload = {
            team_id: teamId,
            name: newPlayer.name,
            back_number: newPlayer.back_number,
            position: newPlayer.position,
            birth_date: newPlayer.birth_date,
            is_elite: newPlayer.is_elite
        }

        const { data, error } = await supabase.from('players').insert(payload).select().single()

        if (error) {
            alert('선수 추가 실패: ' + error.message)
        } else if (data) {
            setPlayers([...players, data as Player])
            setNewPlayer({ name: '', back_number: '', position: '', birth_date: '', is_elite: false })
        }
    }

    // Delete Player
    const handleDeletePlayer = async (id: string) => {
        if (!confirm('정말 이 선수를 삭제하시겠습니까?')) return

        const { error } = await supabase.from('players').delete().eq('id', id)
        if (error) alert('삭제 실패: ' + error.message)
        else setPlayers(players.filter(p => p.id !== id))
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Link href="/admin/teams" className="inline-flex items-center text-gray-500 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4 mr-1" />
                목록으로
            </Link>

            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">{team.name_ko} 관리</h1>
                <button onClick={handleUpdateTeam} disabled={loading} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    <Save className="w-4 h-4" />
                    저장하기
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Team Info Card */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h2 className="font-bold text-lg border-b pb-2">팀 정보</h2>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">팀명 (한글)</label>
                        <input
                            value={team.name_ko}
                            onChange={e => setTeam({ ...team, name_ko: e.target.value })}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">대표자명</label>
                        <input
                            value={team.manager_name}
                            onChange={e => setTeam({ ...team, manager_name: e.target.value })}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">연락처</label>
                        <input
                            value={team.manager_phone}
                            onChange={e => setTeam({ ...team, manager_phone: e.target.value })}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">입금 상태</label>
                            <select
                                value={team.payment_status}
                                onChange={e => setTeam({ ...team, payment_status: e.target.value })}
                                className="w-full p-2 border rounded"
                            >
                                <option value="unpaid">미입금</option>
                                <option value="paid">입금완료</option>
                                <option value="cancelled">취소</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">승인 상태</label>
                            <select
                                value={team.status}
                                onChange={e => setTeam({ ...team, status: e.target.value })}
                                className="w-full p-2 border rounded"
                            >
                                <option value="pending">대기</option>
                                <option value="confirmed">승인됨</option>
                                <option value="cancelled">취소됨</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Player List */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
                    <h2 className="font-bold text-lg border-b pb-2 mb-4 flex justify-between items-center">
                        선수 명단 ({players.length}명)
                    </h2>

                    <div className="flex-1 overflow-y-auto max-h-[400px] space-y-2 mb-4">
                        {players.map(player => (
                            <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                                        {player.back_number || '-'}
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm flex items-center gap-1">
                                            {player.name}
                                            {player.is_elite && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded">선출</span>}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {player.position || '포지션 미입력'} | {player.birth_date || '생년월일 미입력'}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => handleDeletePlayer(player.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {players.length === 0 && <p className="text-center text-gray-400 py-8">등록된 선수가 없습니다.</p>}
                    </div>

                    <div className="border-t pt-4">
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <input
                                placeholder="이름"
                                className="p-2 border rounded text-sm"
                                value={newPlayer.name}
                                onChange={e => setNewPlayer({ ...newPlayer, name: e.target.value })}
                            />
                            <input
                                placeholder="등번호"
                                type="number"
                                className="p-2 border rounded text-sm"
                                value={newPlayer.back_number}
                                onChange={e => setNewPlayer({ ...newPlayer, back_number: e.target.value })}
                            />
                            <input
                                placeholder="포지션 (G, F, C)"
                                className="p-2 border rounded text-sm"
                                value={newPlayer.position}
                                onChange={e => setNewPlayer({ ...newPlayer, position: e.target.value })}
                            />
                            <input
                                placeholder="생년월일 (YYMMDD)"
                                className="p-2 border rounded text-sm"
                                value={newPlayer.birth_date}
                                onChange={e => setNewPlayer({ ...newPlayer, birth_date: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newPlayer.is_elite}
                                    onChange={e => setNewPlayer({ ...newPlayer, is_elite: e.target.checked })}
                                />
                                선수 출신
                            </label>
                            <button onClick={handleAddPlayer} className="px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-black font-medium">
                                선수 추가
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
