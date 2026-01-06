'use client';

import { useState } from 'react';
import { Plus, Trash2, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Player {
    name: string;
    back_number: string;
    position: string;
    birth_date: string;
    is_pro: boolean;
}

interface PlayerListInputProps {
    players: Player[];
    onChange: (players: Player[]) => void;
}

export function PlayerListInput({ players, onChange }: PlayerListInputProps) {
    const [pasteText, setPasteText] = useState('');
    const [showPaste, setShowPaste] = useState(false);

    const addPlayer = () => {
        onChange([...players, { name: '', back_number: '', position: 'G', birth_date: '', is_pro: false }]);
    };

    const removePlayer = (idx: number) => {
        onChange(players.filter((_, i) => i !== idx));
    };

    const updatePlayer = (idx: number, field: keyof Player, value: any) => {
        const next = [...players];
        next[idx] = { ...next[idx], [field]: value };
        onChange(next);
    };

    const handlePaste = () => {
        const lines = pasteText.split('\n').filter(l => l.trim());
        const newPlayers: Player[] = lines.map(line => {
            const parts = line.split('/').map(p => p.trim());
            return {
                name: parts[0] || '',
                back_number: parts[1] || '',
                position: parts[2] || 'G',
                birth_date: parts[3] || '',
                is_pro: parts[4]?.includes('선출') || false
            };
        });
        onChange([...players, ...newPlayers]);
        setPasteText('');
        setShowPaste(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <label className="text-sm font-black text-slate-500 uppercase tracking-widest">Player Roster</label>
                <button
                    onClick={() => setShowPaste(!showPaste)}
                    className="flex items-center gap-2 text-xs font-bold text-primary hover:underline"
                >
                    <ClipboardList size={14} /> {showPaste ? '닫기' : '명단 합치기/붙여넣기'}
                </button>
            </div>

            {showPaste && (
                <div className="glass p-6 rounded-3xl space-y-4 animate-in fade-in slide-in-from-top-4">
                    <p className="text-xs text-slate-500">
                        형식: <b>이름/백넘버/포지션/생년월일(YYMMDD)/선출 또는 비선출</b> (줄바꿈으로 구분)
                    </p>
                    <textarea
                        value={pasteText}
                        onChange={(e) => setPasteText(e.target.value)}
                        className="input-field min-h-[120px] font-mono text-sm"
                        placeholder="홍길동/7/G/010101/비선출\n김철수/10/F/000202/선출"
                    />
                    <button onClick={handlePaste} className="w-full btn-primary py-2 text-sm">
                        적용하기
                    </button>
                </div>
            )}

            <div className="space-y-3">
                {players.map((p, idx) => (
                    <div key={idx} className="glass p-4 rounded-2xl grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-1 text-xs font-black text-slate-400">{idx + 1}</div>
                        <input
                            placeholder="이름"
                            className="col-span-3 input-field py-2 text-sm"
                            value={p.name}
                            onChange={(e) => updatePlayer(idx, 'name', e.target.value)}
                        />
                        <input
                            placeholder="#"
                            className="col-span-2 input-field py-2 text-sm text-center"
                            value={p.back_number}
                            onChange={(e) => updatePlayer(idx, 'back_number', e.target.value)}
                        />
                        <select
                            className="col-span-2 input-field py-2 text-sm"
                            value={p.position}
                            onChange={(e) => updatePlayer(idx, 'position', e.target.value)}
                        >
                            <option>G</option><option>F</option><option>C</option>
                        </select>
                        <input
                            placeholder="YYMMDD"
                            className="col-span-3 input-field py-2 text-sm"
                            value={p.birth_date}
                            onChange={(e) => updatePlayer(idx, 'birth_date', e.target.value)}
                        />
                        <button
                            onClick={() => removePlayer(idx)}
                            className="col-span-1 text-destructive hover:bg-destructive/10 p-2 rounded-xl transition-all"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}

                <button
                    onClick={addPlayer}
                    className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-2 text-slate-400 font-bold hover:border-primary/50 hover:text-primary transition-all"
                >
                    <Plus size={20} /> 선수 추가
                </button>
            </div>
        </div>
    );
}
