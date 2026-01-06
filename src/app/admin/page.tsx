'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Tournament, Team } from '@/types/database';
import {
    BarChart3,
    Settings,
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    Calendar,
    Users as UsersIcon,
    Trash2,
    Edit,
    ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'tournaments' | 'participants' | 'stats'>('tournaments');
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [isAddingTournament, setIsAddingTournament] = useState(false);

    useEffect(() => {
        async function fetchData() {
            const { data } = await supabase
                .from('tournaments')
                .select('*')
                .eq('is_deleted', false)
                .order('created_at', { ascending: false });
            if (data) setTournaments(data);
        }
        fetchData();
    }, []);

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
            {/* Sidebar */}
            <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h1 className="text-xl font-black text-primary">BDR <span className="text-slate-400">ADMIN</span></h1>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {[
                        { id: 'tournaments', label: '대회 관리', icon: Calendar },
                        { id: 'participants', label: '참가팀 관리', icon: UsersIcon },
                        { id: 'stats', label: '통계 대시보드', icon: BarChart3 },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all",
                                activeTab === item.id
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                            )}
                        >
                            <item.icon size={20} />
                            {item.label}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all">
                        <Settings size={20} />
                        시스템 설정
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8 lg:p-12">
                <header className="flex items-center justify-between mb-10">
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 dark:text-white">
                            {activeTab === 'tournaments' ? '대회 관리' : activeTab === 'participants' ? '참가팀 관리' : '통계 대시보드'}
                        </h2>
                        <p className="text-slate-500 mt-1">총 {tournaments.length}개의 대회가 등록되어 있습니다.</p>
                    </div>
                    <button
                        onClick={() => setIsAddingTournament(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={20} /> 신규 대회 등록
                    </button>
                </header>

                {activeTab === 'tournaments' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tournaments.length === 0 ? (
                            <div className="col-span-full py-20 bg-slate-100 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] text-center">
                                <p className="text-slate-400 font-bold">등록된 대회가 없습니다.</p>
                            </div>
                        ) : (
                            tournaments.map(t => (
                                <div key={t.id} className="glass card-shadow rounded-[2rem] overflow-hidden group">
                                    <div className="aspect-video bg-slate-200 dark:bg-slate-800 relative">
                                        {t.poster_url && <img src={t.poster_url} className="object-cover w-full h-full" />}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                            <button className="p-3 bg-white text-slate-800 rounded-2xl hover:bg-primary hover:text-white transition-all">
                                                <Edit size={20} />
                                            </button>
                                            <button className="p-3 bg-white text-destructive rounded-2xl hover:bg-destructive hover:text-white transition-all">
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800 dark:text-white line-clamp-1">{t.name}</h3>
                                            <div className="flex items-center gap-2 text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">
                                                <Calendar size={12} />
                                                {t.start_date || '일정미정'} ~ {t.end_date || '일정미정'}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <div className="flex -space-x-2">
                                                {/* Mock participant avatars */}
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200" />
                                                ))}
                                                <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                    +12
                                                </div>
                                            </div>
                                            <button className="text-primary font-bold text-sm flex items-center gap-1 hover:underline">
                                                상세보기 <ExternalLink size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Placeholder for other tabs */}
                {activeTab === 'participants' && (
                    <div className="glass card-shadow rounded-[2.5rem] p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="relative flex-1 max-w-md">
                                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="팀명, 대표자명, 연락처 검색"
                                    className="input-field pl-12"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary transition-all">
                                    <Filter size={20} />
                                </button>
                                <button className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary transition-all">
                                    <MoreHorizontal size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-xs text-slate-400 uppercase tracking-widest font-black border-b border-slate-100 dark:border-slate-800">
                                        <th className="pb-4 px-4 font-black">팀정보</th>
                                        <th className="pb-4 px-4 font-black">지역</th>
                                        <th className="pb-4 px-4 font-black">종별/디비전</th>
                                        <th className="pb-4 px-4 font-black">신천일시</th>
                                        <th className="pb-4 px-4 font-black">상태</th>
                                        <th className="pb-4 px-4 font-black">관리</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {/* Mock row */}
                                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="py-6 px-4">
                                            <div className="font-black text-slate-800 dark:text-white">슬로우</div>
                                            <div className="text-xs text-slate-400 font-bold">홍길동 (010-1234-5678)</div>
                                        </td>
                                        <td className="py-6 px-4 text-sm font-bold text-slate-500">서울특별시</td>
                                        <td className="py-6 px-4">
                                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black text-slate-500 uppercase">
                                                일반부 / D3
                                            </span>
                                        </td>
                                        <td className="py-6 px-4 text-sm font-medium text-slate-500">2026.01.07</td>
                                        <td className="py-6 px-4">
                                            <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-[10px] font-black uppercase">
                                                Confirmed
                                            </span>
                                        </td>
                                        <td className="py-6 px-4">
                                            <button className="p-2 text-slate-400 hover:text-primary transition-all">
                                                <Edit size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* Add Tournament Modal (Simple placeholder for now) */}
            {isAddingTournament && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass p-10 rounded-[3rem] card-shadow max-w-2xl w-full space-y-8"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white">신규 대회 등록</h3>
                            <button onClick={() => setIsAddingTournament(false)} className="text-slate-400 hover:text-slate-600">
                                ✕
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2 space-y-2">
                                <label className="text-sm font-bold text-slate-500">대회명</label>
                                <input type="text" className="input-field" placeholder="예: 제2회 BDR 챔피언십" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-500">시작일</label>
                                <input type="date" className="input-field" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-500">종료일</label>
                                <input type="date" className="input-field" />
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setIsAddingTournament(false)} className="flex-1 py-4 font-bold text-slate-500">취소</button>
                            <button onClick={() => setIsAddingTournament(false)} className="flex-[2] btn-primary">등록하기</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
