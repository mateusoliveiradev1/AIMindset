import { useCallback, useRef } from 'react';

interface TouchFeedbackOptions {
  type?: 'primary' | 'secondary' | 'card' | 'link' | 'nav' | 'form';
  disabled?: boolean;
  hapticFeedback?: boolean;
  rippleColor?: string;
}

export const useTouchFeedback = (options: TouchFeedbackOptions = {}) => {
  const {
    type = 'primary',
    disabled = false,
    hapticFeedback = true,
    rippleColor
  } = options;

  const elementRef = useRef<HTMLElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);

  // Função para trigger do feedback tátil (iOS)
  const triggerHapticFeedback = useCallback(() => {
    if (!hapticFeedback || disabled) return;
    
    // Tentar usar a API de vibração se disponível
    if ('vibrate' in navigator) {
      navigator.vibrate(10); // Vibração curta de 10ms
    }
    
    // Para iOS, usar a API de feedback tátil se disponível
    if ('Taptic' in window) {
      // @ts-ignore - API específica do iOS
      window.Taptic.impact('light');
    }
  }, [hapticFeedback, disabled]);

  // Criar efeito ripple programaticamente
  const createRipple = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    if (disabled || !elementRef.current) return;

    const element = elementRef.current;
    const rect = element.getBoundingClientRect();
    
    // Calcular posição do toque
    let x, y;
    if ('touches' in event && event.touches.length > 0) {
      x = event.touches[0].clientX - rect.left;
      y = event.touches[0].clientY - rect.top;
    } else {
      x = (event as React.MouseEvent).clientX - rect.left;
      y = (event as React.MouseEvent).clientY - rect.top;
    }

    // Remover ripple anterior se existir
    const existingRipple = element.querySelector('.ripple-effect');
    if (existingRipple) {
      existingRipple.remove();
    }

    // Criar novo elemento ripple
    const ripple = document.createElement('div');
    ripple.className = 'ripple-effect';
    
    // Calcular tamanho do ripple
    const size = Math.max(rect.width, rect.height) * 2;
    
    // Aplicar estilos
    Object.assign(ripple.style, {
      position: 'absolute',
      left: `${x - size / 2}px`,
      top: `${y - size / 2}px`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      background: rippleColor || getRippleColor(type),
      transform: 'scale(0)',
      opacity: '0.6',
      pointerEvents: 'none',
      zIndex: '1',
      transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
    });

    element.appendChild(ripple);

    // Animar ripple
    requestAnimationFrame(() => {
      ripple.style.transform = 'scale(1)';
      ripple.style.opacity = '0';
    });

    // Remover ripple após animação
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 300);

    // Trigger feedback tátil
    triggerHapticFeedback();
  }, [disabled, type, rippleColor, triggerHapticFeedback]);

  // Obter cor do ripple baseada no tipo
  const getRippleColor = (type: string): string => {
    switch (type) {
      case 'primary':
        return 'rgba(0, 255, 127, 0.4)'; // lime-green
      case 'secondary':
        return 'rgba(147, 51, 234, 0.4)'; // neon-purple
      case 'card':
        return 'rgba(255, 255, 255, 0.2)';
      case 'link':
        return 'rgba(0, 255, 127, 0.3)';
      case 'nav':
        return 'rgba(255, 255, 255, 0.15)';
      case 'form':
        return 'rgba(147, 51, 234, 0.3)';
      default:
        return 'rgba(255, 255, 255, 0.3)';
    }
  };

  // Handlers de eventos otimizados
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (disabled) return;
    createRipple(event);
  }, [createRipple, disabled]);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (disabled) return;
    // Só criar ripple no mouse se não for um dispositivo touch
    if (!('ontouchstart' in window)) {
      createRipple(event);
    }
  }, [createRipple, disabled]);

  // Props para aplicar ao elemento
  const touchFeedbackProps = {
    ref: elementRef,
    onTouchStart: handleTouchStart,
    onMouseDown: handleMouseDown,
    className: `touch-feedback ${type ? `btn-${type}` : ''} ${disabled ? 'disabled' : ''}`,
    style: {
      position: 'relative' as const,
      overflow: 'hidden' as const,
      transform: 'translateZ(0)', // Force hardware acceleration
      WebkitTapHighlightColor: 'transparent', // Remove default iOS highlight
      touchAction: 'manipulation' as const, // Prevent double-tap zoom
    }
  };

  return {
    touchFeedbackProps,
    createRipple,
    triggerHapticFeedback
  };
};