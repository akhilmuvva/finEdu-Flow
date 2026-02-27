import React, { useEffect, useRef } from 'react';
import { ShieldCheck, Activity, Target, Zap } from 'lucide-react';
import { cn } from '../utils/cn';
import { DocVerifier } from './DocVerifier';

interface StrategyDashboardProps {
    simulation: any;
    formatCurrency: (amount: number, prefix?: string) => string;
}

export const StrategyDashboard: React.FC<StrategyDashboardProps> = ({ simulation, formatCurrency }) => {
    const tickerRef = useRef<HTMLSpanElement>(null);
    const prevEmi = useRef(0);

    useEffect(() => {
        if (simulation?.emi && tickerRef.current) {
            const start = prevEmi.current;
            const end = simulation.emi;
            const duration = 1200;
            const startTime = performance.now();
            const tick = (now: number) => {
                const progress = Math.min((now - startTime) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = start + (end - start) * eased;
                if (tickerRef.current) tickerRef.current.textContent = formatCurrency(Math.round(current));
                if (progress < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            prevEmi.current = end;
        }
    }, [simulation?.emi]);

    if (!simulation) return null;

    const sust = simulation.sustainability_data || {};

    return (
        <div className="space-y-8 stagger-reveal">
            {/* Top Metrics: Web3 Style */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="glass-card p-6 rounded-[2rem] border-t-4 border-t-cyan-400 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap size={64} className="text-cyan-400" />
                    </div>
                    <p className="text-[10px] font-black uppercase text-gray-500 mb-1 tracking-widest">Monthly EMI</p>
                    <p className="text-4xl font-black italic text-cyan-400">
                        <span ref={tickerRef}>{formatCurrency(simulation.emi)}</span>
                    </p>
                    <div className="mt-4 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                        <span className="text-[8px] font-black text-cyan-500/80 uppercase">Live Policy Adjusted</span>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-[2rem] border-t-4 border-t-purple-400 relative overflow-hidden group">
                    <p className="text-[10px] font-black uppercase text-gray-500 mb-1 tracking-widest">Financial Health Score</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-black italic text-purple-400">{sust.health_score}%</p>
                        <span className={cn(
                            "text-[10px] font-black px-2 py-0.5 rounded uppercase",
                            sust.risk_status === 'Optimal' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                        )}>
                            {sust.risk_status}
                        </span>
                    </div>
                    <p className="mt-3 text-[10px] font-bold text-gray-400 leading-tight">
                        Placement Prob: {sust.placement_probability}% | Infl. Stress: {sust.inflation_adjustment_factor}x
                    </p>
                    {sust.market_momentum > 1 && (
                        <div className="mt-3 flex items-center gap-2">
                            <div className="px-2 py-0.5 rounded bg-pink-500/10 border border-pink-500/30 text-pink-400 text-[8px] font-black uppercase">
                                Premium Market Momentum: {sust.market_momentum}x
                            </div>
                        </div>
                    )}
                </div>

                <div className="glass-card p-6 rounded-[2rem] border-t-4 border-t-emerald-400">
                    <p className="text-[10px] font-black uppercase text-gray-500 mb-1 tracking-widest">Tax Shield (80E)</p>
                    <p className="text-3xl font-black italic text-emerald-400">{formatCurrency(simulation.tax_benefit_80E)}</p>
                    <div className="mt-4 p-2 bg-slate-900/50 rounded-xl border border-white/5">
                        <p className="text-[8px] font-bold text-gray-500 leading-tight uppercase">
                            Estimated recovery over 8 years post-graduation.
                        </p>
                    </div>
                </div>
            </div>

            {/* AI Advisor & Doc Verifier */}
            <div className="grid md:grid-cols-2 gap-8">
                <div className="glass-card p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-900/80 to-slate-950/80 border border-white/5">
                    <div className="flex items-center gap-3 mb-6">
                        <Target className="text-pink-500" />
                        <h4 className="text-sm font-black uppercase tracking-tighter italic">Intelligence Directive</h4>
                    </div>
                    <div className="space-y-4">
                        {sust.recommendations?.map((rec: string, i: number) => (
                            <div key={i} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-pink-500/30 transition-all group">
                                <div className="p-2 h-fit bg-pink-500/10 rounded-lg text-pink-500 group-hover:scale-110 transition-transform">
                                    <Zap size={14} />
                                </div>
                                <p className="text-xs font-bold text-gray-300 leading-relaxed">{rec}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Document Verifier — replaces static checklist */}
                <DocVerifier isEligibleSubvention={simulation.vidyalaxmi_eligible || simulation.csis_eligible} />
            </div>
        </div>
    );
};
