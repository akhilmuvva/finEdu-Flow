import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Calculator,
  BookOpen,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Download,
  Zap,
  GraduationCap,
  Building2,
  PieChart,
  ChevronRight,
  Info
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = 'http://localhost:8000';

function App() {
  const [universities, setUniversities] = useState([]);
  const [selectedUniv, setSelectedUniv] = useState(null);
  const [loanAmount, setLoanAmount] = useState(1000000);
  const [courseDuration, setCourseDuration] = useState(4);
  const [familyIncome, setFamilyIncome] = useState(500000);
  const [tenure, setTenure] = useState(10);
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/universities`);
      setUniversities(res.data);
      if (res.data.length > 0) setSelectedUniv(res.data[0]);
    } catch (err) {
      console.error("Error fetching universities", err);
    }
  };

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/simulate`, {
        loan_amount: loanAmount,
        course_duration: courseDuration,
        family_income: familyIncome,
        tenure_years: tenure,
        university_name: selectedUniv?.name,
        extra_emi_per_year: 0
      });
      setSimulation(res.data);
    } catch (err) {
      console.error("Simulation failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-primary-500/30">
      {/* Hero Section */}
      <header className="relative py-12 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-primary-600/10 blur-[120px] rounded-full pointer-events-none" />
        <nav className="max-w-7xl mx-auto flex justify-between items-center mb-16 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Calculator className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Finn<span className="text-primary-400">EDu</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Calculator</a>
            <a href="#" className="hover:text-white transition-colors">Universities</a>
            <a href="#" className="hover:text-white transition-colors">Tax Savings</a>
          </div>
          <button className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-semibold transition-all backdrop-blur-sm">
            Launch Portal
          </button>
        </nav>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-bold mb-6 tracking-wider uppercase">
              <Zap size={14} /> 2026 Compliance Ready
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-[1.1]">
              Smart Credits for <br />
              <span className="gradient-text">Future Leaders.</span>
            </h1>
            <p className="text-xl text-gray-400 mb-8 max-w-xl leading-relaxed">
              Precision-engineered loan projections for Indian students. Benchmarked against RLLR 2026 with automated PM-Vidyalaxmi eligibility.
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => document.getElementById('engine').scrollIntoView({ behavior: 'smooth' })} className="btn-primary flex items-center gap-2">
                Simulate Now <ArrowRight size={18} />
              </button>
              <button className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-semibold transition-all">
                View University ROI
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:flex justify-end hidden"
          >
            <div className="w-full max-w-md p-8 glass-card rounded-3xl relative">
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-indigo-500/20 blur-3xl rounded-full" />
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-gray-400 text-sm mb-1 uppercase tracking-widest font-bold">Projected EMI</p>
                  <p className="text-4xl font-black">₹15,044<span className="text-sm font-medium text-gray-500">/mo</span></p>
                </div>
                <div className="bg-green-500/10 text-green-400 px-3 py-1 rounded-lg text-xs font-bold">
                  80E SAVINGS
                </div>
              </div>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="text-primary-400" size={20} />
                    <span className="text-sm font-medium">CSIS Eligible</span>
                  </div>
                  <div className="w-4 h-4 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
                </div>
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="text-indigo-400" size={20} />
                    <span className="text-sm font-medium">ROI Score</span>
                  </div>
                  <span className="text-lg font-bold">9.2/10</span>
                </div>
              </div>
              <div className="h-32 w-full bg-gradient-to-t from-primary-500/10 to-transparent rounded-2xl flex items-center justify-center border border-white/5 overflow-hidden">
                {/* Decorative sparkline */}
                <svg className="w-full h-16 px-2" viewBox="0 0 100 20">
                  <path d="M0,20 Q10,15 20,18 T40,10 T60,15 T80,5 T100,2" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-500" />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Calculator Section */}
      <section id="engine" className="max-w-7xl mx-auto py-24 px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">The Prediction <span className="text-primary-500">Engine</span></h2>
          <p className="text-gray-400">Adjust parameters to see 2026-compliant repayment schedules.</p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Inputs */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-8 glass-card rounded-3xl space-y-8">
              <div>
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Target University</label>
                <select
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  value={selectedUniv?.aishe_code}
                  onChange={(e) => setSelectedUniv(universities.find(u => u.aishe_code === e.target.value))}
                >
                  {universities.map(u => (
                    <option key={u.aishe_code} value={u.aishe_code}>{u.name}</option>
                  ))}
                </select>
                {selectedUniv && (
                  <div className="mt-3 flex gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-gray-400">{selectedUniv.pmvl_category} CATEGORY</span>
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-gray-400">NIRF rank #{selectedUniv.nirf_2026}</span>
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loan Amount</label>
                  <span className="text-lg font-bold">₹{(loanAmount / 100000).toFixed(1)}L</span>
                </div>
                <input
                  type="range" min="100000" max="4000000" step="50000"
                  className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(parseInt(e.target.value))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Family Income</label>
                  <input
                    type="number"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    value={familyIncome}
                    onChange={(e) => setFamilyIncome(parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Tenure (Yrs)</label>
                  <input
                    type="number"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    value={tenure}
                    onChange={(e) => setTenure(parseInt(e.target.value))}
                  />
                </div>
              </div>

              <button
                onClick={runSimulation}
                disabled={loading}
                className="w-full btn-primary h-14 disabled:opacity-50"
              >
                {loading ? "Calculating..." : "Update Projections"}
              </button>
            </div>

            <div className="p-6 bg-primary-900/10 border border-primary-500/20 rounded-3xl flex items-start gap-4">
              <Info className="text-primary-400 shrink-0 mt-1" />
              <p className="text-sm text-gray-400 leading-relaxed">
                Interest rates are automatically calculated based on the institution's 2026 PMVL Category (AAA/AA/A).
              </p>
            </div>
          </div>

          {/* Outputs */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {simulation ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-6 glass-card rounded-3xl">
                      <p className="text-gray-400 text-xs font-bold uppercase mb-2">Projected EMI</p>
                      <p className="text-3xl font-bold">₹{simulation.emi.toLocaleString()}</p>
                    </div>
                    <div className="p-6 glass-card rounded-3xl border-primary-500/20">
                      <p className="text-gray-400 text-xs font-bold uppercase mb-2">Subvention Status</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xl font-bold">{simulation.subvention_details.label || "None"}</p>
                        <ShieldCheck className="text-green-500" size={20} />
                      </div>
                    </div>
                  </div>

                  <div className="p-8 glass-card rounded-3xl">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <PieChart size={20} className="text-primary-400" />
                        Balance Over Time
                      </h3>
                      <div className="flex gap-4 text-xs font-medium uppercase tracking-widest text-gray-500">
                        <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary-500" /> Balance</span>
                      </div>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={simulation.repayment_schedule.filter((_, i) => i % 6 === 0)}>
                          <defs>
                            <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#335ef7" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#335ef7" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                          <XAxis
                            dataKey="month"
                            stroke="#6b7280"
                            fontSize={10}
                            tickFormatter={(val) => `M${val}`}
                          />
                          <YAxis
                            hide
                            stroke="#6b7280"
                            fontSize={10}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '12px' }}
                            itemStyle={{ color: '#fff' }}
                          />
                          <Area type="monotone" dataKey="remaining_balance" stroke="#335ef7" fillOpacity={1} fill="url(#colorBal)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="p-5 glass-card rounded-2xl">
                      <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">Tax Benefit (80E)</p>
                      <p className="text-xl font-bold text-green-400">₹{Math.round(simulation.tax_benefit_80E).toLocaleString()}</p>
                    </div>
                    <div className="p-5 glass-card rounded-2xl">
                      <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">Total Interest</p>
                      <p className="text-xl font-bold">₹{Math.round(simulation.total_interest_paid).toLocaleString()}</p>
                    </div>
                    <div className="p-5 glass-card rounded-2xl relative overflow-hidden group">
                      <div className="absolute inset-0 bg-primary-500/5 group-hover:bg-primary-500/10 transition-colors" />
                      <p className="text-gray-400 text-[10px] font-bold uppercase mb-1 relative z-10">Export Logic</p>
                      <button className="flex items-center gap-2 text-sm font-bold text-primary-400 relative z-10">
                        Download PDF <Download size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-12 glass-card rounded-3xl border-dashed border-2 border-white/10 opacity-60">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <Zap className="text-gray-500" />
                  </div>
                  <p className="text-gray-400 text-center max-w-xs">
                    Input your loan parameters to generate a high-fidelity 2026 projection.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* University Data Table */}
      <section className="bg-gray-900/30 py-24 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-4xl font-bold mb-4">ROI Intelligence</h2>
              <p className="text-gray-400">Top 2026 NIRF institutions ranked by RO-Investment Index.</p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-gray-800 rounded-lg text-xs font-bold hover:bg-gray-700 transition-colors">CENTRAL</button>
              <button className="px-4 py-2 bg-gray-800 rounded-lg text-xs font-bold hover:bg-gray-700 transition-colors">PRIVATE</button>
              <button className="px-4 py-2 bg-primary-600 rounded-lg text-xs font-bold">ALL TIERS</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-gray-500 text-xs font-bold uppercase tracking-widest">
                  <th className="pb-6 px-4">Institution</th>
                  <th className="pb-6 px-4 text-center">NIRF 2026</th>
                  <th className="pb-6 px-4">PMVL Cat</th>
                  <th className="pb-6 px-4">Avg Placement</th>
                  <th className="pb-6 px-4">Base Rate</th>
                  <th className="pb-6 px-4 text-right">ROI Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {universities.slice(0, 8).map(u => (
                  <tr key={u.aishe_code} className="hover:bg-white/5 transition-colors group">
                    <td className="py-6 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center border border-white/5 text-primary-400 font-bold group-hover:scale-110 transition-transform">
                          {u.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.state}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-4 text-center">
                      <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold">
                        #{u.nirf_2026}
                      </span>
                    </td>
                    <td className="py-6 px-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${u.pmvl_category === 'AAA' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                          u.pmvl_category === 'AA' ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' :
                            'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                        {u.pmvl_category} GRADE
                      </span>
                    </td>
                    <td className="py-6 px-4 font-bold tracking-tight">
                      ₹{u.avg_placement_lpa}L
                    </td>
                    <td className="py-6 px-4 text-gray-400 text-sm">
                      {u.base_interest_rate.toFixed(2)}%
                    </td>
                    <td className="py-6 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500"
                            style={{ width: `${u.roi_index * 10}%` }}
                          />
                        </div>
                        <span className="font-bold text-primary-400">{u.roi_index}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto py-12 px-6 border-t border-white/5 text-center">
        <div className="flex justify-center items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-primary-600 rounded flex items-center justify-center">
            <Calculator size={14} />
          </div>
          <span className="font-bold">FinnEDu</span>
        </div>
        <p className="text-gray-500 text-sm">© 2026 FinnEDu. High-Precision Education Loan Engine.</p>
      </footer>
    </div>
  );
}

export default App;
