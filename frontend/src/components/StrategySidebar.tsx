import React, { useEffect, useState } from 'react';
import {
    LayoutDashboard,
    ShieldCheck,
    Rocket,
    Target,
    ChevronRight,
    BrainCircuit,
    Zap
} from 'lucide-react';
import { cn } from '../utils/cn';

interface StrategySidebarProps {
    isOpen: boolean;
    onClose: () => void;
    simulation: any;
    formatCurrency: (amount: number, prefix?: string) => string;
}

export const StrategySidebar: React.FC<StrategySidebarProps> = ({ isOpen, onClose, simulation, formatCurrency }) => {
    const [prevSavings, setPrevSavings] = useState(0);

    // Rolling counter for savings when sidebar is open
    useEffect(() => {
        if (isOpen && simulation?.sustainability_data?.interest_savings) {
            const savings = simulation.sustainability_data.interest_savings;
            const el = document.querySelector('.savings-counter') as HTMLElement;
            if (!el) return;
            const start = prevSavings;
            const duration = 1500;
            const startTime = performance.now();
            const tick = (now: number) => {
                const progress = Math.min((now - startTime) / duration, 1);
                const value = start + (savings - start) * progress;
                el.textContent = formatCurrency(value);
                if (progress < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            setPrevSavings(savings);
        }
    }, [isOpen, simulation]);


    if (!simulation) return null;

    const sust = simulation.sustainability_data || {};
    const roadmap = [
        { title: "Moratorium Phase", icon: <ShieldCheck size={14} />, desc: "Simple Interest Only. Subvention active." },
        { title: "Graduation Prep", icon: <BrainCircuit size={14} />, desc: "Target placement ROI: >140% of total cost." },
        { title: "Repayment Launch", icon: <Rocket size={14} />, desc: "Switch to Compounding EMI. First 80E claim." },
        { title: "Early Liquidation", icon: <Target size={14} />, desc: "Apply 1-Extra-EMI rule to clear 3 years early." }
    ];

    return (
        <>
            {/* Dark backdrop — click to close */}
            <div
                onClick={onClose}
                className={cn(
                    "fixed inset-0 z-[99] bg-black/50 backdrop-blur-sm transition-opacity duration-500",
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
            />
            {/* Sidebar panel */}
            <div className={cn(
                "fixed inset-y-0 right-0 w-[400px] z-[100] transform transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                isOpen ? "translate-x-0 shadow-[-20px_0_60px_rgba(0,0,0,0.6)]" : "translate-x-full"
            )}>
                <div className="h-full bg-slate-950/90 backdrop-blur-3xl border-l border-white/10 flex flex-col">
                    <div className="p-8 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <BrainCircuit className="text-cyan-400" size={24} />
                            <div>
                                <h2 className="text-xl font-black italic uppercase tracking-tighter">AI Strategy Hub</h2>
                                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">2026 Debt Clearance roadmap</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                            <ChevronRight className="text-gray-500" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                        {/* Stress Score / Health Section */}
                        <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Global Health Status</p>
                            <div className="p-6 rounded-[2rem] bg-gradient-to-br from-slate-900 to-black border border-white/5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-[8px] font-black uppercase",
                                        sust.health_score > 75 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                                    )}>
                                        {sust.risk_status}
                                    </span>
                                </div>
                                <p className="text-5xl font-black italic text-white">{sust.health_score}%</p>
                                <p className="text-[9px] font-bold text-gray-400 mt-2">Neural Optimization Efficiency</p>

                                <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[10px] font-black uppercase text-gray-500">Predicted Savings</p>
                                        <p className="savings-counter text-2xl font-black text-emerald-400 italic">₹0</p>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-400 transition-all duration-1000"
                                            style={{ width: `${sust.health_score}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Roadmap Timeline */}
                        <div className="space-y-6">
                            <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                                <LayoutDashboard size={12} /> Milestone Directives
                            </p>
                            <div className="space-y-6 relative ml-2">
                                <div className="absolute left-[-8px] top-2 bottom-2 w-0.5 bg-white/5" />
                                {roadmap.map((step, i) => (
                                    <div key={i} className="relative pl-6 group">
                                        <div className="absolute left-[-12px] top-1.5 w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)] group-hover:scale-125 transition-transform" />
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="p-1 bg-white/5 rounded text-cyan-400">{step.icon}</span>
                                            <h4 className="text-[11px] font-black uppercase white group-hover:text-cyan-400 transition-colors">{step.title}</h4>
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-500 leading-tight">{step.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Live Intelligence Nudge */}
                        <div className="p-6 rounded-3xl bg-cyan-500/5 border border-cyan-500/20 space-y-3">
                            <div className="flex items-center gap-2 text-cyan-400">
                                <Zap size={14} />
                                <p className="text-[10px] font-black uppercase">Live Nudge</p>
                            </div>
                            <p className="text-[11px] font-bold text-gray-300 leading-relaxed italic">
                                {sust.recommendations?.[0] || "Analyze your profile to unlock custom repayment strategies."}
                            </p>
                        </div>
                    </div>

                    <div className="p-8 border-t border-white/5">
                        <button className="w-full py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all transform active:scale-95">
                            Download Strategic PDF <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
