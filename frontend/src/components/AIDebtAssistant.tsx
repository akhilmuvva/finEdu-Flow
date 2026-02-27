import React, { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';
import { Sparkles, TrendingDown, Target, Zap, ArrowRight, ShieldAlert } from 'lucide-react';
import { cn } from '../utils/cn';

interface AIDebtAssistantProps {
    simulation: any;
    formatCurrency: (amount: number, prefix?: string) => string;
}

export const AIDebtAssistant: React.FC<AIDebtAssistantProps> = ({ simulation, formatCurrency }) => {
    const sparklineRef = useRef<SVGSVGElement>(null);

    const ReductionPath = (years: number) => {
        const factor = Math.min(years / 5, 1);
        const yCoord = 80 - (factor * 60);
        return `M0 80 Q 100 ${yCoord}, 200 50 T 400 20`;
    };

    useEffect(() => {
        if (simulation && sparklineRef.current) {
            // Anime.js Sparkline Animation
            animate('.sparkline-path', {
                strokeDashoffset: [400, 0],
                opacity: [0, 1],
                easing: 'easeInOutSine',
                duration: 1500,
                delay: 500
            });

            animate('.nudge-reveal', {
                translateX: [20, 0],
                opacity: [0, 1],
                delay: stagger(150),
                easing: 'easeOutExpo'
            });
        }
    }, [simulation]);

    if (!simulation) return null;

    const data = simulation.sustainability_data || {};
    const gigTarget = data.gig_work_target || 0;
    const savings = data.interest_savings || 0;
    const reduction = data.tenure_reduction_years || 0;
    const strategies = data.strategies || {};

    const [hoverStrategy, setHoverStrategy] = React.useState<string | null>(null);

    return (
        <div className="glass-card p-8 rounded-[2.5rem] bg-slate-950/40 border border-white/5 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full" />

            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-cyan-500/20 rounded-xl">
                    <Sparkles className="text-cyan-400" size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-black italic uppercase tracking-tighter">AI Debt-Clear Assistant</h3>
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">2026 Predictive Logic Active</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-10">
                {/* Visualizer: Savings Sparkline */}
                <div className="space-y-6">
                    <div className="p-6 bg-slate-900/50 rounded-3xl border border-white/5 relative h-48 flex flex-col justify-end overflow-hidden">
                        <div className="absolute top-6 left-6 z-10">
                            <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Savings Sparkline</p>
                            <p className="text-2xl font-black italic text-emerald-400">
                                {savings > 0 ? '-' : ''}{formatCurrency(hoverStrategy ? (strategies[hoverStrategy]?.savings || savings) : savings)}
                            </p>
                        </div>

                        <svg ref={sparklineRef} viewBox="0 0 400 100" className="w-full h-24 mb-2">
                            <path
                                className="sparkline-path"
                                d={ReductionPath(hoverStrategy ? (strategies[hoverStrategy]?.reduction || reduction) : reduction)}
                                fill="none"
                                stroke={hoverStrategy ? "#22d3ee" : "#10b981"}
                                strokeWidth="3"
                                strokeDasharray="400"
                                opacity="0"
                            />
                            <path
                                d={ReductionPath(hoverStrategy ? (strategies[hoverStrategy]?.reduction || reduction) : reduction)}
                                fill="url(#grad)"
                                opacity="0.1"
                            />
                            <defs>
                                <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" style={{ stopColor: hoverStrategy ? '#06b6d4' : '#10b981', stopOpacity: 1 }} />
                                    <stop offset="100%" style={{ stopColor: hoverStrategy ? '#06b6d4' : '#10b981', stopOpacity: 0 }} />
                                </linearGradient>
                            </defs>
                        </svg>

                        <div className="flex justify-between items-center text-[8px] font-black text-gray-600 uppercase tracking-widest px-1">
                            <span>Moratorium</span>
                            <span>Repayment Phase</span>
                            <span>Debt Free</span>
                        </div>
                    </div>

                    <div className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl transition-all duration-500",
                        hoverStrategy ? "bg-cyan-500/10 border border-cyan-500/30 scale-[1.02]" : "bg-emerald-500/5 border border-emerald-500/20"
                    )}>
                        <TrendingDown className={hoverStrategy ? "text-cyan-400" : "text-emerald-400"} size={24} />
                        <div>
                            <p className={cn("text-xs font-black uppercase", hoverStrategy ? "text-cyan-400" : "text-emerald-400")}>
                                {hoverStrategy ? "Potential Impact" : "Impact Analysis"}
                            </p>
                            <p className="text-[10px] font-bold text-gray-400">
                                Total Tenure Reduction: <span className={hoverStrategy ? "text-cyan-400" : "text-emerald-400"}>
                                    {hoverStrategy ? strategies[hoverStrategy]?.reduction : reduction} Years
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Intelligent Nudges */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-4">Live Repayment Nudges</h4>

                    <div className="nudge-reveal space-y-3">
                        {gigTarget > 0 ? (
                            <div
                                onMouseEnter={() => setHoverStrategy('gig_work')}
                                onMouseLeave={() => setHoverStrategy(null)}
                                className="p-4 bg-slate-900 border-l-4 border-l-cyan-500 rounded-2xl space-y-2 hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-2">
                                    <Target className="text-cyan-400" size={14} />
                                    <span className="text-[10px] font-black text-white uppercase italic">Optimal Gig Target</span>
                                </div>
                                <p className="text-[11px] font-bold text-gray-400 leading-relaxed">
                                    Earning <span className="text-cyan-400">₹{gigTarget}/mo</span> part-time will neutralize the compounding interest during your moratorium.
                                </p>
                            </div>
                        ) : (
                            <div className="p-4 bg-slate-900 border-l-4 border-l-emerald-500 rounded-2xl space-y-2">
                                <div className="flex items-center gap-2">
                                    <ShieldAlert className="text-emerald-400" size={14} />
                                    <span className="text-[10px] font-black text-white uppercase italic">Sustainability Locked</span>
                                </div>
                                <p className="text-[11px] font-bold text-gray-400 leading-relaxed">
                                    No immediate gig-work needed. Maintain NIRF-tier academic performance to sustain placement ROI.
                                </p>
                            </div>
                        )}

                        <div
                            onMouseEnter={() => setHoverStrategy('extra_emi')}
                            onMouseLeave={() => setHoverStrategy(null)}
                            className="p-4 bg-slate-900 border border-white/5 rounded-2xl space-y-2 hover:border-pink-500/30 hover:bg-slate-800 transition-all cursor-pointer group"
                        >
                            <div className="flex items-center gap-2 text-pink-500">
                                <Zap size={14} />
                                <span className="text-[10px] font-black uppercase italic">Strategy: 1-Extra-EMI Rule</span>
                            </div>
                            <p className="text-[11px] font-bold text-gray-400 leading-relaxed">
                                Paying just one extra EMI per year can reduce your effective interest rate by <span className="text-pink-400">1.2%</span>.
                            </p>
                            <div className="flex justify-end pt-1">
                                <button className="text-[8px] font-black uppercase text-pink-500 flex items-center gap-1 group-hover:translate-x-1 transition-transform bg-pink-500/5 px-2 py-1 rounded border border-pink-500/20">Apply Plan <ArrowRight size={8} /></button>
                            </div>
                        </div>

                        <div
                            onMouseEnter={() => setHoverStrategy('lumpsum_2l')}
                            onMouseLeave={() => setHoverStrategy(null)}
                            className="p-4 bg-slate-900 border border-white/5 rounded-2xl space-y-2 hover:border-blue-400/30 hover:bg-slate-800 transition-all cursor-pointer group"
                        >
                            <div className="flex items-center gap-2 text-blue-400">
                                <ArrowRight size={14} />
                                <span className="text-[10px] font-black uppercase italic">Scenario: Lumpsum Offset</span>
                            </div>
                            <p className="text-[11px] font-bold text-gray-400 leading-relaxed italic">
                                Use joining bonus (Est. ₹2L) to clear 15% of principal on Day 1 of repayment.
                            </p>
                            <div className="flex justify-end pt-1">
                                <button className="text-[8px] font-black uppercase text-blue-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform bg-blue-500/5 px-2 py-1 rounded border border-blue-500/20">Analyze Impact <ArrowRight size={8} /></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
