import React, { useState, useRef } from 'react';
import axios from 'axios';
import {
    Upload, CheckCircle2, XCircle, AlertCircle,
    Loader2, FileText, Shield, ClipboardList,
    ChevronRight, X, Sparkles, Lock, AlertTriangle,
    ArrowRight, ExternalLink, RotateCcw
} from 'lucide-react';
import { cn } from '../utils/cn';

const API = 'http://localhost:8000';

interface ActionStep {
    step: number | string;
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
    action: string;
    agency: string;
    reason: string;
}

interface VerificationResult {
    verified: boolean;
    confidence: number;
    status: 'VERIFIED' | 'PARTIAL' | 'REJECTED';
    found_signals: string[];
    missing_signals: string[];
    format_issues: string[];
    ai_verdict: string;
    policy_note: string;
    doc_label: string;
    rejection_action_plan: ActionStep[];
}

interface DocConfig {
    id: string;
    label: string;
    desc: string;
    icon: React.ReactNode;
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    accept: string;
}


interface DocState {
    status: 'idle' | 'uploading' | 'done';
    result?: VerificationResult;
    fileName?: string;
}

interface DocVerifierProps {
    isEligibleSubvention: boolean;
    universityTier?: string;
}

export const DocVerifier: React.FC<DocVerifierProps> = ({ isEligibleSubvention, universityTier }) => {
    // Dynamic Config Logic
    const dynamicConfigs: DocConfig[] = [
        {
            id: 'income_certificate',
            label: 'Income Certificate',
            desc: isEligibleSubvention ? 'Critical for 3% Subsidy' : 'Optional for self-funding',
            icon: <Shield size={14} />,
            priority: isEligibleSubvention ? 'CRITICAL' : 'MEDIUM',
            accept: '.pdf,.jpg,.jpeg,.png',
        },
        {
            id: 'nirf_admission',
            label: 'NIRF Uni Admission',
            desc: universityTier === 'AAA' ? 'Uncollateralized Eligibility' : 'Verified Institution',
            icon: <FileText size={14} />,
            priority: universityTier === 'AAA' ? 'CRITICAL' : 'HIGH',
            accept: '.pdf,.jpg,.jpeg,.png',
        },
        {
            id: 'co_applicant_kyc',
            label: 'Co-Applicant KYC',
            desc: 'Aadhar + PAN Linked',
            icon: <Lock size={14} />,
            priority: 'CRITICAL',
            accept: '.pdf,.jpg,.jpeg,.png',
        },
        {
            id: 'entrance_scorecard',
            label: 'Entrance Scorecard',
            desc: universityTier === 'AAA' ? 'Priority Processing' : 'JEE/CAT/GATE Validated',
            icon: <ClipboardList size={14} />,
            priority: universityTier === 'AAA' ? 'HIGH' : 'MEDIUM',
            accept: '.pdf,.jpg,.jpeg,.png',
        },
    ];

    const [docStates, setDocStates] = useState<Record<string, DocState>>(
        Object.fromEntries(dynamicConfigs.map(d => [d.id, { status: 'idle' }]))
    );
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const handleUpload = async (docId: string, file: File) => {
        setDocStates(prev => ({ ...prev, [docId]: { status: 'uploading', fileName: file.name } }));

        try {
            const form = new FormData();
            form.append('doc_type', docId);
            form.append('file', file);

            const res = await axios.post<VerificationResult>(
                `${API}/api/v1/verify-document`,
                form,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            setDocStates(prev => ({
                ...prev,
                [docId]: { status: 'done', result: res.data, fileName: file.name }
            }));
            setActiveModal(docId);
        } catch {


            setDocStates(prev => ({
                ...prev,
                [docId]: {
                    status: 'done',
                    fileName: file.name,
                    result: {
                        verified: false,
                        confidence: 0,
                        status: 'REJECTED',
                        found_signals: [],
                        missing_signals: [],
                        format_issues: [],
                        ai_verdict: '❌ Upload failed. Please try again.',
                        policy_note: '',
                        doc_label: '',
                        rejection_action_plan: [
                            {
                                step: 1, priority: 'CRITICAL',
                                action: 'Check your internet connection and try uploading again.',
                                agency: '—', reason: 'Network error'
                            },
                            {
                                step: 2, priority: 'HIGH',
                                action: 'Ensure file is PDF, JPG, or PNG and under 10MB.',
                                agency: '—', reason: 'File format'
                            }
                        ]
                    }
                }
            }));
        }
    };

    const getStatusIcon = (state: DocState) => {
        if (state.status === 'uploading') return <Loader2 size={12} className="animate-spin text-cyan-400" />;
        if (state.status === 'done') {
            if (state.result?.status === 'VERIFIED') return <CheckCircle2 size={12} className="text-emerald-400" />;
            if (state.result?.status === 'PARTIAL') return <AlertCircle size={12} className="text-amber-400" />;
            return <XCircle size={12} className="text-rose-400" />;
        }
        return <CheckCircle2 size={12} className="text-gray-600" />;
    };

    const getStatusBadge = (state: DocState) => {
        if (state.status === 'uploading') return { label: 'SCANNING', cls: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 animate-pulse' };
        if (state.status === 'done') {
            const s = state.result?.status;
            if (s === 'VERIFIED') return { label: 'AI VERIFIED ✅', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
            if (s === 'PARTIAL') return { label: 'PARTIAL ⚠️', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
            return { label: 'FAILED ❌', cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
        }
        return { label: 'CRITICAL', cls: 'bg-pink-500/10 text-pink-500 border-pink-500/20' };
    };

    const activeResult = activeModal ? docStates[activeModal]?.result : null;
    const activeConfig = activeModal ? dynamicConfigs.find(d => d.id === activeModal) : null;

    return (
        <>
            <div className="glass-card p-8 rounded-[2.5rem] border border-white/5">
                {/* Security & Compliance Alert */}
                <div className="mb-6 p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-[50px] -mr-16 -mt-16 group-hover:bg-rose-500/20 transition-all" />
                    <div className="flex gap-3 relative z-10">
                        <div className="p-2 h-fit bg-rose-500/10 rounded-xl text-rose-500">
                            <Shield size={16} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-rose-400 uppercase tracking-wider mb-1">Pre-Submission Precautions</p>
                            <ul className="space-y-1.5">
                                {[
                                    { text: "Digital Forgery Detection active: Avoid AI-edited or poorly scanned PDFs.", icon: <Sparkles size={10} /> },
                                    { text: "Income Certificate must be issued AFTER April 1st, 2025 (FY 2025-26).", icon: <Lock size={10} /> },
                                    { text: "Banks will cross-check with DigiLocker. Ensure manual uploads match.", icon: <CheckCircle2 size={10} /> }
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-[8px] font-bold text-gray-400">
                                        <span className="mt-0.5 text-rose-500">{item.icon}</span>
                                        {item.text}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Document Readiness Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-amber-500/10 rounded-xl">
                        <ClipboardList className="text-amber-500" size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-tighter italic">Document Readiness</h4>
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">AI-Powered Verification Engine</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1 text-[8px] font-black text-cyan-400 uppercase">
                        <Sparkles size={10} /> AI Active
                    </div>
                </div>

                {/* Document Rows */}
                <div className="grid grid-cols-1 gap-3">
                    {dynamicConfigs.map((doc) => {
                        const state = docStates[doc.id];
                        const badge = getStatusBadge(state);

                        return (
                            <div
                                key={doc.id}
                                className={cn(
                                    "flex items-center justify-between p-3.5 rounded-2xl border transition-all group",
                                    state.status === 'done' && state.result?.status === 'VERIFIED'
                                        ? "bg-emerald-500/5 border-emerald-500/20"
                                        : state.status === 'done' && state.result?.status === 'PARTIAL'
                                            ? "bg-amber-500/5 border-amber-500/20"
                                            : state.status === 'done'
                                                ? "bg-rose-500/5 border-rose-500/20"
                                                : "bg-slate-900/50 border-white/5 hover:border-white/10"
                                )}
                            >
                                {/* Left: icon + label */}
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "p-1.5 rounded-lg",
                                        state.status === 'done' && state.result?.status === 'VERIFIED' ? "bg-emerald-500/10 text-emerald-400" :
                                            state.status === 'done' && state.result?.status === 'PARTIAL' ? "bg-amber-500/10 text-amber-400" :
                                                state.status === 'done' ? "bg-rose-500/10 text-rose-400" :
                                                    "bg-slate-800 text-gray-400"
                                    )}>
                                        {getStatusIcon(state)}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-white uppercase">{doc.label}</p>
                                        <p className="text-[8px] font-bold text-gray-500 uppercase">
                                            {state.status === 'done' && state.result
                                                ? `Confidence: ${state.result.confidence}%`
                                                : doc.desc}
                                        </p>
                                    </div>
                                </div>

                                {/* Right: badge + upload button */}
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "text-[7px] font-black px-1.5 py-0.5 rounded border uppercase",
                                        badge.cls
                                    )}>
                                        {badge.label}
                                    </span>

                                    {/* Upload trigger */}
                                    <input
                                        type="file"
                                        accept={doc.accept}
                                        className="hidden"
                                        ref={el => { fileRefs.current[doc.id] = el; }}
                                        onChange={e => {
                                            if (e.target.files?.[0]) {
                                                handleUpload(doc.id, e.target.files[0]);
                                                e.target.value = '';
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            if (state.status === 'done') {
                                                setActiveModal(doc.id);
                                            } else {
                                                fileRefs.current[doc.id]?.click();
                                            }
                                        }}
                                        disabled={state.status === 'uploading'}
                                        className={cn(
                                            "flex items-center gap-1 px-2 py-1 rounded-lg text-[8px] font-black uppercase transition-all",
                                            state.status === 'done'
                                                ? "bg-white/5 text-gray-300 hover:bg-white/10"
                                                : "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950",
                                            state.status === 'uploading' && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        {state.status === 'done' ? (
                                            <><ChevronRight size={8} /> View</>
                                        ) : (
                                            <><Upload size={8} /> Verify</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Overall status */}
                {(() => {
                    const done = Object.values(docStates).filter(s => s.status === 'done').length;
                    const verified = Object.values(docStates).filter(s => s.result?.status === 'VERIFIED').length;
                    if (done === 0) return null;
                    return (
                        <div className="mt-4 p-3 bg-slate-900/50 rounded-2xl border border-white/5 flex items-center justify-between">
                            <p className="text-[9px] font-black text-gray-400 uppercase">AI Verification Progress</p>
                            <div className="flex items-center gap-2">
                                <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-400 transition-all duration-700"
                                        style={{ width: `${(verified / 4) * 100}%` }}
                                    />
                                </div>
                                <p className="text-[9px] font-black text-emerald-400">{verified}/4 Verified</p>
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* AI Result Modal */}
            {activeModal && activeResult && activeConfig && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-md"
                        onClick={() => setActiveModal(null)}
                    />
                    {/* Modal — scrollable */}
                    <div className="relative w-full max-w-lg bg-slate-950 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_80px_rgba(34,211,238,0.15)] flex flex-col max-h-[90vh]">
                        {/* Top accent bar */}
                        <div className={cn(
                            "h-1 w-full flex-shrink-0",
                            activeResult.status === 'VERIFIED' ? "bg-emerald-400" :
                                activeResult.status === 'PARTIAL' ? "bg-amber-400" : "bg-rose-400"
                        )} />

                        {/* Scrollable content */}
                        <div className="overflow-y-auto flex-1 p-8">
                            {/* Close */}
                            <button
                                onClick={() => setActiveModal(null)}
                                className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-xl transition-colors z-10"
                            >
                                <X size={16} className="text-gray-500" />
                            </button>

                            {/* Header */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className={cn(
                                    "p-3 rounded-2xl",
                                    activeResult.status === 'VERIFIED' ? "bg-emerald-500/10" :
                                        activeResult.status === 'PARTIAL' ? "bg-amber-500/10" : "bg-rose-500/10"
                                )}>
                                    {activeResult.status === 'VERIFIED'
                                        ? <CheckCircle2 className="text-emerald-400" size={24} />
                                        : activeResult.status === 'PARTIAL'
                                            ? <AlertCircle className="text-amber-400" size={24} />
                                            : <XCircle className="text-rose-400" size={24} />
                                    }
                                </div>
                                <div>
                                    <h3 className="font-black uppercase italic text-lg tracking-tighter">{activeConfig.label}</h3>
                                    <p className="text-[9px] font-bold text-gray-500 uppercase">AI Verification Report</p>
                                </div>
                            </div>

                            {/* Confidence Ring */}
                            <div className="flex items-center gap-4 p-4 bg-slate-900 rounded-2xl mb-5">
                                <div className="relative w-16 h-16">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                                        <circle cx="32" cy="32" r="28" fill="none" stroke="#1e293b" strokeWidth="6" />
                                        <circle
                                            cx="32" cy="32" r="28" fill="none"
                                            stroke={activeResult.confidence >= 70 ? '#34d399' : activeResult.confidence >= 40 ? '#fbbf24' : '#f87171'}
                                            strokeWidth="6"
                                            strokeDasharray={`${(activeResult.confidence / 100) * 175.9} 175.9`}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-sm font-black">{activeResult.confidence}%</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">AI Confidence Score</p>
                                    <span className={cn(
                                        "text-xs font-black px-2 py-0.5 rounded uppercase",
                                        activeResult.status === 'VERIFIED' ? "bg-emerald-500/10 text-emerald-400" :
                                            activeResult.status === 'PARTIAL' ? "bg-amber-500/10 text-amber-400" :
                                                "bg-rose-500/10 text-rose-400"
                                    )}>{activeResult.status}</span>
                                </div>
                            </div>

                            {/* AI Verdict */}
                            <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 mb-4">
                                <p className="text-[9px] font-black text-gray-500 uppercase mb-2 flex items-center gap-1">
                                    <Sparkles size={8} /> AI Verdict
                                </p>
                                <p className="text-xs font-bold text-gray-300 leading-relaxed">{activeResult.ai_verdict}</p>
                            </div>

                            {/* Signals */}
                            {activeResult.found_signals.length > 0 && (
                                <div className="mb-3">
                                    <p className="text-[9px] font-black text-emerald-400 uppercase mb-2">✅ Signals Detected</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {activeResult.found_signals.map((sig, i) => (
                                            <span key={i} className="text-[8px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase">
                                                {sig}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeResult.missing_signals.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-[9px] font-black text-rose-400 uppercase mb-2">❌ Missing Signals</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {activeResult.missing_signals.map((sig, i) => (
                                            <span key={i} className="text-[8px] font-black bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded uppercase">
                                                {sig}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── REJECTION ACTION PLAN ───────────────────── */}
                            {(activeResult.status === 'REJECTED' || activeResult.status === 'PARTIAL') &&
                                activeResult.rejection_action_plan?.length > 0 && (
                                    <div className="mb-4">
                                        {/* Section header */}
                                        <div className={cn(
                                            "flex items-center gap-2 p-3 rounded-2xl mb-3",
                                            activeResult.status === 'REJECTED'
                                                ? "bg-rose-500/10 border border-rose-500/20"
                                                : "bg-amber-500/10 border border-amber-500/20"
                                        )}>
                                            <AlertTriangle size={14} className={activeResult.status === 'REJECTED' ? 'text-rose-400' : 'text-amber-400'} />
                                            <div>
                                                <p className={cn(
                                                    "text-[10px] font-black uppercase",
                                                    activeResult.status === 'REJECTED' ? 'text-rose-400' : 'text-amber-400'
                                                )}>AI Rejection Action Plan</p>
                                                <p className="text-[8px] font-bold text-gray-500">Follow these steps to fix and re-submit your document</p>
                                            </div>
                                        </div>

                                        {/* Steps */}
                                        <div className="space-y-2.5">
                                            {activeResult.rejection_action_plan.map((item, i) => {
                                                const priorityConfig = {
                                                    CRITICAL: { cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20', dot: 'bg-rose-400' },
                                                    HIGH: { cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20', dot: 'bg-orange-400' },
                                                    MEDIUM: { cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-400' },
                                                    INFO: { cls: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', dot: 'bg-cyan-400' },
                                                }[item.priority] ?? { cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20', dot: 'bg-gray-400' };

                                                return (
                                                    <div
                                                        key={i}
                                                        className="flex gap-3 p-3 bg-slate-900 rounded-2xl border border-white/5 hover:border-white/10 transition-all group"
                                                    >
                                                        {/* Step number bubble */}
                                                        <div className="flex-shrink-0 w-7 h-7 rounded-xl bg-slate-800 flex items-center justify-center text-[9px] font-black text-gray-400 mt-0.5">
                                                            {item.step}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            {/* Priority + reason */}
                                                            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                                                <span className={cn(
                                                                    "text-[7px] font-black px-1.5 py-0.5 rounded border uppercase",
                                                                    priorityConfig.cls
                                                                )}>
                                                                    <span className={cn("inline-block w-1 h-1 rounded-full mr-1", priorityConfig.dot)} />
                                                                    {item.priority}
                                                                </span>
                                                                <span className="text-[7px] font-bold text-gray-600 uppercase">{item.reason}</span>
                                                            </div>

                                                            {/* Action text */}
                                                            <p className="text-[10px] font-bold text-gray-200 leading-relaxed">{item.action}</p>

                                                            {/* Agency */}
                                                            {item.agency && item.agency !== '—' && (
                                                                <div className="flex items-center gap-1 mt-1.5">
                                                                    <ExternalLink size={8} className="text-gray-600" />
                                                                    <span className="text-[8px] font-bold text-gray-500 uppercase">{item.agency}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <ArrowRight size={12} className="text-gray-700 group-hover:text-gray-500 transition-colors flex-shrink-0 mt-1" />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                            {/* Policy Note */}
                            {activeResult.policy_note && (
                                <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl mb-4">
                                    <p className="text-[9px] font-bold text-cyan-400 leading-relaxed">
                                        📋 {activeResult.policy_note}
                                    </p>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-3">
                                <button
                                    className="flex-1 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-gray-300 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-white/5"
                                    onClick={() => {
                                        setActiveModal(null);
                                        setTimeout(() => fileRefs.current[activeModal]?.click(), 100);
                                    }}
                                >
                                    <RotateCcw size={12} /> Re-Upload
                                </button>
                                {activeResult.status === 'VERIFIED' && (
                                    <button
                                        className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                                        onClick={() => setActiveModal(null)}
                                    >
                                        <CheckCircle2 size={12} /> Done
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
