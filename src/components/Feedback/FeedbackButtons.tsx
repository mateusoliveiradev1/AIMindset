import React, { memo, useRef } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface FeedbackButtonsProps {
  onFeedback: (useful: boolean) => void;
  submitting: boolean;
  hasSubmitted: boolean;
}

export const FeedbackButtons: React.FC<FeedbackButtonsProps> = memo(({
  onFeedback,
  submitting,
  hasSubmitted
}) => {
  const lastPointerRef = useRef<string>('none');
  return (
    <div className="flex gap-3 justify-center">
      <button
        onClick={() => onFeedback(true)}
        onPointerDown={(e) => {
          if (submitting || hasSubmitted) return;
          lastPointerRef.current = e.pointerType;
          if (e.pointerType === 'touch') {
            onFeedback(true);
          }
        }}
        disabled={submitting || hasSubmitted}
        className={`
          flex items-center gap-2 px-6 py-3 h-11 rounded-lg font-medium transition-colors transition-transform duration-200 active:scale-95 ring-1 ring-neon-purple/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple/40 focus-visible:ring-offset-1 focus-visible:ring-offset-darker-surface/30 shadow-sm hover:shadow-md
          ${hasSubmitted 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-green-50 text-green-700 hover:bg-green-100'
          }
          ${submitting ? 'opacity-50 cursor-not-allowed' : ''}
          min-w-[120px] touch-manipulation
        `}
        style={{
          transform: 'translateZ(0)', // Force hardware acceleration
          backfaceVisibility: 'hidden', // Prevent flickering
          WebkitFontSmoothing: 'antialiased',
          willChange: 'transform, opacity',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation'
        }}
        aria-disabled={submitting || hasSubmitted}
        aria-label="Marcar artigo como útil"
      >
        <ThumbsUp className="w-5 h-5" />
        <span>👍 Sim</span>
      </button>
      
      <button
        onClick={() => onFeedback(false)}
        onPointerDown={(e) => {
          if (submitting || hasSubmitted) return;
          lastPointerRef.current = e.pointerType;
          if (e.pointerType === 'touch') {
            onFeedback(false);
          }
        }}
        disabled={submitting || hasSubmitted}
        className={`
          flex items-center gap-2 px-6 py-3 h-11 rounded-lg font-medium transition-colors transition-transform duration-200 active:scale-95 ring-1 ring-neon-purple/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple/40 focus-visible:ring-offset-1 focus-visible:ring-offset-darker-surface/30 shadow-sm hover:shadow-md
          ${hasSubmitted 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-red-50 text-red-700 hover:bg-red-100'
          }
          ${submitting ? 'opacity-50 cursor-not-allowed' : ''}
          min-w-[120px] touch-manipulation
        `}
        style={{
          transform: 'translateZ(0)', // Force hardware acceleration
          backfaceVisibility: 'hidden', // Prevent flickering
          WebkitFontSmoothing: 'antialiased',
          willChange: 'transform, opacity',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation'
        }}
        aria-disabled={submitting || hasSubmitted}
        aria-label="Marcar artigo como não útil"
      >
        <ThumbsDown className="w-5 h-5" />
        <span>👎 Não</span>
      </button>
    </div>
  );
});