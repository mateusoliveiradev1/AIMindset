// Hook otimizado para Hero Section com cache TTL de 3 minutos
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { hybridCache, CacheKeys } from '@/utils/hybridCache';
import { logEvent } from '@/lib/logging';
import { usePerformanceAudit } from './usePerformanceAudit';
import { supabaseOptimizer } from '@/utils/supabaseOptimizer';
import type { Article } from '@/types';

// Cache TTL específico para Hero Section (3 minutos)
const HERO_SECTION_TTL = 3 * 60 * 1000; // 180000ms

export interface UseFeaturedArticlesReturn {
  featuredArticles: Article[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useFeaturedArticles = (): UseFeaturedArticlesReturn => {
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeaturedArticles = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      // Monitorar FCP e LCP específicos da Hero Section
      // auditHeroMetrics(); // Função removida temporariamente

      // Cache específico para Hero Section
      const cacheKey = CacheKeys.FEATURED_ARTICLES;
      
      if (!forceRefresh) {
        const cached = await hybridCache.get<Article[]>(cacheKey);
        if (cached.data) {
          console.log(`🟢 [Hero Section] Using cached featured articles from ${cached.source}`);
          setFeaturedArticles(cached.data);
          setLoading(false);
          
          // Log de performance
          logEvent('info', 'hero_section', 'cache_hit', {
            source: cached.source,
            articleCount: cached.data.length,
            ttl_remaining: HERO_SECTION_TTL
          });
          
          return;
        }
      }

      console.log('🔄 [Hero Section] Buscando artigos em destaque com query otimizada...');
      
      // Usar otimizador de queries para buscar artigos em destaque
      const { data, error: supabaseError, queryTime, fromCache } = await supabaseOptimizer.getFeaturedArticles(6);

      if (supabaseError) {
        throw supabaseError;
      }

      if (!data || data.length === 0) {
        console.log('⚠️ [Hero Section] No featured articles found');
        setFeaturedArticles([]);
        return;
      }

      // Cache com TTL específico de 3 minutos (acesso com contador)
      await hybridCache.set(CacheKeys.FEATURED_ARTICLES, data, { accessCount: 1 });

      console.log(`✅ [Hero Section] ${data.length} artigos em destaque carregados (${queryTime}ms)${fromCache ? ' [CACHE]' : ''}`);
      
      // Log de performance
      logEvent('info', 'hero_section', 'optimized_load', {
        articleCount: data.length,
        queryTime: Math.round(queryTime),
        fromCache,
        timestamp: new Date().toISOString()
      });
      setFeaturedArticles(data);

      // Log de performance
      logEvent('info', 'hero_section', 'articles_loaded', {
        articleCount: data.length,
        cacheTtl: HERO_SECTION_TTL
      });

    } catch (err) {
      console.error('❌ [Hero Section] Error fetching featured articles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch featured articles');
      
      logEvent('error', 'hero_section', 'fetch_error', {
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    logEvent('info', 'hero_section', 'manual_refresh_triggered');
    await fetchFeaturedArticles(true);
  }, [fetchFeaturedArticles]);

  // Monitorar FCP (First Contentful Paint) específico da Hero Section
  useEffect(() => {
    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      
      if (fcpEntry && fcpEntry.startTime < 2000) { // Se FCP < 2s na Hero Section
        logEvent('info', 'hero_section', 'fcp_optimized', {
          fcp: Math.round(fcpEntry.startTime),
          url: window.location.href
        });
      }
    });

    try {
      observer.observe({ entryTypes: ['paint'] });
    } catch (error) {
      console.warn('[Hero Section] PerformanceObserver not supported');
    }

    return () => observer.disconnect();
  }, []);

  // Carregar artigos em destaque ao montar o componente
  useEffect(() => {
    fetchFeaturedArticles();
  }, [fetchFeaturedArticles]);

  return {
    featuredArticles,
    loading,
    error,
    refresh
  };
};

// Função auxiliar para invalidar cache da Hero Section
export const invalidateFeaturedArticlesCache = async () => {
  const cacheKey = CacheKeys.FEATURED_ARTICLES || 'featured_articles';
  await hybridCache.invalidate(cacheKey);
  
  logEvent('info', 'hero_section', 'cache_invalidated', {
    cacheKey,
    reason: 'Article update/publish'
  });
};

// Função para monitorar performance da Hero Section
export const monitorHeroSectionPerformance = () => {
  if ('performance' in window) {
    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      
      entries.forEach(entry => {
        if (entry.entryType === 'largest-contentful-paint') {
          const lcp = Math.round(entry.startTime);
          
          if (lcp > 2500) { // LCP > 2.5s é considerado lento
            logEvent('warn', 'hero_section', 'lcp_slow', {
              lcp,
              url: window.location.href,
              severity: lcp > 4000 ? 'critical' : 'warning'
            });
          }
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      console.warn('[Hero Section] LCP observer not supported');
    }
  }
};