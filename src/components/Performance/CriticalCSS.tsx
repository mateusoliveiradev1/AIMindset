import React, { useEffect } from 'react';

// Critical CSS inline para Above the Fold
const CRITICAL_CSS = `
  /* Reset e base críticos */
  *,*::before,*::after{box-sizing:border-box}
  body{margin:0;font-family:system-ui,-apple-system,sans-serif;background:#0a0a0a;color:#fff;line-height:1.6}
  
  /* Layout crítico */
  .min-h-screen{min-height:100vh}
  .flex{display:flex}
  .items-center{align-items:center}
  .justify-center{justify-content:center}
  .text-center{text-align:center}
  
  /* Cores críticas */
  .bg-dark-surface{background-color:#1a1a1a}
  .text-white{color:#fff}
  .text-lime-green{color:#32cd32}
  .border-lime-green{border-color:#32cd32}
  
  /* Animações críticas */
  .animate-spin{animation:spin 1s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
  
  /* Typography crítica */
  .font-orbitron{font-family:'Orbitron',sans-serif}
  .font-bold{font-weight:700}
  .text-3xl{font-size:1.875rem}
  .text-4xl{font-size:2.25rem}
  
  /* Spacing crítico */
  .p-4{padding:1rem}
  .mb-4{margin-bottom:1rem}
  .mx-auto{margin-left:auto;margin-right:auto}
  
  /* Loading states */
  .opacity-0{opacity:0}
  .opacity-100{opacity:1}
  .transition-opacity{transition-property:opacity;transition-duration:300ms}
`;

interface CriticalCSSProps {
  children: React.ReactNode;
}

export const CriticalCSS: React.FC<CriticalCSSProps> = ({ children }) => {
  useEffect(() => {
    // Injetar CSS crítico no head se ainda não estiver presente
    const existingStyle = document.getElementById('critical-css');
    
    if (!existingStyle) {
      const style = document.createElement('style');
      style.id = 'critical-css';
      style.textContent = CRITICAL_CSS;
      document.head.insertBefore(style, document.head.firstChild);
    }

    // Preload das fontes críticas
    const preloadFonts = () => {
      const fontUrl = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Montserrat:wght@400;600;700&family=Roboto:wght@300;400;500;700&display=swap';
      
      if (!document.querySelector(`link[href="${fontUrl}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'style';
        link.href = fontUrl;
        link.crossOrigin = 'anonymous';
        link.onload = () => {
          link.rel = 'stylesheet';
        };
        document.head.appendChild(link);
      }
    };

    preloadFonts();

    // Otimizar carregamento de CSS não crítico
    const loadNonCriticalCSS = () => {
      // Aguardar o carregamento inicial
      setTimeout(() => {
        const nonCriticalCSS = document.querySelectorAll('link[rel="stylesheet"][data-non-critical]');
        nonCriticalCSS.forEach(link => {
          (link as HTMLLinkElement).rel = 'stylesheet';
        });
      }, 100);
    };

    loadNonCriticalCSS();

    // Cleanup
    return () => {
      // Não remover o CSS crítico para evitar FOUC
    };
  }, []);

  return <>{children}</>;
};

// Hook para otimização de CSS
export const useOptimizedCSS = () => {
  useEffect(() => {
    // Remover CSS não utilizado após carregamento
    const removeUnusedCSS = () => {
      // Aguardar carregamento completo
      setTimeout(() => {
        const allElements = document.querySelectorAll('*');
        const usedClasses = new Set<string>();

        // Coletar todas as classes utilizadas
        allElements.forEach(element => {
          const classList = element.classList;
          classList.forEach(className => {
            usedClasses.add(className);
          });
        });

        // Marcar classes utilizadas para ferramentas de build
        (window as any).__USED_CSS_CLASSES__ = Array.from(usedClasses);
      }, 2000);
    };

    removeUnusedCSS();
  }, []);

  return null;
};

// Componente para lazy loading de CSS não crítico
export const LazyCSS: React.FC<{ href: string; media?: string }> = ({ 
  href, 
  media = 'all' 
}) => {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    link.media = media;
    link.onload = () => {
      link.rel = 'stylesheet';
    };

    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, [href, media]);

  return null;
};

export default CriticalCSS;