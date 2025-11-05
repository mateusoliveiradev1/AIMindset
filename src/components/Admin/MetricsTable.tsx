import React, { useState, useEffect } from 'react';
import { TrendingUp, MessageCircle, ThumbsUp, ThumbsDown, Eye, RefreshCw, Heart, MessageSquare } from 'lucide-react';
import { Article } from '../../hooks/useArticles';

interface ArticleMetrics {
  article_id: string | number;
  positive_feedback: number;
  negative_feedback: number;
  total_comments: number;
  approval_rate: number;
  total_likes?: number;
  total_replies?: number;
  engagement_rate?: number;
}

interface MetricsTableProps {
  articles: Article[];
  metrics: ArticleMetrics[];
  onArticleClick: (article: Article) => void;
}

export const MetricsTable: React.FC<MetricsTableProps> = ({
  articles,
  metrics,
  onArticleClick
}) => {
  const [updatingArticles, setUpdatingArticles] = useState<Set<string>>(new Set());
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Detectar mudanças nas métricas para mostrar indicadores visuais
  useEffect(() => {
    setLastUpdate(new Date());
    
    // Simular indicador de atualização
    if (metrics && metrics.length > 0) {
      const articleIds = metrics.map(m => m.article_id);
      setUpdatingArticles(new Set(articleIds.map(id => typeof id === 'string' ? id : String(id))));
      
      // Remover indicador após 2 segundos
      const timer = setTimeout(() => {
        setUpdatingArticles(new Set());
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [metrics]);

  const getMetricsForArticle = (articleId: string): ArticleMetrics => {
    // articleId já é string
    const articleIdStr = articleId;
    
    const found = metrics?.find(m => {
      const match = m.article_id === articleIdStr;
      return match;
    });
    
    const result = found || {
      article_id: articleId,
      positive_feedback: 0,
      negative_feedback: 0,
      total_comments: 0,
      approval_rate: 0,
      total_likes: 0,
      total_replies: 0,
      engagement_rate: 0
    };
    
    return result;
  };

  const formatApprovalRate = (rate: number): string => {
    const safeRate = Number(rate) || 0;
    return isNaN(safeRate) ? '0%' : `${Math.round(safeRate)}%`;
  };

  const getApprovalRateColor = (rate: number): string => {
    const safeRate = Number(rate) || 0;
    if (isNaN(safeRate)) return 'text-gray-400';
    if (safeRate >= 80) return 'text-lime-green';
    if (safeRate >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Função utilitária para iniciais do título
  const getInitials = (text: string) => {
    const words = (text || '').split(' ').filter(Boolean);
    const first = words[0]?.[0] || '';
    const last = words.length > 1 ? words[words.length - 1][0] : '';
    return (first + last).toUpperCase();
  };

  return (
    <div className="relative overflow-hidden glass-effect backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 ring-1 ring-white/10">
      <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
        <h3 className="text-lg font-orbitron font-bold text-white">Métricas dos Artigos</h3>
        <div className="flex items-center space-x-2 text-[11px] font-orbitron tracking-wide text-futuristic-gray">
          <RefreshCw className="h-4 w-4" />
          <span>Última atualização: {lastUpdate.toLocaleTimeString()}</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-black/20">
            <tr>
              <th className="px-4 py-3 text-left text-[11px] font-orbitron tracking-wide text-futuristic-gray uppercase">
                Artigo
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-orbitron tracking-wide text-futuristic-gray uppercase">
                <div className="flex items-center">
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  Positivos
                </div>
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-orbitron tracking-wide text-futuristic-gray uppercase">
                <div className="flex items-center">
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  Negativos
                </div>
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-orbitron tracking-wide text-futuristic-gray uppercase">
                <div className="flex items-center">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Comentários
                </div>
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-orbitron tracking-wide text-futuristic-gray uppercase">
                <div className="flex items-center">
                  <Heart className="h-4 w-4 mr-1" />
                  Curtidas
                </div>
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-orbitron tracking-wide text-futuristic-gray uppercase">
                <div className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Respostas
                </div>
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-orbitron tracking-wide text-futuristic-gray uppercase">
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Taxa de Aprovação
                </div>
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-orbitron tracking-wide text-futuristic-gray uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {articles.map((article) => {
              const articleMetrics = getMetricsForArticle(article.id);
              return (
                <tr
                  key={article.id}
                  onClick={() => onArticleClick(article)}
                  className={`group hover:bg-white/5 cursor-pointer transition-all duration-300 ${
                    updatingArticles.has(article.id)
                      ? 'bg-futuristic-blue/10 ring-1 ring-futuristic-blue/30'
                      : ''
                  }`}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full ring-1 ring-white/10 bg-neon-purple/20 flex items-center justify-center text-[11px] font-orbitron text-neon-purple">
                          {getInitials(article.title)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate max-w-xs">
                          {article.title}
                        </p>
                        <p className="text-[11px] font-orbitron tracking-wide text-futuristic-gray">
                          {new Date(article.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium transition-all duration-300 ${
                        updatingArticles.has(article.id)
                          ? 'text-futuristic-blue animate-pulse'
                          : 'text-lime-green'
                      }`}>
                        {articleMetrics.positive_feedback}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium transition-all duration-300 ${
                        updatingArticles.has(article.id)
                          ? 'text-futuristic-blue animate-pulse'
                          : 'text-red-400'
                      }`}>
                        {articleMetrics.negative_feedback}
                      </span>
                      {updatingArticles.has(article.id) && (
                        <RefreshCw className="h-3 w-3 ml-2 text-futuristic-blue animate-spin" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium transition-all duration-300 ${
                        updatingArticles.has(article.id)
                          ? 'text-futuristic-blue animate-pulse'
                          : 'text-blue-400'
                      }`}>
                        {articleMetrics.total_comments}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium transition-all duration-300 ${
                        updatingArticles.has(article.id)
                          ? 'text-futuristic-blue animate-pulse'
                          : 'text-pink-400'
                      }`}>
                        {articleMetrics.total_likes || 0}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium transition-all duration-300 ${
                        updatingArticles.has(article.id)
                          ? 'text-futuristic-blue animate-pulse'
                          : 'text-purple-400'
                      }`}>
                        {articleMetrics.total_replies || 0}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium transition-all duration-300 ${
                        updatingArticles.has(article.id)
                          ? 'text-futuristic-blue animate-pulse'
                          : getApprovalRateColor(articleMetrics.approval_rate)
                      }`}>
                        {formatApprovalRate(articleMetrics.approval_rate)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <button
                      onClick={() => onArticleClick(article)}
                      className="inline-flex items-center px-3 py-1 rounded-full border border-white/10 ring-1 ring-white/10 text-[11px] font-orbitron tracking-wide text-neon-purple hover:bg-neon-purple/10 transition-all duration-200 hover:shadow-[0_8px_30px_rgba(99,102,241,0.25)]"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Ver Detalhes
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {articles.length === 0 && (
        <div className="text-center py-8">
          <p className="text-futuristic-gray">Nenhum artigo encontrado</p>
        </div>
      )}
    </div>
  );
};