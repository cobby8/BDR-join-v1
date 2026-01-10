'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, Phone, User, Trophy, Pencil, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { updateTeamStatus, updateTeamInfo, updatePlayer, fetchTeamDetails } from '@/app/actions/admin'

interface Player {
    id: string
    name: string
    back_number: string
    birth_date: string
    position: string
    is_elite: boolean
    team_id: string
}

interface TeamDetailModalProps {
    teamId: string | null
    isOpen: boolean
    onClose: () => void
    teamName: string
    teamData?: any // Expanded team data including status
}

const UniformIcon = ({ color, text }: { color: string, text: string }) => {
    const safeColor = color || '#000000'
    const isDark = ['white', '#ffffff', '#fff'].includes(safeColor.toLowerCase()) || safeColor.toLowerCase().includes('yellow')

    return (
        <div className="flex flex-col items-center gap-1 group">
            <div className="relative w-12 h-12 flex items-center justify-center drop-shadow-sm transition-transform group-hover:scale-105">
                <svg viewBox="0 0 100 100" className="w-full h-full" style={{ fill: safeColor }}>
                    {/* Sleeveless Jersey Shape */}
                    <path d="M 25,10 L 75,10 L 85,35 L 85,90 L 15,90 L 15,35 Z" />
                    {/* Collar Cutout */}
                    <path d="M 35,10 Q 50,25 65,10" fill="white" />
                </svg>
                {/* Text Overlay (First Letter of Team Name) */}
                <span className={`absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-black ${isDark ? 'text-gray-900' : 'text-white'
                    }`}>
                    {text?.charAt(0).toUpperCase() || ''}
                </span>
            </div>
            <span className="text-[10px] text-gray-500 font-medium group-hover:text-blue-600 transition-colors truncate max-w-[60px]">{safeColor}</span>
        </div>
    )
}

export default function TeamDetailModal({ teamId, isOpen, onClose, teamName, teamData }: TeamDetailModalProps) {
    const [loading, setLoading] = useState(false)
    const [players, setPlayers] = useState<Player[]>([])
    const [history, setHistory] = useState<any[]>([])
    const [updatingParams, setUpdatingParams] = useState<string | null>(null)
    const [isEditing, setIsEditing] = useState(false)

    // Edit Forms
    const [editTeamForm, setEditTeamForm] = useState<any>({})
    const [editPlayersForm, setEditPlayersForm] = useState<Record<string, any>>({})

    const handleStatusChange = async (field: 'status' | 'payment_status', value: string) => {
        if (!teamId) return
        setUpdatingParams(field)
        try {
            const res = await updateTeamStatus(teamId, field, value)
            if (res.error) {
                alert('업데이트 실패: ' + res.error)
            } else {
                alert('상태가 변경되었습니다. (새로고침 시 반영됩니다)')
            }
        } catch (e: any) {
            alert('오류: ' + e.message)
        } finally {
            setUpdatingParams(null)
        }
    }



    // Update edit form when data changes or modal opens
    useEffect(() => {
        if (teamData) {
            setEditTeamForm({
                name_ko: teamData.name_ko,
                manager_name: teamData.manager_name,
                manager_phone: teamData.manager_phone,
            })
        }
    }, [teamData])

    useEffect(() => {
        const loadDetails = async () => {
            if (!isOpen || !teamId || !teamData?.manager_phone) return

            // Reset state
            setIsEditing(false)
            setLoading(true)
            const res = await fetchTeamDetails(teamId, teamData.manager_phone)

            if (res.error) {
                console.error('Failed to fetch details:', res.error)
                setLoading(false)
                return
            }

            // Set Players
            const loadedPlayers = (res.players || []) as Player[]
            setPlayers(loadedPlayers)

            // Initialize edit form for players
            const pForm: Record<string, any> = {}
            loadedPlayers.forEach((p) => {
                pForm[p.id] = { ...p }
            })
            setEditPlayersForm(pForm)

            // Set History
            setHistory(res.history || [])
            setLoading(false)
        }

        loadDetails()
    }, [isOpen, teamId, teamData?.manager_phone])

    // Determine Active vs Past
    const { activeTournaments, pastTournaments } = useMemo(() => {
        const today = new Date().setHours(0, 0, 0, 0)

        const active: any[] = []
        const past: any[] = []

        history.forEach(h => {
            // 1. If no tournament (Deleted) -> Past
            if (!h.tournaments) {
                past.push({ ...h, isDeleted: true })
                return
            }

            // 2. If status says '종료' (Ended) -> Past
            if (h.tournaments.status === '종료') {
                past.push(h)
                return
            }

            // 3. Date check
            const dateStr = h.tournaments.end_date || h.tournaments.start_date
            if (!dateStr) {
                active.push(h) // No date & not '종료'? Assume active OR if created_at is old?
                return
            }

            const tourDate = new Date(dateStr).getTime()

            // If today is AFTER the tourDate, it's past.
            if (today > tourDate) {
                past.push(h)
            } else {
                active.push(h)
            }
        })

        return { activeTournaments: active, pastTournaments: past }
    }, [history])

    // Logic for Highest Division (Still uses ALL history)
    const highestDivision = useMemo(() => {
        if (!history.length) return teamData?.division || '-'
        const divisions = history.map(h => h.division).filter(Boolean)
        const uniqueDivs = Array.from(new Set(divisions))
        if (uniqueDivs.length === 0) return '-'
        uniqueDivs.sort()
        return uniqueDivs[0]
    }, [history, teamData])

    const handleSaveTeam = async () => {
        if (!teamId) return
        const res = await updateTeamInfo(teamId, editTeamForm)
        if (res.error) alert('팀 정보 수정 실패: ' + res.error)
        else {
            // alert('팀 정보가 수정되었습니다.')
        }
    }

    const handleSavePlayers = async () => {
        const promises = Object.values(editPlayersForm).map(p => updatePlayer(p.id, p))
        const results = await Promise.all(promises)
        const errors = results.filter(r => r.error)
        if (errors.length > 0) alert(`${errors.length}명의 선수 정보 수정 실패.`)
    }

    const handleSaveAll = async () => {
        await handleSaveTeam()
        await handleSavePlayers()
        setIsEditing(false)
        alert('저장되었습니다.')
        window.location.reload()
    }

    const handlePlayerChange = (id: string, field: string, value: any) => {
        setEditPlayersForm(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: value }
        }))
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

                {/* Header Controls */}
                <div className="p-4 flex justify-between items-center bg-white z-10 border-b border-gray-100">
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${isEditing ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                    >
                        {isEditing ? (
                            <>
                                <X className="w-4 h-4" /> 취소
                            </>
                        ) : (
                            <>
                                <Pencil className="w-4 h-4" /> 정보 수정
                            </>
                        )}
                    </button>
                    <div className="flex gap-2">
                        {isEditing && (
                            <button
                                onClick={handleSaveAll}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                            >
                                <Save className="w-4 h-4" /> 저장
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-8 pt-6">
                    {teamData && (
                        <div className="flex flex-col gap-6">
                            {/* Main Team Card */}
                            <div className="flex flex-col gap-4">
                                {/* Title Area: Name + Region */}
                                <div className="flex items-center gap-3">
                                    {isEditing ? (
                                        <input
                                            value={editTeamForm.name_ko || ''}
                                            onChange={e => setEditTeamForm({ ...editTeamForm, name_ko: e.target.value })}
                                            className="text-3xl font-extrabold text-gray-900 tracking-tight border-b-2 border-blue-200 focus:outline-none focus:border-blue-500 w-full"
                                            placeholder="팀명"
                                        />
                                    ) : (
                                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                                            {teamName}
                                        </h2>
                                    )}
                                    <div className="px-3 py-1 bg-gray-100 rounded-lg text-gray-600 font-bold text-sm shrink-0">
                                        {teamData.province} {teamData.city}
                                    </div>
                                </div>

                                {/* Info Box */}
                                <div className="flex flex-col gap-4 p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                                    {/* Top Left: Representative Info */}
                                    <div className="flex items-center gap-3 text-sm text-gray-500 font-medium pb-4 border-b border-blue-100">
                                        <div className="flex items-center gap-2">
                                            <User className='w-4 h-4' />
                                            <span className="shrink-0">대표자:</span>
                                            {isEditing ? (
                                                <input
                                                    value={editTeamForm.manager_name || ''}
                                                    onChange={e => setEditTeamForm({ ...editTeamForm, manager_name: e.target.value })}
                                                    className="w-24 bg-white px-2 py-0.5 rounded border border-blue-200 text-sm focus:outline-none focus:border-blue-500"
                                                    placeholder="이름"
                                                />
                                            ) : (
                                                <span>{teamData.manager_name}</span>
                                            )}
                                        </div>
                                        <span className="w-px h-3 bg-gray-300"></span>
                                        <div className="flex items-center gap-2">
                                            <Phone className='w-4 h-4' />
                                            {isEditing ? (
                                                <input
                                                    value={editTeamForm.manager_phone || ''}
                                                    onChange={e => setEditTeamForm({ ...editTeamForm, manager_phone: e.target.value })}
                                                    className="w-32 bg-white px-2 py-0.5 rounded border border-blue-200 text-sm focus:outline-none focus:border-blue-500"
                                                    placeholder="전화번호"
                                                />
                                            ) : (
                                                <a href={`tel:${teamData.manager_phone}`} className='hover:text-blue-600 hover:underline'>
                                                    {teamData.manager_phone}
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Main Content: Category + Uniforms */}
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">최고 디비전 (역대)</label>
                                            <div className="text-2xl font-bold text-gray-900">{teamData.category || 'Unknown'} / {highestDivision}</div>
                                        </div>

                                        <div className="flex gap-8">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">HOME</span>
                                                <UniformIcon color={teamData.uniform_home} text={teamData.name_en || teamData.name_ko} />
                                            </div>
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">AWAY</span>
                                                <UniformIcon color={teamData.uniform_away} text={teamData.name_en || teamData.name_ko} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Current Status (Only Active) */}
                            {activeTournaments.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Trophy className="w-5 h-5 text-gray-500" />
                                        현재 참가 현황
                                    </h3>
                                    <div className="space-y-3">
                                        {activeTournaments.map((activeTeam) => (
                                            <div key={activeTeam.id} className="flex justify-between items-center p-4 bg-white rounded-xl border border-blue-200 shadow-sm ring-4 ring-blue-50">
                                                <div>
                                                    <div className="font-bold text-gray-900 text-lg">
                                                        {activeTeam.tournaments?.name.replace(/^\[.*?\]/, `[${activeTeam.division}]`) || '현재 대회'}
                                                    </div>
                                                    <div className="text-sm text-gray-500 mt-1 flex gap-2">
                                                        <span>{activeTeam.category} / {activeTeam.division}</span>
                                                        {activeTeam.tournaments?.start_date && (
                                                            <>
                                                                <span className="text-gray-300">|</span>
                                                                <span>
                                                                    {new Date(activeTeam.tournaments.start_date).toLocaleDateString()}
                                                                    {(() => {
                                                                        try {
                                                                            const t = activeTeam.tournaments
                                                                            let placeName = ''
                                                                            const places = typeof t.places === 'string' ? JSON.parse(t.places) : t.places
                                                                            if (Array.isArray(places) && places.length > 0) {
                                                                                const p = places[0]
                                                                                if (typeof p === 'string') placeName = p
                                                                                else if (typeof p === 'object' && p?.name) placeName = p.name
                                                                                else if (typeof p === 'object' && p?.address) placeName = p.address
                                                                            }
                                                                            return placeName ? ` @${placeName}` : ''
                                                                        } catch (e) { return '' }
                                                                    })()}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-1">신청일: {new Date(activeTeam.created_at).toLocaleDateString()}</div>
                                                </div>
                                                <div className="flex flex-col gap-2 items-end">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-gray-400">참가비</span>
                                                        <select
                                                            defaultValue={activeTeam.payment_status}
                                                            onChange={(e) => handleStatusChange('payment_status', e.target.value)}
                                                            disabled={updatingParams === 'payment_status'}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border-0 ring-1 ring-inset focus:outline-none cursor-pointer ${activeTeam.payment_status === 'paid' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                                                activeTeam.payment_status === 'pending' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' :
                                                                    'bg-red-50 text-red-700 ring-red-600/20'
                                                                }`}
                                                        >
                                                            <option value="pending">미입금</option>
                                                            <option value="paid">입금완료</option>
                                                            <option value="refunded">환불완료</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-gray-400">승인</span>
                                                        <select
                                                            defaultValue={activeTeam.status}
                                                            onChange={(e) => handleStatusChange('status', e.target.value)}
                                                            disabled={updatingParams === 'status'}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border-0 ring-1 ring-inset focus:outline-none cursor-pointer ${activeTeam.status === 'confirmed' ? 'bg-blue-50 text-blue-700 ring-blue-700/10' :
                                                                activeTeam.status === 'pending' ? 'bg-gray-50 text-gray-600 ring-gray-500/10' :
                                                                    'bg-red-50 text-red-700 ring-red-600/10'
                                                                }`}
                                                        >
                                                            <option value="pending">대기중</option>
                                                            <option value="confirmed">확정</option>
                                                            <option value="cancelled">취소</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Players Section (Moved Above History) */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-gray-500" />
                            선수 명단
                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{players.length}명</span>
                        </h3>
                        <div className="border border-gray-100 rounded-xl overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-3 w-20 text-center">No.</th>
                                        <th className="px-6 py-3">이름</th>
                                        <th className="px-6 py-3">생년월일</th>
                                        <th className="px-6 py-3">포지션</th>
                                        <th className="px-6 py-3 text-center">선출여부</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">불러오는 중...</td></tr>
                                    ) : players.length === 0 ? (
                                        <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">등록된 선수가 없습니다.</td></tr>
                                    ) : (
                                        players.map((p) => {
                                            const form = editPlayersForm[p.id] || p
                                            return (
                                                <tr key={p.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-3 text-center font-mono text-gray-600 font-bold">
                                                        {isEditing ? (
                                                            <input
                                                                value={form.back_number}
                                                                onChange={e => handlePlayerChange(p.id, 'back_number', e.target.value)}
                                                                className="w-12 text-center border rounded py-1 bg-white focus:border-blue-500 focus:outline-none"
                                                            />
                                                        ) : p.back_number}
                                                    </td>
                                                    <td className="px-6 py-3 font-medium text-gray-900">{p.name}</td>
                                                    <td className="px-6 py-3 text-gray-500">
                                                        {isEditing ? (
                                                            <input
                                                                value={form.birth_date || ''}
                                                                onChange={e => handlePlayerChange(p.id, 'birth_date', e.target.value)}
                                                                className="w-28 border rounded py-1 px-2 bg-white focus:border-blue-500 focus:outline-none"
                                                                placeholder="YYYY-MM-DD"
                                                            />
                                                        ) : (p.birth_date || '-')}
                                                    </td>
                                                    <td className="px-6 py-3 text-gray-500">
                                                        {isEditing ? (
                                                            <input
                                                                value={form.position || ''}
                                                                onChange={e => handlePlayerChange(p.id, 'position', e.target.value)}
                                                                className="w-16 border rounded py-1 px-2 bg-white focus:border-blue-500 focus:outline-none"
                                                            />
                                                        ) : (p.position || '-')}
                                                    </td>
                                                    <td className="px-6 py-3 text-center">
                                                        {isEditing ? (
                                                            <button
                                                                onClick={() => handlePlayerChange(p.id, 'is_elite', !form.is_elite)}
                                                                className={`px-2 py-1 rounded text-xs font-bold transition-colors ${form.is_elite ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                                            >
                                                                {form.is_elite ? '선출' : '비선출'}
                                                            </button>
                                                        ) : (
                                                            p.is_elite ? (
                                                                <span className="inline-flex px-2 py-0.5 bg-red-100 text-red-600 rounded text-xs font-bold">선출</span>
                                                            ) : (
                                                                <span className="text-gray-300">-</span>
                                                            )
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* History Section (Past Tournaments) */}
                    {pastTournaments.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-gray-500" />
                                최근 참가 이력 (종료된 대회)
                            </h3>
                            <div className="space-y-3">
                                {pastTournaments.map((h, i) => (
                                    <div key={i} className={`flex justify-between items-center p-4 rounded-xl border ${h.id === teamId ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100' : 'bg-gray-50 border-gray-100'}`}>
                                        <div>
                                            <div className="font-bold text-gray-900">
                                                {h.tournaments?.name?.replace(/^\[.*?\]/, `[${h.division}]`) || '알 수 없는 대회'}
                                                <span className="ml-2 text-xs text-gray-500 font-normal">
                                                    {h.tournaments?.start_date ? new Date(h.tournaments.start_date).toLocaleDateString() : ''}
                                                    {h.tournaments?.location && ` @ ${h.tournaments.location}`}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-0.5">{h.category} / {h.division}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-xs font-bold px-2 py-1 rounded inline-block mb-1 ${h.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                                                }`}>{h.status === 'confirmed' ? '확정' : h.status === 'pending' ? '대기' : h.status}</div>
                                            <div className="text-xs text-gray-400">{new Date(h.created_at).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
