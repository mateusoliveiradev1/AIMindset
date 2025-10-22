import React from 'react';
import { TrendingUp, MessageCircle, ThumbsUp, ThumbsDown, Eye } from 'lucide-react';
import { Article } from '../../hooks/useArticles';

interface ArticleMetrics {
  article_id: number;
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
  const getMetricsForArticle = (articleId: number): ArticleMetrics => {
    return metrics.find(m => m.article_id === articleId) || {
      article_id: articleId,
      positive_feedback: 0,
      negative_feedback: 0,
      total_comments: 0,
      approval_rate: 0
    };
  };

  const formatApprovalRate = (rate: number): string => {
    return `${Math.round(rate)}%`;
  };

  const getApprovalRateColor = (rate: number): string => {
    if (rate >= 80) return 'text-lime-green';
    if (rate >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-darker-surface/30 rounded-lg overflow-hidden">
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
                  className="hover:bg-darker-surface/20 transition-colors duration-200"
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
                      <span className="text-sm font-medium text-lime-green">
                        {articleMetrics.positive_feedback}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-red-400">
                        {articleMetrics.negative_feedback}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-blue-400">
                        {articleMetrics.total_comments}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${getApprovalRateColor(articleMetrics.approval_rate)}`}>
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