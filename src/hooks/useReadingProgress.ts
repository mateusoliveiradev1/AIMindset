import { useState, useEffect } from 'react';

export const useReadingProgress = (targetId: string = 'article-content') => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const article = document.getElementById(targetId);
      if (!article) return;

      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const scrollPercent = scrollTop / (docHeight - winHeight);
      const scrollPercentRounded = Math.round(scrollPercent * 100);

      setProgress(Math.min(100, Math.max(0, scrollPercentRounded)));
    };

    const throttledUpdateProgress = () => {
      requestAnimationFrame(updateProgress);
    };

    window.addEventListener('scroll', throttledUpdateProgress, { passive: true });
    window.addEventListener('resize', throttledUpdateProgress, { passive: true });
    
    // Initial calculation
    updateProgress();

    return () => {
      window.removeEventListener('scroll', throttledUpdateProgress);
      window.removeEventListener('resize', throttledUpdateProgress);
    };
  }, [targetId]);

  return progress;
};