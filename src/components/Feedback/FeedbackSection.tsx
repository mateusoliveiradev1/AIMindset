import React from 'react';
import { FeedbackButtons } from './FeedbackButtons';
import { useFeedback } from '../../hooks/useFeedback';

interface FeedbackSectionProps {
  articleId: number;
}

export const FeedbackSection: React.FC<FeedbackSectionProps> = ({ articleId }) => {
  const { submitting, hasSubmitted, submitFeedback } = useFeedback(articleId);

  const handleFeedback = async (useful: boolean) => {
    await submitFeedback(useful);
  };

  return (
    <div className="bg-darker-surface/30 backdrop-blur-sm rounded-lg p-6 my-8 border border-neon-purple/20 hover:border-neon-purple/40 transition-all duration-300 hover:shadow-lg hover:shadow-neon-purple/10">
      <div className="text-center">
        {!hasSubmitted ? (
          <>
            <h3 className="text-lg font-semibold font-orbitron text-white mb-4 bg-gradient-to-r from-neon-purple to-lime-green bg-clip-text text-transparent">
              Este artigo foi útil para você?
            </h3>
            <p className="text-futuristic-gray mb-6 text-sm">
              Seu feedback nos ajuda a criar conteúdo ainda melhor
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
          </div>
        )}
      </div>
    </div>
  );
};