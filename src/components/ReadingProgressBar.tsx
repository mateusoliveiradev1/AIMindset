import React from 'react';
import { useReadingProgress } from '../hooks/useReadingProgress';

interface ReadingProgressBarProps {
  target?: string;
}

export const ReadingProgressBar: React.FC<ReadingProgressBarProps> = ({ 
  target = 'article-content' 
}) => {
  const progress = useReadingProgress(target);

  return (
    <div className="fixed top-0 left-0 w-full z-50 h-1 bg-gray-900/20 backdrop-blur-sm">
      <div 
        className="h-full bg-gradient-to-r from-lime-400 to-purple-500 transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};