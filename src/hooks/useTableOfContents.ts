import { useState, useEffect } from 'react';

export interface TOCItem {
  id: string;
  text: string;
  level: number;
  element: HTMLElement;
}

export const useTableOfContents = (contentSelector: string = '[data-article-content]') => {
  const [toc, setToc] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const generateTOC = () => {
      console.log('🔍 Gerando TOC, procurando por:', contentSelector);
      const content = document.querySelector(contentSelector);
      console.log('📄 Elemento encontrado:', content);
      
      // Força o log para aparecer
      if (typeof window !== 'undefined') {
        window.console.log('🔍 TOC DEBUG - Selector:', contentSelector);
        window.console.log('📄 TOC DEBUG - Element:', content);
      }
      
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

    const observerOptions = {
      rootMargin: '-20% 0% -35% 0%',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    }, observerOptions);

    toc.forEach((item) => {
      if (item.element) {
        observer.observe(item.element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [toc]);

  const scrollToHeading = (id: string) => {
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
  };

  return {
    toc,
    activeId,
    scrollToHeading
  };
};