import React from 'react';
import { cn } from '../utils/cn';

export const SkeletonBox: React.FC<{ className?: string }> = ({ className }) => (
    <div className={cn("animate-pulse bg-slate-800/50 rounded-xl", className)} />
);

export const DashboardSkeleton: React.FC = () => {
    return (
        <div className="space-y-8">
            {/* Top Metrics Skeleton */}
            <div className="grid md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="glass-card p-6 rounded-[2rem] border-t-4 border-t-slate-800 relative overflow-hidden">
                        <SkeletonBox className="h-3 w-20 mb-2" />
                        <SkeletonBox className="h-10 w-32" />
                        <div className="mt-4 flex gap-2">
                            <SkeletonBox className="h-3 w-3 rounded-full" />
                            <SkeletonBox className="h-3 w-24" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Area Skeleton */}
            <div className="grid md:grid-cols-2 gap-8">
                {/* Left Column: Intelligence & Chart */}
                <div className="space-y-8">
                    <div className="glass-card p-8 rounded-[2.5rem] bg-slate-900/40 border border-white/5">
                        <div className="flex gap-3 mb-6">
                            <SkeletonBox className="h-6 w-6 rounded-full" />
                            <SkeletonBox className="h-6 w-40" />
                        </div>
                        <div className="space-y-4">
                            {[1, 2, 3].map((j) => (
                                <div key={j} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <SkeletonBox className="h-8 w-8 rounded-lg shrink-0" />
                                    <SkeletonBox className="h-4 w-full" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chart Skeleton */}
                    <div className="glass-card p-6 rounded-[2rem] border border-white/5 bg-slate-950/20">
                        <div className="flex justify-between mb-6">
                            <div className="space-y-2">
                                <SkeletonBox className="h-4 w-32" />
                                <SkeletonBox className="h-3 w-48" />
                            </div>
                            <div className="flex gap-2">
                                <SkeletonBox className="h-3 w-12 rounded-full" />
                                <SkeletonBox className="h-3 w-12 rounded-full" />
                            </div>
                        </div>
                        {/* Mimic the chart SVG */}
                        <div className="relative h-48 w-full mb-6 bg-slate-900/30 rounded-xl overflow-hidden">
                            <div className="absolute inset-0 opacity-20">
                                <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10" />
                                <div className="absolute bottom-1/4 left-0 right-0 h-px bg-white/5" />
                                <div className="absolute bottom-1/2 left-0 right-0 h-px bg-white/5" />
                                <div className="absolute bottom-3/4 left-0 right-0 h-px bg-white/5" />
                            </div>
                            {/* Simulated paths */}
                            <svg className="w-full h-full" viewBox="0 0 400 150">
                                <path
                                    d="M 0 120 L 100 100 L 200 80 L 300 60 L 400 40"
                                    fill="none"
                                    stroke="rgba(255,255,255,0.05)"
                                    strokeWidth="2"
                                />
                                <path
                                    d="M 0 120 L 100 80 L 200 50 L 300 30 L 400 10"
                                    fill="none"
                                    stroke="rgba(34, 211, 238, 0.1)"
                                    strokeWidth="4"
                                />
                            </svg>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <SkeletonBox className="h-20 w-full" />
                            <SkeletonBox className="h-20 w-full" />
                        </div>
                    </div>
                </div>

                {/* Right Column: Doc Verifier & Sync */}
                <div className="space-y-8">
                    <SkeletonBox className="h-[300px] w-full rounded-[2.5rem]" />
                    <SkeletonBox className="h-[200px] w-full rounded-[2.5rem]" />
                </div>
            </div>
        </div>
    );
};
