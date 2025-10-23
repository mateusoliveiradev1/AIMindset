import React, { useState, useEffect } from 'react';
import { TrendingUp, MessageCircle, ThumbsUp, ThumbsDown, Eye, RefreshCw } from 'lucide-react';
import { Article } from '../../hooks/useArticles';

interface ArticleMetrics {
  article_id: string | number;
  positive_feedback: number;
  negative_feedback: number;
  total_comments: number;
  approval_rate: number;
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
  const [updatingArticles, setUpdatingArticles] = useState<Set<number>>(new Set());
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Detectar mudanças nas métricas para mostrar indicadores visuais
  useEffect(() => {
    console.log('📊 [METRICS-TABLE] Métricas recebidas:', metrics);
    console.log('📊 [METRICS-TABLE] Número de métricas:', metrics?.length || 0);
    console.log('📊 [METRICS-TABLE] Artigos disponíveis:', articles?.length || 0);
    
    setLastUpdate(new Date());
    
    // Simular indicador de atualização
    if (metrics && metrics.length > 0) {
      const articleIds = metrics.map(m => m.article_id);
      console.log('🔄 [METRICS-TABLE] Atualizando indicadores para artigos:', articleIds);
      setUpdatingArticles(new Set(articleIds.map(id => typeof id === 'string' ? parseInt(id) : id)));
      
      // Remover indicador após 2 segundos
      const timer = setTimeout(() => {
        console.log('✅ [METRICS-TABLE] Removendo indicadores de atualização');
        setUpdatingArticles(new Set());
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [metrics]);

  const getMetricsForArticle = (articleId: number): ArticleMetrics => {
    // Converter articleId para string para comparação
    const articleIdStr = articleId.toString();
    
    console.log(`🔍 [METRICS-TABLE] Buscando métricas para artigo ${articleId} (string: ${articleIdStr})`);
    console.log(`🔍 [METRICS-TABLE] Métricas disponíveis:`, metrics?.map(m => ({ 
      id: m.article_id, 
      type: typeof m.article_id,
      positive: m.positive_feedback,
      negative: m.negative_feedback,
      comments: m.total_comments
    })));
    
    const found = metrics?.find(m => {
      const match = m.article_id === articleIdStr;
      console.log(`🔍 [METRICS-TABLE] Comparando ${m.article_id} === ${articleIdStr}: ${match}`);
      return match;
    });
    
    const result = found || {
      article_id: articleId,
      positive_feedback: 0,
      negative_feedback: 0,
      total_comments: 0,
      approval_rate: 0
    };
    
    console.log(`📊 [METRICS-TABLE] Resultado final para artigo ${articleId}:`, result);
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

  return (
    <div className="bg-darker-surface/30 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-darker-surface/50 flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">Métricas dos Artigos</h3>
        <div className="flex items-center space-x-2 text-sm text-futuristic-gray">
          <RefreshCw className="h-4 w-4" />
          <span>Última atualização: {lastUpdate.toLocaleTimeString()}</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-darker-surface/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-futuristic-gray uppercase tracking-wider">
                Artigo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-futuristic-gray uppercase tracking-wider">
                <div className="flex items-center">
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  Positivos
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-futuristic-gray uppercase tracking-wider">
                <div className="flex items-center">
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  Negativos
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-futuristic-gray uppercase tracking-wider">
                <div className="flex items-center">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Comentários
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-futuristic-gray uppercase tracking-wider">
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Taxa de Aprovação
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-futuristic-gray uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-darker-surface/50">
            {articles.map((article) => {
              const articleMetrics = getMetricsForArticle(article.id);
              return (
                <tr 
                  key={article.id}
                  onClick={() => onArticleClick(article)}
                  className={`hover:bg-darker-surface/50 cursor-pointer transition-all duration-300 ${
                    updatingArticles.has(article.id) 
                      ? 'bg-futuristic-blue/10 border-l-4 border-futuristic-blue animate-pulse' 
                      : ''
                  }`}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate max-w-xs">
                          {article.title}
                        </p>
                        <p className="text-xs text-futuristic-gray">
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
                          : getApprovalRateColor(articleMetrics.approval_rate)
                      }`}>
                        {formatApprovalRate(articleMetrics.approval_rate)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <button
                      onClick={() => onArticleClick(article)}
                      className="inline-flex items-center px-3 py-1 border border-neon-purple/30 rounded-md text-xs font-medium text-neon-purple hover:bg-neon-purple/10 transition-colors duration-200"
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