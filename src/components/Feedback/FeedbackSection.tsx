import React from 'react';
import { ThumbsUp, ThumbsDown, Users, TrendingUp } from 'lucide-react';
import { FeedbackButtons } from './FeedbackButtons';
import { useFeedback } from '../../hooks/useFeedback';
import { useArticleFeedbackStats } from '../../hooks/useArticleFeedbackStats';

interface FeedbackSectionProps {
  articleId: string | number;
}

export const FeedbackSection: React.FC<FeedbackSectionProps> = ({ articleId }) => {
  const { submitting, hasSubmitted, submitFeedback } = useFeedback(String(articleId));
  const { stats, loading: statsLoading } = useArticleFeedbackStats(String(articleId));

  const handleFeedback = async (useful: boolean) => {
    await submitFeedback(useful);
  };

  return (
    <div className="bg-darker-surface/30 backdrop-blur-sm rounded-lg p-6 my-8 border border-neon-purple/20 hover:border-neon-purple/40 transition-all duration-300 hover:shadow-lg hover:shadow-neon-purple/10">
      {/* Estatísticas de Feedback */}
      {!statsLoading && stats.totalFeedbacks > 0 && (
        <div className="mb-6 p-4 bg-darker-surface/20 rounded-lg border border-neon-purple/10">
          <div className="flex items-center justify-center gap-6 text-sm">
            {/* Total de pessoas que avaliaram */}
            <div className="flex items-center gap-2 text-futuristic-gray">
              <Users className="h-4 w-4 text-neon-purple" />
              <span>
                <span className="text-white font-semibold">{stats.totalFeedbacks}</span> 
                {stats.totalFeedbacks === 1 ? ' pessoa avaliou' : ' pessoas avaliaram'}
              </span>
            </div>

            {/* Feedback positivo */}
            <div className="flex items-center gap-2 text-lime-green">
              <ThumbsUp className="h-4 w-4" />
              <span className="font-semibold">{stats.positiveFeedbacks}</span>
            </div>

            {/* Feedback negativo */}
            <div className="flex items-center gap-2 text-red-400">
              <ThumbsDown className="h-4 w-4" />
              <span className="font-semibold">{stats.negativeFeedbacks}</span>
            </div>

            {/* Taxa de aprovação */}
            <div className="flex items-center gap-2 text-neon-purple">
              <TrendingUp className="h-4 w-4" />
              <span className="font-semibold">{stats.approvalRate.toFixed(1)}%</span>
              <span className="text-futuristic-gray">aprovação</span>
            </div>
          </div>

          {/* Barra de progresso da aprovação */}
          {stats.totalFeedbacks > 0 && (
            <div className="mt-3">
              <div className="w-full bg-darker-surface/50 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-lime-green to-neon-purple h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${stats.approvalRate}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="text-center">
        {!hasSubmitted ? (
          <>
            <h3 className="text-lg font-semibold font-orbitron text-white mb-4 bg-gradient-to-r from-neon-purple to-lime-green bg-clip-text text-transparent">
              Este artigo foi útil para você?
            </h3>
            <p className="text-futuristic-gray mb-6 text-sm">
              {stats.totalFeedbacks > 0 
                ? `Junte-se às ${stats.totalFeedbacks} pessoas que já avaliaram este conteúdo`
                : 'Seu feedback nos ajuda a criar conteúdo ainda melhor'
              }
            </p>
            <FeedbackButtons
              onFeedback={handleFeedback}
              submitting={submitting}
              hasSubmitted={hasSubmitted}
            />
          </>
        ) : (
          <div className="py-4">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-2xl animate-pulse">⚡</span>
              <h3 className="text-lg font-semibold font-orbitron text-lime-green animate-fade-in">
                Obrigado pelo seu feedback!
              </h3>
            </div>
            <p className="text-futuristic-gray text-sm">
              Sua opinião é muito importante para nós e nos ajuda a melhorar continuamente.
            </p>
            {stats.totalFeedbacks > 0 && (
              <p className="text-neon-purple text-xs mt-2">
                Agora somos {stats.totalFeedbacks + 1} pessoas que avaliaram este artigo!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};