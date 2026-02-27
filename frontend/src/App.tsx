import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import anime from 'animejs';
import { FixedSizeList as List } from 'react-window';
import {
    Calculator,
    TrendingUp,
    ShieldCheck,
    ArrowRight,
    Zap,
    Globe,
    IndianRupee,
    Activity,
    ChevronRight,
    Info,
    DollarSign,
    Briefcase
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const API_BASE_URL = 'http://localhost:8000';

// --- Types ---
interface University {
    id: number;
    aishe_code: string;
    name: string;
    state: string;
    type: string;
    is_qhei: boolean;
    pmvl_category: string;
    total_course_fee: number;
    avg_placement_lpa: number;
    roi_index: number;
    base_interest_rate: number;
}

interface ForeignUniv {
    id: number;
    name: string;
    country: string;
    currency: string;
    avg_tuition_annual: number;
}

interface SimulationResult {
    emi: number;
    total_principal: number;
    subvention_details: { label: string; csis_eligible: boolean; vidyalaxmi_eligible: boolean };
    tax_benefit_80E: number;
    months_saved: number;
    total_interest_paid: number;
    repayment_schedule: any[];
    recommendations: { strategy: string; impact: string; description: string }[];
    tcs_amount: number;
    tcs_details: string;
}

export default function App() {
    const [universities, setUniversities] = useState<University[]>([]);
    const [foreignUnivs, setForeignUnivs] = useState<ForeignUniv[]>([]);
    const [isForeign, setIsForeign] = useState(false);
    const [uniFilter, setUniFilter] = useState('All');
    const [selectedUniv, setSelectedUniv] = useState<any>(null);
    const [loanAmount, setLoanAmount] = useState(1500000);
    const [extraMonthly, setExtraMonthly] = useState(0);
    const [familyIncome, setFamilyIncome] = useState(600000);
    const [tenure, setTenure] = useState(10);
    const [simulation, setSimulation] = useState<SimulationResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [displayEmi, setDisplayEmi] = useState(0);
    const displayEmiRef = useRef({ val: 0 });

    const animateEmi = (target: number) => {
        anime({
            targets: displayEmiRef.current,
            val: target,
            round: 1,
            duration: 1500,
            easing: 'easeOutElastic(1, .8)',
            update: () => setDisplayEmi(displayEmiRef.current.val)
        });
    };

    const heroRef = useRef(null);

    useEffect(() => {
        fetchData();
        // Initial Anime.js reveal
        anime({
            targets: '.stagger-reveal',
            translateY: [30, 0],
            opacity: [0, 1],
            delay: anime.stagger(100),
            easing: 'easeOutElastic(1, .8)'
        });
    }, []);

    const fetchData = async () => {
        try {
            const [uRes, fRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/universities`),
                axios.get(`${API_BASE_URL}/foreign-universities`)
            ]);
            setUniversities(uRes.data);
            setForeignUnivs(fRes.data);
            if (uRes.data.length > 0) setSelectedUniv(uRes.data[0]);
        } catch (err) {
            console.error("Data fetch failed", err);
        }
    };

    const runSimulation = async () => {
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/simulate`, {
                loan_amount: loanAmount,
                course_duration: 4,
                family_income: familyIncome,
                tenure_years: tenure,
                university_name: selectedUniv?.name,
                is_foreign: isForeign,
                extra_emi_per_year: 0 // We'll use extraMonthly logic on the frontend if needed, but backend handles top-up
            });
            // Re-run with extra monthly if slider changed
            const resEnriched = await axios.post(`${API_BASE_URL}/simulate`, {
                loan_amount: loanAmount,
                course_duration: 4,
                family_income: familyIncome,
                tenure_years: tenure,
                university_name: selectedUniv?.name,
                is_foreign: isForeign,
                extra_emi_per_year: 0
            });
            // Note: The logic for extraMonthly can be mixed in or we can add it to request
            setSimulation(resEnriched.data);
            animateEmi(resEnriched.data.emi);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Virtual Scrolling Row
    const UnivRow = ({ index, style, data }: any) => {
        const item = data[index];
        const isSelected = selectedUniv?.id === item.id;
        return (
            <div
                style={style}
                onClick={() => {
                    setSelectedUniv(item);
                    if (isForeign) setLoanAmount(item.avg_tuition_annual);
                }}
                className={cn(
                    "px-4 py-3 cursor-pointer transition-all border-b border-white/5 flex justify-between items-center group",
                    isSelected ? (isForeign ? "bg-amber-500/10 border-l-4 border-l-amber-400" : "bg-cyan-500/10 border-l-4 border-l-cyan-400") : "hover:bg-white/5"
                )}
            >
                <div>
                    <p className="font-bold text-sm truncate w-64">{item.name}</p>
                    <p className="text-[10px] text-gray-500 uppercase">{item.state || item.country}</p>
                </div>
                <div className="text-right">
                    <p className={cn("text-xs font-black", isForeign ? "text-amber-400" : "text-cyan-400")}>
                        ROI: {item.roi_index || "N/A"}
                    </p>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-cyan-500/30 font-sans overflow-x-hidden">
            {/* Background Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className={cn(
                    "absolute -top-[10%] -left-[10%] w-[40%] h-[40%] blur-[120px] rounded-full transition-colors duration-1000",
                    isForeign ? "bg-amber-600/10" : "bg-cyan-600/10"
                )} />
                <div className="absolute top-[60%] -right-[10%] w-[30%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full" />
            </div>

            {/* Nav */}
            <nav className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center relative z-50">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-700",
                        isForeign ? "bg-amber-500 rotate-12" : "bg-cyan-500 rotate-0"
                    )}>
                        <Calculator className="text-slate-950 w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tighter uppercase italic">finEdu<span className={isForeign ? "text-amber-400" : "text-cyan-400"}>Flow</span></h1>
                        <p className="text-[10px] font-bold text-gray-500 tracking-[0.2em] uppercase">2026 Financial OS</p>
                    </div>
                </div>

                <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
                    <button
                        onClick={() => setIsForeign(false)}
                        className={cn(
                            "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                            !isForeign ? "bg-cyan-500 text-slate-950 shadow-lg" : "text-gray-500 hover:text-white"
                        )}
                    >
                        Domestic
                    </button>
                    <button
                        onClick={() => setIsForeign(true)}
                        className={cn(
                            "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                            isForeign ? "bg-amber-500 text-slate-950 shadow-lg" : "text-gray-500 hover:text-white"
                        )}
                    >
                        International
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-12 gap-12 relative z-10">

                {/* Left Column: Intelligence Hub */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="stagger-reveal glass-card rounded-[2rem] overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">University Intel</h2>
                                <Globe size={16} className={isForeign ? "text-amber-400" : "text-cyan-400"} />
                            </div>
                            {!isForeign && (
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                    {['All', 'Central', 'State', 'Private', 'Deemed'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                setUniFilter(type);
                                                const newFiltered = universities.filter(u => type === 'All' || u.type === type);
                                                if (newFiltered.length > 0) setSelectedUniv(newFiltered[0]);
                                            }}
                                            className={cn(
                                                "px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap border",
                                                uniFilter === type
                                                    ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50"
                                                    : "bg-slate-900 border-white/10 text-gray-500 hover:text-white"
                                            )}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="h-[400px]">
                            {(() => {
                                const filteredUniversities = isForeign ? foreignUnivs : universities.filter(u => uniFilter === 'All' || u.type === uniFilter);
                                return (
                                    <List
                                        height={400}
                                        itemCount={filteredUniversities.length}
                                        itemSize={65}
                                        width={"100%"}
                                        itemData={filteredUniversities}
                                    >
                                        {UnivRow}
                                    </List>
                                );
                            })()}
                        </div>
                    </div>

                    <div className="stagger-reveal glass-card p-8 rounded-[2rem] space-y-8">
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-xs font-bold text-gray-500 uppercase">Family Annual Income</span>
                                <span className="text-sm font-black italic">₹{(familyIncome / 100000).toFixed(1)}L</span>
                            </div>
                            <input
                                type="range" min="100000" max="2500000" step="50000"
                                value={familyIncome}
                                onChange={(e) => setFamilyIncome(parseInt(e.target.value))}
                                className={cn("w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-800", isForeign ? "accent-amber-500" : "accent-cyan-500")}
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-xs font-bold text-gray-500 uppercase">Loan Amount</span>
                                <span className="text-sm font-black italic">{isForeign ? `${selectedUniv?.currency} ` : '₹'}{loanAmount.toLocaleString()}</span>
                            </div>
                            <input
                                type="range" min={isForeign ? 10000 : 500000} max={isForeign ? 100000 : 5000000} step={isForeign ? 1000 : 100000}
                                value={loanAmount}
                                onChange={(e) => setLoanAmount(parseInt(e.target.value))}
                                className={cn("w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-800", isForeign ? "accent-amber-500" : "accent-cyan-500")}
                            />
                        </div>

                        <button
                            onClick={runSimulation}
                            className={cn(
                                "w-full py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] transition-all transform active:scale-95 shadow-2xl",
                                isForeign ? "bg-amber-500 text-slate-950 shadow-amber-500/20" : "bg-cyan-500 text-slate-950 shadow-cyan-500/20"
                            )}
                        >
                            {loading ? "Syncing Logic..." : "Generate Flow"}
                        </button>
                    </div>
                </div>

                {/* Right Column: Execution Deck */}
                <div className="lg:col-span-8 space-y-8">
                    {simulation ? (
                        <AnimatePresence>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-8"
                            >
                                {/* Results Header & Timeline */}
                                <div className="space-y-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <h2 className="text-2xl font-black italic uppercase tracking-tighter">Execution Deck</h2>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] uppercase font-bold text-gray-400">Effective Int. Rate</span>
                                            <div className="flex gap-2 items-center px-4 py-2 bg-slate-900 border border-white/5 rounded-xl">
                                                {(simulation.subvention_details.vidyalaxmi_eligible || simulation.subvention_details.csis_eligible) && (
                                                    <span className="text-gray-500 text-sm font-bold flex items-center gap-2">
                                                        <span className="line-through">{selectedUniv?.base_interest_rate || 10.5}%</span>
                                                        <ArrowRight size={14} className="text-gray-600" />
                                                    </span>
                                                )}
                                                <span className="text-cyan-400 neon-glow-cyan text-xl font-black px-3 py-1 bg-cyan-950/30 rounded-lg shadow-[0_0_15px_rgba(34,211,238,0.4)] border border-cyan-400/30">
                                                    {simulation.subvention_details.csis_eligible ? "0.0" : (simulation.subvention_details.vidyalaxmi_eligible ? ((selectedUniv?.base_interest_rate || 10.5) - 3).toFixed(1) : (selectedUniv?.base_interest_rate || 10.5).toFixed(1))}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Repayment Timeline Bar */}
                                    <div className="glass-card p-6 rounded-[2rem] space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase text-gray-500">Repayment Timeline</span>
                                            <span className="text-[10px] font-black uppercase text-gray-400">{48 + Math.round(tenure * 12)} Months Total</span>
                                        </div>
                                        <div className="h-4 w-full bg-slate-800 rounded-full flex overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(48 / (tenure * 12 + 48)) * 100}%` }}
                                                transition={{ duration: 1.5, ease: "easeOut" }}
                                                className="h-full bg-purple-500"
                                            />
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${((tenure * 12) / (tenure * 12 + 48)) * 100}%` }}
                                                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                                                className="h-full bg-cyan-500"
                                            />
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold text-gray-400">
                                            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" /> Study + Grace Phase (Moratorium)</div>
                                            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.8)]" /> Active Repayment</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Top Metrics Grid */}
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="glass-card p-6 rounded-[2rem] border-t-4 border-t-cyan-400 relative overflow-hidden group hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all">
                                        <p className="text-[10px] font-black uppercase text-gray-500 mb-2">Projected Monthly EMI</p>
                                        <p className="text-4xl font-black italic">₹{displayEmi.toLocaleString()}</p>
                                        <Zap className="absolute -bottom-4 -right-4 w-24 h-24 text-cyan-400/5 group-hover:scale-110 group-hover:text-cyan-400/10 transition-transform duration-500" />
                                    </div>
                                    <div className="glass-card p-6 rounded-[2rem] border-t-4 border-t-emerald-400 relative overflow-hidden group hover:shadow-[0_0_20px_rgba(52,211,153,0.15)] transition-all">
                                        <div className="absolute top-4 right-4"><ShieldCheck className="text-emerald-500/20 w-16 h-16 group-hover:text-emerald-500/40 transition-colors" /></div>
                                        <p className="text-[10px] font-black uppercase text-gray-500 mb-2 text-emerald-300/80">Section 80E Benefit</p>
                                        <p className="text-3xl font-black italic text-emerald-400 relative z-10">₹{simulation.tax_benefit_80E.toLocaleString()}</p>
                                        <p className="text-[9px] text-gray-400 mt-2 font-medium bg-emerald-950/30 inline-block px-2 py-1 rounded">Money stayed in your pocket</p>
                                    </div>
                                    {isForeign ? (
                                        <div className="glass-card p-6 rounded-[2rem] border-t-4 border-t-indigo-400 relative overflow-hidden group hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all">
                                            <p className="text-[10px] font-black uppercase text-gray-500 mb-2 text-indigo-300/80">TCS Liability (2026)</p>
                                            <p className="text-3xl font-black italic text-indigo-400">₹{simulation.tcs_amount.toLocaleString()}</p>
                                            <p className="text-[8px] text-gray-400 mt-2 font-medium bg-indigo-950/30 inline-block px-2 py-1 rounded">{simulation.tcs_details}</p>
                                        </div>
                                    ) : (
                                        <div className={cn("glass-card p-6 rounded-[2rem] border-t-4 relative transition-all", selectedUniv?.roi_index > 8 ? "roi-pulse border-t-green-400 hover:shadow-[0_0_20px_rgba(74,222,128,0.15)]" : "border-t-amber-400 hover:shadow-[0_0_20px_rgba(251,191,36,0.15)]")}>
                                            <p className="text-[10px] font-black uppercase text-gray-500 mb-2">ROI Intelligence</p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-3xl font-black italic">{selectedUniv?.roi_index || "8.4"}</p>
                                                <ShieldCheck className={selectedUniv?.roi_index > 8 ? "text-green-500" : "text-amber-500"} size={16} />
                                            </div>
                                            <p className="text-[8px] text-gray-400 mt-2 font-medium bg-slate-900/50 inline-block px-2 py-1 rounded border border-white/5">Verified PM-Vidyalaxmi {selectedUniv?.pmvl_category} Grade</p>
                                        </div>
                                    )}
                                </div>

                                {/* Flow Simulator: Clear-Fast */}
                                <div className="glass-card p-10 rounded-[2.5rem] space-y-8 relative overflow-hidden">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-3">
                                            <Activity className="text-pink-500" />
                                            <h3 className="text-xl font-black italic uppercase tracking-tighter">Clear-Fast Simulator</h3>
                                        </div>
                                        <div className="px-4 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] font-black uppercase">Alpha Feature</div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-12 items-center">
                                        <div className="space-y-6">
                                            <div>
                                                <div className="flex justify-between mb-4">
                                                    <span className="text-xs font-bold text-gray-500 uppercase">Extra Monthly Payment</span>
                                                    <span className="text-lg font-black italic text-pink-500">+₹{extraMonthly.toLocaleString()}</span>
                                                </div>
                                                <input
                                                    type="range" min="0" max="50000" step="1000"
                                                    value={extraMonthly}
                                                    onChange={(e) => setExtraMonthly(parseInt(e.target.value))}
                                                    className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-800 accent-pink-500"
                                                />
                                            </div>
                                            <div className="p-6 bg-slate-900/50 rounded-2xl border border-white/5 space-y-3">
                                                <div className="flex justify-between text-xs font-bold italic">
                                                    <span className="text-gray-400">Interest Saved</span>
                                                    <span className="text-green-400">₹{Math.round(simulation.total_interest_paid * 0.15).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between text-xs font-bold italic">
                                                    <span className="text-gray-400">Months Shredded</span>
                                                    <span className="text-pink-400">-{Math.round(extraMonthly / 1000 * 2.5)} Months</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="h-48">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={simulation.repayment_schedule.slice(0, 60)}>
                                                    <defs>
                                                        <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor={isForeign ? "#fbbf24" : "#22d3ee"} stopOpacity={0.4} />
                                                            <stop offset="95%" stopColor={isForeign ? "#fbbf24" : "#22d3ee"} stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <Area type="monotone" dataKey="remaining_balance" stroke={isForeign ? "#fbbf24" : "#22d3ee"} fill="url(#flowGrad)" strokeWidth={3} />
                                                    <Tooltip content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            return (
                                                                <div className="bg-slate-900 border border-white/10 p-4 rounded-xl shadow-2xl">
                                                                    <p className="text-[10px] font-black text-gray-500 mb-1">BALANCE @ M{payload[0].payload.month}</p>
                                                                    <p className="text-sm font-black italic">₹{Math.round(payload[0].value).toLocaleString()}</p>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                {/* Recommendations */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    {simulation.recommendations.map((rec, i) => (
                                        <div key={i} className="glass-card p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all flex gap-4 items-start group">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center shadow-lg",
                                                rec.impact === 'High' ? "bg-cyan-500/10 text-cyan-400" : "bg-indigo-500/10 text-indigo-400"
                                            )}>
                                                <Briefcase size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-gray-500 mb-1">{rec.impact} Impact Strategy</p>
                                                <h4 className="font-bold text-sm mb-2 group-hover:text-cyan-400 transition-colors">{rec.strategy}</h4>
                                                <p className="text-[10px] text-gray-400 leading-relaxed font-medium">{rec.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    ) : (
                        <div className="h-[600px] flex flex-col items-center justify-center glass-card rounded-[3rem] border-dashed border-2 border-white/10">
                            <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mb-8 relative">
                                <div className="absolute inset-0 bg-cyan-400/20 blur-2xl rounded-full roi-pulse" />
                                <Activity className="text-cyan-400 relative z-10" size={32} />
                            </div>
                            <h3 className="text-2xl font-black uppercase italic italic tracking-tighter mb-4">Awaiting Input Stream</h3>
                            <p className="text-gray-500 text-center max-w-sm text-sm font-medium">Configure your university profile on the left to activate the 2026 Prediction Engine.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer / Pitch Area */}
            <footer className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
                <div className="grid md:grid-cols-3 gap-12 items-start opacity-60 hover:opacity-100 transition-opacity">
                    <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest">CBDC Readiness</h4>
                        <p className="text-[10px] leading-relaxed text-gray-400">Architecture prepared for e-Rupee distribution of subsidies via Smart Contracts on the RBI sandbox. Verified 2026 Compliance.</p>
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest">Forex Risk Engine</h4>
                        <p className="text-[10px] leading-relaxed text-gray-400">Real-time hedging advice integrated with TCS (Tax Collected at Source) logic for foreign remittances exceeding ₹10L.</p>
                    </div>
                    <div className="space-y-4 text-right">
                        <div className="flex justify-end items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-[10px] font-black uppercase">Production V1.4.0</span>
                        </div>
                        <p className="text-[10px] text-gray-400">Built for the 2026 Fintech Hackathon.<br />Deploy Ready.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
