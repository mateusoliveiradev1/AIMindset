import { useState, useCallback, useRef, useEffect } from 'react';

interface MicroInteractionConfig {
  duration?: number;
  delay?: number;
  easing?: string;
}

interface TooltipConfig {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

/**
 * Hook para microinterações e feedback visual
 * Mantém o design atual mas adiciona sutis melhorias de UX
 */
export const useMicroInteractions = () => {
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [clickedElement, setClickedElement] = useState<string | null>(null);
  const [savedStates, setSavedStates] = useState<Set<string>>(new Set());
  
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Adiciona efeito hover sutil
   */
  const useHover = (elementId: string, config: MicroInteractionConfig = {}) => {
    const { duration = 200, delay = 0 } = config;

    const handleMouseEnter = useCallback(() => {
      if (delay > 0) {
        hoverTimeoutRef.current = setTimeout(() => {
          setHoveredElement(elementId);
        }, delay);
      } else {
        setHoveredElement(elementId);
      }
    }, [elementId, delay]);

    const handleMouseLeave = useCallback(() => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      setHoveredElement(null);
    }, []);

    return {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      'data-hover': hoveredElement === elementId ? 'active' : undefined,
      className: hoveredElement === elementId ? 'micro-hover-active' : ''
    };
  };

  /**
   * Adiciona efeito click sutil
   */
  const useClick = (elementId: string, config: MicroInteractionConfig = {}) => {
    const { duration = 150 } = config;

    const handleClick = useCallback(() => {
      setClickedElement(elementId);
      
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      
      clickTimeoutRef.current = setTimeout(() => {
        setClickedElement(null);
      }, duration);
    }, [elementId, duration]);

    return {
      onClick: handleClick,
      'data-click': clickedElement === elementId ? 'active' : undefined,
      className: clickedElement === elementId ? 'micro-click-active' : ''
    };
  };

  /**
   * Adiciona estado de "salvo com sucesso"
   */
  const useSaveFeedback = (elementId: string) => {
    const showSaved = useCallback(() => {
      setSavedStates(prev => new Set(prev).add(elementId));
      
      setTimeout(() => {
        setSavedStates(prev => {
          const next = new Set(prev);
          next.delete(elementId);
          return next;
        });
      }, 2000);
    }, [elementId]);

    return {
      showSaved,
      isSaved: savedStates.has(elementId),
      'data-saved': savedStates.has(elementId) ? 'true' : 'false',
      className: savedStates.has(elementId) ? 'micro-saved-active' : ''
    };
  };

  /**
   * Adiciona tooltip acessível
   */
  const useTooltip = (config: TooltipConfig) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { content, position = 'top', delay = 500 } = config;

    const handleMouseEnter = useCallback(() => {
      tooltipTimeoutRef.current = setTimeout(() => {
        setShowTooltip(true);
      }, delay);
    }, [delay]);

    const handleMouseLeave = useCallback(() => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      setShowTooltip(false);
    }, []);

    const positionClasses = {
      top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 -translate-y-1/2 ml-2'
    };

    return {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      'aria-label': content,
      'data-tooltip': content,
      'data-tooltip-visible': showTooltip ? 'true' : 'false',
      className: 'micro-tooltip-container'
    };
  };

  /**
   * Adiciona feedback visual para loading states
   */
  const useLoadingFeedback = (isLoading: boolean, duration = 300) => {
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
      if (isLoading) {
        setIsTransitioning(true);
      } else {
        const timeout = setTimeout(() => {
          setIsTransitioning(false);
        }, duration);
        return () => clearTimeout(timeout);
      }
    }, [isLoading, duration]);

    return {
      'data-loading': isLoading ? 'true' : 'false',
      'data-transitioning': isTransitioning ? 'true' : 'false',
      className: isLoading ? 'micro-loading-active' : ''
    };
  };

  /**
   * Adiciona efeito de pulsação sutil para elementos importantes
   */
  const usePulse = (elementId: string, active = true) => {
    return {
      'data-pulse': active ? 'active' : 'inactive',
      'data-pulse-id': elementId,
      className: active ? 'micro-pulse-active' : ''
    };
  };

  // Limpar timeouts ao desmontar
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  return {
    useHover,
    useClick,
    useSaveFeedback,
    useTooltip,
    useLoadingFeedback,
    usePulse
  };
};

/**
 * Componente para injetar estilos CSS das microinterações
 * Mantém o visual atual mas adiciona sutis melhorias
 */
export const MicroInteractionsStyles = () => (
  <style jsx global>{`
    /* Hover sutil em botões e cards */
    .micro-hover-active {
      transform: translateY(-1px);
      transition: transform 0.2s ease-out;
    }

    /* Click feedback sutil */
    .micro-click-active {
      transform: scale(0.98);
      transition: transform 0.15s ease-out;
    }

    /* Estado salvo com sucesso */
    .micro-saved-active {
      position: relative;
    }

    .micro-saved-active::after {
      content: '✓';
      position: absolute;
      top: -4px;
      right: -4px;
      background: #10b981;
      color: white;
      border-radius: 50%;
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: bold;
      animation: micro-saved-pulse 0.3s ease-out;
    }

    @keyframes micro-saved-pulse {
      0% {
        transform: scale(0);
        opacity: 0;
      }
      50% {
        transform: scale(1.2);
        opacity: 1;
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }

    /* Tooltip container */
    .micro-tooltip-container {
      position: relative;
    }

    /* Loading state sutil */
    .micro-loading-active {
      opacity: 0.7;
      pointer-events: none;
      transition: opacity 0.3s ease-out;
    }

    /* Pulse sutil para elementos importantes */
    .micro-pulse-active {
      animation: micro-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes micro-pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.8;
      }
    }

    /* Transições suaves para mudanças de estado */
    [data-loading="true"] {
      transition: opacity 0.3s ease-out;
    }

    [data-transitioning="true"] {
      transition: all 0.3s ease-out;
    }

    /* Focus visible para acessibilidade */
    .micro-focus-visible:focus-visible {
      outline: 2px solid #84cc16;
      outline-offset: 2px;
      border-radius: 4px;
    }
  `}</style>
);

/**
 * Hook para acessibilidade e navegação por teclado
 */
export const useKeyboardNavigation = () => {
  const [focusedElement, setFocusedElement] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Navegação por teclado para elementos interativos
      if (event.key === 'Enter' || event.key === ' ') {
        const target = event.target as HTMLElement;
        if (target.getAttribute('role') === 'button' || 
            target.tagName === 'BUTTON' || 
            target.tagName === 'A') {
          target.click();
        }
      }

      // Escape para fechar modais/dropdowns
      if (event.key === 'Escape') {
        const modals = document.querySelectorAll('[role="dialog"]');
        const dropdowns = document.querySelectorAll('[data-dropdown-open="true"]');
        
        modals.forEach(modal => {
          const closeButton = modal.querySelector('[data-close-modal]') as HTMLElement;
          if (closeButton) closeButton.click();
        });

        dropdowns.forEach(dropdown => {
          dropdown.setAttribute('data-dropdown-open', 'false');
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addKeyboardSupport = (elementId: string) => {
    return {
      tabIndex: 0,
      role: 'button',
      'aria-label': elementId,
      'data-keyboard-id': elementId,
      className: 'micro-focus-visible',
      onFocus: () => setFocusedElement(elementId),
      onBlur: () => setFocusedElement(null)
    };
  };

  return {
    focusedElement,
    addKeyboardSupport
  };
};