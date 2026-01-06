'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Tournament, Division, Player } from '@/types/database';
import { cn } from '@/lib/utils';
import { Trophy, Users, Palette, UserPlus, Send, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { UniformSelector } from '@/components/UniformSelector';
import { PlayerListInput } from '@/components/PlayerListInput';
import Image from 'next/image';

export default function RegistrationPage() {
  const [step, setStep] = useState(0);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    province: '서울특별시',
    city: '',
    team_name_ko: '',
    team_name_en: '',
    manager_name: '',
    manager_phone: '',
    division_id: '',
    uniform_home_hex: '#1769ff',
    uniform_away_hex: '#ffffff',
  });
  const [players, setPlayers] = useState<Partial<Player>[]>([]);

  useEffect(() => {
    async function fetchTournaments() {
      const { data } = await supabase
        .from('tournaments')
        .select('*')
        .eq('is_deleted', false)
        .order('start_date', { ascending: true });

      if (data) setTournaments(data);
      setIsLoading(false);
    }
    fetchTournaments();
  }, []);

  useEffect(() => {
    const tourId = selectedTournament?.id;
    if (tourId) {
      async function fetchDivisions(id: string) {
        const { data } = await supabase
          .from('divisions')
          .select('*')
          .eq('tournament_id', id);
        if (data) setDivisions(data);
      }
      fetchDivisions(tourId);
    }
  }, [selectedTournament]);

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    if (!selectedTournament) return;
    setIsSubmitting(true);

    try {
      const tour = selectedTournament;
      if (!tour) return;

      // 1. Create Team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          tournament_id: tour.id,
          division_id: formData.division_id,
          province: formData.province,
          city: formData.city,
          team_name_ko: formData.team_name_ko,
          team_name_en: formData.team_name_en,
          manager_name: formData.manager_name,
          manager_phone: formData.manager_phone,
          uniform_home_hex: formData.uniform_home_hex,
          uniform_away_hex: formData.uniform_away_hex,
          status: 'pending'
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // 2. Create Players
      const playersToInsert = players.map(p => ({
        team_id: team.id,
        name: p.name,
        back_number: p.back_number,
        position: p.position,
        birth_date: p.birth_date,
        is_pro: p.is_pro
      }));

      const { error: playerError } = await supabase
        .from('players')
        .insert(playersToInsert);

      if (playerError) throw playerError;

      setIsSuccess(true);
      setStep(5);
    } catch (err) {
      console.error(err);
      alert('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass p-12 rounded-[3rem] card-shadow max-w-lg w-full text-center space-y-6"
        >
          <div className="w-20 h-20 bg-green-500 text-white rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-green-500/20">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white">참가 신청 완료!</h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            {selectedTournament?.name}에 성공적으로 신청되었습니다.<br />
            대표자 연락처로 안내 문자가 발송될 예정입니다.
          </p>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl text-left space-y-2 border border-slate-100 dark:border-slate-700">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Payment Info</p>
            <p className="font-bold text-slate-700 dark:text-slate-200">{selectedTournament?.fee_text}</p>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{selectedTournament?.account_info}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full btn-primary"
          >
            홈으로 돌아가기
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-20">
      <header className="relative h-64 flex items-center justify-center overflow-hidden bg-slate-900">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-slate-900" />
        </div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-5xl font-black text-white">
            BDR <span className="text-primary italic uppercase tracking-tighter">Join</span>
          </h1>
          <p className="text-slate-400 mt-2 font-medium">농구대회 참가신청 시스템 v2.0</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-20">
        <div className="glass card-shadow rounded-3xl p-6 flex justify-between items-center">
          {[
            { icon: Trophy, label: '대회선택' },
            { icon: Users, label: '팀정보' },
            { icon: Palette, label: '구분/유니폼' },
            { icon: UserPlus, label: '선수명단' },
            { icon: Send, label: '제출' },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 group">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                step >= idx ? "bg-primary text-white scale-110 shadow-lg shadow-primary/20" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
              )}>
                <item.icon size={20} />
              </div>
              <span className={cn(
                "text-xs font-bold transition-all duration-300 hidden md:block",
                step === idx ? "text-primary" : "text-slate-400"
              )}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-[400px]"
          >
            {step === 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-black text-slate-800 dark:text-white">대회를 선택하세요</h2>
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map(i => <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-[2.5rem]" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tournaments.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => { setSelectedTournament(t); nextStep(); }}
                        className="group relative glass rounded-[2.5rem] overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] border-2 border-transparent hover:border-primary/50"
                      >
                        <div className="aspect-[16/10] bg-slate-200 dark:bg-slate-800 relative">
                          <Image
                            src={t.poster_url || 'https://via.placeholder.com/800x500?text=BDR+TOURNAMENT'}
                            alt={t.name}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                          <div className="absolute bottom-6 left-6 right-6">
                            <h3 className="text-white font-black text-2xl leading-tight">{t.name}</h3>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 1 && (
              <div className="glass p-8 md:p-12 rounded-[3rem] card-shadow space-y-8">
                <h2 className="text-2xl font-black text-slate-800 dark:text-white">① 팀 기본정보 입력</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500">시도 선택</label>
                    <select
                      value={formData.province}
                      onChange={e => setFormData({ ...formData, province: e.target.value })}
                      className="input-field"
                    >
                      <option>서울특별시</option><option>경기도</option><option>인천광역시</option>
                      {/* ... other regions */}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500">팀명 (국문)</label>
                    <input
                      type="text" className="input-field" placeholder="예: 슬로우"
                      value={formData.team_name_ko}
                      onChange={e => setFormData({ ...formData, team_name_ko: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500">대표자 이름</label>
                    <input
                      type="text" className="input-field"
                      value={formData.manager_name}
                      onChange={e => setFormData({ ...formData, manager_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500">대표자 연락처</label>
                    <input
                      type="tel" className="input-field" placeholder="01000000000"
                      value={formData.manager_phone}
                      onChange={e => setFormData({ ...formData, manager_phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="pt-4 flex gap-4">
                  <button onClick={prevStep} className="flex-1 px-6 py-4 rounded-2xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 flex items-center justify-center gap-2">
                    <ArrowLeft size={20} /> 이전
                  </button>
                  <button onClick={nextStep} className="flex-[2] btn-primary flex items-center justify-center gap-2">
                    다음 단계 <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="glass p-8 md:p-12 rounded-[3rem] card-shadow space-y-10">
                <div className="space-y-6">
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white">② 종별 및 유니폼 선택</h2>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">참가 종별/디비전</label>
                    <select
                      className="input-field"
                      value={formData.division_id}
                      onChange={e => setFormData({ ...formData, division_id: e.target.value })}
                    >
                      <option value="">디비전을 선택하세요</option>
                      {divisions.map(d => (
                        <option key={d.id} value={d.id}>{d.category} - {d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <UniformSelector
                  homeHex={formData.uniform_home_hex}
                  awayHex={formData.uniform_away_hex}
                  onHomeChange={(hex) => setFormData({ ...formData, uniform_home_hex: hex })}
                  onAwayChange={(hex) => setFormData({ ...formData, uniform_away_hex: hex })}
                />

                <div className="pt-4 flex gap-4">
                  <button onClick={prevStep} className="flex-1 px-6 py-4 rounded-2xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 flex items-center justify-center gap-2">
                    <ArrowLeft size={20} /> 이전
                  </button>
                  <button onClick={nextStep} className="flex-[2] btn-primary flex items-center justify-center gap-2">
                    다음 단계 <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="glass p-8 md:p-12 rounded-[3rem] card-shadow space-y-8">
                <h2 className="text-2xl font-black text-slate-800 dark:text-white">③ 선수 명단 작성</h2>
                <PlayerListInput
                  players={players as Player[]}
                  onChange={(p) => setPlayers(p)}
                />
                <div className="pt-4 flex gap-4">
                  <button onClick={prevStep} className="flex-1 px-6 py-4 rounded-2xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 flex items-center justify-center gap-2">
                    <ArrowLeft size={20} /> 이전
                  </button>
                  <button onClick={nextStep} className="flex-[2] btn-primary flex items-center justify-center gap-2">
                    최종 확인 <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="glass p-8 md:p-12 rounded-[3rem] card-shadow space-y-8">
                <h2 className="text-2xl font-black text-slate-800 dark:text-white">④ 신청 정보 확인</h2>
                <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-8 rounded-3xl">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <span className="text-slate-400 font-bold">참가 대회</span>
                    <span className="text-right font-black text-slate-700 dark:text-white">{selectedTournament?.name}</span>
                    <span className="text-slate-400 font-bold">팀명</span>
                    <span className="text-right font-black text-slate-700 dark:text-white">{formData.team_name_ko}</span>
                    <span className="text-slate-400 font-bold">디비전</span>
                    <span className="text-right font-black text-slate-700 dark:text-white">
                      {divisions.find(d => d.id === formData.division_id)?.name || '선택안됨'}
                    </span>
                    <span className="text-slate-400 font-bold">선수 인원</span>
                    <span className="text-right font-black text-slate-700 dark:text-white">{players.length}명</span>
                  </div>
                </div>

                <div className="p-6 bg-primary/5 rounded-3xl border-2 border-primary/20">
                  <p className="text-sm text-primary font-bold text-center">
                    위 내용이 정확한지 다시 한번 확인해 주세요. <br className="hidden md:block" />
                    제출 후에는 수정 코드가 필요합니다.
                  </p>
                </div>

                <div className="pt-4 flex gap-4">
                  <button onClick={prevStep} className="flex-1 px-6 py-4 rounded-2xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 flex items-center justify-center gap-2">
                    <ArrowLeft size={20} /> 이전
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-[2] btn-primary flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                    {isSubmitting ? '제출 중...' : '신청서 제출하기'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
