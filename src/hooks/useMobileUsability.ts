import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook para melhorar a usabilidade mobile
 * Adiciona funcionalidades touch otimizadas sem alterar o visual
 */
export const useMobileUsability = () => {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Detecta se é dispositivo touch
  const isTouchDevice = useCallback(() => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }, []);

  // Adiciona feedback visual para elementos touch
  const addTouchFeedback = useCallback((element: HTMLElement) => {
    if (!isTouchDevice()) return;

    element.classList.add('touch-feedback');
    
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
      
      // Adiciona classe de feedback ativo
      element.classList.add('touch-active');
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // Remove classe de feedback ativo
      element.classList.remove('touch-active');
      
      // Verifica se foi um tap rápido (não um scroll)
      if (touchStartRef.current) {
        const timeDiff = Date.now() - touchStartRef.current.time;
        if (timeDiff < 200) {
          // Adiciona ripple effect
          createRippleEffect(element, e.changedTouches[0]);
        }
      }
      
      touchStartRef.current = null;
    };

    const handleTouchCancel = () => {
      element.classList.remove('touch-active');
      touchStartRef.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [isTouchDevice]);

  // Cria efeito ripple para feedback visual
  const createRippleEffect = useCallback((element: HTMLElement, touch: Touch) => {
    const rect = element.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(59, 130, 246, 0.3);
      transform: scale(0);
      animation: ripple 0.3s ease-out;
      pointer-events: none;
      left: ${x - 10}px;
      top: ${y - 10}px;
      width: 20px;
      height: 20px;
      z-index: 1000;
    `;

    // Adiciona keyframes se não existir
    if (!document.querySelector('#ripple-keyframes')) {
      const style = document.createElement('style');
      style.id = 'ripple-keyframes';
      style.textContent = `
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    element.style.position = element.style.position || 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);

    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 300);
  }, []);

  // Otimiza áreas de toque para elementos pequenos
  const optimizeTouchTargets = useCallback(() => {
    if (!isTouchDevice()) return;

    const smallElements = document.querySelectorAll('button, a, [role="button"], input[type="checkbox"], input[type="radio"]');
    
    smallElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      const rect = htmlElement.getBoundingClientRect();
      
      // Se o elemento é menor que 44px, adiciona classe para otimização
      if (rect.width < 44 || rect.height < 44) {
        htmlElement.classList.add('touch-target');
      }
    });
  }, [isTouchDevice]);

  // Otimiza formulários para mobile
  const optimizeForms = useCallback(() => {
    if (!isTouchDevice()) return;

    const forms = document.querySelectorAll('form');
    
    forms.forEach((form) => {
      form.classList.add('mobile-form');
      
      // Otimiza inputs
      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach((input) => {
        const htmlInput = input as HTMLElement;
        htmlInput.classList.add('mobile-form-field');
        
        // Adiciona autocomplete apropriado
        if (input instanceof HTMLInputElement) {
          if (input.type === 'email' && !input.autocomplete) {
            input.autocomplete = 'email';
          }
          if (input.type === 'tel' && !input.autocomplete) {
            input.autocomplete = 'tel';
          }
          if (input.name?.includes('name') && !input.autocomplete) {
            input.autocomplete = 'name';
          }
        }
      });
    });
  }, [isTouchDevice]);

  // Adiciona suporte a gestos de swipe
  const addSwipeSupport = useCallback((element: HTMLElement, onSwipe?: (direction: 'left' | 'right' | 'up' | 'down') => void) => {
    if (!isTouchDevice() || !onSwipe) return;

    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      endX = touch.clientX;
      endY = touch.clientY;
    };

    const handleTouchEnd = () => {
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const minSwipeDistance = 50;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Swipe horizontal
        if (Math.abs(deltaX) > minSwipeDistance) {
          onSwipe(deltaX > 0 ? 'right' : 'left');
        }
      } else {
        // Swipe vertical
        if (Math.abs(deltaY) > minSwipeDistance) {
          onSwipe(deltaY > 0 ? 'down' : 'up');
        }
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isTouchDevice]);

  // Previne zoom acidental em inputs
  const preventAccidentalZoom = useCallback(() => {
    if (!isTouchDevice()) return;

    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach((input) => {
      const htmlInput = input as HTMLInputElement;
      if (htmlInput.style.fontSize === '' || parseFloat(htmlInput.style.fontSize) < 16) {
        htmlInput.style.fontSize = '16px';
      }
    });
  }, [isTouchDevice]);

  // Inicializa otimizações mobile
  useEffect(() => {
    if (!isTouchDevice()) return;

    // Aplica otimizações iniciais
    optimizeTouchTargets();
    optimizeForms();
    preventAccidentalZoom();

    // Observer para novos elementos
    const observer = new MutationObserver(() => {
      optimizeTouchTargets();
      optimizeForms();
      preventAccidentalZoom();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      observer.disconnect();
    };
  }, [optimizeTouchTargets, optimizeForms, preventAccidentalZoom, isTouchDevice]);

  return {
    isTouchDevice: isTouchDevice(),
    addTouchFeedback,
    addSwipeSupport,
    createRippleEffect,
    optimizeTouchTargets,
    optimizeForms
  };
};