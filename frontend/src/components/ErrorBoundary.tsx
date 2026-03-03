import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    errorType: 'backend' | 'runtime' | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        errorType: null
    };

    public static getDerivedStateFromError(error: unknown): State {
        // Check if it's a network error (FastAPI down)
        const err = error as { message?: string; code?: string };
        const isNetworkError = err?.message?.includes('Network Error') || err?.code === 'ERR_NETWORK';
        return {
            hasError: true,
            errorType: isNetworkError ? 'backend' : 'runtime'
        };
    }


    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[400px] flex flex-col items-center justify-center p-12 bg-slate-900/50 rounded-[3rem] border border-white/5 backdrop-blur-3xl text-center">
                    <div className="p-6 bg-red-500/10 rounded-full mb-6">
                        <AlertCircle className="text-red-400 w-12 h-12" />
                    </div>

                    <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">
                        {this.state.errorType === 'backend' ? 'FastAPI Connection Lost' : 'Operational Anomaly Detected'}
                    </h2>

                    <p className="text-gray-400 max-w-md mb-8 text-sm font-medium leading-relaxed">
                        {this.state.errorType === 'backend'
                            ? 'The core FinTech engine on localhost:8000 is unresponsive. We are attempting to reconnect to the sync service.'
                            : 'A runtime error occurred in the execution deck. Our AI agents are logging the telemetry.'}
                    </p>

                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 px-8 py-4 bg-white text-slate-950 font-black rounded-2xl hover:scale-105 transition-transform"
                    >
                        <RefreshCcw size={18} />
                        <span>Re-Initialize System</span>
                    </button>

                    {this.state.errorType === 'backend' && (
                        <div className="absolute bottom-8 flex items-center gap-2 px-4 py-2 bg-slate-950 border border-white/10 rounded-full">
                            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Auto-Reconnecting to v0.1.2...</span>
                        </div>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
