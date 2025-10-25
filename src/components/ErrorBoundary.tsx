import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Button from './UI/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Atualiza o state para mostrar a UI de fallback
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Silenciar logs de erro para dynamic imports
    if (error.message?.includes('Failed to fetch dynamically imported module')) {
      console.warn('⚠️ Dynamic import error (handled):', error.message);
    } else {
      console.error('🚨 ErrorBoundary capturou um erro:', error, errorInfo);
    }
    
    this.setState({
      error,
      errorInfo
    });

    // Chamar callback personalizado se fornecido
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      // Usar fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI de erro padrão
      return (
        <div className="min-h-screen bg-dark-surface flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-darker-surface/50 backdrop-blur-md rounded-2xl border border-red-500/30 p-8 text-center">
            <div className="mb-6">
              <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h1 className="text-2xl font-orbitron font-bold text-white mb-2">
                Ops! Algo deu errado
              </h1>
              <p className="text-futuristic-gray">
                Ocorreu um erro inesperado. Tente recarregar a página ou voltar ao início.
              </p>
            </div>

            {/* Mostrar detalhes do erro apenas em desenvolvimento */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-left">
                <h3 className="text-red-400 font-semibold mb-2">Detalhes do erro:</h3>
                <pre className="text-xs text-red-300 overflow-auto max-h-32">
                  {this.state.error.toString()}
                </pre>
                {this.state.errorInfo && (
                  <pre className="text-xs text-red-300 overflow-auto max-h-32 mt-2">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={this.handleRetry}
                className="flex-1 bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/30 border border-neon-purple/30"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
              <Button
                onClick={this.handleGoHome}
                className="flex-1 bg-lime-green/20 text-lime-green hover:bg-lime-green/30 border border-lime-green/30"
              >
                <Home className="w-4 h-4 mr-2" />
                Voltar ao Início
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;