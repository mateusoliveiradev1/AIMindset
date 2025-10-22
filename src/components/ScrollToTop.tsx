import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronUp } from 'lucide-react';

export const ScrollToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const location = useLocation();

  // Detectar se estamos em uma página de artigo
  const isArticlePage = location.pathname.startsWith('/artigo/');

  // Detectar tamanho da tela
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  // Detectar scroll para mostrar/ocultar o botão
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  // Função para scroll suave ao topo
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Calcular posicionamento dinâmico baseado no contexto
  const getPositionClasses = () => {
    if (screenSize === 'desktop') {
      // Desktop: posição padrão sempre
      return 'bottom-6 right-6';
    }

    if (isArticlePage && (screenSize === 'mobile' || screenSize === 'tablet')) {
      // Em artigos mobile/tablet: posicionar à esquerda do botão do índice
      if (screenSize === 'mobile') {
        return 'bottom-6 right-20'; // Espaço para o botão do índice (w-14 + gap)
      } else {
        return 'bottom-6 right-24'; // Tablet: mais espaço (w-16 + gap)
      }
    }

    // Outras páginas mobile/tablet: posição padrão
    return 'bottom-6 right-6';
  };

  const getSizeClasses = () => {
    if (screenSize === 'mobile') {
      return 'w-12 h-12';
    } else if (screenSize === 'tablet') {
      return 'w-13 h-13';
    } else {
      return 'w-14 h-14';
    }
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className={`
            fixed ${getPositionClasses()} z-[9990]
            ${getSizeClasses()}
            bg-gradient-to-r from-blue-500 to-purple-600
            hover:from-blue-600 hover:to-purple-700
            text-white rounded-full
            shadow-lg hover:shadow-xl
            transform hover:scale-110 active:scale-95
            transition-all duration-300 ease-in-out
            flex items-center justify-center
            group animate-fade-in
          `}
          aria-label="Voltar ao topo"
          title="Voltar ao topo"
        >
          <ChevronUp 
            className={`
              ${screenSize === 'mobile' ? 'w-5 h-5' : screenSize === 'tablet' ? 'w-6 h-6' : 'w-7 h-7'}
              group-hover:animate-bounce
              transition-transform duration-200
            `} 
          />
        </button>
      )}
    </>
  );
};