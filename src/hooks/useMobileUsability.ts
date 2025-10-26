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
  const addTouchFeedback = useCallback((element: HTMLElement, event?: TouchEvent | MouseEvent) => {
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

    // Se um evento foi passado, cria o ripple imediatamente
    if (event && 'touches' in event) {
      createRippleEffect(element, event.touches[0]);
    } else if (event && 'clientX' in event) {
      // Para eventos de mouse, simula um touch
      const fakeTouch = {
        clientX: event.clientX,
        clientY: event.clientY
      } as Touch;
      createRippleEffect(element, fakeTouch);
    }

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
      
      // Adiciona classe para prevenir zoom
      htmlInput.classList.add('prevent-zoom');
      
      // Garante que o font-size seja pelo menos 16px para prevenir zoom no iOS
      const computedStyle = window.getComputedStyle(htmlInput);
      const fontSize = parseFloat(computedStyle.fontSize);
      
      if (fontSize < 16) {
        htmlInput.style.fontSize = '16px';
      }
    });
  }, [isTouchDevice]);

  // Melhora a experiência de scroll
  const optimizeScrolling = useCallback(() => {
    if (!isTouchDevice()) return;

    // Adiciona momentum scrolling para iOS
    (document.body.style as any).webkitOverflowScrolling = 'touch';
    
    // Otimiza elementos scrolláveis
    const scrollableElements = document.querySelectorAll('[data-scrollable], .overflow-auto, .overflow-y-auto, .overflow-x-auto');
    scrollableElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      (htmlElement.style as any).webkitOverflowScrolling = 'touch';
      htmlElement.style.overscrollBehavior = 'contain';
    });
  }, [isTouchDevice]);

  // Inicializa otimizações mobile
  useEffect(() => {
    if (isTouchDevice()) {
      optimizeTouchTargets();
      optimizeForms();
      preventAccidentalZoom();
      optimizeScrolling();
      
      // Adiciona classes CSS globais para mobile
      document.body.classList.add('touch-device');
      
      // Adiciona estilos CSS se não existirem
      if (!document.querySelector('#mobile-usability-styles')) {
        const style = document.createElement('style');
        style.id = 'mobile-usability-styles';
        style.textContent = `
          .touch-target {
            min-height: 44px !important;
            min-width: 44px !important;
            padding: 8px !important;
          }
          
          .touch-feedback {
            position: relative;
            overflow: hidden;
            transition: all 0.2s ease;
          }
          
          .touch-active {
            transform: scale(0.98);
            opacity: 0.8;
          }
          
          .mobile-form-field {
            font-size: 16px !important;
          }
          
          .prevent-zoom {
            font-size: 16px !important;
          }
          
          .mobile-form {
            -webkit-tap-highlight-color: transparent;
          }
          
          .touch-device * {
            -webkit-tap-highlight-color: transparent;
          }
          
          @media (hover: none) and (pointer: coarse) {
            .hover\\:scale-105:hover {
              transform: scale(1.02) !important;
            }
            
            .hover\\:shadow-lg:hover {
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
            }
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, [isTouchDevice, optimizeTouchTargets, optimizeForms, preventAccidentalZoom, optimizeScrolling]);

  return {
    isTouchDevice: isTouchDevice(),
    addTouchFeedback,
    addSwipeSupport,
    optimizeTouchTargets,
    optimizeForms,
    preventAccidentalZoom,
    optimizeScrolling
  };
};