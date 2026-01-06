'use client';



interface UniformSelectorProps {
    homeHex: string;
    awayHex: string;
    onHomeChange: (hex: string) => void;
    onAwayChange: (hex: string) => void;
}

export function UniformSelector({ homeHex, awayHex, onHomeChange, onAwayChange }: UniformSelectorProps) {
    const Jersey = ({ color }: { color: string }) => (
        <svg viewBox="0 0 120 140" className="w-full h-40 drop-shadow-2xl">
            <defs>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.2" />
                </filter>
            </defs>
            <g filter="url(#shadow)">
                <path
                    d="M35 10 L50 10 L54 22 L66 22 L70 10 L85 10 L85 34 L95 42 L95 130 L25 130 L25 42 L35 34 Z"
                    fill={color}
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-slate-900 dark:text-slate-100"
                />
                <path d="M54 22 L60 28 L66 22" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-900 dark:text-slate-100" />
            </g>
        </svg>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <label className="text-sm font-black text-slate-500 uppercase tracking-widest">Home Color</label>
                <div className="glass p-6 rounded-3xl flex flex-col items-center gap-6">
                    <Jersey color={homeHex} />
                    <div className="flex w-full gap-2">
                        <input
                            type="color"
                            value={homeHex}
                            onChange={(e) => onHomeChange(e.target.value)}
                            className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent"
                        />
                        <input
                            type="text"
                            value={homeHex}
                            onChange={(e) => onHomeChange(e.target.value)}
                            className="flex-1 input-field font-mono text-sm uppercase"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <label className="text-sm font-black text-slate-500 uppercase tracking-widest">Away Color</label>
                <div className="glass p-6 rounded-3xl flex flex-col items-center gap-6">
                    <Jersey color={awayHex} />
                    <div className="flex w-full gap-2">
                        <input
                            type="color"
                            value={awayHex}
                            onChange={(e) => onAwayChange(e.target.value)}
                            className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent"
                        />
                        <input
                            type="text"
                            value={awayHex}
                            onChange={(e) => onAwayChange(e.target.value)}
                            className="flex-1 input-field font-mono text-sm uppercase"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
