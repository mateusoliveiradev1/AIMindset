import React, { useState, useEffect, useCallback } from 'react';
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

  // Detectar tamanho da tela
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
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

  // Early return se não há itens - COM VERIFICAÇÃO DE SEGURANÇA
  if (!toc || !Array.isArray(toc) || toc.length === 0) {
    return null;
  }

  return (
    <>
      {/* Botão flutuante para mobile/tablet - POSIÇÃO FIXA ABSOLUTA */}
      {!isDesktop && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-6 right-6 z-[9999] bg-neon-purple hover:bg-neon-purple/80 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 backdrop-blur-sm"
          title="Índice do artigo"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999
          }}
        >
          <List className="h-5 w-5" />
        </button>
      )}

      {/* Modal para mobile/tablet - POSIÇÃO FIXA ABSOLUTA */}
      {!isDesktop && isModalOpen && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10000
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
                onClick={() => setIsModalOpen(false)}
                className="text-futuristic-gray hover:text-white transition-colors p-1 rounded-md hover:bg-futuristic-gray/10"
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
                          onClick={() => {
                            scrollToHeading(item.id);
                            setIsModalOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-300 ${
                            activeId === item.id
                              ? 'bg-neon-purple/20 text-neon-purple border-l-2 border-neon-purple'
                              : 'text-futuristic-gray hover:text-white hover:bg-futuristic-gray/10'
                          }`}
                          style={{ paddingLeft: `${(item.level - 1) * 12 + 12}px` }}
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

      {/* Sidebar FIXA para desktop - EFEITO PARALLAX REAL */}
      {isDesktop && (
        <div 
          className="fixed top-20 left-6 w-80 max-h-[calc(100vh-120px)] z-[9998] bg-darker-surface/90 backdrop-blur-md border border-futuristic-gray/20 rounded-lg shadow-2xl"
          style={{
            position: 'fixed',
            top: '80px',
            left: '24px',
            width: '320px',
            maxHeight: 'calc(100vh - 120px)',
            zIndex: 9998
          }}
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
                          onClick={() => scrollToHeading(item.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-300 text-sm ${
                            activeId === item.id
                              ? 'bg-neon-purple/20 text-neon-purple border-l-2 border-neon-purple shadow-sm'
                              : 'text-futuristic-gray hover:text-white hover:bg-futuristic-gray/10'
                          }`}
                          style={{ paddingLeft: `${(item.level - 1) * 12 + 12}px` }}
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