import React, { useEffect, useRef } from 'react';
import { animate } from 'animejs';
import { TrendingDown, Info } from 'lucide-react';

import { SimulationResult } from '../types';

interface SavingsComparisonProps {
    simulation: SimulationResult | null;
}


const SavingsComparison: React.FC<SavingsComparisonProps> = ({ simulation }) => {
    const svgRef = useRef<SVGSVGElement>(null);

    const standardData = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0];
    const optimizedData = [100, 85, 70, 55, 40, 25, 10, 0];

    const generatePath = (data: number[], width: number, height: number) => {
        const step = width / (data.length - 1);
        return data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${height - (d / 100) * height}`).join(' ');
    };

    useEffect(() => {
        if (svgRef.current) {
            animate('.path-standard', {
                strokeDashoffset: [1000, 0],
                easing: 'easeInOutSine',
                duration: 2000,
                delay: 200
            });

            animate('.path-optimized', {
                strokeDashoffset: [1000, 0],
                easing: 'easeOutQuart',
                duration: 2500,
                delay: 500
            });
        }
    }, [simulation]);

    if (!simulation) return null;

    const interestSaved = simulation.sustainability_data?.interest_savings || 280000;
    const monthsSaved = simulation.months_saved || 22;

    return (
        <div className="glass-card p-6 rounded-[2rem] border border-white/5 bg-slate-950/20">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h4 className="text-sm font-black uppercase italic tracking-tighter">Savings Comparison</h4>
                    <p className="text-[9px] font-bold text-gray-500 uppercase">Standard vs AI-Optimized Path</p>
                </div>
                <div className="flex gap-2">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-gray-600" />
                        <span className="text-[8px] font-black text-gray-400 uppercase">Standard</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span className="text-[8px] font-black text-cyan-400 uppercase">AI-Optimized</span>
                    </div>
                </div>
            </div>

            <div className="relative h-48 w-full mb-6">
                <svg ref={svgRef} className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
                    {/* Standard Path */}
                    <path
                        className="path-standard"
                        d={generatePath(standardData, 400, 150)}
                        fill="none"
                        stroke="#4b5563"
                        strokeWidth="2"
                        strokeDasharray="1000"
                        opacity="0.5"
                    />
                    {/* Optimized Path */}
                    <path
                        className="path-optimized"
                        d={generatePath(optimizedData, 400, 150)}
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth="4"
                        strokeDasharray="1000"
                        strokeLinecap="round"
                    />

                    {/* Fill Gradients */}
                    <defs>
                        <linearGradient id="opt-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path
                        d={generatePath(optimizedData, 400, 150) + " L 400 150 L 0 150 Z"}
                        fill="url(#opt-grad)"
                    />
                </svg>

                {/* Savings Callout */}
                <div className="absolute top-4 right-4 animate-bounce">
                    <div className="bg-emerald-500/10 border border-emerald-400/30 backdrop-blur-md px-3 py-1.5 rounded-xl">
                        <p className="text-[10px] font-black text-emerald-400 uppercase">-{monthsSaved} Months</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 group hover:border-cyan-500/30 transition-all">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingDown size={14} className="text-cyan-400" />
                        <p className="text-[8px] font-black text-gray-500 uppercase">Total Saving</p>
                    </div>
                    <p className="text-lg font-black italic text-cyan-400">₹{(interestSaved / 1000).toFixed(1)}K</p>
                </div>
                <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingDown size={14} className="text-emerald-400" />
                        <p className="text-[8px] font-black text-gray-500 uppercase">Months Saved</p>
                    </div>
                    <p className="text-lg font-black italic text-emerald-400">{monthsSaved}</p>
                </div>
            </div>
        </div>
    );
};

export default SavingsComparison;
