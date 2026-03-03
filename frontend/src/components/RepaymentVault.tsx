import React, { useState, useEffect, useRef, useCallback } from 'react';

import axios from 'axios';
import { Wallet, ArrowUpRight, TrendingUp, ShieldCheck, CreditCard, Bell, Info } from 'lucide-react';
import { animate } from 'animejs';
import { motion, AnimatePresence } from 'framer-motion';

interface VaultHistory {
    amount: number;
    type: string;
    description: string;
    date: string;
}

interface VaultData {
    balance: number;
    last_fee_deduction: string | null;
}

export const RepaymentVault: React.FC<{ emi: number }> = ({ emi }) => {
    const [vault, setVault] = useState<VaultData | null>(null);
    const [history, setHistory] = useState<VaultHistory[]>([]);
    const [isDepositing, setIsDepositing] = useState(false);
    const [showNotification, setShowNotification] = useState(false);

    const progressRef = useRef<HTMLDivElement>(null);
    const balanceRef = useRef<HTMLSpanElement>(null);

    const fetchVaultData = useCallback(async () => {
        try {
            const [vaultRes, historyRes] = await Promise.all([
                axios.get('http://localhost:8000/api/v1/vault'),
                axios.get('http://localhost:8000/api/v1/vault/history')
            ]);
            setVault(vaultRes.data);
            setHistory(historyRes.data);

            // Trigger notifications or animations if a fee was recently deducted
            if (vaultRes.data.last_fee_deduction) {
                // If fee was deducted in the last minute (simulated check)
                const lastDate = new Date(vaultRes.data.last_fee_deduction).getTime();
                if (Date.now() - lastDate < 60000) {
                    setShowNotification(true);
                }
            }
        } catch {
            console.error('Failed to fetch vault data');
        }

    }, []);


    useEffect(() => {
        const init = async () => {
            await fetchVaultData();
        };
        init();
    }, [fetchVaultData]);



    useEffect(() => {
        if (vault && progressRef.current) {
            const nextEmiGoal = emi || 10000;
            const percentage = Math.min((vault.balance / nextEmiGoal) * 100, 100);

            if (progressRef.current) {
                animate(progressRef.current, {
                    width: `${percentage}%`,
                    duration: 1500,
                    easing: 'easeOutElastic(1, .8)'
                });
            }

            if (balanceRef.current) {
                animate(balanceRef.current, {
                    innerHTML: [0, vault.balance],
                    round: 1,
                    easing: 'easeInOutExpo',
                    duration: 1500
                });
            }
        }
    }, [vault, emi]);

    const handleDeposit = async () => {
        setIsDepositing(true);
        // Simulate Razorpay Payment Flow
        setTimeout(async () => {
            try {
                await axios.post('http://localhost:8000/api/v1/vault/deposit', {
                    amount: 5000,
                    razorpay_payment_id: `pay_${Math.random().toString(36).substr(2, 9)}`
                });
                await fetchVaultData();
                setIsDepositing(false);
            } catch {
                setIsDepositing(false);
            }

        }, 1200);
    };

    return (
        <div className="relative group overflow-hidden rounded-3xl bg-slate-900/40 border border-white/10 backdrop-blur-xl p-8 transition-all hover:border-teal-500/50">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-teal-500/20 rounded-2xl text-teal-400 group-hover:scale-110 transition-transform">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white font-outfit">Student Repayment Vault</h3>
                        <p className="text-slate-400 text-sm">Automated Proactive Debt-Clearing</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-teal-500/10 rounded-full border border-teal-500/20">
                    <ShieldCheck size={14} className="text-teal-400" />
                    <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Secured</span>
                </div>
            </div>

            {/* Balance Card */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="p-6 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-white/5">
                    <p className="text-slate-400 text-sm mb-1 uppercase tracking-widest font-bold">Total Savings</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-extrabold text-white font-outfit">₹<span ref={balanceRef}>0</span></span>
                        <div className="flex items-center text-teal-400 text-sm font-medium">
                            <TrendingUp size={16} className="mr-1" />
                            <span>Target: ₹{emi.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6">
                        <div className="flex justify-between text-[10px] text-slate-500 uppercase font-black mb-2 tracking-tighter">
                            <span>Progress to Next EMI</span>
                            <span>{vault ? Math.round((vault.balance / emi) * 100) : 0}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div ref={progressRef} className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 shadow-[0_0_15px_rgba(45,212,191,0.5)] w-0" />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col justify-center gap-4">
                    <button
                        onClick={handleDeposit}
                        disabled={isDepositing}
                        className="w-full relative py-4 px-6 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-700 text-slate-950 font-black rounded-2xl transition-all flex items-center justify-center gap-3 overflow-hidden group/btn"
                    >
                        {isDepositing ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
                                <span>Processing...</span>
                            </div>
                        ) : (
                            <>
                                <ArrowUpRight size={20} className="transition-transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
                                <span>Deposit Savings (Razorpay)</span>
                            </>
                        )}
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                    </button>
                    <div className="flex items-center gap-3 p-4 bg-slate-800/40 rounded-xl border border-white/5 text-[11px] text-slate-400 leading-relaxed">
                        <Info size={16} className="text-teal-500 shrink-0" />
                        Deposits here drop your Financial Stress Score to 'Green' if 3 months covered.
                    </div>
                </div>
            </div>

            {/* History Link / Quick View */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recent Activity</h4>
                    <span className="text-[10px] text-teal-400 hover:underline cursor-pointer">View All Transactions</span>
                </div>
                <div className="space-y-3 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                    {history.length > 0 ? history.slice(0, 3).map((tx, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${tx.amount > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {tx.amount > 0 ? <TrendingUp size={14} /> : <CreditCard size={14} />}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white">{tx.description}</p>
                                    <p className="text-[10px] text-slate-500">{new Date(tx.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <span className={`text-xs font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                                {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toLocaleString()}
                            </span>
                        </div>
                    )) : (
                        <p className="text-center py-8 text-slate-500 text-xs italic">No transactions yet. Start saving for a stress-free future.</p>
                    )}
                </div>
            </div>

            {/* Platform Fee Notification */}
            <AnimatePresence>
                {showNotification && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="absolute bottom-6 right-6 left-6 p-4 bg-indigo-600 rounded-2xl shadow-2xl border border-indigo-400 flex items-center gap-4 z-50"
                    >
                        <div className="p-2 bg-white/20 rounded-xl text-white">
                            <Bell size={20} className="animate-bounce" />
                        </div>
                        <div className="flex-1">
                            <h5 className="text-sm font-bold text-white">Annual Platform Fee Deducted</h5>
                            <p className="text-[10px] text-indigo-100 opacity-80 leading-tight">
                                This fee powers your 2026 AI Advisor, Geoapify Location Services, and Smart Calendar Sync.
                            </p>
                        </div>
                        <button onClick={() => setShowNotification(false)} className="text-white/60 hover:text-white">
                            <Info size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            `}</style>
        </div>
    );
};
