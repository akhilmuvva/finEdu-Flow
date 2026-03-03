import React, { useEffect, useRef } from 'react';
import { SimulationResult } from '../types';

import { ShieldCheck, Activity, Target, Zap } from 'lucide-react';
import { animate } from 'animejs';

import { cn } from '../utils/cn';
import SavingsComparison from './SavingsComparison';
interface StrategyDashboardProps {
    simulation: SimulationResult | null;
    formatCurrency: (amount: number, isInternational?: boolean) => string;
    universityName: string;
    familyIncome: number;
}

export const StrategyDashboard: React.FC<StrategyDashboardProps> = ({
    simulation, formatCurrency, universityName, familyIncome
}) => {
    const tickerRef = useRef<HTMLSpanElement>(null);
    const prevEmi = useRef(0);

    useEffect(() => {
        if (simulation?.emi && tickerRef.current) {
            const currentObj = { val: prevEmi.current };
            animate(currentObj, {
                val: simulation.emi,
                round: 1,
                easing: 'easeOutElastic(1, .8)',
                duration: 1500,
                update: () => {
                    if (tickerRef.current) tickerRef.current.textContent = formatCurrency(currentObj.val);
                }
            });
            prevEmi.current = simulation.emi;
        }
    }, [simulation?.emi, formatCurrency]);


    if (!simulation) return null;

    const sust = simulation.sustainability_data;
    if (!sust) return null;


    return (
        <div className="space-y-8 stagger-reveal">
            {/* Header with University Name */}
            <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-400">
                    <Activity size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">{universityName}</h2>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Financial Strategy Synthesis</p>
                </div>
            </div>

            {/* Top Metrics: Web3 Style */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className={cn(
                    "glass-card p-6 rounded-[2rem] border-t-4 relative overflow-hidden group transition-all duration-700",
                    simulation.vidyalaxmi_eligible || simulation.csis_eligible ? "border-t-emerald-400 shadow-[0_0_35px_rgba(52,211,153,0.15)] bg-emerald-500/5 ring-1 ring-emerald-400/20" : "border-t-cyan-400"
                )}>
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap size={64} className={simulation.vidyalaxmi_eligible || simulation.csis_eligible ? "text-emerald-400" : "text-cyan-400"} />
                    </div>
                    <div className="flex justify-between items-start mb-1">
                        <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Monthly EMI</p>
                        {(simulation.vidyalaxmi_eligible || simulation.csis_eligible) && (
                            <div className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[7px] font-black text-emerald-400 uppercase animate-pulse">
                                Savings Applied
                            </div>
                        )}
                    </div>
                    {(!familyIncome || familyIncome === 0) ? (
                        <div className="space-y-2">
                            <p className="text-sm font-black text-rose-400 uppercase tracking-tighter">Data Incomplete</p>
                            <button
                                className="text-[9px] font-bold text-cyan-400 hover:text-white underline uppercase tracking-widest"
                            >
                                Configure Family Income to Secure CSIS
                            </button>
                        </div>
                    ) : (
                        <>
                            <p className={cn("text-4xl font-black italic", simulation.vidyalaxmi_eligible || simulation.csis_eligible ? "text-emerald-400" : "text-cyan-400")}>
                                <span ref={tickerRef}>{formatCurrency(simulation.emi)}</span>
                            </p>
                            <div className="mt-4 flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <div className={cn("w-1.5 h-1.5 rounded-full animate-ping", simulation.vidyalaxmi_eligible || simulation.csis_eligible ? "bg-emerald-400" : "bg-cyan-400")} />
                                    <span className={cn("text-[8px] font-black uppercase", simulation.vidyalaxmi_eligible || simulation.csis_eligible ? "text-emerald-500" : "text-cyan-500/80")}>Live Policy Adjusted</span>
                                </div>
                                {(simulation.vidyalaxmi_eligible || simulation.csis_eligible) && (
                                    <div className="text-[8px] font-bold text-emerald-500/60 uppercase">
                                        Saved: {formatCurrency(simulation.total_interest_paid ? (simulation.total_interest_paid * 0.15) : 45000)}*
                                    </div>
                                )}
                            </div>
                        </>
                    )}
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

            {/* AI Advisor & Savings Comparison */}
            <div className="grid md:grid-cols-2 gap-8 items-start">
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
                <SavingsComparison simulation={simulation} />
            </div>
        </div>
    );
};
