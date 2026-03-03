import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import { animate as anime } from 'animejs';
import {
    Search, MapPin, GraduationCap, Globe, Shield, TrendingUp, Sparkles,
    ArrowRight, Calculator, ChevronRight, Wallet, Clock, RefreshCw, Layers, LayoutDashboard, FileCheck
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { FixedSizeList as List } from 'react-window';
import { cn } from './utils/cn';

// Import local components
import { NearbyBanks } from './components/NearbyBanks';
import { AIDebtAssistant } from './components/AIDebtAssistant';
import { StrategyDashboard } from './components/StrategyDashboard';
import { StrategicAdvisor } from './components/StrategicAdvisor';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DashboardSkeleton } from './components/SkeletonDashboard';
import { DocVerifier } from './components/DocVerifier';
import { RepaymentVault } from './components/RepaymentVault';

// Types
import { University, ForeignUniv, SimulationResult, Bank } from './types';

const API_BASE_URL = 'http://localhost:8000';

const App = () => {
    // --- States ---
    const [universities, setUniversities] = useState<University[]>([]);
    const [foreignUnivs, setForeignUnivs] = useState<ForeignUniv[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUniv, setSelectedUniv] = useState<University | ForeignUniv | null>(null);
    const [isInternationalActive, setIsInternationalActive] = useState(false);
    const [income, setIncome] = useState(600000);
    const [courseDuration, setCourseDuration] = useState(4);
    const [extraMonthly, setExtraMonthly] = useState(0);
    const [oneTimeLumpsum, setOneTimeLumpsum] = useState(0);
    const [lumpsumMonth, setLumpsumMonth] = useState(1);
    const [simulation, setSimulation] = useState<SimulationResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [simulating, setSimulating] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'vault' | 'documents'>('dashboard');

    // Navigation state for search list
    const [isForeign, setIsForeign] = useState(false);

    // --- Refs ---
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const simulationRef = useRef<HTMLDivElement>(null);

    // --- Formatters ---
    const formatCurrency = useCallback((val: number, isInt: boolean | unknown = isInternationalActive) => {
        const checkInt = typeof isInt === 'boolean' ? isInt : isInternationalActive;
        return new Intl.NumberFormat(checkInt ? 'en-US' : 'en-IN', {
            style: 'currency',
            currency: checkInt ? 'USD' : 'INR',
            maximumFractionDigits: 0
        }).format(val);
    }, [isInternationalActive]);

    // --- API Calls ---
    useEffect(() => {
        const fetchUnivs = async () => {
            try {
                const [domestic, foreign] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/v1/universities`),
                    axios.get(`${API_BASE_URL}/api/v1/foreign-universities`)
                ]);
                setUniversities(domestic.data);
                setForeignUnivs(foreign.data);
                setLoading(false);
            } catch (err: unknown) {
                console.error('Fetch failed:', err);
                setLoading(false);
            }
        };
        fetchUnivs();
    }, []);

    const runSimulation = useCallback(async () => {
        if (!selectedUniv) return;
        setSimulating(true);
        try {
            const tuition = ('total_course_fee' in selectedUniv && (selectedUniv as University).total_course_fee)
                ? (selectedUniv as University).total_course_fee
                : (('avg_tuition_annual' in selectedUniv && (selectedUniv as ForeignUniv).avg_tuition_annual)
                    ? (selectedUniv as ForeignUniv).avg_tuition_annual * courseDuration
                    : 0);
            const res = await axios.post(`${API_BASE_URL}/api/v1/calculate`, {
                loan_amount: tuition,
                family_income: income,
                course_duration: courseDuration,
                tenure_years: 10,
                extra_monthly: extraMonthly,
                one_time_lumpsum: oneTimeLumpsum,
                lumpsum_month: lumpsumMonth,
                is_foreign: isInternationalActive,
                university_name: selectedUniv.name
            });
            setSimulation(res.data);
        } catch (err: unknown) {
            console.error('Simulation Failed:', err);
        } finally {
            setSimulating(false);
        }
    }, [selectedUniv, income, courseDuration, extraMonthly, isInternationalActive]);

    // Debounced Simulation Effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (selectedUniv) runSimulation();
        }, 500);
        return () => clearTimeout(timer);
    }, [selectedUniv, income, courseDuration, extraMonthly, oneTimeLumpsum, lumpsumMonth, isInternationalActive, runSimulation]);

    // --- Handlers ---
    const handleUnivSelect = (univ: University | ForeignUniv) => {
        setSelectedUniv(univ);
        setIsInternationalActive(isForeign);
        if (simulationRef.current) {
            anime(simulationRef.current, {
                opacity: [0, 1],
                translateY: [20, 0],
                duration: 800,
                easing: 'easeOutExpo'
            });
        }
        simulationRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // --- Filtered Lists ---
    const filteredList = useMemo(() => {
        const list = isForeign ? foreignUnivs : universities;
        return list.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [isForeign, universities, foreignUnivs, searchQuery]);

    // --- Search UI Components ---
    const UnivRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const univ = filteredList[index];
        const isSel = selectedUniv?.id === univ.id;
        const avg_tuition = ('avg_tuition_annual' in univ) ? (univ.avg_tuition_annual || 0) : (('total_course_fee' in univ) ? (univ as University).total_course_fee : 0);
        const currency = ('currency' in univ) ? (univ.currency || 'INR') : 'INR';
        const roi = ('roi_index' in univ) ? (univ.roi_index || 0) : 0;

        return (
            <div style={style} className="px-4 py-2">
                <button
                    onClick={() => handleUnivSelect(univ)}
                    className={cn(
                        "w-full flex items-center justify-between p-4 rounded-3xl border transition-all duration-500 group",
                        isSel ? "glass-card border-cyan-500/50 bg-cyan-500/10" : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/[0.07]"
                    )}
                >
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                            isSel ? "bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.4)]" : "bg-white/5 text-gray-400"
                        )}>
                            <GraduationCap size={20} />
                        </div>
                        <div className="text-left">
                            <h4 className="text-sm font-black text-white tracking-tight uppercase italic">{univ.name}</h4>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                    <MapPin size={8} /> {isForeign ? 'International' : 'Domestic'}
                                </span>
                                <span className="text-[10px] font-black text-cyan-400/80 uppercase">
                                    {formatCurrency(avg_tuition, currency === 'USD')}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="hidden md:block text-right">
                            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">ROI Index</p>
                            <div className="flex items-center gap-1.5">
                                <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                                        style={{ width: `${(roi / 5) * 100}%` }}
                                    />
                                </div>
                                <span className="text-[10px] font-black text-emerald-400 italic">{(roi).toFixed(1)}</span>
                            </div>
                        </div>
                        <ChevronRight className={cn("text-gray-600 transition-transform", isSel && "translate-x-1 text-cyan-400")} size={16} />
                    </div>
                </button>
            </div>
        );
    };

    if (loading) return <DashboardSkeleton />;

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 font-['Outfit'] selection:bg-cyan-500/30 overflow-x-hidden">
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(34,211,238,0.08)_0%,_transparent_50%)] pointer-events-none" />

            {/* Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-500"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Strategic Advisor Sidebar */}
            {simulation && (
                <StrategicAdvisor
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    simulation={simulation}
                    formatCurrency={formatCurrency}
                    selectedUniv={selectedUniv}
                    familyIncome={income}
                    oneTimeLumpsum={oneTimeLumpsum}
                    setOneTimeLumpsum={setOneTimeLumpsum}
                    lumpsumMonth={lumpsumMonth}
                    setLumpsumMonth={setLumpsumMonth}
                />
            )}

            <main className="relative max-w-7xl mx-auto px-6 py-12 lg:py-20">
                {/* Hero Header */}
                <header className="mb-20 text-center relative">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-md">
                        <ArrowRight size={14} className="text-cyan-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/80 italic">Finance Evolution 2025</span>
                    </div>

                    <h1 className="text-6xl lg:text-8xl font-black italic tracking-tighter mb-6 uppercase inline-block bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent leading-[0.85]">
                        Student <span className="text-cyan-400">Flow</span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-base text-gray-400 font-medium leading-relaxed uppercase tracking-tight">
                        Navigate the complexities of student debt with AI-driven <span className="text-white">repayment strategies</span> and <span className="text-white">university ROI</span> benchmarking.
                    </p>
                </header>

                {/* University Search Section */}
                <section className="mb-20" ref={scrollContainerRef}>
                    <div className="glass-card rounded-[3.5rem] p-4 lg:p-6 border border-white/10 shadow-2xl relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[100px] -mr-32 -mt-32 pointer-events-none" />

                        <div className="flex flex-col lg:flex-row gap-6">
                            {/* University Type Toggle */}
                            <div className="lg:w-72 flex-shrink-0">
                                <div className="bg-slate-900/50 p-2 rounded-3xl border border-white/5 flex flex-row lg:flex-col gap-2 h-full">
                                    {[
                                        { id: false, label: 'Domestic', icon: MapPin, desc: 'NIRF Ranked Inst.' },
                                        { id: true, label: 'International', icon: Globe, desc: 'Global Rankings' }
                                    ].map((type) => (
                                        <button
                                            key={type.label}
                                            onClick={() => {
                                                setIsForeign(type.id);
                                                setSelectedUniv(null);
                                            }}
                                            className={cn(
                                                "flex-1 flex items-center gap-4 p-4 rounded-2xl transition-all duration-500 group",
                                                isForeign === type.id ? "bg-white text-slate-950 shadow-xl" : "hover:bg-white/5 text-gray-500"
                                            )}
                                        >
                                            <div className={cn(
                                                "p-2.5 rounded-xl transition-colors",
                                                isForeign === type.id ? "bg-slate-950 text-white" : "bg-white/5 text-gray-500"
                                            )}>
                                                <type.icon size={18} />
                                            </div>
                                            <div className="text-left hidden lg:block">
                                                <p className="text-xs font-black uppercase tracking-tight">{type.label}</p>
                                                <p className={cn(
                                                    "text-[9px] font-bold uppercase tracking-widest",
                                                    isForeign === type.id ? "text-slate-950/60" : "text-gray-600"
                                                )}>{type.desc}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Search and List */}
                            <div className="flex-1 min-w-0">
                                <div className="mb-4 relative group">
                                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                        <Search className="text-gray-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder={`SEARCH ${isForeign ? 'GLOBAL' : 'NIRF'} UNIVERSITIES...`}
                                        className="w-full bg-slate-900/50 border border-white/5 rounded-3xl py-6 pl-16 pr-8 text-sm font-black uppercase tracking-widest text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 focus:bg-slate-900 transition-all"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                <div className="h-[400px] border border-white/5 rounded-3xl bg-slate-900/30 overflow-hidden relative">
                                    {filteredList.length > 0 ? (
                                        <List
                                            height={400}
                                            itemCount={filteredList.length}
                                            itemSize={80}
                                            width="100%"
                                            className="custom-scrollbar"
                                        >
                                            {UnivRow}
                                        </List>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center opacity-40">
                                            <Calculator size={48} className="text-gray-600 mb-4" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Match Found</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Dashboard / Simulation Section */}
                <div ref={simulationRef} className="scroll-mt-20">
                    {selectedUniv ? (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Left Column: Inputs */}
                            <div className="lg:col-span-4 space-y-8">
                                <div className="glass-card p-10 rounded-[3.5rem] border border-white/5 relative overflow-hidden group">
                                    <h3 className="text-lg font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3">
                                        <Layers className="text-cyan-400" size={20} />
                                        Input Matrix
                                    </h3>

                                    <div className="space-y-10 relative z-10">
                                        {[
                                            { label: 'Expected Income', val: income, set: setIncome, min: 300000, max: 5000000, step: 50000, icon: TrendingUp },
                                            { label: 'Course Duration', val: courseDuration, set: setCourseDuration, min: 1, max: 6, step: 1, icon: Clock },
                                            { label: 'Extra Monthly Repay', val: extraMonthly, set: setExtraMonthly, min: 0, max: 50000, step: 1000, icon: Shield }
                                        ].map((input) => (
                                            <div key={input.label} className="group/item">
                                                <div className="flex justify-between items-center mb-4">
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                                        <input.icon size={12} className="text-cyan-400/50" />
                                                        {input.label}
                                                    </label>
                                                    <span className="text-sm font-black text-white italic tracking-tighter bg-white/5 px-3 py-1 rounded-lg">
                                                        {input.label.includes('Income') || input.label.includes('Repay')
                                                            ? formatCurrency(input.val)
                                                            : `${input.val} YEARS`}
                                                    </span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min={input.min}
                                                    max={input.max}
                                                    step={input.step}
                                                    value={input.val}
                                                    onChange={(e) => input.set(Number(e.target.value))}
                                                    className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 transition-all"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Strategy Sidebar Toggle */}
                                <button
                                    onClick={() => setSidebarOpen(true)}
                                    disabled={!simulation}
                                    className="w-full group relative p-8 rounded-[2.5rem] bg-gradient-to-br from-cyan-500 to-blue-600 overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(34,211,238,0.2)] disabled:opacity-50 disabled:grayscale"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="text-left">
                                            <p className="text-[10px] font-black text-slate-950 uppercase tracking-[0.2em] mb-1">Quantum View</p>
                                            <h4 className="text-xl font-black text-slate-950 uppercase italic leading-none">AI Strategic Advisor</h4>
                                        </div>
                                        <div className="p-3 bg-slate-950/20 rounded-2xl text-slate-950">
                                            <ArrowRight size={24} />
                                        </div>
                                    </div>
                                </button>

                                {/* Live Simulation Status */}
                                <div className="glass-card p-6 rounded-3xl border border-white/5 flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping absolute inset-0" />
                                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full relative" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Live Simulation Active</p>
                                    </div>
                                    {simulating && <RefreshCw size={14} className="text-cyan-400 animate-spin" />}
                                </div>
                            </div>

                            {/* Right Column: Dynamic Tabs */}
                            <div className="lg:col-span-8 flex flex-col gap-8">
                                {/* Navigation Tabs */}
                                <div className="glass-card p-2 rounded-[2rem] border border-white/5 flex gap-2">
                                    {[
                                        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                                        { id: 'documents', label: 'Vault', icon: FileCheck },
                                        { id: 'vault', label: 'Repayment', icon: Wallet }
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as 'dashboard' | 'vault' | 'documents')}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all italic",
                                                activeTab === tab.id ? "bg-white text-slate-950 shadow-lg" : "text-gray-500 hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            <tab.icon size={16} />
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {activeTab === 'dashboard' && (
                                    <ErrorBoundary>
                                        <div className="flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                            {simulation ? (
                                                <>
                                                    <StrategyDashboard
                                                        simulation={simulation}
                                                        formatCurrency={formatCurrency}
                                                        universityName={selectedUniv?.name || ''}
                                                        familyIncome={income}
                                                    />

                                                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />

                                                    <AIDebtAssistant
                                                        simulation={simulation}
                                                        formatCurrency={formatCurrency}
                                                        onApply={(monthly) => setExtraMonthly(monthly)}
                                                    />

                                                    <NearbyBanks
                                                        uniId={selectedUniv?.id || 0}
                                                        familyIncome={income}
                                                    />
                                                </>
                                            ) : (
                                                <div className="h-[500px] glass-card rounded-[3.5rem] flex flex-col items-center justify-center border border-white/5">
                                                    <div className="p-8 bg-cyan-500/10 rounded-full mb-6">
                                                        <Sparkles className="text-cyan-400 animate-pulse" size={48} />
                                                    </div>
                                                    <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2">Neural Engine Initializing</h3>
                                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Select Parameters for Insight</p>
                                                </div>
                                            )}
                                        </div>
                                    </ErrorBoundary>
                                )}

                                {activeTab === 'documents' && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                                        <DocVerifier
                                            isEligibleSubvention={income <= 450000}
                                            universityTier={selectedUniv && 'pmvl_category' in selectedUniv ? (selectedUniv as University).pmvl_category : undefined}
                                        />
                                    </div>
                                )}

                                {activeTab === 'vault' && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                                        <RepaymentVault emi={simulation?.emi || 0} />
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-[60vh] flex flex-col items-center justify-center text-center px-6">
                            <div className="relative mb-12">
                                <div className="absolute inset-0 bg-cyan-500/20 blur-[80px] rounded-full scale-150 animate-pulse" />
                                <div className="relative h-40 w-40 flex items-center justify-center rounded-[3rem] bg-slate-900 border border-white/10 shadow-2xl">
                                    <MapPin size={64} className="text-cyan-400 opacity-20 absolute" />
                                    <Globe className="text-cyan-400 animate-[spin_10s_linear_infinite]" size={48} />
                                </div>
                            </div>
                            <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-4">Initialize <span className="text-cyan-400">Trajectory</span></h2>
                            <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px] max-w-sm">Select a university to begin financial simulation and debt strategy synthesis.</p>
                            <button
                                onClick={() => scrollContainerRef.current?.scrollIntoView({ behavior: 'smooth' })}
                                className="mt-10 px-8 py-4 bg-white text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-cyan-400 transition-all hover:scale-105 active:scale-95"
                            >
                                Start Analysis
                            </button>
                        </div>
                    )}
                </div>
            </main>

            <div className="fixed bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent pointer-events-none" />
        </div>
    );
};

export default App;
