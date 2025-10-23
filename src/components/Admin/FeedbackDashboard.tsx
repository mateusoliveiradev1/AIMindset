import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TrendingUp, MessageCircle, ThumbsUp, ThumbsDown, RefreshCw, Filter } from 'lucide-react';
import { useArticles } from '../../hooks/useArticles';
import { useRealTimeMetrics } from '../../hooks/useRealTimeMetrics';
import { MetricsTable } from './MetricsTable';
import { ArticleDetailsModal } from './ArticleDetailsModal';
import { Article } from '../../hooks/useArticles';
import { RequestMonitor } from '../RequestMonitor';

interface ArticleMetrics {
  article_id: number;
  positive_feedback: number;
  negative_feedback: number;
  total_comments: number;
  approval_rate: number;
}

export const FeedbackDashboard: React.FC = () => {
  const { articles, loading: articlesLoading, refreshArticles } = useArticles();
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('published');
  const [searchTerm, setSearchTerm] = useState('');

  // Extrair IDs dos artigos para o hook de métricas
  const articleIds = useMemo(() => {
    const ids = (articles || []).map(article => article.id.toString());
    console.log('🔍 [FEEDBACK-DASHBOARD] Artigos disponíveis:', articles?.length || 0);
    console.log('🔍 [FEEDBACK-DASHBOARD] IDs extraídos:', ids);
    return ids;
  }, [articles]);

  // Hook para métricas em tempo real
  const { metrics, loading: metricsLoading, error, lastUpdate, forceRefresh, cacheSize } = useRealTimeMetrics(articleIds);

  // Memoizar métricas formatadas para evitar re-renders desnecessários
  const formattedMetrics = useMemo(() => {
    console.log('🔍 [FEEDBACK-DASHBOARD] Iniciando formatação das métricas');
    console.log('🔍 [FEEDBACK-DASHBOARD] Métricas recebidas:', metrics);
    console.log('🔍 [FEEDBACK-DASHBOARD] Tipo das métricas:', typeof metrics);
    console.log('🔍 [FEEDBACK-DASHBOARD] Keys das métricas:', Object.keys(metrics || {}));
    
    if (!metrics || Object.keys(metrics).length === 0) {
      console.log('⚠️ [FEEDBACK-DASHBOARD] Nenhuma métrica disponível');
      return [];
    }
    
    const formatted = Object.entries(metrics).map(([articleId, metric], index) => {
      console.log(`🔍 [FEEDBACK-DASHBOARD] Processando métrica ${index} para artigo ${articleId}:`, metric);
      
      // Validar e garantir valores seguros
      const positiveFeedback = Number(metric.positiveFeedback) || 0;
      const negativeFeedback = Number(metric.negativeFeedback) || 0;
      const totalComments = Number(metric.comments) || 0; // Corrigir nome da propriedade
      const approvalRate = Number(metric.approvalRate) || 0;
      
      console.log(`📊 [FEEDBACK-DASHBOARD] Valores extraídos para artigo ${articleId}:`, {
        positiveFeedback,
        negativeFeedback,
        totalComments,
        approvalRate,
        originalMetric: metric
      });
      
      // Verificar se há valores NaN
      if (isNaN(positiveFeedback) || isNaN(negativeFeedback) || 
          isNaN(totalComments) || isNaN(approvalRate)) {
        console.warn('⚠️ [FEEDBACK-DASHBOARD] Valores NaN detectados:', {
          articleId, positiveFeedback, negativeFeedback, totalComments, approvalRate
        });
      }
      
      const formattedMetric = {
        article_id: articleId, // Usar o articleId como string
        positive_feedback: positiveFeedback,
        negative_feedback: negativeFeedback,
        total_comments: totalComments,
        approval_rate: isNaN(approvalRate) ? 0 : approvalRate
      };
      
      console.log(`✅ [FEEDBACK-DASHBOARD] Métrica formatada para artigo ${articleId}:`, formattedMetric);
      return formattedMetric;
    });
    
    console.log('✅ [FEEDBACK-DASHBOARD] Todas as métricas formatadas:', formatted);
    return formatted;
  }, [metrics]);

  // Debug das métricas recebidas
  useEffect(() => {
    console.log('🎯 [FEEDBACK-DASHBOARD] Artigos carregados:', articles?.length || 0);
    console.log('📊 [FEEDBACK-DASHBOARD] Métricas recebidas:', metrics);
    console.log('📊 [FEEDBACK-DASHBOARD] Métricas formatadas:', formattedMetrics);
    console.log('⏳ [FEEDBACK-DASHBOARD] Loading states:', { articlesLoading, metricsLoading });
    console.log('🔄 [FEEDBACK-DASHBOARD] Estado atual do dashboard:', {
      totalArticles: articles?.length || 0,
      totalMetrics: Object.keys(metrics || {}).length,
      formattedMetricsCount: formattedMetrics?.length || 0,
      lastUpdate: lastUpdate?.toLocaleTimeString()
    });
  }, [articles, metrics, formattedMetrics, articlesLoading, metricsLoading, lastUpdate]);

  const handleRefresh = useCallback(async () => {
    console.log('🔄 [DASHBOARD] Refresh manual iniciado');
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
      return matchesSearch && matchesFilter;
    });
  }, [articles, searchTerm, filterStatus]);

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
    
    const totalFeedback = totalPositiveFeedback + totalNegativeFeedback;
    const overallApprovalRate = totalFeedback > 0 ? (totalPositiveFeedback / totalFeedback) * 100 : 0;
    
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
      overallApprovalRate: isNaN(overallApprovalRate) ? 0 : overallApprovalRate
    };
  }, [formattedMetrics]);

  // Log de debug para monitoramento
  useEffect(() => {
    console.log('📊 [DASHBOARD] Estado atual:', {
      articles: articles?.length || 0,
      metrics: Object.keys(metrics).length,
      loading: { articles: articlesLoading, metrics: metricsLoading },
      lastUpdate,
      cacheSize,
      error
    });
  }, [articles, metrics, articlesLoading, metricsLoading, lastUpdate, cacheSize, error]);

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

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-darker-surface/30 rounded-lg p-6">
          <div className="flex items-center justify-between">
             <div>
               <p className="text-sm font-medium text-futuristic-gray">Feedback Positivo</p>
               <p className="text-2xl font-bold text-lime-green">{totalStats.totalPositiveFeedback}</p>
             </div>
             <div className="p-3 bg-lime-green/20 rounded-full">
               <ThumbsUp className="h-6 w-6 text-lime-green" />
             </div>
           </div>
        </div>

        <div className="bg-darker-surface/30 rounded-lg p-6">
           <div className="flex items-center justify-between">
             <div>
               <p className="text-sm font-medium text-futuristic-gray">Feedback Negativo</p>
               <p className="text-2xl font-bold text-red-400">{totalStats.totalNegativeFeedback}</p>
             </div>
             <div className="p-3 bg-red-400/20 rounded-full">
               <ThumbsDown className="h-6 w-6 text-red-400" />
             </div>
           </div>
         </div>

         <div className="bg-darker-surface/30 rounded-lg p-6">
           <div className="flex items-center justify-between">
             <div>
               <p className="text-sm font-medium text-futuristic-gray">Total Comentários</p>
               <p className="text-2xl font-bold text-blue-400">{totalStats.totalComments}</p>
             </div>
             <div className="p-3 bg-blue-400/20 rounded-full">
               <MessageCircle className="h-6 w-6 text-blue-400" />
             </div>
           </div>
         </div>

         <div className="bg-darker-surface/30 rounded-lg p-6">
           <div className="flex items-center justify-between">
             <div>
               <p className="text-sm font-medium text-futuristic-gray">Taxa de Aprovação</p>
               <p className="text-2xl font-bold text-neon-purple">
                 {isNaN(totalStats.overallApprovalRate) ? '0' : Math.round(totalStats.overallApprovalRate)}%
               </p>
             </div>
             <div className="p-3 bg-neon-purple/20 rounded-full">
               <TrendingUp className="h-6 w-6 text-neon-purple" />
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