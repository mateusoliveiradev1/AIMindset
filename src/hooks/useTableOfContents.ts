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

export const useTableOfContents = (
  contentSelector: string = '[data-article-content]',
  dependencies: any[] = []
) => {
  const [toc, setToc] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Throttled function to update active ID
  const throttledSetActiveId = useCallback(
    throttle((id: string) => {
      setActiveId(id);
    }, 100),
    []
  );

  // Reset state immediately when contentSelector or dependencies change
  useEffect(() => {
    // console.log('🔄 [TOC DEBUG] ContentSelector ou dependências mudaram, resetando TOC:', contentSelector, dependencies);
    
    // Limpar estado imediatamente
    setToc([]);
    setActiveId('');
    
    // Limpar observer anterior
    if (observerRef.current) {
      // console.log('🧹 Desconectando observer anterior');
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    
    // Limpar timeout anterior
    if (timeoutRef.current) {
      // console.log('⏰ Limpando timeout anterior');
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [contentSelector, ...dependencies]);

  useEffect(() => {
    const generateTOC = () => {
      console.log('🔍 Gerando TOC, procurando por:', contentSelector);
      
      // Tentar múltiplos seletores
      let content = document.querySelector(contentSelector);
      
      if (!content) {
        console.log('🔍 Tentando seletor alternativo: #article-content');
        content = document.querySelector('#article-content');
      }
      
      if (!content) {
        console.log('🔍 Tentando seletor alternativo: article');
        content = document.querySelector('article');
      }
      
      console.log('📄 Elemento encontrado:', content);
      
      if (!content) {
        console.warn('❌ Elemento não encontrado com nenhum seletor');
        return;
      }

      // DEBUG: Verificar o conteúdo HTML
      console.log('📋 [TOC DEBUG] Content HTML:', content.innerHTML.substring(0, 1000));
      
      // Verificar se há elementos ReactMarkdown
      const reactMarkdownElements = content.querySelectorAll('[data-sourcepos]');
      console.log('🔍 [TOC DEBUG] Elementos ReactMarkdown encontrados:', reactMarkdownElements.length);
      
      const headings = content.querySelectorAll('h1, h2, h3, h4, h5, h6');
      
      // Debug adicional: verificar todos os elementos filhos
      const allChildren = content.querySelectorAll('*');
      console.log('🔍 [TOC DEBUG] Total de elementos filhos:', allChildren.length);
      console.log('🔍 [TOC DEBUG] Tipos de elementos:', Array.from(allChildren).map(el => el.tagName).slice(0, 10));
      console.log('📋 [TOC DEBUG] Headings encontrados:', headings.length, headings);
      console.log('📋 [TOC DEBUG] Content element:', content);
      
      // DEBUG: Verificar se há elementos com texto de cabeçalho
      const allElements = content.querySelectorAll('*');
      console.log('📋 [TOC DEBUG] Total de elementos no content:', allElements.length);
      
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

        console.log(`📌 [TOC DEBUG] Heading ${index + 1}:`, { id, text, level, tagName: element.tagName });

        tocItems.push({
          id,
          text,
          level,
          element
        });
      });

      console.log('✅ [TOC DEBUG] TOC Items gerados:', tocItems);
      setToc(tocItems);
    };

    // Generate TOC after content is loaded with retry mechanism
    let retryCount = 0;
    const maxRetries = 3;
    
    const generateTOCWithRetry = () => {
      console.log(`🔄 [TOC DEBUG] Tentativa ${retryCount + 1} de geração do TOC`);
      
      // Tentar múltiplos seletores
      let content = document.querySelector(contentSelector);
      
      if (!content) {
        console.log('🔍 Tentando seletor alternativo: #article-content');
        content = document.querySelector('#article-content');
      }
      
      if (!content) {
        console.log('🔍 Tentando seletor alternativo: article');
        content = document.querySelector('article');
      }
      
      if (!content) {
        console.warn('❌ [TOC DEBUG] Elemento não encontrado com nenhum seletor');
        // Limpar TOC se não há conteúdo
        setToc([]);
        setActiveId('');
        return;
      }

      // DEBUG: Verificar o conteúdo HTML completo
      console.log('📋 [TOC DEBUG] Content HTML completo (primeiros 500 chars):', content.innerHTML.substring(0, 500));
      console.log('📋 [TOC DEBUG] Content textContent (primeiros 200 chars):', content.textContent?.substring(0, 200));
      
      // Verificar se há elementos ReactMarkdown
      const reactMarkdownElements = content.querySelectorAll('[data-sourcepos]');
      console.log('🔍 [TOC DEBUG] Elementos ReactMarkdown encontrados:', reactMarkdownElements.length);
      
      // Debug adicional: verificar todos os elementos filhos
      const allChildren = content.querySelectorAll('*');
      console.log('🔍 [TOC DEBUG] Total de elementos filhos:', allChildren.length);
      console.log('🔍 [TOC DEBUG] Tipos de elementos:', Array.from(allChildren).map(el => el.tagName).slice(0, 10));
      
      // Verificar se há elementos p que podem conter cabeçalhos
      const paragraphs = content.querySelectorAll('p');
      console.log('🔍 [TOC DEBUG] Parágrafos encontrados:', paragraphs.length);
      if (paragraphs.length > 0) {
        console.log('🔍 [TOC DEBUG] Primeiro parágrafo:', paragraphs[0].textContent?.substring(0, 100));
      }

      const headings = content.querySelectorAll('h1, h2, h3, h4, h5, h6');
      console.log(`📋 [TOC DEBUG] Headings encontrados na tentativa ${retryCount + 1}:`, headings.length);
      
      // If no headings found and we haven't reached max retries, try again
      if (headings.length === 0 && retryCount < maxRetries) {
        retryCount++;
        console.log(`⏳ Nenhum heading encontrado, tentando novamente em 2s (tentativa ${retryCount}/${maxRetries})`);
        timeoutRef.current = setTimeout(generateTOCWithRetry, 2000);
        return;
      }
      
      // Se não encontrou headings após todas as tentativas, limpar TOC
      if (headings.length === 0) {
        console.log('❌ Nenhum heading encontrado após todas as tentativas, limpando TOC');
        setToc([]);
        setActiveId('');
        return;
      }
      
      // Generate TOC with found headings
      console.log('✅ Headings encontrados, gerando TOC...');
      generateTOC();
    };

    // Aguardar um pouco antes de tentar gerar o TOC para garantir que o DOM esteja pronto
    const timeoutId = setTimeout(() => {
      generateTOCWithRetry();
    }, 500); // Aumentar o timeout para aguardar o ReactMarkdown
    
    // Também tentar imediatamente
    generateTOCWithRetry();
    
    // Tentar novamente após mais tempo se necessário
    const secondTimeoutId = setTimeout(() => {
      generateTOCWithRetry();
    }, 1000);
       
    // Cleanup
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (secondTimeoutId) {
        clearTimeout(secondTimeoutId);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [contentSelector, ...dependencies]);

  useEffect(() => {
    // Cleanup previous observer first
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (toc.length === 0) {
      console.log('📋 TOC vazio, não criando observer');
      return;
    }

    console.log('👁️ Criando observer para', toc.length, 'headings');

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
        observerRef.current = null;
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