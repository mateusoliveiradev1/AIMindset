import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Stats {
  totalArticles: number;
  totalUsers: number;
  totalCountries: number;
  totalViews: number;
  loading: boolean;
  error: string | null;
}

export const useStats = () => {
  const [stats, setStats] = useState<Stats>({
    totalArticles: 0,
    totalUsers: 0,
    totalCountries: 1, // Apenas Brasil por enquanto
    totalViews: 0,
    loading: true,
    error: null
  });

  const fetchStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));

      // Usar Promise.allSettled para evitar que um erro pare todas as requisições
      const [articlesResult, usersResult] = await Promise.allSettled([
        supabase
          .from('articles')
          .select('*', { count: 'exact', head: true })
          .eq('published', true),
        supabase
          .from('newsletter_subscriptions')
          .select('*', { count: 'exact', head: true })
      ]);

      let articlesCount = 0;
      let usersCount = 0;

      // Processar resultado dos artigos
      if (articlesResult.status === 'fulfilled' && !articlesResult.value.error) {
        articlesCount = articlesResult.value.count || 0;
      } else {
        console.warn('Erro ao buscar artigos:', articlesResult.status === 'fulfilled' ? articlesResult.value.error : articlesResult.reason);
      }

      // Processar resultado dos usuários
      if (usersResult.status === 'fulfilled' && !usersResult.value.error) {
        usersCount = usersResult.value.count || 0;
      } else {
        console.warn('Erro ao buscar usuários:', usersResult.status === 'fulfilled' ? usersResult.value.error : usersResult.reason);
      }

      // Calcular visualizações baseado nos artigos (simulado por enquanto)
      const totalViews = articlesCount * 50; // Estimativa de 50 views por artigo

      setStats({
        totalArticles: articlesCount,
        totalUsers: usersCount,
        totalCountries: 1, // Apenas Brasil
        totalViews,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
    }
  };

  useEffect(() => {
    // Buscar estatísticas na inicialização com um pequeno delay para evitar requisições simultâneas
    const timer = setTimeout(() => {
      fetchStats();
    }, 100);

    // Atualizar automaticamente a cada 5 minutos (reduzido para evitar muitas requisições)
    const interval = setInterval(fetchStats, 5 * 60 * 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  return { ...stats, refetch: fetchStats };
};