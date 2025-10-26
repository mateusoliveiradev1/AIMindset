import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
  isolate?: boolean;
  enableLogging?: boolean;
  monitoringService?: 'sentry' | 'logrocket' | 'custom';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log do erro
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Gerar ID único para o erro
    const eventId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.setState({
      errorInfo,
      eventId
    });

    // Callback personalizado
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Reportar erro para serviço de monitoramento (se configurado)
    this.reportError(error, errorInfo, eventId);
  }

  componentDidUpdate(prevProps: Props) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset automático quando props mudam
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
    }

    // Reset baseado em chaves específicas
    if (hasError && resetKeys && resetKeys.length > 0) {
      const prevResetKeys = prevProps.resetKeys || [];
      const hasResetKeyChanged = resetKeys.some((key, index) => key !== prevResetKeys[index]);
      
      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null
    });
  };

  // Reset automático após um tempo
  scheduleReset = (delay: number = 5000) => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.resetTimeoutId = window.setTimeout(() => {
      this.resetErrorBoundary();
    }, delay);
  };

  // Reportar erro para serviços externos
  private reportError = (error: Error, errorInfo: ErrorInfo, eventId: string) => {
    try {
      // Aqui você pode integrar com serviços como Sentry, LogRocket, etc.
      const errorReport = {
        eventId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.getUserId(), // Implementar conforme necessário
      };

      // Salvar no localStorage para debug
      const savedErrors = JSON.parse(localStorage.getItem('errorBoundaryLogs') || '[]');
      savedErrors.push(errorReport);
      localStorage.setItem('errorBoundaryLogs', JSON.stringify(savedErrors.slice(-10))); // Manter apenas os 10 mais recentes

      // Enviar para API de monitoramento (se disponível)
      if (process.env.NODE_ENV === 'production') {
        this.sendToMonitoringService(errorReport);
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private getUserId = (): string | null => {
    // Implementar lógica para obter ID do usuário
    return localStorage.getItem('userId') || null;
  };

  private sendToMonitoringService = async (errorReport: any) => {
    try {
      // Implementar envio para serviço de monitoramento
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      });
    } catch (error) {
      console.error('Failed to send error to monitoring service:', error);
    }
  };

  render() {
    if (this.state.hasError) {
      // Fallback customizado
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI de erro padrão
      return (
        <div className="min-h-screen bg-dark-surface flex items-center justify-center p-6">
          <Card className="max-w-2xl w-full">
            <div className="text-center">
              <div className="text-6xl mb-4">🚨</div>
              <h1 className="text-2xl font-bold text-white mb-4">
                Oops! Algo deu errado
              </h1>
              <p className="text-futuristic-gray mb-6">
                Encontramos um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver o problema.
              </p>

              {/* Detalhes do erro (apenas em desenvolvimento) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded text-left">
                  <h3 className="text-lg font-semibold text-red-400 mb-2">Detalhes do Erro (Dev Mode)</h3>
                  <div className="text-sm text-red-300 mb-2">
                    <strong>Mensagem:</strong> {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <details className="text-xs text-red-200">
                      <summary className="cursor-pointer hover:text-red-100">Stack Trace</summary>
                      <pre className="mt-2 whitespace-pre-wrap overflow-auto max-h-40">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <details className="text-xs text-red-200 mt-2">
                      <summary className="cursor-pointer hover:text-red-100">Component Stack</summary>
                      <pre className="mt-2 whitespace-pre-wrap overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                  {this.state.eventId && (
                    <div className="text-xs text-red-300 mt-2">
                      <strong>Event ID:</strong> {this.state.eventId}
                    </div>
                  )}
                </div>
              )}

              {/* Ações */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={this.resetErrorBoundary}
                  className="bg-gradient-to-r from-lime-green to-neon-purple"
                >
                  🔄 Tentar Novamente
                </Button>
                
                <Button
                  onClick={() => window.location.reload()}
                  variant="secondary"
                >
                  🔃 Recarregar Página
                </Button>
                
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                >
                  🏠 Ir para Home
                </Button>
              </div>

              {/* Auto-reset */}
              <div className="mt-6 text-sm text-futuristic-gray">
                <p>A página será recarregada automaticamente em alguns segundos...</p>
                <Button
                  onClick={() => this.scheduleReset(1000)}
                  variant="ghost"
                  className="text-xs mt-2"
                >
                  ⏱️ Reset Automático (5s)
                </Button>
              </div>

              {/* Informações de suporte */}
              <div className="mt-8 p-4 bg-dark-surface/50 rounded border border-futuristic-gray/30">
                <h3 className="text-sm font-semibold text-white mb-2">Precisa de ajuda?</h3>
                <p className="text-xs text-futuristic-gray mb-2">
                  Se o problema persistir, entre em contato conosco:
                </p>
                <div className="text-xs text-futuristic-gray space-y-1">
                  <div>📧 Email: suporte@aimindset.com</div>
                  <div>💬 Chat: Disponível 24/7</div>
                  {this.state.eventId && (
                    <div>🆔 Código do Erro: {this.state.eventId}</div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook para usar Error Boundary programaticamente
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  // Throw error para ser capturado pelo Error Boundary
  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
};

// HOC para envolver componentes com Error Boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Error Boundary específico para rotas
export const RouteErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    resetOnPropsChange={true}
    onError={(error, errorInfo) => {
      console.error('Route Error:', error, errorInfo);
      // Aqui você pode adicionar lógica específica para erros de rota
    }}
    fallback={
      <div className="min-h-screen bg-dark-surface flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center">
          <div className="text-4xl mb-4">🛣️</div>
          <h2 className="text-xl font-bold text-white mb-4">Erro na Rota</h2>
          <p className="text-futuristic-gray mb-6">
            Não foi possível carregar esta página. Tente navegar para outra seção.
          </p>
          <Button
            onClick={() => window.location.href = '/'}
            className="bg-gradient-to-r from-lime-green to-neon-purple"
          >
            🏠 Voltar ao Início
          </Button>
        </Card>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

// Error Boundary para componentes assíncronos
export const AsyncErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    onError={(error, errorInfo) => {
      console.error('Async Component Error:', error, errorInfo);
    }}
    fallback={
      <div className="p-6 text-center">
        <div className="text-2xl mb-2">⚠️</div>
        <p className="text-futuristic-gray">
          Erro ao carregar componente. Recarregando...
        </p>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

export default ErrorBoundary;