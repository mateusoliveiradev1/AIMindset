import React from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface FeedbackButtonsProps {
  onFeedback: (useful: boolean) => void;
  submitting: boolean;
  hasSubmitted: boolean;
}

export const FeedbackButtons: React.FC<FeedbackButtonsProps> = ({
  onFeedback,
  submitting,
  hasSubmitted
}) => {
  return (
    <div className="flex gap-3 justify-center">
      <button
        onClick={() => onFeedback(true)}
        disabled={submitting || hasSubmitted}
        className={`
          flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200
          ${hasSubmitted 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-green-50 text-green-700 hover:bg-green-100 hover:scale-105 active:scale-95'
          }
          ${submitting ? 'opacity-50 cursor-not-allowed' : ''}
          min-w-[120px] touch-manipulation
        `}
        aria-label="Marcar artigo como útil"
      >
        <ThumbsUp className="w-5 h-5" />
        <span>👍 Sim</span>
      </button>
      
      <button
        onClick={() => onFeedback(false)}
        disabled={submitting || hasSubmitted}
        className={`
          flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200
          ${hasSubmitted 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-red-50 text-red-700 hover:bg-red-100 hover:scale-105 active:scale-95'
          }
          ${submitting ? 'opacity-50 cursor-not-allowed' : ''}
          min-w-[120px] touch-manipulation
        `}
        aria-label="Marcar artigo como não útil"
      >
        <ThumbsDown className="w-5 h-5" />
        <span>👎 Não</span>
      </button>
    </div>
  );
};