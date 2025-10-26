import React from 'react';
import { Loader2 } from 'lucide-react';

interface InfiniteScrollLoaderProps {
  isLoading: boolean;
  hasMore: boolean;
  error?: string | null;
  onRetry?: () => void;
  loadingRef?: React.RefObject<HTMLDivElement>;
}

export const InfiniteScrollLoader: React.FC<InfiniteScrollLoaderProps> = ({
  isLoading,
  hasMore,
  error,
  onRetry,
  loadingRef
}) => {
  if (error) {
    return (
      <div 
        ref={loadingRef}
        className="flex flex-col items-center justify-center py-8 text-center"
      >
        <div className="text-red-400 mb-4">
          <span className="text-sm">Erro ao carregar mais conteúdo</span>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-neon-purple/20 text-neon-purple rounded-lg hover:bg-neon-purple/30 transition-colors duration-200 text-sm font-medium"
          >
            Tentar novamente
          </button>
        )}
      </div>
    );
  }

  if (!hasMore) {
    return (
      <div 
        ref={loadingRef}
        className="flex items-center justify-center py-8 text-futuristic-gray"
      >
        <span className="text-sm">Você chegou ao fim! 🎉</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div 
        ref={loadingRef}
        className="flex items-center justify-center py-8"
      >
        <div className="flex items-center space-x-3 text-neon-purple">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Carregando mais conteúdo...</span>
        </div>
      </div>
    );
  }

  // Elemento invisível para trigger do Intersection Observer
  return (
    <div 
      ref={loadingRef}
      className="h-4 w-full"
      aria-hidden="true"
    />
  );
};