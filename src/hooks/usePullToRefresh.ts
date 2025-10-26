import { useCallback, useEffect, useRef, useState } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  resistance?: number;
  enabled?: boolean;
}

export interface PullToRefreshProps {
  containerRef: React.RefObject<HTMLDivElement>;
  isRefreshing: boolean;
  isPulling: boolean;
  pullDistance: number;
  pullToRefreshStyle: React.CSSProperties;
  refreshIndicatorStyle: React.CSSProperties;
  isThresholdReached: boolean;
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
  enabled = true
}: UsePullToRefreshOptions): PullToRefreshProps => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  
  const startY = useRef(0);
  const currentY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    
    startY.current = e.touches[0].clientY;
    setIsPulling(true);
  }, [enabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || !enabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    
    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;
    
    if (deltaY > 0) {
      e.preventDefault();
      const distance = Math.min(deltaY / resistance, threshold * 1.5);
      setPullDistance(distance);
    }
  }, [isPulling, enabled, isRefreshing, resistance, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || !enabled) return;
    
    setIsPulling(false);
    
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Pull to refresh error:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
  }, [isPulling, enabled, pullDistance, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    // Use passive listeners for better performance
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, enabled]);

  const pullToRefreshStyle = {
    transform: `translateY(${pullDistance}px)`,
    transition: isPulling ? 'none' : 'transform 0.3s ease-out',
  };

  const refreshIndicatorStyle = {
    opacity: Math.min(pullDistance / threshold, 1),
    transform: `translateY(${Math.max(0, pullDistance - 20)}px) rotate(${pullDistance * 2}deg)`,
    transition: isPulling ? 'none' : 'all 0.3s ease-out',
  };

  return {
    containerRef,
    isRefreshing,
    isPulling,
    pullDistance,
    pullToRefreshStyle,
    refreshIndicatorStyle,
    isThresholdReached: pullDistance >= threshold
  };
};