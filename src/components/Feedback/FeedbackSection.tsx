import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { ThumbsUp, ThumbsDown, Users, TrendingUp, Zap } from 'lucide-react';
import { FeedbackButtons } from './FeedbackButtons';
import { useFeedback } from '../../hooks/useFeedback';
import { useArticleFeedbackStats } from '../../hooks/useArticleFeedbackStats';
import { useRealTimeInteractions } from '../../hooks/useRealTimeInteractions';
import { toast } from 'sonner';

interface FeedbackSectionProps {
  articleId: string | number;
}

export const FeedbackSection: React.FC<FeedbackSectionProps> = ({ articleId }) => {
  const articleIdString = String(articleId);
  const { submitting, hasSubmitted, submitFeedback } = useFeedback(articleIdString);
  const { stats, loading: statsLoading, refreshStats } = useArticleFeedbackStats(articleIdString);
  const [lastUseful, setLastUseful] = useState<boolean | null>(null);
  
  // 🚀 Hook para tempo real sem notificações (para não incomodar o usuário)
  const { 
    stats: realTimeStats, 
    isConnected,
    forceStatsUpdate 
  } = useRealTimeInteractions({
    articleIds: [articleIdString],
    enableNotifications: false, // Sem notificações para usuários finais
    debounceMs: 1000 // Debounce maior para economizar recursos
  });

  // Memoizar o callback de feedback para evitar re-renderizações
  const handleFeedback = useCallback(async (useful: boolean) => {
    setLastUseful(useful);
    const success = await submitFeedback(useful);
    if (success) {
      // Forçar atualização imediata das stats em tempo real
      forceStatsUpdate(articleIdString);
    }
  }, [submitFeedback, forceStatsUpdate, articleIdString]);

  // Memoizar as stats para evitar recálculos desnecessários
  const displayStats = useMemo(() => {
    const currentStats = realTimeStats[articleIdString] || stats;
    const totalFeedbacks = currentStats.totalFeedbacks || stats.totalFeedbacks || 0;
    const positiveFeedbacks = currentStats.positiveFeedbacks || stats.positiveFeedbacks || 0;
    const negativeFeedbacks = currentStats.negativeFeedbacks || stats.negativeFeedbacks || 0;
    
    return {
      totalFeedbacks,
      positiveFeedbacks,
      negativeFeedbacks,
      approvalRate: totalFeedbacks > 0 
        ? (positiveFeedbacks / totalFeedbacks) * 100 
        : (stats.approvalRate || 0)
    };
  }, [realTimeStats, articleIdString, stats]);

  // Atualizar stats apenas quando necessário (evitar loops)
  useEffect(() => {
    if (realTimeStats[articleIdString] && !statsLoading) {
      refreshStats();
    }
  }, [realTimeStats, articleIdString, refreshStats, statsLoading]);

  // Memoizar a seção de estatísticas para evitar re-renderizações
  const statsSection = useMemo(() => {
    if (statsLoading) {
      return (
        <div className="mb-6 p-4 bg-darker-surface/20 rounded-lg border border-neon-purple/10">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-darker-surface/30 rounded w-3/4"></div>
            <div className="h-4 bg-darker-surface/30 rounded w-1/2"></div>
            <div className="h-2 bg-darker-surface/30 rounded w-full"></div>
          </div>
        </div>
      );
    }

    if (displayStats.totalFeedbacks === 0) {
      return null;
    }

    const approvalWidth = Math.max(0, Math.min(100, Number(displayStats.approvalRate.toFixed(1))));

    return (
      <div className="mb-6 p-4 bg-darker-surface/20 rounded-lg border border-neon-purple/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center justify-center gap-6 text-sm flex-1">
            <div className="flex items-center gap-2 text-futuristic-gray">
              <Users className="h-4 w-4 text-neon-purple" />
              <span>
                <span className="text-white font-semibold">{displayStats.totalFeedbacks}</span> 
                {displayStats.totalFeedbacks === 1 ? ' pessoa avaliou' : ' pessoas avaliaram'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-lime-green">
              <ThumbsUp className="h-4 w-4" />
              <span className="font-semibold">{displayStats.positiveFeedbacks}</span>
            </div>
            <div className="flex items-center gap-2 text-red-400">
              <ThumbsDown className="h-4 w-4" />
              <span className="font-semibold">{displayStats.negativeFeedbacks}</span>
            </div>
            <div className="flex items-center gap-2 text-neon-purple">
              <TrendingUp className="h-4 w-4" />
              <span className="font-semibold">{displayStats.approvalRate.toFixed(1)}%</span>
              <span className="text-futuristic-gray">aprovação</span>
            </div>
          </div>
          {isConnected && (
            <div className="flex items-center gap-1 text-xs text-lime-green animate-pulse">
              <Zap className="h-3 w-3" />
              <span>Tempo Real</span>
            </div>
          )}
        </div>
        <div className="h-2 bg-darker-surface/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-lime-green to-neon-purple"
            style={{ width: `${approvalWidth}%` }}
          ></div>
        </div>
      </div>
    );
  }, [displayStats, isConnected, statsLoading]);

  return (
    <div className="bg-darker-surface/30 backdrop-blur-sm rounded-lg p-6 my-8 border border-neon-purple/20 hover:border-neon-purple/40 transition-colors duration-300 hover:shadow-lg hover:shadow-neon-purple/20" style={{ willChange: 'opacity, box-shadow' }}>
      {/* Estatísticas de Feedback */}
      {statsSection}

      {/* Título e Descrição */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
          Este artigo foi útil para você?
        </h3>
        <p className="text-futuristic-gray text-sm">
          Sua avaliação nos ajuda a melhorar o conteúdo
        </p>
      </div>

      <FeedbackButtons
        onFeedback={handleFeedback}
        hasSubmitted={hasSubmitted}
        submitting={submitting}
      />

      <div className="mt-4 min-h-[44px]" aria-live="polite">
        {hasSubmitted && (
          <div className="p-3 bg-lime-green/10 border border-lime-green/20 rounded-lg text-center">
            <p className="text-lime-green text-sm font-medium">
              ✨ Obrigado pelo seu feedback! Sua opinião é muito importante para nós.
            </p>
          </div>
        )}
      </div>

      {hasSubmitted && lastUseful === false && (
        <div className="mt-3 flex flex-col items-center gap-2">
          <div className="flex gap-2">
            <button
              className="text-xs px-2 py-1 rounded bg-darker-surface/20 text-futuristic-gray hover:bg-darker-surface/30 border border-neon-purple/10"
              onClick={() => toast.success('Obrigado! Vamos considerar a atualização.')}
            >
              Desatualizado
            </button>
            <button
              className="text-xs px-2 py-1 rounded bg-darker-surface/20 text-futuristic-gray hover:bg-darker-surface/30 border border-neon-purple/10"
              onClick={() => toast.success('Obrigado! Vamos incluir mais exemplos.')}
            >
              Faltou exemplo
            </button>
            <button
              className="text-xs px-2 py-1 rounded bg-darker-surface/20 text-futuristic-gray hover:bg-darker-surface/30 border border-neon-purple/10"
              onClick={() => toast.success('Obrigado! Vamos simplificar em próximas versões.')}
            >
              Muito avançado
            </button>
          </div>
          <a
            href={`/articles?related_to=${articleIdString}`}
            className="text-neon-purple text-xs underline underline-offset-2 hover:text-neon-purple/80"
          >
            Ver artigos relacionados
          </a>
        </div>
      )}
    </div>
  );
};