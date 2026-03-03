import React, { useState, useRef } from 'react';
import axios from 'axios';
import { animate, stagger } from 'animejs';
import { Calendar, Check, Download, Loader2, Sparkles, MapPin } from 'lucide-react';
import { cn } from '../utils/cn';

import { SimulationResult } from '../types';

interface SmartCalendarSyncProps {
    simulation: SimulationResult | null;

    universityName: string;
    lat?: number;
    lon?: number;
    familyIncome: number;
}

export const SmartCalendarSync: React.FC<SmartCalendarSyncProps> = ({
    simulation, universityName, lat, lon, familyIncome
}) => {
    const [syncing, setSyncing] = useState(false);
    const [synced, setSynced] = useState(false);
    const timelineRef = useRef<HTMLDivElement>(null);

    const handleSync = async () => {
        setSyncing(true);

        // Anime.js Timeline Animation
        if (timelineRef.current) {
            animate('.sync-dot', {
                scale: [0, 1],
                opacity: [0, 1],
                delay: stagger(50),
                easing: 'easeOutElastic(1, .8)',
                duration: 800
            });
        }

        try {
            const res = await axios.post('http://localhost:8000/api/v1/generate-calendar', {
                simulation_data: simulation,
                university_name: universityName,
                lat: lat,
                lon: lon,
                family_income: familyIncome
            });

            const { ics_content } = res.data;
            const blob = new Blob([ics_content], { type: 'text/calendar' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'FinnEDu_EMI_Plan.ics');
            document.body.appendChild(link);
            link.click();
            link.remove();

            setSynced(true);
            setTimeout(() => setSynced(false), 3000);
        } catch (err) {
            console.error("Calendar sync failed", err);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="glass-card p-6 rounded-[2rem] border border-white/5 bg-slate-950/20 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-xl">
                        <Calendar className="text-indigo-400" size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black uppercase italic tracking-tighter">Smart EMI Reminders</h4>
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Auto-Syncing Timeline</p>
                    </div>
                </div>
                <button
                    onClick={handleSync}
                    disabled={syncing}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        synced
                            ? "bg-emerald-500 text-slate-950"
                            : "bg-indigo-500 hover:bg-indigo-400 text-slate-950"
                    )}
                >
                    {syncing ? (
                        <><Loader2 size={12} className="animate-spin" /> Syncing...</>
                    ) : synced ? (
                        <><Check size={12} /> Synced!</>
                    ) : (
                        <><Download size={12} /> Set Reminders</>
                    )}
                </button>
            </div>

            {/* Animation Timeline */}
            <div className="relative h-12 flex items-center gap-1 overflow-hidden" ref={timelineRef}>
                {Array.from({ length: 40 }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "sync-dot w-2 h-2 rounded-full opacity-0",
                            i < 12 ? "bg-indigo-500/40" : "bg-cyan-500/40",
                            i === 0 && "scale-150 ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950"
                        )}
                    />
                ))}
            </div>

            <div className="mt-4 p-3 bg-slate-900/50 rounded-2xl border border-white/5">
                <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
                        <Sparkles size={12} />
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 leading-relaxed uppercase">
                        Generates a dynamic .ics file with <span className="text-indigo-400 font-black">Strategic Notifications</span> for high-stress months and moratorium check-ins.
                    </p>
                </div>
            </div>

            {synced && (
                <div className="absolute inset-0 bg-emerald-500/5 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-500">
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/20">
                        <Check size={14} className="text-slate-950" />
                        <span className="text-[10px] font-black text-slate-950 uppercase tracking-widest">Calendar Ready</span>
                    </div>
                </div>
            )}
        </div>
    );
};
