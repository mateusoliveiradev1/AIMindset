import React from 'react';
import { cn } from '../../utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  variant?: 'primary' | 'secondary' | 'accent';
  className?: string;
  showText?: boolean;
}

/**
 * Componente de loading spinner com microinterações
 * Otimizado para diferentes contextos e acessibilidade
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  variant = 'primary',
  className,
  showText = true
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const variantClasses = {
    primary: 'border-t-lime-green',
    secondary: 'border-t-futuristic-gray',
    accent: 'border-t-blue-600'
  };

  return (
    <div className={cn(
      "flex items-center justify-center space-x-2",
      "animate-fade-in",
      className
    )}>
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-gray-600",
          sizeClasses[size],
          variantClasses[variant]
        )}
        role="status"
        aria-label="Carregando"
      />
      {text && showText && (
        <span className="text-sm text-futuristic-gray animate-pulse">
          {text}
        </span>
      )}
    </div>
  );
};

interface LoadingCardProps {
  title?: string;
  description?: string;
  items?: number;
  className?: string;
}

/**
 * Skeleton card para indicar carregamento de conteúdo
 */
export const LoadingCard: React.FC<LoadingCardProps> = ({
  title = 'Carregando...',
  description,
  items = 3,
  className
}) => {
  return (
    <div className={cn(
      "bg-dark-card rounded-lg border border-futuristic-gray/20 p-6",
      "animate-fade-in",
      className
    )}>
      <div className="mb-4">
        <div className="h-6 bg-gray-700 rounded animate-pulse w-1/3 mb-2" />
        {description && (
          <div className="h-4 bg-gray-700 rounded animate-pulse w-2/3" />
        )}
      </div>
      
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="mb-3 last:mb-0">
          <div className="h-4 bg-gray-700 rounded animate-pulse w-full mb-2" />
          <div className="h-4 bg-gray-700 rounded animate-pulse w-5/6" />
        </div>
      ))}
    </div>
  );
};

interface LoadingTableProps {
  columns?: number;
  rows?: number;
  className?: string;
}

/**
 * Skeleton table para indicar carregamento de dados tabulares
 */
export const LoadingTable: React.FC<LoadingTableProps> = ({
  columns = 5,
  rows = 5,
  className
}) => {
  return (
    <div className={cn(
      "bg-dark-card rounded-lg border border-futuristic-gray/20",
      "animate-fade-in",
      className
    )}>
      {/* Header */}
      <div className="border-b border-futuristic-gray/20 p-4">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, index) => (
            <div
              key={index}
              className="h-4 bg-gray-700 rounded animate-pulse flex-1"
            />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-futuristic-gray/20">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="flex space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div
                  key={colIndex}
                  className="h-3 bg-gray-700 rounded animate-pulse flex-1"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface LoadingButtonProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Loading state para botões com microinterações
 */
export const LoadingButton: React.FC<LoadingButtonProps> = ({
  text = 'Processando...',
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      disabled
      className={cn(
        "inline-flex items-center justify-center space-x-2",
        "bg-lime-green/20 text-lime-green border border-lime-green/30",
        "rounded-md font-medium cursor-not-allowed",
        "transition-all duration-200",
        sizeClasses[size],
        className
      )}
    >
      <LoadingSpinner size="sm" variant="accent" showText={false} />
      <span>{text}</span>
    </button>
  );
};

interface ProgressBarProps {
  progress?: number;
  text?: string;
  variant?: 'primary' | 'success' | 'warning';
  className?: string;
}

/**
 * Progress bar para operações longas com feedback visual
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress = 0,
  text,
  variant = 'primary',
  className
}) => {
  const variantColors = {
    primary: 'bg-lime-green',
    success: 'bg-green-500',
    warning: 'bg-yellow-500'
  };

  return (
    <div className={cn("w-full", className)}>
      {text && (
        <div className="flex justify-between text-sm text-futuristic-gray mb-2">
          <span>{text}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-out",
            variantColors[variant]
          )}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
};

interface LoadingOverlayProps {
  text?: string;
  subtext?: string;
  showSpinner?: boolean;
  className?: string;
}

/**
 * Overlay de loading para bloquear interface durante operações críticas
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  text = 'Processando...',
  subtext,
  showSpinner = true,
  className
}) => {
  return (
    <div className={cn(
      "fixed inset-0 bg-dark-surface/80 backdrop-blur-sm",
      "flex items-center justify-center z-50",
      "animate-fade-in",
      className
    )}>
      <div className="text-center">
        {showSpinner && (
          <LoadingSpinner size="xl" variant="primary" showText={false} />
        )}
        <h3 className="text-lg font-medium text-white mt-4 mb-2">
          {text}
        </h3>
        {subtext && (
          <p className="text-sm text-futuristic-gray">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Hook para gerenciar estados de loading com microinterações
 */
export const useLoadingState = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingText, setLoadingText] = React.useState('');
  const [loadingProgress, setLoadingProgress] = React.useState(0);

  const startLoading = (text?: string) => {
    setIsLoading(true);
    setLoadingText(text || 'Carregando...');
    setLoadingProgress(0);
  };

  const stopLoading = () => {
    setIsLoading(false);
    setLoadingText('');
    setLoadingProgress(0);
  };

  const updateProgress = (progress: number, text?: string) => {
    setLoadingProgress(progress);
    if (text) setLoadingText(text);
  };

  return {
    isLoading,
    loadingText,
    loadingProgress,
    startLoading,
    stopLoading,
    updateProgress
  };
};

/**
 * Animações CSS para loading states
 */
export const LoadingStyles = () => (
  <style>{`
    @keyframes fade-in {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-fade-in {
      animation: fade-in 0.3s ease-out;
    }

    @keyframes pulse-subtle {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.8;
      }
    }

    .animate-pulse-subtle {
      animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
  `}</style>
);