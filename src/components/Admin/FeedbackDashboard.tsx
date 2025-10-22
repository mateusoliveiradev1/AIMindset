import React, { useState, useEffect } from 'react';
import { TrendingUp, MessageCircle, ThumbsUp, ThumbsDown, RefreshCw, Filter } from 'lucide-react';
import { useArticles } from '../../hooks/useArticles';
import { useArticleMetrics } from '../../hooks/useArticleMetrics';
import { MetricsTable } from './MetricsTable';
import { ArticleDetailsModal } from './ArticleDetailsModal';
import { Article } from '../../hooks/useArticles';

interface ArticleMetrics {
  article_id: number;
  positive_feedback: number;
  negative_feedback: number;
  total_comments: number;
  approval_rate: number;
}

export const FeedbackDashboard: React.FC = () => {
  const { articles, loading: articlesLoading, refreshArticles } = useArticles();
  const [allMetrics, setAllMetrics] = useState<ArticleMetrics[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('published');
  const [searchTerm, setSearchTerm] = useState('');


  // Hook para métricas
  const { metrics, loading: metricsLoading, refreshMetrics } = useArticleMetrics();

  // Carregar métricas para todos os artigos
  useEffect(() => {
    if (metrics && metrics.length > 0) {
      const formattedMetrics = metrics.map(metric => ({
        article_id: metric.article_id,
        positive_feedback: metric.positive_feedback,
        negative_feedback: metric.negative_feedback,
        total_comments: metric.total_comments,
        approval_rate: metric.approval_rate
      }));
      setAllMetrics(formattedMetrics);
    }
  }, [metrics]);

  const handleRefresh = async () => {
    await refreshArticles();
    await refreshMetrics();
  };

  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedArticle(null);
  };

  // Filtrar artigos
  const filteredArticles = (articles || []).filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'published' && article.published) ||
                         (filterStatus === 'draft' && !article.published);
    return matchesSearch && matchesFilter;
  });

  // Calcular estatísticas gerais
  const totalPositiveFeedback = allMetrics.reduce((sum, m) => sum + m.positive_feedback, 0);
  const totalNegativeFeedback = allMetrics.reduce((sum, m) => sum + m.negative_feedback, 0);
  const totalComments = allMetrics.reduce((sum, m) => sum + m.total_comments, 0);
  const totalFeedback = totalPositiveFeedback + totalNegativeFeedback;
  const overallApprovalRate = totalFeedback > 0 ? (totalPositiveFeedback / totalFeedback) * 100 : 0;

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
              <p className="text-2xl font-bold text-lime-green">{totalPositiveFeedback}</p>
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
              <p className="text-2xl font-bold text-red-400">{totalNegativeFeedback}</p>
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
              <p className="text-2xl font-bold text-blue-400">{totalComments}</p>
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
              <p className="text-2xl font-bold text-neon-purple">{Math.round(overallApprovalRate)}%</p>
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
          metrics={allMetrics}
          onArticleClick={handleArticleClick}
        />
      )}

      {/* Modal de Detalhes */}
      <ArticleDetailsModal
        article={selectedArticle}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};