import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TrendingUp, MessageCircle, ThumbsUp, ThumbsDown, RefreshCw, Filter, Heart, Reply, Zap } from 'lucide-react';
import { useArticles } from '../../hooks/useArticles';
import { useRealTimeMetrics } from '../../hooks/useRealTimeMetrics';
import { useRealTimeInteractions } from '../../hooks/useRealTimeInteractions';
import { useRealTimeSync } from '../../hooks/useRealTimeSync';
import { MetricsTable } from './MetricsTable';
import { ArticleDetailsModal } from './ArticleDetailsModal';
import { Article } from '../../hooks/useArticles';
import { RequestMonitor } from '../RequestMonitor';

interface ArticleMetrics {
  article_id: string;  // Mudança: string em vez de number para compatibilidade com UUIDs
  positive_feedback: number;
  negative_feedback: number;
  total_comments: number;
  approval_rate: number;
  total_likes?: number;      // NOVO: Total de curtidas nos comentários
  total_replies?: number;    // NOVO: Total de respostas
  engagement_rate?: number;  // NOVO: Taxa de engajamento
}

export const FeedbackDashboard: React.FC = () => {
  const { articles, loading: articlesLoading, refreshArticles } = useArticles();
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('published');
  const [searchTerm, setSearchTerm] = useState('');
  const [engagementFilter, setEngagementFilter] = useState<'all' | 'high_likes' | 'with_replies' | 'high_engagement' | 'active'>('all');

  // Extrair IDs dos artigos para o hook de métricas
  const articleIds = useMemo(() => {
    const ids = (articles || []).map(article => article.id.toString());
    return ids;
  }, [articles]);

  // Hook para métricas em tempo real
  const { metrics, loading: metricsLoading, error, lastUpdate, forceRefresh, cacheSize } = useRealTimeMetrics(articleIds);

  // 🚀 NOVO: Hook para interações em tempo real com notificações
  const { 
    interactions, 
    stats: realTimeStats, 
    isConnected, 
    error: realTimeError,
    totalInteractions,
    lastInteraction,
    forceStatsUpdate
  } = useRealTimeInteractions({
    articleIds,
    enableNotifications: true, // Habilitar notificações no painel admin
    debounceMs: 300 // Resposta mais rápida para admin
  });

  // 🔄 Hook de sincronização global para garantir atualização automática
  const { invalidateAllCaches } = useRealTimeSync({
    onFeedbackChange: () => {
      console.log('🔄 [FEEDBACK-DASHBOARD] Feedback change detected - forcing refresh');
      forceRefresh();
      forceStatsUpdate();
    },
    onCommentChange: () => {
      console.log('🔄 [FEEDBACK-DASHBOARD] Comment change detected - forcing refresh');
      forceRefresh();
      forceStatsUpdate();
    },
    enableGlobalSync: true
  });

  // Memoizar métricas formatadas para evitar re-renders desnecessários
  const formattedMetrics = useMemo(() => {
    if (!metrics || Object.keys(metrics).length === 0) {
      return [];
    }
    
    const formatted = Object.entries(metrics).map(([articleId, metric]) => {
      // Validar e garantir valores seguros
      const positiveFeedback = Number(metric.positiveFeedback) || 0;
      const negativeFeedback = Number(metric.negativeFeedback) || 0;
      const totalComments = Number(metric.comments) || 0; // Usar 'comments' do hook
      const approvalRate = Number(metric.approvalRate) || 0;
      
      const formattedMetric: ArticleMetrics = {
        article_id: articleId,  // Mudança: manter como string (UUID)
        positive_feedback: positiveFeedback,
        negative_feedback: negativeFeedback,
        total_comments: totalComments,
        approval_rate: isNaN(approvalRate) ? 0 : approvalRate,
        total_likes: metric.total_likes || 0,
        total_replies: metric.total_replies || 0,
        engagement_rate: totalComments > 0 ? ((metric.total_likes || 0) + (metric.total_replies || 0)) / totalComments * 100 : 0
      };
      
      return formattedMetric;
    });
    
    return formatted;
  }, [metrics]);

  // Debug das métricas recebidas
  useEffect(() => {
    // Logs simplificados apenas para debug crítico
    if (error) {
      console.error('❌ [FEEDBACK-DASHBOARD] Erro:', error);
    }
  }, [articles, metrics, formattedMetrics, articlesLoading, metricsLoading, lastUpdate, error]);

  const handleRefresh = useCallback(async () => {
    await refreshArticles();
    forceRefresh();
  }, [refreshArticles, forceRefresh]);

  const handleArticleClick = useCallback((article: Article) => {
    setSelectedArticle(article);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedArticle(null);
  }, []);

  // Filtrar artigos
  const filteredArticles = useMemo(() => {
    return (articles || []).filter(article => {
      const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           article.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' ||
                           (filterStatus === 'published' && article.published) ||
                           (filterStatus === 'draft' && !article.published);
      
      // Filtro de engajamento
      let matchesEngagement = true;
      if (engagementFilter !== 'all') {
        const articleMetrics = formattedMetrics.find(m => m.article_id === article.id);
        if (articleMetrics) {
          switch (engagementFilter) {
            case 'high_likes':
              matchesEngagement = (articleMetrics.total_likes || 0) >= 5;
              break;
            case 'with_replies':
              matchesEngagement = (articleMetrics.total_replies || 0) > 0;
              break;
            case 'high_engagement':
              matchesEngagement = (articleMetrics.engagement_rate || 0) >= 80;
              break;
            case 'active':
              matchesEngagement = (articleMetrics.total_likes || 0) > 0 || (articleMetrics.total_replies || 0) > 0;
              break;
          }
        } else {
          matchesEngagement = false;
        }
      }
      
      return matchesSearch && matchesFilter && matchesEngagement;
    });
  }, [articles, searchTerm, filterStatus, engagementFilter, formattedMetrics]);

  // Calcular estatísticas gerais
  const totalStats = useMemo(() => {
    // Garantir que formattedMetrics é um array válido
    const safeMetrics = Array.isArray(formattedMetrics) ? formattedMetrics : [];
    
    const totalPositiveFeedback = safeMetrics.reduce((sum, m) => {
      const value = Number(m?.positive_feedback) || 0;
      return sum + (isNaN(value) ? 0 : value);
    }, 0);
    
    const totalNegativeFeedback = safeMetrics.reduce((sum, m) => {
      const value = Number(m?.negative_feedback) || 0;
      return sum + (isNaN(value) ? 0 : value);
    }, 0);
    
    const totalComments = safeMetrics.reduce((sum, m) => {
      const value = Number(m?.total_comments) || 0;
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    // NOVO: Calcular estatísticas de curtidas e respostas
    const totalLikes = safeMetrics.reduce((sum, m) => {
      const value = Number(m?.total_likes) || 0;
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const totalReplies = safeMetrics.reduce((sum, m) => {
      const value = Number(m?.total_replies) || 0;
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const totalFeedback = totalPositiveFeedback + totalNegativeFeedback;
    const overallApprovalRate = totalFeedback > 0 ? (totalPositiveFeedback / totalFeedback) * 100 : 0;
    
    // NOVO: Calcular taxa de engajamento (curtidas + respostas / comentários)
    const engagementRate = totalComments > 0 ? ((totalLikes + totalReplies) / totalComments) * 100 : 0;

    // NOVO: Comentários ativos (com curtidas ou respostas)
    const activeComments = safeMetrics.reduce((sum, m) => {
      const likes = Number(m?.total_likes) || 0;
      const replies = Number(m?.total_replies) || 0;
      return sum + (likes > 0 || replies > 0 ? 1 : 0);
    }, 0);
    
    // Verificar se há valores NaN nas estatísticas
    if (isNaN(overallApprovalRate)) {
      console.warn('⚠️ [FEEDBACK-DASHBOARD] Taxa de aprovação NaN detectada:', {
        totalPositiveFeedback, totalNegativeFeedback, totalFeedback
      });
    }

    return {
      totalPositiveFeedback: isNaN(totalPositiveFeedback) ? 0 : totalPositiveFeedback,
      totalNegativeFeedback: isNaN(totalNegativeFeedback) ? 0 : totalNegativeFeedback,
      totalComments: isNaN(totalComments) ? 0 : totalComments,
      totalFeedback: isNaN(totalFeedback) ? 0 : totalFeedback,
      overallApprovalRate: isNaN(overallApprovalRate) ? 0 : overallApprovalRate,
      totalLikes: isNaN(totalLikes) ? 0 : totalLikes,           // NOVO
      totalReplies: isNaN(totalReplies) ? 0 : totalReplies,     // NOVO
      engagementRate: isNaN(engagementRate) ? 0 : engagementRate, // NOVO
      activeComments: isNaN(activeComments) ? 0 : activeComments  // NOVO
    };
  }, [formattedMetrics]);

  // Log de debug para monitoramento
  useEffect(() => {
    // Apenas logs críticos de erro
    if (error) {
      console.error('❌ [DASHBOARD] Erro crítico:', error);
    }
  }, [error]);

  return (
    <div className="space-y-6">
      {/* Header */}
       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
         <div>
           <h2 className="text-2xl font-orbitron font-bold text-white">
             Dashboard de <span className="gradient-text">Feedback</span>
           </h2>
           <p className="text-futuristic-gray mt-1">
             Acompanhe métricas de engajamento dos artigos em tempo real
           </p>
           <div className="flex items-center gap-4 mt-2 text-sm text-futuristic-gray">
             <span>📊 {Object.keys(metrics).length} métricas carregadas</span>
             <span>💾 Cache: {cacheSize} entradas</span>
             {lastUpdate && (
               <span>🕒 Última atualização: {lastUpdate.toLocaleTimeString()}</span>
             )}
             {error && (
               <span className="text-red-400">⚠️ {error}</span>
             )}
           </div>
         </div>
         <button
           onClick={handleRefresh}
           disabled={articlesLoading || metricsLoading}
           className="inline-flex items-center px-4 py-2 bg-neon-purple/20 border border-neon-purple/30 rounded-lg text-neon-purple hover:bg-neon-purple/30 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
         >
           <RefreshCw className={`h-4 w-4 mr-2 ${(articlesLoading || metricsLoading) ? 'animate-spin' : ''}`} />
           Atualizar
         </button>
       </div>

      {/* 🚀 Status de Tempo Real - Premium */}
      <div className={`relative overflow-hidden glass-effect backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/10 ring-1 ring-white/10 transition-all duration-300 group hover:shadow-[0_8px_30px_rgba(99,102,241,0.25)]`}>
        <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-2xl ${isConnected ? 'bg-lime-green/10' : 'bg-red-400/10'}`}></div>
        <div className="flex items-center justify-between relative">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-105 ${isConnected ? 'bg-lime-green/20' : 'bg-red-400/20'}`}>
              <Zap className={`h-6 w-6 ${isConnected ? 'text-lime-green' : 'text-red-400'}`} />
            </div>
            <div>
              <p className="text-[11px] font-orbitron tracking-wide text-futuristic-gray">Status do Tempo Real</p>
              <p className={`text-xl font-bold ${isConnected ? 'text-lime-green' : 'text-red-400'}`}>{isConnected ? 'Conectado' : 'Desconectado'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-orbitron tracking-wide text-futuristic-gray">Interações</p>
            <p className="text-2xl font-bold text-neon-purple">{totalInteractions}</p>
            {lastInteraction && (
              <p className="text-[11px] font-orbitron tracking-wide text-futuristic-gray">
                Última: {new Date(lastInteraction.timestamp).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        {realTimeError && (
          <div className="mt-3 p-3 rounded-lg border border-red-400/30 ring-1 ring-red-400/10 bg-red-400/10 text-red-300 text-[11px] font-orbitron">
            Erro: {realTimeError}
          </div>
        )}
      </div>

      {/* Estatísticas Gerais - EXPANDIDO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {/* Feedback Positivo */}
        <div className="relative overflow-hidden glass-effect backdrop-blur-sm rounded-xl p-6 border border-white/10 ring-1 ring-white/10 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(99,102,241,0.25)] group">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-lime-green/10 rounded-full blur-2xl"></div>
          <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-neon-purple/10 rounded-full blur-xl"></div>
          <div className="flex items-center justify-between relative">
            <div>
              <p className="text-[11px] font-orbitron tracking-wide text-futuristic-gray">Feedback Positivo</p>
              <p className="text-2xl font-bold text-lime-green">{totalStats.totalPositiveFeedback}</p>
            </div>
            <div className="p-3 rounded-full ring-1 ring-white/10 bg-lime-green/20 transition-transform duration-300 group-hover:scale-105">
              <ThumbsUp className="h-6 w-6 text-lime-green" />
            </div>
          </div>
        </div>

        {/* Feedback Negativo */}
        <div className="relative overflow-hidden glass-effect backdrop-blur-sm rounded-xl p-6 border border-white/10 ring-1 ring-white/10 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(99,102,241,0.25)] group">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-red-400/10 rounded-full blur-2xl"></div>
          <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-neon-purple/10 rounded-full blur-xl"></div>
          <div className="flex items-center justify-between relative">
            <div>
              <p className="text-[11px] font-orbitron tracking-wide text-futuristic-gray">Feedback Negativo</p>
              <p className="text-2xl font-bold text-red-400">{totalStats.totalNegativeFeedback}</p>
            </div>
            <div className="p-3 rounded-full ring-1 ring-white/10 bg-red-400/20 transition-transform duration-300 group-hover:scale-105">
              <ThumbsDown className="h-6 w-6 text-red-400" />
            </div>
          </div>
        </div>

        {/* Total Comentários */}
        <div className="relative overflow-hidden glass-effect backdrop-blur-sm rounded-xl p-6 border border-white/10 ring-1 ring-white/10 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(99,102,241,0.25)] group">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl"></div>
          <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-neon-purple/10 rounded-full blur-xl"></div>
          <div className="flex items-center justify-between relative">
            <div>
              <p className="text-[11px] font-orbitron tracking-wide text-futuristic-gray">Total Comentários</p>
              <p className="text-2xl font-bold text-blue-400">{totalStats.totalComments}</p>
            </div>
            <div className="p-3 rounded-full ring-1 ring-white/10 bg-blue-400/20 transition-transform duration-300 group-hover:scale-105">
              <MessageCircle className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Taxa de Aprovação */}
        <div className="relative overflow-hidden glass-effect backdrop-blur-sm rounded-xl p-6 border border-white/10 ring-1 ring-white/10 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(99,102,241,0.25)] group">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-neon-purple/10 rounded-full blur-2xl"></div>
          <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-blue-400/10 rounded-full blur-xl"></div>
          <div className="flex items-center justify-between relative">
            <div>
              <p className="text-[11px] font-orbitron tracking-wide text-futuristic-gray">Taxa de Aprovação</p>
              <p className="text-2xl font-bold text-neon-purple">{isNaN(totalStats.overallApprovalRate) ? '0' : Math.round(totalStats.overallApprovalRate)}%</p>
            </div>
            <div className="p-3 rounded-full ring-1 ring-white/10 bg-neon-purple/20 transition-transform duration-300 group-hover:scale-105">
              <TrendingUp className="h-6 w-6 text-neon-purple" />
            </div>
          </div>
        </div>

        {/* Total de Curtidas */}
        <div className="relative overflow-hidden glass-effect backdrop-blur-sm rounded-xl p-6 border border-white/10 ring-1 ring-white/10 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(99,102,241,0.25)] group">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-pink-400/10 rounded-full blur-2xl"></div>
          <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-neon-purple/10 rounded-full blur-xl"></div>
          <div className="flex items-center justify-between relative">
            <div>
              <p className="text-[11px] font-orbitron tracking-wide text-futuristic-gray">Total de Curtidas</p>
              <p className="text-2xl font-bold text-pink-400">{totalStats.totalLikes}</p>
              <p className="text-[11px] font-orbitron tracking-wide text-pink-300 mt-1">
                {totalStats.totalComments > 0 ? (totalStats.totalLikes / totalStats.totalComments).toFixed(1) : '0'} por comentário
              </p>
            </div>
            <div className="p-3 rounded-full ring-1 ring-white/10 bg-pink-400/20 transition-transform duration-300 group-hover:scale-105">
              <Heart className="h-6 w-6 text-pink-400" />
            </div>
          </div>
        </div>

        {/* Total de Respostas */}
        <div className="relative overflow-hidden glass-effect backdrop-blur-sm rounded-xl p-6 border border-white/10 ring-1 ring-white/10 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(99,102,241,0.25)] group">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl"></div>
          <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-neon-purple/10 rounded-full blur-xl"></div>
          <div className="flex items-center justify-between relative">
            <div>
              <p className="text-[11px] font-orbitron tracking-wide text-futuristic-gray">Total de Respostas</p>
              <p className="text-2xl font-bold text-cyan-400">{totalStats.totalReplies}</p>
              <p className="text-[11px] font-orbitron tracking-wide text-cyan-300 mt-1">
                {totalStats.totalComments > 0 ? (totalStats.totalReplies / totalStats.totalComments).toFixed(1) : '0'} por comentário
              </p>
            </div>
            <div className="p-3 rounded-full ring-1 ring-white/10 bg-cyan-400/20 transition-transform duration-300 group-hover:scale-105">
              <Reply className="h-6 w-6 text-cyan-400" />
            </div>
          </div>
        </div>
      </div>

      {/* NOVO: Segunda linha de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Taxa de Engajamento */}
        <div className="relative overflow-hidden glass-effect backdrop-blur-sm rounded-xl p-6 border border-white/10 ring-1 ring-white/10 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(99,102,241,0.25)] group">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-yellow-400/10 rounded-full blur-2xl"></div>
          <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-neon-purple/10 rounded-full blur-xl"></div>
          <div className="flex items-center justify-between relative">
            <div>
              <p className="text-[11px] font-orbitron tracking-wide text-futuristic-gray">Taxa de Engajamento</p>
              <p className="text-2xl font-bold text-yellow-400">{Math.round(totalStats.engagementRate)}%</p>
              <p className="text-[11px] font-orbitron tracking-wide text-yellow-300 mt-1">Curtidas + Respostas / Comentários</p>
            </div>
            <div className="p-3 rounded-full ring-1 ring-white/10 bg-yellow-400/20 transition-transform duration-300 group-hover:scale-105">
              <TrendingUp className="h-6 w-6 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Comentários Ativos */}
        <div className="relative overflow-hidden glass-effect backdrop-blur-sm rounded-xl p-6 border border-white/10 ring-1 ring-white/10 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(99,102,241,0.25)] group">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-green-400/10 rounded-full blur-2xl"></div>
          <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-neon-purple/10 rounded-full blur-xl"></div>
          <div className="flex items-center justify-between relative">
            <div>
              <p className="text-[11px] font-orbitron tracking-wide text-futuristic-gray">Comentários Ativos</p>
              <p className="text-2xl font-bold text-green-400">{totalStats.activeComments}</p>
              <p className="text-[11px] font-orbitron tracking-wide text-green-300 mt-1">Com curtidas ou respostas</p>
            </div>
            <div className="p-3 rounded-full ring-1 ring-white/10 bg-green-400/20 transition-transform duration-300 group-hover:scale-105">
              <MessageCircle className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </div>

        {/* Engajamento Médio */}
        <div className="relative overflow-hidden glass-effect backdrop-blur-sm rounded-xl p-6 border border-white/10 ring-1 ring-white/10 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(99,102,241,0.25)] group">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-orange-400/10 rounded-full blur-2xl"></div>
          <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-neon-purple/10 rounded-full blur-xl"></div>
          <div className="flex items-center justify-between relative">
            <div>
              <p className="text-[11px] font-orbitron tracking-wide text-futuristic-gray">Engajamento Médio</p>
              <p className="text-2xl font-bold text-orange-400">{(() => {
                const articlesWithEngagement = formattedMetrics?.filter(metric => (metric.total_likes || 0) > 0 || (metric.total_replies || 0) > 0).length || 0;
                if (articlesWithEngagement === 0) return 0;
                return Math.round((totalStats.totalLikes + totalStats.totalReplies) / articlesWithEngagement);
              })()}</p>
              <p className="text-[11px] font-orbitron tracking-wide text-orange-300 mt-1">Por artigo ativo</p>
            </div>
            <div className="p-3 rounded-full ring-1 ring-white/10 bg-orange-400/20 transition-transform duration-300 group-hover:scale-105">
              <TrendingUp className="h-6 w-6 text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar artigos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-futuristic-gray" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'published' | 'draft')}
            className="px-4 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white focus:outline-none focus:border-neon-purple"
          >
            <option value="all">Todos os Status</option>
            <option value="published">Publicados</option>
            <option value="draft">Rascunhos</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <Heart className="h-4 w-4 text-futuristic-gray" />
          <select
            value={engagementFilter}
            onChange={(e) => setEngagementFilter(e.target.value as 'all' | 'high_likes' | 'with_replies' | 'high_engagement' | 'active')}
            className="px-4 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white focus:outline-none focus:border-neon-purple"
          >
            <option value="all">Todo Engajamento</option>
            <option value="high_likes">Mais Curtidos (5+)</option>
            <option value="with_replies">Com Respostas</option>
            <option value="high_engagement">Alto Engajamento (80%+)</option>
            <option value="active">Comentários Ativos</option>
          </select>
        </div>
      </div>

      {/* Tabela de Métricas */}
      {articlesLoading || metricsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-purple"></div>
          <span className="ml-3 text-futuristic-gray">Carregando métricas...</span>
        </div>
      ) : (
        <MetricsTable
           articles={filteredArticles}
           metrics={formattedMetrics}
           onArticleClick={handleArticleClick}
         />
      )}

      {/* Modal de Detalhes */}
      <ArticleDetailsModal
        article={selectedArticle}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {/* Monitor de Requisições */}
      <RequestMonitor />
    </div>
  );
};