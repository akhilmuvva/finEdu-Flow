import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { NearbyBanks } from './components/NearbyBanks';
import { AIDebtAssistant } from './components/AIDebtAssistant';
import { StrategyDashboard } from './components/StrategyDashboard';
import { StrategySidebar } from './components/StrategySidebar';
import { animate, stagger } from 'animejs';
import { FixedSizeList as List } from 'react-window';
import {
    Calculator, Globe, Activity, Zap, ShieldCheck, Briefcase, ChevronRight,
    ArrowRight, MapPin, RotateCw, ClipboardList, CheckCircle2, Lock, XCircle, Phone
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
    total_interest: number;
    moratorium_interest: number;
    capitalized_principal: number;
    effective_rate: number;
    subsidy_status: string;
    csis_eligible: boolean;
    vidyalaxmi_eligible: boolean;
    tax_benefit_80E: number;
    months_saved: number;
    tcs_amount: number;
    tcs_details: string;
    total_interest_paid?: number;
    repayment_schedule?: any[];
    recommendations?: { strategy: string; impact: string; description: string }[];
}

export default function App() {
    const [allUniversities, setAllUniversities] = useState<University[]>([]);
    const [universities, setUniversities] = useState<University[]>([]);
    const [foreignUnivs, setForeignUnivs] = useState<ForeignUniv[]>([]);
    const [isForeign, setIsForeign] = useState(false);
    const [isInternational, setIsInternational] = useState(false);
    const [uniFilter, setUniFilter] = useState('All');
    const [selectedUniv, setSelectedUniv] = useState<any>(null);
    const [loanAmount, setLoanAmount] = useState(1500000);
    const [extraMonthly, setExtraMonthly] = useState(0);
    const [familyIncome, setFamilyIncome] = useState(600000);
    const [tenure, setTenure] = useState(10);
    const [simulation, setSimulation] = useState<SimulationResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [isLive, setIsLive] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    // Auto-run simulation when inputs change (Live Advice)
    useEffect(() => {
        if (!isLive) return;
        const debouncer = setTimeout(() => {
            if (loanAmount && tenure && familyIncome) {
                runSimulation();
            }
        }, 800);
        return () => clearTimeout(debouncer);
    }, [loanAmount, tenure, familyIncome, selectedUniv, isLive]);
    const [selectedFee, setSelectedFee] = useState(0);
    const [displayEmi, setDisplayEmi] = useState(0);
    const [displayInterest, setDisplayInterest] = useState(0);
    const [displayTax, setDisplayTax] = useState(0);
    const displayEmiRef = useRef({ val: 0, interest: 0, tax: 0 });

    const filteredUniversities = useMemo(() => {
        if (uniFilter === 'All') return allUniversities;
        return allUniversities.filter(u =>
            u.type?.toLowerCase().includes(uniFilter.toLowerCase())
        );
    }, [allUniversities, uniFilter]);

    const animateEmi = (targetEmi: number, targetInterest: number, targetTax: number) => {
        const start = { val: displayEmiRef.current.val, interest: displayEmiRef.current.interest, tax: displayEmiRef.current.tax };
        const startTime = performance.now();
        const duration = 1500;
        const ease = (t: number) => 1 - Math.pow(1 - t, 4);
        const tick = (now: number) => {
            const elapsed = Math.min((now - startTime) / duration, 1);
            const t = ease(elapsed);
            displayEmiRef.current.val = Math.round(start.val + (targetEmi - start.val) * t);
            displayEmiRef.current.interest = Math.round(start.interest + (targetInterest - start.interest) * t);
            displayEmiRef.current.tax = Math.round(start.tax + (targetTax - start.tax) * t);
            setDisplayEmi(displayEmiRef.current.val);
            setDisplayInterest(displayEmiRef.current.interest);
            setDisplayTax(displayEmiRef.current.tax);
            if (elapsed < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    };

    const formatCurrency = (amount: number, prefix: string = '₹') => {
        if (isInternational && prefix === '₹') {
            return `$${(amount / 88.75).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        }
        return `${prefix}${amount.toLocaleString('en-IN')}`;
    };

    useEffect(() => {
        if (document.querySelector('.currency-animate')) {
            animate('.currency-animate', {
                rotateX: [{ from: -90, to: 0 }],
                opacity: [{ from: 0, to: 1 }],
                duration: 600,
                easing: 'easeOutBack'
            });
        }
    }, [isInternational]);

    useEffect(() => {
        if (document.querySelector('.univ-row')) {
            animate('.univ-row', {
                translateX: [{ from: -30, to: 0 }],
                opacity: [{ from: 0, to: 1 }],
                delay: stagger(50),
                easing: 'easeOutExpo',
                duration: 500
            });
        }
    }, [uniFilter, isForeign]);


    useEffect(() => {
        fetchData();
        setTimeout(() => {
            if (document.querySelector('.stagger-reveal')) {
                animate('.stagger-reveal', {
                    translateY: [{ from: 30, to: 0 }],
                    opacity: [{ from: 0, to: 1 }],
                    delay: stagger(100),
                    easing: 'easeOutExpo'
                });
            }
        }, 100);
    }, []);

    useEffect(() => {
        if (!simulation) return;
        const timer = setTimeout(() => {
            if (document.querySelector('.metric-card-reveal')) {
                animate('.metric-card-reveal', {
                    translateY: [{ from: 24, to: 0 }],
                    scale: [{ from: 0.93, to: 1 }],
                    opacity: [{ from: 0, to: 1 }],
                    delay: stagger(120),
                    easing: 'easeOutExpo',
                    duration: 900
                });
            }
            if (document.querySelector('.subsidy-badge-animate')) {
                animate('.subsidy-badge-animate', {
                    scale: [{ from: 0.5, to: 1 }],
                    opacity: [{ from: 0, to: 1 }],
                    easing: 'easeOutBack',
                    duration: 700,
                    delay: 250
                });
            }
        }, 60);
        return () => clearTimeout(timer);
    }, [simulation]);

    const fetchData = async () => {
        try {
            const [uRes, fRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/universities`),
                axios.get(`${API_BASE_URL}/foreign-universities`)
            ]);
            setAllUniversities(uRes.data);
            setUniversities(uRes.data);
            setForeignUnivs(fRes.data);
            if (uRes.data.length > 0) {
                const first = uRes.data[0];
                setSelectedUniv(first);
                if (first.total_course_fee) {
                    setLoanAmount(Number(first.total_course_fee));
                    setSelectedFee(Number(first.total_course_fee));
                }
            }
        } catch (err) {
            console.error("Data fetch failed", err);
        }
    };

    const runSimulation = async () => {
        setLoading(true);
        setApiError(null);
        displayEmiRef.current = { val: 0, interest: 0, tax: 0 };
        setDisplayEmi(0); setDisplayInterest(0); setDisplayTax(0);
        try {
            const res = await axios.post(`${API_BASE_URL}/calculate`, {
                loan_amount: Number(loanAmount),
                family_income: Number(familyIncome),
                course_duration: 4,
                tenure_years: Number(tenure),
                university_name: selectedUniv?.name ?? null,
                is_foreign: Boolean(isForeign),
            });
            const data: SimulationResult = res.data;
            setSimulation(data);
            animateEmi(data.emi, data.total_interest, data.tax_benefit_80E);
        } catch (err: any) {
            const detail = err?.response?.data?.detail;
            const msg = detail ? (typeof detail === 'string' ? detail : JSON.stringify(detail)) : err?.message || 'Backend unreachable';
            setApiError(msg);
        } finally {
            setLoading(false);
        }
    };

    const UnivRow = ({ index, style, data }: any) => {
        const item = data[index];
        const isSelected = selectedUniv?.id === item.id;
        return (
            <div
                style={style}
                onClick={() => {
                    setSelectedUniv(item);
                    if (isForeign && item.avg_tuition_annual) {
                        setLoanAmount(Number(item.avg_tuition_annual));
                        setSelectedFee(Number(item.avg_tuition_annual));
                    } else if (!isForeign && item.total_course_fee) {
                        setLoanAmount(Number(item.total_course_fee));
                        setSelectedFee(Number(item.total_course_fee));
                    }
                }}
                className={cn(
                    "univ-row px-4 py-3 cursor-pointer transition-all border-b border-white/5 flex justify-between items-center group",
                    isSelected ? (isForeign ? "bg-amber-500/10 border-l-4 border-l-amber-400" : "bg-cyan-500/10 border-l-4 border-l-cyan-400") : "hover:bg-white/5"
                )}
            >
                <div>
                    <p className="font-bold text-sm truncate w-64">{item.name}</p>
                    <div className="flex justify-between items-center mt-0.5">
                        <p className="text-[10px] text-gray-500 uppercase">{item.state || item.country}</p>
                        <p className="text-[10px] font-bold text-gray-400">
                            {formatCurrency(isForeign ? item.avg_tuition_annual : item.total_course_fee, isForeign ? `${item.currency} ` : '₹')}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className={cn("text-xs font-black", isForeign ? "text-amber-400" : "text-cyan-400")}>
                        ROI: {item.roi_index?.toFixed(2) || "N/A"}
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

                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-white/10 backdrop-blur-md items-center shadow-2xl">
                        <button
                            onClick={() => setIsInternational(!isInternational)}
                            className={cn(
                                "px-4 py-2 mr-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-transparent",
                                isInternational ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" : "text-gray-500 hover:text-white"
                            )}
                        >
                            {isInternational ? "USD Mode" : "INR Mode"}
                        </button>
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
                    <button
                        onClick={() => {
                            document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
                            setTimeout(() => runSimulation(), 300);
                        }}
                        className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[11px] font-black uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Activity size={14} /> Launch Portal
                    </button>
                </div>
            </nav>

            {/* AI Strategy Sidebar */}
            <StrategySidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                simulation={simulation}
                formatCurrency={formatCurrency}
            />

            {/* Floating AI Hub Button */}
            {simulation && !isSidebarOpen && (
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="fixed right-0 top-1/2 -translate-y-1/2 z-[99] bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-3 py-6 rounded-l-2xl flex flex-col items-center gap-2 shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-all hover:px-4 active:scale-95 group"
                >
                    <Activity size={16} />
                    <span className="text-[8px] font-black uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">AI Hub</span>
                </button>
            )}

            <main id="dashboard" className="max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-12 gap-12 relative z-10">
                {/* Left Column */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="stagger-reveal glass-card rounded-[2rem] overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                                <div
                                    onClick={() => setIsLive(!isLive)}
                                    className={cn(
                                        "flex items-center gap-2 px-2 py-1 rounded-lg cursor-pointer transition-all border",
                                        isLive ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400" : "bg-slate-900 border-white/5 text-gray-500"
                                    )}
                                >
                                    <div className={cn("w-1 h-1 rounded-full", isLive ? "bg-cyan-400 animate-pulse" : "bg-gray-600")} />
                                    <span className="text-[8px] font-black uppercase tracking-widest">Live IQ</span>
                                </div>
                                <Globe size={16} className={isForeign ? "text-amber-400" : "text-cyan-400"} />
                            </div>
                            {!isForeign && (
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                    {['All', 'Central', 'State', 'Private', 'Deemed'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => { setUniFilter(type); if (filteredUniversities.length > 0) setSelectedUniv(filteredUniversities[0]); }}
                                            className={cn(
                                                "px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap border",
                                                uniFilter === type ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50" : "bg-slate-900 border-white/10 text-gray-500 hover:text-white"
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
                                const displayList = isForeign ? foreignUnivs : filteredUniversities;
                                return (
                                    <List height={400} itemCount={displayList.length} itemSize={65} width={"100%"} itemData={displayList}>
                                        {UnivRow}
                                    </List>
                                );
                            })()}
                        </div>
                    </div>

                    <div className="stagger-reveal glass-card p-8 rounded-[2rem] space-y-8">
                        <div className={cn("p-6 rounded-3xl border relative overflow-hidden transition-all duration-500", isForeign ? "bg-amber-500/10 border-amber-500/20 shadow-[0_0_25px_rgba(245,158,11,0.1)]" : "bg-cyan-500/10 border-cyan-500/20 shadow-[0_0_25px_rgba(6,182,212,0.1)]")}>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] mb-2">Target University</p>
                                <h3 className="text-xl font-black italic uppercase leading-tight mb-4 truncate pr-12">{selectedUniv?.name || "Select University"}</h3>
                                <div className="flex justify-between items-end border-t border-white/5 pt-4">
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Total Fee Est.</p>
                                        <p className={cn("text-2xl font-black italic", isForeign ? "text-amber-400" : "text-cyan-400")}>{formatCurrency(selectedFee, isForeign ? `${selectedUniv?.currency} ` : '₹')}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">ROI Score</p>
                                        <div className={cn("px-3 py-1 rounded-lg text-xs font-black", isForeign ? "bg-amber-500 text-slate-950" : "bg-cyan-500 text-slate-950")}>{selectedUniv?.roi_index?.toFixed(2) || "0.00"}</div>
                                    </div>
                                </div>
                            </div>
                            <Globe className={cn("absolute -top-4 -right-4 w-20 h-20 opacity-10", isForeign ? "text-amber-400" : "text-cyan-400")} />
                        </div>

                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="flex justify-between">
                                <span className="text-xs font-bold text-gray-500 uppercase">Family Annual Income</span>
                                <span className="text-sm font-black italic currency-animate block">{formatCurrency(familyIncome)}</span>
                            </div>
                            <input type="range" min="100000" max="2500000" step="50000" value={familyIncome} onChange={(e) => setFamilyIncome(parseInt(e.target.value))} className={cn("w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-800", isForeign ? "accent-amber-500" : "accent-cyan-500")} />
                        </div>

                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="flex justify-between items-center">
                                <div><span className="text-xs font-black text-white uppercase tracking-wider">Loan Amount</span><p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">Course Fee Sync Active</p></div>
                                <span className="text-sm font-black italic text-cyan-400 bg-cyan-950/30 px-3 py-1 rounded-lg border border-cyan-500/30">{formatCurrency(loanAmount, isForeign ? `${selectedUniv?.currency} ` : '₹')}</span>
                            </div>
                            <input type="range" min={isForeign ? 10000 : 500000} max={isForeign ? 100000 : 5000000} step={isForeign ? 1000 : 100000} value={loanAmount} onChange={(e) => setLoanAmount(parseInt(e.target.value))} className={cn("w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-800", isForeign ? "accent-amber-500" : "accent-cyan-500")} />
                        </div>

                        <button onClick={runSimulation} className={cn("w-full py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] transition-all transform active:scale-95 shadow-2xl", isForeign ? "bg-amber-500 text-slate-950 shadow-amber-500/20" : "bg-cyan-500 text-slate-950 shadow-cyan-500/20")}>
                            {loading ? "Syncing Logic..." : "Update Projections"}
                        </button>
                    </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-8 space-y-8 relative min-h-[500px]">
                    {loading && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-12 bg-slate-950/80 backdrop-blur-xl rounded-[2.5rem] border border-white/5">
                            <div className="relative w-24 h-24 mb-6">
                                <div className="absolute inset-0 border-4 border-t-cyan-500 border-r-transparent border-b-cyan-500/20 border-l-transparent rounded-full animate-spin"></div>
                                <Activity className="absolute inset-0 m-auto text-cyan-400 animate-pulse w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-black italic uppercase tracking-[0.3em] text-cyan-400 animate-pulse">Processing...</h3>
                        </div>
                    )}

                    {simulation ? (
                        <AnimatePresence>
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-2xl font-black italic uppercase tracking-tighter">Execution Deck</h2>
                                        {simulation.vidyalaxmi_eligible && (
                                            <div className="subsidy-badge-animate mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/30 border border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                                                <ShieldCheck className="text-purple-400 w-3.5 h-3.5" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-purple-300">PM-Vidyalaxmi Active</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] uppercase font-bold text-gray-400">Effective rate</span>
                                        <div className="px-4 py-2 bg-slate-900 border border-white/5 rounded-xl">
                                            <span className="text-cyan-400 text-xl font-black">{simulation.effective_rate?.toFixed(2)}%</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Interactive Strategy Dashboard (Web3 Style) */}
                                <StrategyDashboard simulation={simulation} formatCurrency={formatCurrency} />

                                {/* AI Debt-Clear Assistant (Repayment Optimizer) */}
                                <AIDebtAssistant simulation={simulation} formatCurrency={formatCurrency} />

                                {/* Campus-to-Capital Hub (Geoapify Integration) */}
                                {selectedUniv && (
                                    <NearbyBanks uniId={selectedUniv.id} familyIncome={familyIncome} />
                                )}

                                <div className="glass-card p-10 rounded-[2.5rem] space-y-8 overflow-hidden">
                                    <h3 className="text-xl font-black italic uppercase tracking-tighter">Clear-Fast Simulator</h3>
                                    <div className="grid md:grid-cols-2 gap-12 items-center">
                                        <div className="space-y-6">
                                            <input type="range" min="0" max="50000" step="1000" value={extraMonthly} onChange={(e) => setExtraMonthly(parseInt(e.target.value))} className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-800 accent-pink-500" />
                                            <div className="p-6 bg-slate-900/50 rounded-2xl border border-white/5 space-y-3 font-bold italic text-xs">
                                                <div className="flex justify-between text-gray-400"><span>Interest Saved</span><span className="text-green-400">₹{(Math.round(extraMonthly * 10)).toLocaleString()}*</span></div>
                                            </div>
                                        </div>
                                        <div className="h-48">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={(simulation.repayment_schedule ?? []).slice(0, 60)}>
                                                    <Area type="monotone" dataKey="remaining_balance" stroke="#22d3ee" fill="rgba(34,211,238,0.2)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    ) : (
                        <div className="h-[600px] flex flex-col items-center justify-center glass-card rounded-[3rem] border-dashed border-2 border-white/10">
                            <Activity className="text-cyan-400/20 mb-8" size={64} />
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter">Awaiting Logic Sync</h3>
                        </div>
                    )}
                </div>
            </main>

            <footer className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
                <div className="grid md:grid-cols-3 gap-12 opacity-60">
                    <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest">CBDC Readiness</h4>
                        <p className="text-[10px] text-gray-400">Prepared for RBI sandbox e-Rupee distribution.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
