import { useState, useEffect, useCallback, useRef } from 'react';

export interface TOCItem {
  id: string;
  text: string;
  level: number;
  element: HTMLElement;
}

// Utility function for throttling
const throttle = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return (...args: any[]) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

export const useTableOfContents = (contentSelector: string = '[data-article-content]') => {
  const [toc, setToc] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Throttled function to update active ID
  const throttledSetActiveId = useCallback(
    throttle((id: string) => {
      setActiveId(id);
    }, 100),
    []
  );

  useEffect(() => {
    const generateTOC = () => {
      console.log('🔍 Gerando TOC, procurando por:', contentSelector);
      const content = document.querySelector(contentSelector);
      console.log('📄 Elemento encontrado:', content);
      
      if (!content) {
        console.warn('❌ Elemento não encontrado:', contentSelector);
        return;
      }

      const headings = content.querySelectorAll('h1, h2, h3, h4, h5, h6');
      console.log('📋 Headings encontrados:', headings.length, headings);
      
      const tocItems: TOCItem[] = [];

      headings.forEach((heading, index) => {
        const element = heading as HTMLElement;
        const level = parseInt(element.tagName.charAt(1));
        const text = element.textContent || '';
        
        // Create or use existing ID
        let id = element.id;
        if (!id) {
          id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
          element.id = id;
        }

        console.log(`📌 Heading ${index + 1}:`, { id, text, level });

        tocItems.push({
          id,
          text,
          level,
          element
        });
      });

      console.log('✅ TOC Items gerados:', tocItems);
      setToc(tocItems);
    };

    // Generate TOC after content is loaded
    const timer = setTimeout(generateTOC, 500);
    
    return () => clearTimeout(timer);
  }, [contentSelector]);

  useEffect(() => {
    if (toc.length === 0) return;

    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Enhanced observer options for better responsiveness
    const observerOptions = {
      rootMargin: '-10% 0% -60% 0%', // More responsive margins
      threshold: [0, 0.1, 0.5, 1] // Multiple thresholds for better detection
    };

    const observer = new IntersectionObserver((entries) => {
      // Find the most visible heading
      let mostVisible = entries[0];
      let maxRatio = 0;

      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
          maxRatio = entry.intersectionRatio;
          mostVisible = entry;
        }
      });

      // If we have a visible heading, update active ID
      if (mostVisible && mostVisible.isIntersecting) {
        throttledSetActiveId(mostVisible.target.id);
      }
    }, observerOptions);

    observerRef.current = observer;

    // Observe all headings
    toc.forEach((item) => {
      if (item.element) {
        observer.observe(item.element);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [toc, throttledSetActiveId]);

  const scrollToHeading = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 100; // Offset for fixed header
      const elementPosition = element.offsetTop;
      const offsetPosition = elementPosition - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  return {
    toc,
    activeId,
    scrollToHeading
  };
};