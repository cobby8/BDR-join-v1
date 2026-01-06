'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Team, Player, Tournament, Division } from '@/types/database';
import { Loader2, Users, Trophy, MapPin, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function TeamView() {
    const { id } = useParams();
    const [team, setTeam] = useState<any>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (!id) return;

            const { data: teamData } = await supabase
                .from('teams')
                .select(`
          *,
          tournaments (*),
          divisions (*)
        `)
                .eq('id', id)
                .single();

            if (teamData) {
                setTeam(teamData);
                const { data: playerData } = await supabase
                    .from('players')
                    .select('*')
                    .eq('team_id', id);
                if (playerData) setPlayers(playerData);
            }
            setIsLoading(false);
        }
        fetchData();
    }, [id]);

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={40} />
        </div>
    );

    if (!team) return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="text-center space-y-4">
                <h1 className="text-2xl font-black text-slate-800">팀 정보가 없습니다.</h1>
                <Link href="/" className="text-primary font-bold hover:underline">홈으로 돌아가기</Link>
            </div>
        </div>
    );

    return (
        <main className="min-h-screen bg-slate-50 pb-20">
            <div className="bg-slate-900 text-white py-12 px-4 shadow-xl">
                <div className="max-w-4xl mx-auto space-y-6">
                    <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold">
                        <ChevronLeft size={16} /> 신청서 홈
                    </Link>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs">
                            <Trophy size={14} /> {team.tournaments?.name}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black">{team.team_name_ko}</h1>
                        <p className="text-slate-400 font-bold uppercase tracking-tight">{team.team_name_en}</p>
                    </div>
                    <div className="flex flex-wrap gap-4 pt-4">
                        <div className="glass px-4 py-2 rounded-2xl flex items-center gap-2 text-sm font-bold">
                            <MapPin size={16} className="text-primary" /> {team.province} {team.city}
                        </div>
                        <div className="glass px-4 py-2 rounded-2xl flex items-center gap-2 text-sm font-bold">
                            <Users size={16} className="text-primary" /> {team.divisions?.category} - {team.divisions?.name}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-10">
                <div className="glass p-8 md:p-12 rounded-[2.5rem] card-shadow space-y-10">
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white">선수 명단 ({players.length}명)</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {players.map((p, idx) => (
                                <div key={p.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 flex items-center gap-6">
                                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-xl font-black text-primary">
                                        {p.back_number}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-lg text-slate-800 dark:text-white">{p.name}</span>
                                            {p.is_pro && (
                                                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-md uppercase">선출</span>
                                            )}
                                        </div>
                                        <div className="text-slate-400 text-sm font-bold">{p.position} · {p.birth_date}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-10 border-t border-slate-100 dark:border-slate-800 space-y-4">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Team Uniform Preview</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-center text-slate-500">HOME</p>
                                <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full" style={{ backgroundColor: team.uniform_home_hex || '#ccc' }} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-center text-slate-500">AWAY</p>
                                <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full" style={{ backgroundColor: team.uniform_away_hex || '#ccc' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
