import React, { useEffect, useState, useRef } from 'react';
import { SimulationResult, Bank, University, ForeignUniv } from '../types';


import axios from 'axios';
import {
    ShieldCheck,
    Rocket,
    Target,
    ChevronRight,
    BrainCircuit,
    Zap,
    Activity,
    MapPin

} from 'lucide-react';
import { cn } from '../utils/cn';
import { animate } from 'animejs';

interface StrategicAdvisorProps {
    isOpen: boolean;
    onClose: () => void;
    simulation: SimulationResult | null;
    formatCurrency: (amount: number, isInternational?: boolean) => string;
    selectedUniv?: University | ForeignUniv | null;
    familyIncome: number;
    oneTimeLumpsum: number;
    setOneTimeLumpsum: (v: number) => void;
    lumpsumMonth: number;
    setLumpsumMonth: (v: number) => void;
}

export const StrategicAdvisor: React.FC<StrategicAdvisorProps> = ({
    isOpen, onClose, simulation, formatCurrency, selectedUniv, familyIncome,
    oneTimeLumpsum, setOneTimeLumpsum, lumpsumMonth, setLumpsumMonth
}) => {

    const [nearbyBanks, setNearbyBanks] = useState<Bank[]>([]);
    const [fetchingBanks, setFetchingBanks] = useState(false);

    // Internal state for the "Applying" effect
    const [localLumpsum, setLocalLumpsum] = useState(oneTimeLumpsum);
    const [localMonth, setLocalMonth] = useState(lumpsumMonth);
    const [isApplying, setIsApplying] = useState(false);

    const scoreRef = useRef<HTMLParagraphElement>(null);

    // Sync local state when external state changes (e.g. from App.tsx resets)
    useEffect(() => {
        setLocalLumpsum(oneTimeLumpsum);
        setLocalMonth(lumpsumMonth);
    }, [oneTimeLumpsum, lumpsumMonth]);

    // Fetch nearby fulfillment centers even if simulation isn't ready
    useEffect(() => {
        const fetchLocalFulfillment = async () => {
            if (!selectedUniv?.id) return;
            setFetchingBanks(true);
            try {
                const res = await axios.get(`http://localhost:8000/api/v1/universities/${selectedUniv.id}/nearby-banks?family_income=${familyIncome}`);
                setNearbyBanks(res.data.slice(0, 5));
            } catch (err) {
                console.error("Sidebar fulfillment fetch failed", err);
            } finally {
                setFetchingBanks(false);
            }
        };

        if (isOpen && selectedUniv) fetchLocalFulfillment();
    }, [isOpen, selectedUniv, familyIncome]);

    useEffect(() => {
        if (isOpen && simulation?.sustainability_data?.health_score && scoreRef.current) {
            animate(scoreRef.current, {
                innerHTML: [0, simulation.sustainability_data.health_score],
                round: 1,
                easing: 'easeInOutExpo',
                duration: 1500
            });
        }
    }, [isOpen, simulation]);

    const handleApplyLiquidation = () => {
        setIsApplying(true);
        setOneTimeLumpsum(localLumpsum);
        setLumpsumMonth(localMonth);

        // Mock a loading state for the "strategic" feel
        setTimeout(() => {
            setIsApplying(false);
        }, 800);
    };

    const sust = simulation?.sustainability_data;

    const roadmap = [
        { title: "Engagement Phase", icon: <ShieldCheck size={14} />, desc: "Simple Interest Only. Subvention active." },
        { title: "ROI Calibration", icon: <Activity size={14} />, desc: "Placement Probability: " + (sust?.placement_probability || 92) + "%" },
        { title: "Repayment Pulse", icon: <Rocket size={14} />, desc: "Switch to Compounding EMI. First 80E claim." },
        { title: "Debt Liquidator", icon: <Target size={14} />, desc: "Targeting Zero-Debt in " + (simulation?.tenure_years || 10) + " years." }
    ];

    const nudges = [
        { type: 'Aggressive', text: "Pay ₹2,000 extra/month to save " + formatCurrency(300000) + " in total interest.", risk: 'LOW' },
        { type: 'Strategic', text: sust?.recommendations?.[0] || "Maintain a 15% debt-to-income ratio for optimal 2026 stress grade.", risk: 'MEDIUM' },
        { type: 'Alert', text: "Optimize Vault balance to auto-qualify for interest-free moratorium extensions.", risk: 'HIGH' }
    ];

    return (
        <>
            <div
                onClick={onClose}
                className={cn(
                    "fixed inset-0 z-[99] bg-black/50 backdrop-blur-sm transition-opacity duration-500",
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
            />
            <div className={cn(
                "fixed inset-y-0 right-0 w-[420px] z-[100] transform transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                isOpen ? "translate-x-0 shadow-[-20px_0_60px_rgba(0,0,0,0.6)]" : "translate-x-full"
            )}>
                <div className="h-full bg-slate-950/95 backdrop-blur-3xl border-l border-white/10 flex flex-col">
                    <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-transparent to-cyan-500/5">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-cyan-500/20 rounded-2xl text-cyan-400 animate-pulse">
                                <BrainCircuit size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black italic uppercase tracking-tighter">Strategic Advisor</h2>
                                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">ML-Driven Execution Deck</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                            <ChevronRight className="text-gray-500" />
                        </button>
                    </div>

                    {/* Subvention Banner */}
                    {simulation && (simulation.vidyalaxmi_eligible || simulation.csis_eligible) && (
                        <div className="mx-8 mt-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <Zap size={16} />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">3% Subvention Active</h4>
                                <p className="text-[8px] font-bold text-gray-500 uppercase leading-none">PM-Vidyalaxmi Policy Applied</p>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                        {!simulation ? (
                            <div className="space-y-10 animate-fade-in">
                                {/* Blank State: Fulfillment Discovery */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <MapPin className="text-cyan-400" size={18} />
                                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Local Fulfillment Discovery</h3>
                                    </div>

                                    {fetchingBanks ? (
                                        <div className="space-y-4">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />
                                            ))}
                                        </div>
                                    ) : nearbyBanks.length > 0 ? (
                                        <div className="space-y-4">
                                            {nearbyBanks.map((bank, i) => (
                                                <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center group hover:border-cyan-500/30 transition-all">
                                                    <div>
                                                        <h4 className="text-[11px] font-black text-white uppercase truncate w-48">{bank.name}</h4>
                                                        <p className="text-[9px] font-bold text-gray-500">{(bank.distance_meters / 1000).toFixed(1)}km • {bank.tier} Grade</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-black text-cyan-400 italic">{bank.interest_rate_2026}%</p>
                                                        <p className="text-[7px] font-black text-gray-600 uppercase">2026 Rate</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center bg-slate-900/50 rounded-3xl border border-dashed border-white/10">
                                            <p className="text-[10px] font-bold text-gray-600 uppercase">Select a university to scan local hubs</p>
                                        </div>
                                    )}
                                </div>
                                <div className="p-6 rounded-3xl bg-slate-900 border border-white/5">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Simulation Required</p>
                                    <p className="text-[11px] font-bold text-gray-400 leading-relaxed italic text-center">
                                        Launch the portal to unlock Gradient Boosting repayment nudges and debt-clear simulations.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Financial Stress Score */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Predicted Stress Grade</p>
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter",
                                            (sust?.health_score || 0) > 75 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                                        )}>
                                            {sust?.risk_status || 'N/A'}
                                        </span>

                                    </div>
                                    <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-black border border-white/5 relative overflow-hidden group">
                                        <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <Activity size={120} className="text-white" />
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex items-baseline gap-2">
                                                <p ref={scoreRef} className="text-6xl font-black italic text-white">0</p>
                                                <span className="text-lg font-black text-gray-600 italic">%</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-gray-500 mt-2 uppercase tracking-widest">Financial Resilience Index</p>

                                            <div className="mt-8 space-y-3">
                                                <div className="flex justify-between text-[8px] font-black uppercase text-gray-500">
                                                    <span>Current Liquidity</span>
                                                    <span className="text-white">{sust?.market_momentum || 1}x Factor</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn("h-full transition-all duration-1000", (sust?.health_score || 0) > 75 ? "bg-emerald-400" : "bg-rose-400")}
                                                        style={{ width: `${sust?.health_score || 0}%` }}
                                                    />
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Advance Liquidation Module */}
                                <div className="p-6 rounded-[2rem] bg-cyan-500/5 border border-cyan-500/10 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 flex items-center gap-2">
                                            <Zap size={14} /> Advance Liquidation
                                        </h3>
                                        <span className="text-[8px] font-black text-gray-500 uppercase">Beta Matrix</span>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <p className="text-[9px] font-black text-gray-400 uppercase">One-time Lumpsum</p>
                                                <p className="text-xs font-black text-white italic">{formatCurrency(localLumpsum)}</p>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="1500000"
                                                step="50000"
                                                value={localLumpsum}
                                                onChange={(e) => setLocalLumpsum(Number(e.target.value))}
                                                className="w-full h-1 bg-slate-800 rounded-full appearance-none accent-cyan-400"
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <p className="text-[9px] font-black text-gray-400 uppercase">Liquidation Month</p>
                                                <p className="text-xs font-black text-white italic">Month {localMonth}</p>
                                            </div>
                                            <input
                                                type="range"
                                                min="1"
                                                max="120"
                                                step="1"
                                                value={localMonth}
                                                onChange={(e) => setLocalMonth(Number(e.target.value))}
                                                className="w-full h-1 bg-slate-800 rounded-full appearance-none accent-cyan-400"
                                            />
                                        </div>

                                        {(simulation.months_saved > 0 || oneTimeLumpsum > 0) && (
                                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
                                                <div>
                                                    <p className="text-[8px] font-black text-emerald-400 uppercase">Trajectory Impact</p>
                                                    <p className="text-[11px] font-bold text-gray-300 italic">{simulation.months_saved} Months Saved</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[8px] font-black text-emerald-400 uppercase">Interest Saved</p>
                                                    <p className="text-[11px] font-bold text-gray-300 italic">Significant Red.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 2026 Repayment Nudges */}
                                <div className="space-y-6">
                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                        <Zap size={14} className="text-amber-400" /> 2026 Repayment Nudges
                                    </p>
                                    <div className="space-y-4">
                                        {nudges.map((nudge, idx) => (
                                            <div key={idx} className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all flex gap-4">
                                                <div className={cn(
                                                    "w-1 h-full rounded-full",
                                                    nudge.risk === 'HIGH' ? 'bg-rose-500' : nudge.risk === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                                                )} />
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[8px] font-black uppercase text-gray-500">{nudge.type} Directive</span>
                                                    </div>
                                                    <p className="text-[11px] font-bold text-gray-300 leading-relaxed italic">{nudge.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Milestone Timeline */}
                                <div className="space-y-6">
                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                        <Target size={14} className="text-cyan-400" /> Life-Cycle Roadmap
                                    </p>
                                    <div className="space-y-8 relative ml-2">
                                        <div className="absolute left-[-8px] top-2 bottom-2 w-0.5 bg-white/5" />
                                        {roadmap.map((step, i) => (
                                            <div key={i} className="relative pl-6 group">
                                                <div className="absolute left-[-12px] top-1.5 w-2.5 h-2.5 rounded-full bg-cyan-500/20 border border-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.3)] group-hover:scale-125 transition-transform" />
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="p-1.5 bg-cyan-500/10 rounded-lg text-cyan-400">{step.icon}</span>
                                                    <h4 className="text-[11px] font-black uppercase text-gray-200 group-hover:text-cyan-400 transition-colors">{step.title}</h4>
                                                </div>
                                                <p className="text-[10px] font-bold text-gray-500 leading-tight uppercase tracking-tighter">{step.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="p-8 border-t border-white/5 bg-slate-900/20">
                        <button
                            onClick={handleApplyLiquidation}
                            disabled={!simulation || isApplying}
                            className="w-full py-5 rounded-3xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-2xl shadow-cyan-500/20 disabled:opacity-50"
                        >
                            {isApplying ? "Analyzing Trajectory..." : "Simulate Advance Liquidation"} <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
            `}</style>
        </>
    );
};
