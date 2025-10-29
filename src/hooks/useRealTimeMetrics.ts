import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface ArticleMetrics {
  articleId: string;
  positiveFeedback: number;
  negativeFeedback: number;
  comments: number;
  approvalRate: number;
  total_likes: number;
  total_replies: number;
  engagement_rate: number;
}

interface RealTimeMetricsState {
  metrics: Record<string, ArticleMetrics>;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

// Cache inteligente com TTL
interface CacheEntry {
  data: ArticleMetrics;
  timestamp: number;
  ttl: number;
}

class SmartCache {
  private cache = new Map<string, CacheEntry>();
  private readonly defaultTTL = 30000; // 30 segundos

  set(key: string, data: ArticleMetrics, ttl = this.defaultTTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): ArticleMetrics | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  getSize() {
    return this.cache.size;
  }
}

const cache = new SmartCache();

export function useRealTimeMetrics(articleIds: string[]) {
  console.log(`🚀 [REALTIME-METRICS] Hook iniciado com ${articleIds.length} artigos:`, articleIds);
  
  const [state, setState] = useState<RealTimeMetricsState>({
    metrics: {},
    loading: false,
    error: null,
    lastUpdate: null
  });

  // Refs para controle
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const loadingRef = useRef(false);

  // Memoizar articleIds para evitar re-renders
  const stableArticleIds = useMemo(() => {
    const sorted = [...articleIds].sort();
    console.log(`🔄 [REALTIME-METRICS] ArticleIds estabilizados:`, sorted);
    return sorted;
  }, [articleIds]);

  // Função para buscar métricas de um artigo
  const fetchArticleMetrics = useCallback(async (articleId: string): Promise<ArticleMetrics> => {
    const cacheKey = `metrics_${articleId}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      console.log(`📦 [REALTIME-METRICS] Cache hit para artigo ${articleId}:`, cached);
      return cached;
    }

    console.log(`🔍 [REALTIME-METRICS] Buscando métricas para artigo ${articleId}`);

    try {
      // PRIMEIRO: Tentar usar a função get_article_metrics do Supabase
      console.log(`🎯 [REALTIME-METRICS] Tentando função get_article_metrics para ${articleId}`);
      
      const { data: metricsData, error: metricsError } = await supabase
        .rpc('get_article_metrics', { article_uuid: articleId });

      if (!metricsError && metricsData) {
        console.log(`✅ [REALTIME-METRICS] Métricas obtidas para ${articleId}:`, metricsData);
        
        const metrics: ArticleMetrics = {
          articleId,
          positiveFeedback: Number(metricsData.positive_feedback) || 0,
          negativeFeedback: Number(metricsData.negative_feedback) || 0,
          comments: Number(metricsData.total_comments) || 0,
          approvalRate: Number(metricsData.approval_rate) || 0,
          total_likes: Number(metricsData.total_likes) || 0,
          total_replies: Number(metricsData.total_replies) || 0,
          engagement_rate: Number(metricsData.engagement_rate) || 0
        };

        // Cache com TTL de 30 segundos
        cache.set(cacheKey, metrics, 30000);
        
        console.log(`✅ [REALTIME-METRICS] Métricas RPC carregadas para ${articleId}:`, metrics);
        return metrics;
      } else {
        console.warn(`⚠️ [REALTIME-METRICS] Função RPC falhou para ${articleId}:`, {
          error: rpcError,
          data: data,
          errorMessage: rpcError?.message,
          errorDetails: rpcError?.details
        });
      }

      // FALLBACK: Buscar dados manualmente se a função RPC falhar
      console.log(`🔄 [REALTIME-METRICS] Fallback: buscando dados manualmente para ${articleId}`);
      
      // Usar supabaseAdmin para garantir acesso aos dados
      const { supabaseAdmin } = await import('../lib/supabase-admin');
      
      // Buscar feedback
      const { data: feedbackData, error: feedbackError } = await supabaseAdmin
        .from('feedbacks')
        .select('type')
        .eq('article_id', articleId);

      if (feedbackError) {
        console.error(`❌ [REALTIME-METRICS] Erro ao buscar feedback para ${articleId}:`, feedbackError);
        throw feedbackError;
      }

      // Buscar comentários com likes e parent_id
      const { data: commentsData, error: commentsError } = await supabaseAdmin
        .from('comments')
        .select('id, likes, parent_id')
        .eq('article_id', articleId);

      if (commentsError) {
        console.error(`❌ [REALTIME-METRICS] Erro ao buscar comentários para ${articleId}:`, commentsError);
        throw commentsError;
      }

      // Calcular métricas de engajamento
      const totalLikes = commentsData?.reduce((sum, comment) => sum + (Number(comment.likes) || 0), 0) || 0;
      const totalReplies = commentsData?.filter(comment => comment.parent_id !== null).length || 0;
      const commentsWithEngagement = commentsData?.filter(comment => 
        (Number(comment.likes) || 0) > 0 || comment.parent_id !== null
      ).length || 0;
      
      const engagementRate = commentsData && commentsData.length > 0 
        ? (commentsWithEngagement / commentsData.length) * 100 
        : 0;

      console.log(`📊 [REALTIME-METRICS] Dados brutos para ${articleId}:`, {
        feedbackData: feedbackData?.length || 0,
        commentsData: commentsData?.length || 0,
        totalLikes,
        totalReplies,
        engagementRate
      });

      const positiveFeedback = Number(feedbackData?.filter(f => f.type === 'positive').length) || 0;
      const negativeFeedback = Number(feedbackData?.filter(f => f.type === 'negative').length) || 0;
      const comments = Number(commentsData?.length) || 0;
      const totalFeedback = positiveFeedback + negativeFeedback;
      const approvalRate = totalFeedback > 0 ? (positiveFeedback / totalFeedback) * 100 : 0;

      // Validar se approvalRate é um número válido
      const safeApprovalRate = isNaN(approvalRate) ? 0 : Math.round(approvalRate * 100) / 100;
      const safeEngagementRate = isNaN(engagementRate) ? 0 : Math.round(engagementRate * 100) / 100;

      const metrics: ArticleMetrics = {
        articleId,
        positiveFeedback,
        negativeFeedback,
        comments,
        approvalRate: safeApprovalRate,
        total_likes: totalLikes,
        total_replies: totalReplies,
        engagement_rate: safeEngagementRate
      };

      // Cache com TTL de 30 segundos
      cache.set(cacheKey, metrics, 30000);
      
      console.log(`✅ [REALTIME-METRICS] Métricas manuais carregadas para ${articleId}:`, metrics);
      return metrics;

    } catch (error) {
      console.error(`❌ [ERROR] Erro ao buscar métricas para ${articleId}:`, error);
      throw error;
    }
  }, []);

  // Função para carregar todas as métricas
  const loadAllMetrics = useCallback(async (ids: string[]) => {
    if (!mountedRef.current || loadingRef.current || ids.length === 0) {
      return;
    }

    loadingRef.current = true;
    
    if (!mountedRef.current) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log(`🔄 [REALTIME-METRICS] Carregando métricas para ${ids.length} artigos:`, ids);
      
      const metricsPromises = ids.map(id => fetchArticleMetrics(id));
      const results = await Promise.allSettled(metricsPromises);
      
      if (!mountedRef.current) return;

      const newMetrics: Record<string, ArticleMetrics> = {};
      let hasErrors = false;

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const metrics = result.value;
          // Validar métricas antes de adicionar ao estado
          const safeMetrics = {
            ...metrics,
            positiveFeedback: Number(metrics.positiveFeedback) || 0,
            negativeFeedback: Number(metrics.negativeFeedback) || 0,
            comments: Number(metrics.comments) || 0,
            approvalRate: Number(metrics.approvalRate) || 0,
            total_likes: Number(metrics.total_likes) || 0,
            total_replies: Number(metrics.total_replies) || 0,
            engagement_rate: Number(metrics.engagement_rate) || 0
          };
          newMetrics[metrics.articleId] = safeMetrics;
        } else {
          console.error(`❌ [REALTIME-METRICS] Falha ao carregar métricas para ${ids[index]}:`, result.reason);
          hasErrors = true;
        }
      });

      if (!mountedRef.current) return;

      console.log(`📊 [REALTIME-METRICS] Métricas atualizadas:`, newMetrics);

      setState(prev => ({
        ...prev,
        metrics: newMetrics,
        loading: false,
        error: hasErrors ? 'Alguns dados podem estar desatualizados' : null,
        lastUpdate: new Date()
      }));

      console.log(`✅ [SUCCESS] ${Object.keys(newMetrics).length} métricas carregadas com sucesso`);

    } catch (error) {
      console.error('❌ [ERROR] Erro ao carregar métricas:', error);
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Erro ao carregar métricas'
        }));
      }
    } finally {
      loadingRef.current = false;
    }
  }, [fetchArticleMetrics]);

  // Função para atualizar métricas específicas (Real-Time)
  const updateMetricsForArticle = useCallback(async (articleId: string) => {
    if (!mountedRef.current) return;
    
    try {
      console.log(`🔄 [REALTIME] Atualizando métricas para artigo ${articleId}`);
      cache.invalidate(`metrics_${articleId}`);
      const metrics = await fetchArticleMetrics(articleId);
      
      if (!mountedRef.current) return;
      
      // Validar métricas antes de atualizar o estado
      const safeMetrics = {
        ...metrics,
        positiveFeedback: Number(metrics.positiveFeedback) || 0,
        negativeFeedback: Number(metrics.negativeFeedback) || 0,
        comments: Number(metrics.comments) || 0,
        approvalRate: Number(metrics.approvalRate) || 0,
        total_likes: Number(metrics.total_likes) || 0,
        total_replies: Number(metrics.total_replies) || 0,
        engagement_rate: Number(metrics.engagement_rate) || 0
      };
      
      setState(prev => ({
        ...prev,
        metrics: { ...prev.metrics, [articleId]: safeMetrics },
        lastUpdate: new Date()
      }));

      console.log(`✅ [REALTIME] Métricas atualizadas para ${articleId}:`, safeMetrics);
    } catch (error) {
      console.error(`❌ [REALTIME] Erro ao atualizar métricas para ${articleId}:`, error);
    }
  }, [fetchArticleMetrics]);

  // Configurar Real-Time Subscriptions
  const setupRealTimeSubscriptions = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    
    console.log(`🔄 [REALTIME] Configurando subscriptions para ${ids.length} artigos`);

    // Limpar canais existentes
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];

    // Subscription para feedback
    const feedbackChannel = supabase
      .channel('feedback_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feedback',
          filter: `article_id=in.(${ids.join(',')})`
        },
        (payload) => {
          console.log('🔄 [REALTIME] Feedback atualizado:', payload);
          const articleId = (payload.new as any)?.article_id || (payload.old as any)?.article_id;
          if (articleId && ids.includes(articleId)) {
            updateMetricsForArticle(articleId);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 [REALTIME] Status feedback subscription:', status);
      });

    // Subscription para comentários
    const commentsChannel = supabase
      .channel('comments_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `article_id=in.(${ids.join(',')})`
        },
        (payload) => {
          console.log('🔄 [REALTIME] Comentários atualizados:', payload);
          const articleId = (payload.new as any)?.article_id || (payload.old as any)?.article_id;
          if (articleId && ids.includes(articleId)) {
            updateMetricsForArticle(articleId);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 [REALTIME] Status comments subscription:', status);
      });

    channelsRef.current = [feedbackChannel, commentsChannel];
  }, [updateMetricsForArticle]);

  // Auto-refresh a cada 30 segundos
  const setupAutoRefresh = useCallback((ids: string[]) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (ids.length === 0) return;

    intervalRef.current = setInterval(() => {
      if (mountedRef.current && !loadingRef.current) {
        console.log('🔄 [AUTO-REFRESH] Atualizando métricas automaticamente');
        cache.clear(); // Limpar cache para forçar atualização
        loadAllMetrics(ids);
      }
    }, 30000); // 30 segundos

    console.log('⏰ [AUTO-REFRESH] Configurado para 30 segundos');
  }, [loadAllMetrics]);

  // Effect principal
  useEffect(() => {
    mountedRef.current = true;
    
    if (stableArticleIds.length === 0) {
      setState({
        metrics: {},
        loading: false,
        error: null,
        lastUpdate: null
      });
      return;
    }

    // Carregar métricas iniciais
    loadAllMetrics(stableArticleIds);

    // Configurar Real-Time Subscriptions
    setupRealTimeSubscriptions(stableArticleIds);

    // Configurar Auto-refresh
    setupAutoRefresh(stableArticleIds);

    // Cleanup
    return () => {
      mountedRef.current = false;
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [stableArticleIds, loadAllMetrics, setupRealTimeSubscriptions, setupAutoRefresh]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Função para forçar atualização manual
  const forceRefresh = useCallback(() => {
    if (!mountedRef.current) return;
    
    console.log('🔄 [MANUAL] Forçando atualização das métricas');
    cache.clear();
    loadAllMetrics(stableArticleIds);
  }, [stableArticleIds, loadAllMetrics]);

  return {
    metrics: state.metrics,
    loading: state.loading,
    error: state.error,
    lastUpdate: state.lastUpdate,
    forceRefresh,
    cacheSize: cache.getSize()
  };
}