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
    <div className="bg-gray-50 rounded-lg p-6 my-8 border border-gray-200">
      <div className="text-center">
        {!hasSubmitted ? (
          <>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Este artigo foi útil para você?
            </h3>
            <p className="text-gray-600 mb-6 text-sm">
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
              <span className="text-2xl">✨</span>
              <h3 className="text-lg font-semibold text-green-700">
                Obrigado pelo seu feedback!
              </h3>
            </div>
            <p className="text-gray-600 text-sm">
              Sua opinião é muito importante para nós e nos ajuda a melhorar continuamente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};