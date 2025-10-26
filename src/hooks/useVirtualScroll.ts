import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  items: any[];
}

interface VirtualScrollResult {
  virtualItems: Array<{
    index: number;
    start: number;
    end: number;
    item: any;
  }>;
  totalHeight: number;
  scrollElementProps: {
    ref: React.RefObject<HTMLDivElement>;
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
    style: React.CSSProperties;
  };
  containerProps: {
    style: React.CSSProperties;
  };
}

export const useVirtualScroll = ({
  itemHeight,
  containerHeight,
  overscan = 5,
  items
}: VirtualScrollOptions): VirtualScrollResult => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const virtualItems = useMemo(() => {
    const itemCount = items.length;
    const totalHeight = itemCount * itemHeight;
    
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const visibleItems = [];
    for (let i = startIndex; i <= endIndex; i++) {
      visibleItems.push({
        index: i,
        start: i * itemHeight,
        end: (i + 1) * itemHeight,
        item: items[i]
      });
    }

    return visibleItems;
  }, [scrollTop, itemHeight, containerHeight, overscan, items]);

  const totalHeight = items.length * itemHeight;

  return {
    virtualItems,
    totalHeight,
    scrollElementProps: {
      ref: scrollElementRef,
      onScroll: handleScroll,
      style: {
        height: containerHeight,
        overflow: 'auto',
        position: 'relative'
      }
    },
    containerProps: {
      style: {
        height: totalHeight,
        position: 'relative'
      }
    }
  };
};

// Hook otimizado para listas de artigos
export const useArticleVirtualScroll = (articles: any[], containerHeight: number = 600) => {
  const itemHeight = 280; // Altura estimada de cada card de artigo
  
  return useVirtualScroll({
    itemHeight,
    containerHeight,
    overscan: 3,
    items: articles
  });
};