import { useEffect } from 'react';

interface ResourceConfig {
  href: string;
  as?: string;
  type?: string;
  crossOrigin?: string;
}

interface PreloadManagerProps {
  criticalResources?: (string | ResourceConfig)[];
  prefetchResources?: (string | ResourceConfig)[];
}

const PreloadManager: React.FC<PreloadManagerProps> = ({
  criticalResources = [],
  prefetchResources = []
}) => {
  useEffect(() => {
    // Preload de recursos críticos
    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      
      if (typeof resource === 'string') {
        link.href = resource;
        
        // Determinar o tipo de recurso
        if (resource.endsWith('.css')) {
          link.as = 'style';
        } else if (resource.endsWith('.js')) {
          link.as = 'script';
        } else if (resource.match(/\.(woff2?|ttf|otf)$/)) {
          link.as = 'font';
          link.type = 'font/woff2';
          link.crossOrigin = 'anonymous';
        } else if (resource.match(/\.(jpg|jpeg|png|webp|svg)$/)) {
          link.as = 'image';
        }
      } else {
        // ResourceConfig object
        link.href = resource.href;
        if (resource.as) link.as = resource.as;
        if (resource.type) link.type = resource.type;
        if (resource.crossOrigin) link.crossOrigin = resource.crossOrigin;
      }
      
      document.head.appendChild(link);
    });

    // Prefetch de recursos não críticos
    prefetchResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      
      if (typeof resource === 'string') {
        link.href = resource;
      } else {
        link.href = resource.href;
        if (resource.as) link.as = resource.as;
      }
      
      document.head.appendChild(link);
    });

    // DNS prefetch para domínios externos - TEMPORARIAMENTE DESABILITADO PARA PREVIEW
    // const externalDomains = [
    //   'fonts.googleapis.com',
    //   'fonts.gstatic.com',
    //   'trae-api-us.mchost.guru'
    // ];

    // externalDomains.forEach(domain => {
    //   const link = document.createElement('link');
    //   link.rel = 'dns-prefetch';
    //   link.href = `//${domain}`;
    //   document.head.appendChild(link);
    // });

    // Preconnect para recursos críticos externos - TEMPORARIAMENTE DESABILITADO PARA PREVIEW
    // const criticalDomains = [
    //   'fonts.googleapis.com',
    //   'fonts.gstatic.com'
    // ];

    // criticalDomains.forEach(domain => {
    //   const link = document.createElement('link');
    //   link.rel = 'preconnect';
    //   link.href = `https://${domain}`;
    //   link.crossOrigin = 'anonymous';
    //   document.head.appendChild(link);
    // });

  }, [criticalResources, prefetchResources]);

  return null;
};

// Hook para gerenciar preload dinâmico
export const usePreload = () => {
  const preloadResource = (url: string, type: 'style' | 'script' | 'font' | 'image') => {
    // Verificar se já foi precarregado
    const existing = document.querySelector(`link[href="${url}"]`);
    if (existing) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = type;
    
    if (type === 'font') {
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
    }
    
    document.head.appendChild(link);
  };

  const prefetchResource = (url: string) => {
    // Verificar se já foi prefetchado
    const existing = document.querySelector(`link[href="${url}"][rel="prefetch"]`);
    if (existing) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  };

  return { preloadResource, prefetchResource };
};

export default PreloadManager;