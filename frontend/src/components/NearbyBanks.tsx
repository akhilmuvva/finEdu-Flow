import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { animate, stagger } from 'animejs';
import { MapPin, Phone, RotateCw, ClipboardList, CheckCircle2, ChevronRight, Briefcase } from 'lucide-react';
import { cn } from '../utils/cn';

interface Bank {
    name: string;
    distance_meters: number;
    formatted_address: string;
    lat: number;
    lon: number;
    pmvl_prioritized: boolean;
    interest_rate_2026: number;
    tier: string;
    maps_url: string;
    document_checklist: Array<{ doc: string; required: boolean; priority: string }>;
}

interface NearbyBanksProps {
    uniId: number;
    familyIncome: number;
}

export const NearbyBanks: React.FC<NearbyBanksProps> = ({ uniId, familyIncome }) => {
    const [banks, setBanks] = useState<Bank[]>([]);
    const [loading, setLoading] = useState(false);
    const [flippedBank, setFlippedBank] = useState<number | null>(null);

    useEffect(() => {
        const fetchBanks = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`http://localhost:8000/api/v1/universities/${uniId}/nearby-banks?family_income=${familyIncome}`);
                setBanks(res.data);
                // Staggered slide-in animation (with guard)
                setTimeout(() => {
                    if (document.querySelector('.bank-card-entrance')) {
                        animate('.bank-card-entrance', {
                            translateX: [100, 0],
                            opacity: [0, 1],
                            delay: stagger(150),
                            easing: 'easeOutExpo',
                            duration: 1200
                        });
                    }
                }, 200);
            } catch (err) {
                console.error("Failed to fetch nearby banks", err);
            } finally {
                setLoading(false);
            }
        };

        if (uniId) fetchBanks();
    }, [uniId, familyIncome]);

    if (loading && banks.length === 0) {
        return (
            <div className="h-48 flex items-center justify-center glass-card rounded-[2rem]">
                <div className="flex flex-col items-center gap-4">
                    <RotateCw className="text-cyan-400 animate-spin" size={24} />
                    <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Scanning Nearby Branches</p>
                </div>
            </div>
        );
    }

    if (!loading && banks.length === 0) {
        return (
            <div className="glass-card p-8 rounded-[2rem] flex items-center justify-center gap-4 border border-dashed border-white/10">
                <MapPin className="text-gray-600" size={20} />
                <p className="text-xs font-bold text-gray-500">No branches found within 5km. Try a different university.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Briefcase className="text-cyan-400" />
                    <h3 className="text-xl font-black italic uppercase tracking-tighter">Campus-to-Capital Hub</h3>
                </div>
                {familyIncome <= 800000 && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-black uppercase shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Subvention Qualified
                    </div>
                )}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {banks.map((bank, idx) => {
                    const isFlipped = flippedBank === idx;
                    return (
                        <div
                            key={idx}
                            onClick={() => setFlippedBank(isFlipped ? null : idx)}
                            className="bank-card-entrance opacity-0 relative h-[19rem] [perspective:1000px] cursor-pointer group"
                        >
                            <div className={cn("relative w-full h-full transition-all duration-700 [transform-style:preserve-3d]", isFlipped && "[transform:rotateY(180deg)]")}>
                                {/* Front: Branch Detail */}
                                <div className="absolute inset-0 [backface-visibility:hidden] glass-card p-6 rounded-[2rem] border-t-2 border-t-cyan-500/50 flex flex-col justify-between hover:shadow-[0_0_30px_rgba(34,211,238,0.1)] transition-all">
                                    <div className="flex justify-between items-start">
                                        <div className="p-2.5 bg-slate-900 rounded-xl border border-white/5">
                                            <MapPin size={18} className="text-cyan-400" />
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-[8px] font-black text-gray-400 uppercase mb-0.5">
                                                <RotateCw size={8} /> {(bank.distance_meters / 1000).toFixed(1)} km away
                                            </div>
                                            <a
                                                href={bank.maps_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 px-2 py-1 rounded bg-cyan-500/10 text-[8px] font-black text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 uppercase transition-all"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                Route to Success <ChevronRight size={8} />
                                            </a>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <h4 className="font-black text-sm uppercase tracking-tight group-hover:text-cyan-400 transition-colors line-clamp-2">{bank.name}</h4>
                                        <p className="text-[9px] text-gray-500 font-bold mt-1">Repo-linked 2026 Rate</p>
                                    </div>
                                    <div className="mt-2 p-3.5 bg-slate-950/50 rounded-2xl border border-white/5 group-hover:border-cyan-500/30 transition-all">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-black italic text-cyan-400">{bank.interest_rate_2026?.toFixed(1)}%</span>
                                            <span className="text-[10px] font-black text-gray-600 uppercase italic">p.a.</span>
                                        </div>
                                        <p className="text-[8px] text-gray-600 mt-1 uppercase font-bold tracking-wider">Applied for {bank.tier} Grade</p>
                                    </div>
                                    {bank.pmvl_prioritized && (
                                        <div className="mt-2 flex items-center gap-1.5 text-[8px] font-black text-purple-400 uppercase">
                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" /> PM-Vidyalaxmi Priority Branch
                                        </div>
                                    )}
                                    <div className="mt-2 flex items-center justify-between text-[8px] font-black uppercase text-cyan-500 tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
                                        Flip for Pre-Qual <ChevronRight size={10} />
                                    </div>
                                </div>

                                {/* Back: Dynamic Checklist from Backend */}
                                <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] glass-card p-6 rounded-[2rem] bg-slate-900 border-t-2 border-t-emerald-500/50 overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                                    <p className="text-[9px] font-black uppercase text-emerald-400 tracking-[0.2em] flex items-center gap-2 mb-4">
                                        <ClipboardList size={12} /> Document Readiness
                                    </p>
                                    <div className="space-y-2.5">
                                        {(bank.document_checklist || [
                                            { doc: 'Income Certificate', required: bank.pmvl_prioritized, priority: 'HIGH' },
                                            { doc: 'NIRF Admission Letter', required: true, priority: 'HIGH' },
                                            { doc: 'Co-applicant Aadhar', required: true, priority: 'HIGH' },
                                            { doc: 'Entrance Scorecard', required: true, priority: 'MEDIUM' },
                                            { doc: 'Fee Structure', required: true, priority: 'MEDIUM' },
                                        ]).map((item: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between p-2 bg-white/5 rounded-xl">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 size={10} className={item.required ? 'text-emerald-400' : 'text-gray-600'} />
                                                    <span className="text-[9px] font-bold text-gray-300 uppercase">{item.doc}</span>
                                                </div>
                                                <span className={cn(
                                                    "text-[7px] font-black px-1.5 py-0.5 rounded uppercase",
                                                    item.priority === 'HIGH' ? 'bg-rose-500/20 text-rose-400' :
                                                        item.priority === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
                                                            'bg-gray-500/20 text-gray-400'
                                                )}>{item.priority}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="w-full mt-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black uppercase tracking-widest transition-all transform active:scale-95">
                                        Reserve Branch Slot
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
