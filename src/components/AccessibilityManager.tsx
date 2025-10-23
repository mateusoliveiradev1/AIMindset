import React, { useEffect, useCallback, useState } from 'react';

interface AccessibilityManagerProps {
  children: React.ReactNode;
  enableAutoAria?: boolean;
  enableKeyboardNavigation?: boolean;
  enableScreenReaderOptimizations?: boolean;
  enableFocusManagement?: boolean;
  announcePageChanges?: boolean;
}

interface AriaAttributes {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  'aria-live'?: 'polite' | 'assertive' | 'off';
  'aria-atomic'?: boolean;
  'aria-relevant'?: string;
  role?: string;
}

// Hook para gerenciamento automático de ARIA
export const useAutoAria = () => {
  const generateAriaLabel = useCallback((element: HTMLElement): string => {
    // Prioridade: aria-label existente > texto visível > placeholder > title > tipo do elemento
    const existingLabel = element.getAttribute('aria-label');
    if (existingLabel) return existingLabel;

    const textContent = element.textContent?.trim();
    if (textContent && textContent.length > 0) return textContent;

    const placeholder = element.getAttribute('placeholder');
    if (placeholder) return placeholder;

    const title = element.getAttribute('title');
    if (title) return title;

    const tagName = element.tagName.toLowerCase();
    const type = element.getAttribute('type');

    // Labels baseados no tipo de elemento
    switch (tagName) {
      case 'button':
        return type === 'submit' ? 'Enviar formulário' : 'Botão';
      case 'input':
        switch (type) {
          case 'email': return 'Campo de email';
          case 'password': return 'Campo de senha';
          case 'search': return 'Campo de busca';
          case 'tel': return 'Campo de telefone';
          case 'url': return 'Campo de URL';
          case 'number': return 'Campo numérico';
          case 'date': return 'Campo de data';
          case 'time': return 'Campo de hora';
          case 'checkbox': return 'Caixa de seleção';
          case 'radio': return 'Botão de opção';
          case 'file': return 'Seletor de arquivo';
          case 'range': return 'Controle deslizante';
          case 'color': return 'Seletor de cor';
          default: return 'Campo de texto';
        }
      case 'textarea': return 'Área de texto';
      case 'select': return 'Lista de seleção';
      case 'a': return 'Link';
      case 'img': return 'Imagem';
      case 'video': return 'Vídeo';
      case 'audio': return 'Áudio';
      case 'nav': return 'Navegação';
      case 'main': return 'Conteúdo principal';
      case 'aside': return 'Conteúdo complementar';
      case 'footer': return 'Rodapé';
      case 'header': return 'Cabeçalho';
      case 'section': return 'Seção';
      case 'article': return 'Artigo';
      default: return 'Elemento interativo';
    }
  }, []);

  const applyAutoAria = useCallback((container: HTMLElement = document.body) => {
    // Elementos que precisam de aria-label
    const interactiveElements = container.querySelectorAll(`
      button:not([aria-label]),
      a:not([aria-label]),
      input:not([aria-label]),
      textarea:not([aria-label]),
      select:not([aria-label]),
      [role="button"]:not([aria-label]),
      [role="link"]:not([aria-label]),
      [tabindex]:not([aria-label])
    `);

    interactiveElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      const ariaLabel = generateAriaLabel(htmlElement);
      if (ariaLabel) {
        htmlElement.setAttribute('aria-label', ariaLabel);
      }
    });

    // Aplicar roles semânticos automáticos
    applySemanticRoles(container);
    
    // Aplicar landmarks automáticos
    applyLandmarks(container);
    
    // Aplicar live regions
    applyLiveRegions(container);

  }, [generateAriaLabel]);

  return { applyAutoAria, generateAriaLabel };
};

// Função para aplicar roles semânticos
const applySemanticRoles = (container: HTMLElement) => {
  // Botões que não são <button>
  const buttonLikeElements = container.querySelectorAll(`
    div[onclick]:not([role]),
    span[onclick]:not([role]),
    .btn:not([role]),
    .button:not([role])
  `);
  buttonLikeElements.forEach(el => el.setAttribute('role', 'button'));

  // Links que não são <a>
  const linkLikeElements = container.querySelectorAll(`
    div[data-href]:not([role]),
    span[data-href]:not([role]),
    .link:not([role])
  `);
  linkLikeElements.forEach(el => el.setAttribute('role', 'link'));

  // Listas que não são <ul>, <ol>
  const listLikeElements = container.querySelectorAll(`
    .list:not([role]),
    .menu:not([role]),
    .dropdown-menu:not([role])
  `);
  listLikeElements.forEach(el => el.setAttribute('role', 'list'));

  // Itens de lista
  const listItemElements = container.querySelectorAll(`
    .list-item:not([role]),
    .menu-item:not([role])
  `);
  listItemElements.forEach(el => el.setAttribute('role', 'listitem'));

  // Tabs
  const tabElements = container.querySelectorAll('.tab:not([role])');
  tabElements.forEach(el => el.setAttribute('role', 'tab'));

  const tabPanelElements = container.querySelectorAll('.tab-panel:not([role])');
  tabPanelElements.forEach(el => el.setAttribute('role', 'tabpanel'));

  // Modals/Dialogs
  const modalElements = container.querySelectorAll(`
    .modal:not([role]),
    .dialog:not([role]),
    .popup:not([role])
  `);
  modalElements.forEach(el => el.setAttribute('role', 'dialog'));

  // Alertas
  const alertElements = container.querySelectorAll(`
    .alert:not([role]),
    .notification:not([role]),
    .toast:not([role])
  `);
  alertElements.forEach(el => el.setAttribute('role', 'alert'));
};

// Função para aplicar landmarks
const applyLandmarks = (container: HTMLElement) => {
  // Navigation
  const navElements = container.querySelectorAll(`
    .navigation:not([role]):not(nav),
    .nav:not([role]):not(nav),
    .menu-main:not([role]):not(nav)
  `);
  navElements.forEach(el => el.setAttribute('role', 'navigation'));

  // Main content
  const mainElements = container.querySelectorAll(`
    .main-content:not([role]):not(main),
    .content:not([role]):not(main),
    #main:not([role]):not(main)
  `);
  mainElements.forEach(el => el.setAttribute('role', 'main'));

  // Complementary content
  const asideElements = container.querySelectorAll(`
    .sidebar:not([role]):not(aside),
    .complementary:not([role]):not(aside)
  `);
  asideElements.forEach(el => el.setAttribute('role', 'complementary'));

  // Banner/Header
  const headerElements = container.querySelectorAll(`
    .site-header:not([role]):not(header),
    .page-header:not([role]):not(header)
  `);
  headerElements.forEach(el => el.setAttribute('role', 'banner'));

  // Content info/Footer
  const footerElements = container.querySelectorAll(`
    .site-footer:not([role]):not(footer),
    .page-footer:not([role]):not(footer)
  `);
  footerElements.forEach(el => el.setAttribute('role', 'contentinfo'));

  // Search
  const searchElements = container.querySelectorAll(`
    .search:not([role]),
    .search-form:not([role]),
    form[action*="search"]:not([role])
  `);
  searchElements.forEach(el => el.setAttribute('role', 'search'));
};

// Função para aplicar live regions
const applyLiveRegions = (container: HTMLElement) => {
  // Status messages
  const statusElements = container.querySelectorAll(`
    .status:not([aria-live]),
    .message:not([aria-live]),
    .feedback:not([aria-live])
  `);
  statusElements.forEach(el => {
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
  });

  // Error messages
  const errorElements = container.querySelectorAll(`
    .error:not([aria-live]),
    .alert-error:not([aria-live]),
    .validation-error:not([aria-live])
  `);
  errorElements.forEach(el => {
    el.setAttribute('aria-live', 'assertive');
    el.setAttribute('aria-atomic', 'true');
  });

  // Loading states
  const loadingElements = container.querySelectorAll(`
    .loading:not([aria-live]),
    .spinner:not([aria-live]),
    .progress:not([aria-live])
  `);
  loadingElements.forEach(el => {
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-label', 'Carregando...');
  });
};

// Hook para navegação por teclado
export const useKeyboardNavigation = () => {
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { key, target, ctrlKey, altKey, shiftKey } = event;
    const element = target as HTMLElement;

    // Navegação por Tab melhorada
    if (key === 'Tab') {
      // Implementar skip links automáticos
      if (!shiftKey && document.activeElement === document.body) {
        const firstFocusable = document.querySelector(`
          a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])
        `) as HTMLElement;
        
        if (firstFocusable) {
          event.preventDefault();
          firstFocusable.focus();
        }
      }
    }

    // Navegação por setas em listas e menus
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      const role = element.getAttribute('role');
      const parent = element.closest('[role="list"], [role="menu"], [role="tablist"], [role="radiogroup"]');
      
      if (parent) {
        event.preventDefault();
        navigateWithArrows(key, element, parent as HTMLElement);
      }
    }

    // Escape para fechar modais/menus
    if (key === 'Escape') {
      const modal = document.querySelector('[role="dialog"][aria-hidden="false"]') as HTMLElement;
      const menu = document.querySelector('[role="menu"][aria-expanded="true"]') as HTMLElement;
      
      if (modal) {
        closeModal(modal);
      } else if (menu) {
        closeMenu(menu);
      }
    }

    // Enter/Space para ativar elementos
    if (key === 'Enter' || key === ' ') {
      if (element.getAttribute('role') === 'button' && element.tagName !== 'BUTTON') {
        event.preventDefault();
        element.click();
      }
    }

    // Atalhos de teclado personalizados
    if (ctrlKey || altKey) {
      handleCustomShortcuts(event);
    }

  }, []);

  const navigateWithArrows = (key: string, current: HTMLElement, container: HTMLElement) => {
    const items = Array.from(container.querySelectorAll(`
      [role="listitem"], [role="menuitem"], [role="tab"], [role="radio"], 
      a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])
    `)) as HTMLElement[];
    
    const currentIndex = items.indexOf(current);
    let nextIndex = currentIndex;

    switch (key) {
      case 'ArrowDown':
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % items.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        nextIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        break;
    }

    if (nextIndex !== currentIndex && items[nextIndex]) {
      items[nextIndex].focus();
    }
  };

  const closeModal = (modal: HTMLElement) => {
    modal.setAttribute('aria-hidden', 'true');
    const closeButton = modal.querySelector('[data-close], .close, .modal-close') as HTMLElement;
    if (closeButton) {
      closeButton.click();
    }
  };

  const closeMenu = (menu: HTMLElement) => {
    menu.setAttribute('aria-expanded', 'false');
    const trigger = document.querySelector(`[aria-controls="${menu.id}"]`) as HTMLElement;
    if (trigger) {
      trigger.focus();
    }
  };

  const handleCustomShortcuts = (event: KeyboardEvent) => {
    const { key, ctrlKey, altKey } = event;

    // Ctrl+/ ou Alt+/ para mostrar atalhos
    if ((ctrlKey || altKey) && key === '/') {
      event.preventDefault();
      showKeyboardShortcuts();
    }

    // Alt+M para ir ao menu principal
    if (altKey && key === 'm') {
      event.preventDefault();
      const mainNav = document.querySelector('nav, [role="navigation"]') as HTMLElement;
      if (mainNav) {
        const firstLink = mainNav.querySelector('a, button') as HTMLElement;
        if (firstLink) firstLink.focus();
      }
    }

    // Alt+C para ir ao conteúdo principal
    if (altKey && key === 'c') {
      event.preventDefault();
      const main = document.querySelector('main, [role="main"]') as HTMLElement;
      if (main) {
        main.focus();
        main.scrollIntoView({ behavior: 'smooth' });
      }
    }

    // Alt+S para ir à busca
    if (altKey && key === 's') {
      event.preventDefault();
      const search = document.querySelector('input[type="search"], [role="search"] input') as HTMLElement;
      if (search) search.focus();
    }
  };

  const showKeyboardShortcuts = () => {
    // Implementar modal com atalhos de teclado
    console.log('Atalhos de teclado disponíveis');
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { focusedElement, setFocusedElement };
};

// Hook para anúncios de mudanças de página
export const usePageAnnouncements = () => {
  const [announcer, setAnnouncer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Criar elemento para anúncios
    const announcerElement = document.createElement('div');
    announcerElement.setAttribute('aria-live', 'assertive');
    announcerElement.setAttribute('aria-atomic', 'true');
    announcerElement.setAttribute('class', 'sr-only');
    announcerElement.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;
    
    document.body.appendChild(announcerElement);
    setAnnouncer(announcerElement);

    return () => {
      if (announcerElement.parentNode) {
        announcerElement.parentNode.removeChild(announcerElement);
      }
    };
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announcer) {
      announcer.setAttribute('aria-live', priority);
      announcer.textContent = message;
      
      // Limpar após 1 segundo para permitir novos anúncios
      setTimeout(() => {
        if (announcer) {
          announcer.textContent = '';
        }
      }, 1000);
    }
  }, [announcer]);

  const announcePageChange = useCallback((pageTitle: string) => {
    announce(`Página carregada: ${pageTitle}`, 'polite');
  }, [announce]);

  const announceError = useCallback((error: string) => {
    announce(`Erro: ${error}`, 'assertive');
  }, [announce]);

  const announceSuccess = useCallback((message: string) => {
    announce(`Sucesso: ${message}`, 'polite');
  }, [announce]);

  return { announce, announcePageChange, announceError, announceSuccess };
};

// Componente principal de acessibilidade
export const AccessibilityManager: React.FC<AccessibilityManagerProps> = ({
  children,
  enableAutoAria = true,
  enableKeyboardNavigation = true,
  enableScreenReaderOptimizations = true,
  enableFocusManagement = true,
  announcePageChanges = true
}) => {
  const { applyAutoAria } = useAutoAria();
  const { focusedElement } = useKeyboardNavigation();
  const { announcePageChange } = usePageAnnouncements();

  useEffect(() => {
    if (enableAutoAria) {
      // Aplicar ARIA automático na montagem
      applyAutoAria();

      // Observar mudanças no DOM para aplicar ARIA em novos elementos
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                applyAutoAria(node as HTMLElement);
              }
            });
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      return () => observer.disconnect();
    }
  }, [enableAutoAria, applyAutoAria]);

  useEffect(() => {
    if (announcePageChanges) {
      // Anunciar mudanças de título da página
      const titleObserver = new MutationObserver(() => {
        announcePageChange(document.title);
      });

      titleObserver.observe(document.querySelector('title') || document.head, {
        childList: true,
        characterData: true
      });

      return () => titleObserver.disconnect();
    }
  }, [announcePageChanges, announcePageChange]);

  useEffect(() => {
    if (enableFocusManagement) {
      // Gerenciar foco em mudanças de rota
      const handleRouteChange = () => {
        const main = document.querySelector('main, [role="main"]') as HTMLElement;
        if (main) {
          main.setAttribute('tabindex', '-1');
          main.focus();
          main.removeAttribute('tabindex');
        }
      };

      // Escutar mudanças de URL (para SPAs)
      window.addEventListener('popstate', handleRouteChange);
      
      return () => window.removeEventListener('popstate', handleRouteChange);
    }
  }, [enableFocusManagement]);

  useEffect(() => {
    if (enableScreenReaderOptimizations) {
      // Adicionar estilos para screen readers
      const style = document.createElement('style');
      style.textContent = `
        .sr-only {
          position: absolute !important;
          width: 1px !important;
          height: 1px !important;
          padding: 0 !important;
          margin: -1px !important;
          overflow: hidden !important;
          clip: rect(0, 0, 0, 0) !important;
          white-space: nowrap !important;
          border: 0 !important;
        }
        
        .sr-only-focusable:focus {
          position: static !important;
          width: auto !important;
          height: auto !important;
          padding: inherit !important;
          margin: inherit !important;
          overflow: visible !important;
          clip: auto !important;
          white-space: inherit !important;
        }
        
        /* Melhorar indicadores de foco */
        *:focus {
          outline: 2px solid #007cba !important;
          outline-offset: 2px !important;
        }
        
        /* Skip links */
        .skip-link {
          position: absolute;
          top: -40px;
          left: 6px;
          background: #000;
          color: #fff;
          padding: 8px;
          text-decoration: none;
          z-index: 9999;
        }
        
        .skip-link:focus {
          top: 6px;
        }
      `;
      
      document.head.appendChild(style);

      return () => {
        if (style.parentNode) {
          style.parentNode.removeChild(style);
        }
      };
    }
  }, [enableScreenReaderOptimizations]);

  return <>{children}</>;
};

export default AccessibilityManager;