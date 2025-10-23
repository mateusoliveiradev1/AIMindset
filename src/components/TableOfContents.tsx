import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTableOfContents } from '../hooks/useTableOfContents';
import { List, X } from 'lucide-react';

interface TableOfContentsProps {
  className?: string;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ 
  className = '' 
}) => {
  const { toc, activeId, scrollToHeading } = useTableOfContents('[data-article-content]');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  // Refs para controle de performance
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTimeRef = useRef<number>(0);
  const isScrollingRef = useRef<boolean>(false);

  // Detectar tamanho da tela
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Lógica otimizada de detecção de scroll
  useEffect(() => {
    const handleScroll = () => {
      const now = Date.now();
      
      // Throttle manual mais eficiente
      if (now - lastScrollTimeRef.current < 150) {
        return;
      }
      
      lastScrollTimeRef.current = now;
      
      // Usar requestAnimationFrame para melhor performance
      if (scrollTimeoutRef.current) {
        cancelAnimationFrame(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = requestAnimationFrame(() => {
        try {
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const windowHeight = window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight;
          
          // Verificar se os valores são válidos
          if (documentHeight <= windowHeight) {
            setIsVisible(true);
            return;
          }
          
          // Calcular porcentagem de scroll
          const scrollPercentage = (scrollTop + windowHeight) / documentHeight;
          
          // Esconder índice quando próximo ao final (90% da página foi rolada)
          const shouldHide = scrollPercentage >= 0.9;
          
          setIsVisible(!shouldHide);
        } catch (error) {
          console.warn('Erro no handleScroll:', error);
          setIsVisible(true); // Fallback seguro
        }
      });
    };

    // Adicionar listener com passive para melhor performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Verificar posição inicial
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        cancelAnimationFrame(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Impedir scroll do body quando modal estiver aberto
  useEffect(() => {
    if (isModalOpen && !isDesktop) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen, isDesktop]);

  // Handler otimizado para cliques
  const handleScrollToHeading = useCallback((headingId: string, closeModal: boolean = false) => {
    try {
      // Prevenir múltiplos cliques
      if (isScrollingRef.current) {
        return;
      }
      
      isScrollingRef.current = true;
      
      // Fechar modal primeiro se necessário
      if (closeModal) {
        setIsModalOpen(false);
      }
      
      // Aguardar um frame antes de fazer scroll
      requestAnimationFrame(() => {
        scrollToHeading(headingId);
        
        // Reset flag após scroll
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 500);
      });
    } catch (error) {
      console.warn('Erro ao navegar para heading:', error);
      isScrollingRef.current = false;
    }
  }, [scrollToHeading]);

  // Early return se não há itens
  if (!toc || !Array.isArray(toc) || toc.length === 0) {
    return null;
  }

  return (
    <>
      {/* Botão flutuante para mobile/tablet */}
      {!isDesktop && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsModalOpen(true);
          }}
          className={`fixed bottom-6 right-6 z-[9999] bg-neon-purple hover:bg-neon-purple/80 text-white p-3 rounded-full shadow-lg transition-all duration-500 hover:scale-110 backdrop-blur-sm ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
          title="Índice do artigo"
          type="button"
        >
          <List className="h-5 w-5" />
        </button>
      )}

      {/* Modal para mobile/tablet */}
      {!isDesktop && isModalOpen && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false);
            }
          }}
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-darker-surface border border-futuristic-gray/20 rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-futuristic-gray/20 bg-darker-surface/80 backdrop-blur-sm">
              <h3 className="font-orbitron font-semibold text-white">Índice</h3>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsModalOpen(false);
                }}
                className="text-futuristic-gray hover:text-white transition-colors p-1 rounded-md hover:bg-futuristic-gray/10"
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* TOC Items */}
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {toc && toc.length > 0 ? (
                <nav>
                  <ul className="space-y-2">
                    {toc.map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleScrollToHeading(item.id, true);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-300 ${
                            activeId === item.id
                              ? 'bg-neon-purple/20 text-neon-purple border-l-2 border-neon-purple'
                              : 'text-futuristic-gray hover:text-white hover:bg-futuristic-gray/10'
                          }`}
                          style={{ paddingLeft: `${(item.level - 1) * 12 + 12}px` }}
                          type="button"
                        >
                          {item.text}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              ) : (
                <p className="text-futuristic-gray text-center py-8">
                  Nenhum cabeçalho encontrado no artigo.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar para desktop */}
      {isDesktop && (
        <div 
          className={`fixed top-20 left-6 w-80 max-h-[calc(100vh-120px)] z-[9998] bg-darker-surface/90 backdrop-blur-md border border-futuristic-gray/20 rounded-lg shadow-2xl transition-all duration-500 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8 pointer-events-none'
          }`}
        >
          <div className="p-6">
            <h3 className="font-orbitron font-semibold text-white mb-4 flex items-center sticky top-0 bg-darker-surface/90 backdrop-blur-sm -mx-6 -mt-6 px-6 pt-6 pb-4 border-b border-futuristic-gray/10">
              <List className="h-4 w-4 mr-2" />
              Índice
            </h3>
            
            <div className="max-h-[calc(100vh-240px)] overflow-y-auto pr-2 -mr-2">
              {toc && toc.length > 0 ? (
                <nav>
                  <ul className="space-y-2">
                    {toc.map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleScrollToHeading(item.id);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-300 text-sm ${
                            activeId === item.id
                              ? 'bg-neon-purple/20 text-neon-purple border-l-2 border-neon-purple shadow-sm'
                              : 'text-futuristic-gray hover:text-white hover:bg-futuristic-gray/10'
                          }`}
                          style={{ paddingLeft: `${(item.level - 1) * 12 + 12}px` }}
                          type="button"
                        >
                          {item.text}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              ) : (
                <p className="text-futuristic-gray text-sm text-center py-8">
                  Nenhum cabeçalho encontrado no artigo.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};