import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook que automaticamente faz scroll para o topo da página
 * sempre que a rota muda (navegação entre páginas)
 */
export const useScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    // Scroll instantâneo para o topo (melhor performance)
    window.scrollTo(0, 0);
  }, [location.pathname]); // Executa sempre que a rota muda
};