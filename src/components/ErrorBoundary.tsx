
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-red-100 space-y-6">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto">
              <span className="text-3xl">⚠️</span>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Ops! Algo deu errado.</h2>
              <p className="text-sm text-zinc-500 font-medium">
                O Oráculo encontrou um erro inesperado ao processar os dados.
              </p>
            </div>
            
            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 overflow-auto max-h-48">
              <p className="text-[10px] font-mono text-red-600 break-all">
                {this.state.error?.toString()}
              </p>
              {this.state.errorInfo && (
                <p className="text-[8px] font-mono text-zinc-400 mt-2 whitespace-pre">
                  {this.state.errorInfo.componentStack}
                </p>
              )}
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-primary text-white rounded-xl font-bold uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Recarregar Aplicação
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
