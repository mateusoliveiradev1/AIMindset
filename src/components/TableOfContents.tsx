import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTableOfContents } from '../hooks/useTableOfContents';
import { List, X } from 'lucide-react';

interface TableOfContentsProps {
  className?: string;
  articleSlug?: string;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ 
  className = '',
  articleSlug
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isAtComments, setIsAtComments] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [screenSize, setScreenSize] = useState<'small' | 'medium' | 'large'>('medium');
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Hook deve ser chamado no topo do componente
  const { toc, activeId, scrollToHeading } = useTableOfContents('#article-content', [articleSlug]);

  // DEBUG: Log quando o componente é renderizado
  console.log('🎯 [TOC DEBUG] TableOfContents renderizado com props:', { className, articleSlug });
  console.log('🎯 [TOC DEBUG] TOC items:', toc);
  console.log('🎯 [TOC DEBUG] Active ID:', activeId);

  // DEBUG: Log do estado do TOC
  console.log('📋 [TOC DEBUG] Estado do TOC:', { 
    tocLength: toc.length, 
    activeId, 
    toc: toc.map(item => ({ id: item.id, text: item.text, level: item.level }))
  });

  // Detectar se é desktop e tamanho da tela
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsDesktop(width >= 1024);
      
      if (width >= 1440) {
        setScreenSize('large');
      } else if (width >= 1200) {
        setScreenSize('medium');
      } else {
        setScreenSize('small');
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Detectar scroll para mostrar/esconder o botão e detectar seção de comentários
  useEffect(() => {
    let commentsObserver: IntersectionObserver | null = null;
    
    const handleScroll = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        const scrollY = window.scrollY;
        
        // DEBUG: Log do scroll
        console.log('📏 [TOC DEBUG] Scroll:', { scrollY, tocLength: toc.length });
        
        // Mostrar/esconder baseado no scroll e se não está na seção de comentários
        const shouldShow = scrollY > 200 && toc.length > 0 && !isAtComments;
        console.log('👁️ [TOC DEBUG] Visibilidade:', { shouldShow, scrollY, tocLength: toc.length, isAtComments });
        setIsVisible(shouldShow);
      }, 10);
    };

    // Configurar Intersection Observer para detectar seção de comentários
    const setupCommentsObserver = () => {
      // Aguardar um pouco mais para garantir que o DOM esteja carregado
      setTimeout(() => {
        // Procurar pela seção de comentários com múltiplos seletores
        const commentsSection = 
          document.querySelector('[data-comments-section="true"]') ||
          document.querySelector('#comments') ||
          document.querySelector('.comments-section') ||
          document.querySelector('[data-comments-section]') ||
          // Procurar por elementos que contenham texto relacionado a comentários
          Array.from(document.querySelectorAll('h2, h3, h4')).find(el => {
            const text = el.textContent?.toLowerCase() || '';
            return text.includes('comentário') || text.includes('comment');
          })?.closest('section, div') ||
          // Procurar por qualquer elemento que contenha "comentário" no texto
          Array.from(document.querySelectorAll('*')).find(el => {
            const text = el.textContent?.toLowerCase() || '';
            return text.includes('comentário') && el.children.length > 0;
          });

        console.log('💬 [TOC DEBUG] Procurando seção de comentários...');
        console.log('💬 [TOC DEBUG] Seletores testados:', {
          'data-comments-section="true"': !!document.querySelector('[data-comments-section="true"]'),
          '#comments': !!document.querySelector('#comments'),
          '.comments-section': !!document.querySelector('.comments-section'),
          'data-comments-section': !!document.querySelector('[data-comments-section]')
        });

        if (commentsSection) {
          console.log('💬 [TOC DEBUG] Seção de comentários encontrada:', commentsSection);
          console.log('💬 [TOC DEBUG] Elemento encontrado:', {
            tagName: commentsSection.tagName,
            id: commentsSection.id,
            className: commentsSection.className,
            dataset: (commentsSection as HTMLElement).dataset
          });
          
          commentsObserver = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                const isIntersecting = entry.isIntersecting;
                const intersectionRatio = entry.intersectionRatio;
                console.log('💬 [TOC DEBUG] Comentários intersecting:', { 
                  isIntersecting, 
                  intersectionRatio,
                  boundingClientRect: entry.boundingClientRect,
                  rootBounds: entry.rootBounds
                });
                setIsAtComments(isIntersecting);
              });
            },
            {
              root: null,
              rootMargin: '-10% 0px -10% 0px', // Trigger quando 10% da seção estiver visível
              threshold: [0, 0.1, 0.25, 0.5] // Múltiplos thresholds para melhor detecção
            }
          );

          commentsObserver.observe(commentsSection);
        } else {
          console.log('💬 [TOC DEBUG] Seção de comentários não encontrada');
          console.log('💬 [TOC DEBUG] Elementos disponíveis no DOM:', {
            allElements: document.querySelectorAll('*').length,
            divsWithId: Array.from(document.querySelectorAll('div[id]')).map(el => el.id),
            sectionsWithClass: Array.from(document.querySelectorAll('section[class]')).map(el => el.className)
          });
        }
      }, 2000); // Aguardar 2 segundos para garantir que o lazy loading carregou
    };

    setupCommentsObserver();

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (commentsObserver) {
        commentsObserver.disconnect();
      }
    };
  }, [toc.length, isAtComments]);

  // Função para scroll suave para o heading - MÉTODO DIRETO E SIMPLES
  const handleScrollToHeading = (id: string) => {
    console.log('🎯 [TOC Component] Clique no TOC - ID:', id);
    
    // Fechar modal se estiver aberto (mobile)
    if (isModalOpen) {
      console.log('🎯 [TOC Component] Fechando modal...');
      setIsModalOpen(false);
    }
    
    // MÉTODO DIRETO - sem usar hook complicado
    const cleanId = id.startsWith('#') ? id.slice(1) : id;
    const element = document.getElementById(cleanId);
    
    console.log('🎯 [TOC Component] Elemento encontrado:', element);
    
    if (element) {
      console.log('🎯 [TOC Component] ✅ SCROLL DIRETO');
      
      // Método 1: scrollIntoView simples
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
      
      // Método 2: window.scrollTo como backup
      setTimeout(() => {
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset + rect.top - 100;
        window.scrollTo({ 
          top: scrollTop, 
          behavior: 'smooth' 
        });
      }, 100);
    } else {
      console.error('🎯 [TOC Component] ❌ Elemento não encontrado:', cleanId);
    }
  };

  // REMOVIDO - gerenciamento de scroll do body que pode interferir
  // useEffect(() => {
  //   if (isModalOpen && !isDesktop) {
  //     // Código removido para evitar conflitos de scroll
  //   }
  // }, [isModalOpen, isDesktop]);

  // Fechar modal ao clicar fora ou pressionar ESC
  useEffect(() => {
    if (!isModalOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsModalOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isModalOpen]);

  // Early return se não há itens
  if (!toc || toc.length === 0) {
    console.log('🚫 [TOC DEBUG] Não há itens no TOC, retornando null');
    return null;
  }

  console.log('✅ [TOC DEBUG] Renderizando TableOfContents com', toc.length, 'itens');

  return (
    <>
      {/* Botão flutuante para mobile/tablet - Melhorado para touch */}
      {!isDesktop && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsModalOpen(true);
          }}
          className={`fixed bottom-6 right-6 z-[9999] bg-neon-purple hover:bg-neon-purple/80 active:bg-neon-purple/90 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 backdrop-blur-sm touch-manipulation ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
          style={{
            // Área de toque otimizada para mobile (mínimo 44px recomendado)
            minWidth: '60px',
            minHeight: '60px',
            padding: '18px',
            WebkitTapHighlightColor: 'transparent',
            // Melhor feedback tátil
            touchAction: 'manipulation',
            userSelect: 'none'
          }}
          title="Índice do artigo"
          type="button"
          aria-label="Abrir índice do artigo"
        >
          <List className="h-6 w-6" />
        </button>
      )}

      {/* Modal para mobile/tablet - Posicionamento fixo melhorado */}
      {!isDesktop && isModalOpen && (
        <div 
          className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center"
          style={{
            // Garantir que o modal não afete o layout da página
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
        >
          {/* Backdrop com melhor suporte a touch */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsModalOpen(false)}
            style={{ touchAction: 'none' }}
          />
          
          {/* Modal Content - Otimizado para mobile */}
          <div 
            ref={modalRef}
            className="relative bg-darker-surface border border-futuristic-gray/20 w-full max-w-md max-h-[85vh] sm:max-h-[80vh] overflow-hidden shadow-2xl transition-all duration-300 sm:rounded-lg rounded-t-lg sm:m-4 mb-0"
            style={{
              // Melhor posicionamento para mobile
              marginBottom: '0',
              borderBottomLeftRadius: '0',
              borderBottomRightRadius: '0'
            }}
          >
            {/* Header com área de toque maior */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-futuristic-gray/20 bg-darker-surface/95 backdrop-blur-sm">
              <h3 className="font-orbitron font-semibold text-white text-lg">Índice</h3>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsModalOpen(false);
                }}
                className="text-futuristic-gray hover:text-white active:text-neon-purple transition-colors rounded-md hover:bg-futuristic-gray/10 active:bg-futuristic-gray/20 touch-manipulation"
                style={{
                  minWidth: '44px',
                  minHeight: '44px',
                  padding: '12px',
                  WebkitTapHighlightColor: 'transparent'
                }}
                type="button"
                aria-label="Fechar índice"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* TOC Items com scroll otimizado para touch */}
            <div 
              className="p-4 sm:p-6 max-h-[calc(85vh-80px)] sm:max-h-[calc(80vh-80px)] overflow-y-auto"
              style={{
                // Melhor scroll em dispositivos touch
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
            >
              {toc && toc.length > 0 ? (
                <nav>
                  <ul className="space-y-3">
                    {toc.map((item, index) => (
                      <li key={`${item.id}-${index}`}>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('🎯 [TOC MODAL CLICK DEBUG] Clicou no item:', item.id, item.text);
                            handleScrollToHeading(item.id);
                          }}
                          className={`w-full text-left rounded-lg transition-all duration-200 touch-manipulation ${
                            activeId === item.id
                              ? 'bg-neon-purple/20 text-neon-purple border-l-4 border-neon-purple shadow-sm'
                              : 'text-futuristic-gray hover:text-white hover:bg-futuristic-gray/10 active:bg-futuristic-gray/20'
                          }`}
                          style={{ 
                            paddingLeft: `${(item.level - 1) * 16 + 16}px`,
                            paddingRight: '16px',
                            paddingTop: '14px',
                            paddingBottom: '14px',
                            minHeight: '52px', // Área de toque otimizada (mínimo 44px + padding)
                            fontSize: '16px', // Tamanho de fonte adequado para mobile
                            lineHeight: '1.4',
                            WebkitTapHighlightColor: 'transparent',
                            touchAction: 'manipulation',
                            userSelect: 'none'
                          }}
                          type="button"
                          data-heading-id={item.id}
                          aria-label={`Ir para ${item.text}`}
                        >
                          {item.text}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              ) : (
                <p className="text-futuristic-gray text-center py-8 text-base">
                  Nenhum cabeçalho encontrado no artigo.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar para desktop - Mantido como estava */}
      {isDesktop && (
        <div 
          className={`fixed top-20 left-6 ${
            screenSize === 'large' ? 'w-80' : 
            screenSize === 'medium' ? 'w-64' : 'w-48'
          } max-h-[calc(100vh-120px)] z-[9998] bg-darker-surface/90 backdrop-blur-md border border-futuristic-gray/20 rounded-lg shadow-2xl transition-all duration-500 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8 pointer-events-none'
          }`}
        >
          <div className={`${
            screenSize === 'large' ? 'p-6' : 
            screenSize === 'medium' ? 'p-4' : 'p-3'
          }`}>
            <h3 className={`font-orbitron font-semibold text-white mb-4 flex items-center sticky top-0 bg-darker-surface/90 backdrop-blur-sm ${
              screenSize === 'large' ? '-mx-6 -mt-6 px-6 pt-6 pb-4' : 
              screenSize === 'medium' ? '-mx-4 -mt-4 px-4 pt-4 pb-3' : '-mx-3 -mt-3 px-3 pt-3 pb-2'
            } border-b border-futuristic-gray/10 ${
              screenSize === 'large' ? 'text-base' : 
              screenSize === 'medium' ? 'text-sm' : 'text-xs'
            }`}>
              <List className={`${
                screenSize === 'large' ? 'h-4 w-4' : 
                screenSize === 'medium' ? 'h-3 w-3' : 'h-3 w-3'
              } mr-2`} />
              Índice
            </h3>
            
            <div className="max-h-[calc(100vh-240px)] overflow-y-auto pr-2 -mr-2">
              {toc && toc.length > 0 ? (
                <nav>
                  <ul className="space-y-2">
                    {toc.map((item, index) => (
                      <li key={`${item.id}-${index}`}>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('🎯 [TOC CLICK DEBUG] Clicou no item:', item.id, item.text);
                            handleScrollToHeading(item.id);
                          }}
                          className={`w-full text-left ${
                            screenSize === 'large' ? 'px-3 py-2' : 
                            screenSize === 'medium' ? 'px-2 py-1.5' : 'px-2 py-1'
                          } rounded-lg transition-all duration-300 ${
                            screenSize === 'large' ? 'text-sm' : 
                            screenSize === 'medium' ? 'text-xs' : 'text-xs'
                          } ${
                            activeId === item.id
                              ? 'bg-neon-purple/20 text-neon-purple border-l-2 border-neon-purple shadow-sm'
                              : 'text-futuristic-gray hover:text-white hover:bg-futuristic-gray/10'
                          }`}
                          style={{ 
                            paddingLeft: `${(item.level - 1) * (screenSize === 'large' ? 12 : screenSize === 'medium' ? 8 : 6) + (screenSize === 'large' ? 12 : screenSize === 'medium' ? 8 : 6)}px` 
                          }}
                          type="button"
                        >
                          {item.text}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              ) : (
                <p className={`text-futuristic-gray text-center py-8 ${
                  screenSize === 'large' ? 'text-sm' : 
                  screenSize === 'medium' ? 'text-xs' : 'text-xs'
                }`}>
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