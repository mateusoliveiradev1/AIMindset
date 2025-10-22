import React, { useState, useEffect, useCallback } from 'react';
import { useTableOfContents } from '../hooks/useTableOfContents';
import { List, X } from 'lucide-react';

interface TableOfContentsProps {
  content: string;
  className?: string;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ 
  content, 
  className = '' 
}) => {
  const { toc, activeId } = useTableOfContents('[data-article-content]');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  // ✅ TODOS OS HOOKS NO TOPO - ANTES DE QUALQUER RETURN CONDICIONAL

  // Função para scroll com fechamento automático
  const scrollToHeading = useCallback((id: string) => {
    console.log(`🎯 Clicando no item: ${id}`);
    
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
      
      // FECHAMENTO AUTOMÁTICO para mobile e tablet
      if (screenSize === 'mobile' || screenSize === 'tablet') {
        console.log('✅ Fechando modal automaticamente após clique');
        setIsModalOpen(false);
      }
    }
  }, [screenSize]);

  // Função para abrir/fechar modal com logs
  const toggleModal = useCallback(() => {
    const newState = !isModalOpen;
    console.log(`🔄 Toggle modal: ${isModalOpen} → ${newState}`);
    setIsModalOpen(newState);
  }, [isModalOpen]);

  // Detectar tamanho da tela - SIMPLIFICADO
  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      console.log(`📱 Resolução detectada: ${width}x${height}`);
      
      if (width < 768) {
        setScreenSize('mobile');
        console.log('📱 Modo: MOBILE - Botão flutuante');
      } else if (width >= 768 && width < 1024) {
        setScreenSize('tablet');
        console.log('📱 Modo: TABLET - Botão flutuante (igual mobile)');
      } else {
        setScreenSize('desktop');
        console.log('📱 Modo: DESKTOP - Sidebar');
      }
      
      // Debug específico para resolução problemática
      if (width === 838 && height === 830) {
        console.log('🚨 RESOLUÇÃO PROBLEMÁTICA DETECTADA: 838x830');
        console.log('🔧 Forçando reset do estado do modal...');
        setIsModalOpen(false); // Reset forçado
      }
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  // Debug logs do estado
  useEffect(() => {
    console.log(`🔍 ESTADO: screenSize=${screenSize}, isModalOpen=${isModalOpen}`);
    console.log(`🔍 TOC ITEMS: ${toc.length} itens`);
  }, [screenSize, isModalOpen, toc]);

  // Reset do estado quando muda o tamanho da tela
  useEffect(() => {
    setIsModalOpen(false);
    console.log('🔄 Reset do modal ao mudar tamanho da tela');
  }, [screenSize]);

  // ✅ EARLY RETURN APÓS TODOS OS HOOKS
  if (toc.length === 0) {
    console.warn('❌ Nenhum item no TOC encontrado');
    return null;
  }

  // Renderizar TOC Items - SIMPLIFICADO
  const renderTOCItems = () => {
    return (
      <ul className="space-y-1">
        {toc.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => scrollToHeading(item.id)}
              className={`
                w-full text-left rounded-lg transition-all duration-200 tablet-touch-target
                hover:bg-lime-400/15 hover:text-lime-400 active:bg-lime-400/25
                ${activeId === item.id 
                  ? 'bg-lime-400/25 text-lime-400 border-l-4 border-lime-400 shadow-sm' 
                  : 'text-gray-300 hover:text-lime-400'
                }
                ${item.level === 1 ? 'font-semibold text-base' : 'font-medium text-sm'}
                px-4 py-3
              `}
              style={{
                paddingLeft: `${(item.level - 1) * 20 + 16}px`
              }}
            >
              <span className="block" title={item.text}>
                {item.text}
              </span>
            </button>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <>
      {/* Mobile & Tablet (< 1024px) - BOTÃO FLUTUANTE UNIVERSAL */}
      {(screenSize === 'mobile' || screenSize === 'tablet') && (
        <div>
          {/* Floating Button - SEMPRE VISÍVEL E FUNCIONAL */}
          <button
            onClick={toggleModal}
            className={`
              fixed bottom-6 right-6 z-50 
              ${screenSize === 'mobile' ? 'w-14 h-14' : 'w-16 h-16'}
              bg-lime-400 hover:bg-lime-500 text-black rounded-full 
              shadow-lg hover:shadow-xl transition-all duration-300 
              flex items-center justify-center group
              ${isModalOpen ? 'bg-lime-500 scale-110' : ''}
            `}
            aria-label={isModalOpen ? 'Fechar índice' : 'Abrir índice'}
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              zIndex: 9999
            }}
          >
            {isModalOpen ? (
              <X className={`${screenSize === 'mobile' ? 'w-6 h-6' : 'w-7 h-7'} transition-transform`} />
            ) : (
              <List className={`${screenSize === 'mobile' ? 'w-6 h-6' : 'w-7 h-7'} group-hover:scale-110 transition-transform`} />
            )}
          </button>

          {/* Modal Universal - Mobile e Tablet */}
          {isModalOpen && (
            <div 
              className="fixed inset-0 z-40 flex items-center justify-center"
              style={{
                position: 'fixed',
                top: '0px',
                left: '0px',
                right: '0px',
                bottom: '0px',
                zIndex: 9998
              }}
            >
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={toggleModal}
              />
              
              {/* Modal Content */}
              <div className={`
                relative mx-4 bg-gray-900/95 backdrop-blur-sm border border-lime-400/20 
                rounded-2xl shadow-2xl animate-slide-up
                ${screenSize === 'mobile' 
                  ? 'w-full max-w-md max-h-[80vh]' 
                  : 'w-full max-w-lg max-h-[85vh]'
                }
              `}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-lime-400/20">
                  <h3 className={`font-semibold text-lime-400 flex items-center gap-3 ${
                    screenSize === 'mobile' ? 'text-lg' : 'text-xl'
                  }`}>
                    <List className={screenSize === 'mobile' ? 'w-5 h-5' : 'w-6 h-6'} />
                    Índice do Artigo
                  </h3>
                  <button
                    onClick={toggleModal}
                    className="p-2 text-gray-400 hover:text-lime-400 transition-colors rounded-full hover:bg-lime-400/10"
                    aria-label="Fechar índice"
                  >
                    <X className={screenSize === 'mobile' ? 'w-5 h-5' : 'w-6 h-6'} />
                  </button>
                </div>

                {/* TOC Items */}
                <nav className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-lime-400/20 scrollbar-track-gray-800/20">
                  {renderTOCItems()}
                </nav>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Desktop (≥ 1024px) - Sidebar Tradicional */}
      {screenSize === 'desktop' && (
        <div className={`sticky top-8 ${className}`}>
          <div className="bg-gray-900/50 backdrop-blur-sm border border-lime-400/20 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-lime-400 mb-4 flex items-center gap-2">
              <List className="w-5 h-5" />
              Índice do Artigo
            </h3>
            <nav className="max-h-96 overflow-y-auto">
              {renderTOCItems()}
            </nav>
          </div>
        </div>
      )}
    </>
  );
};