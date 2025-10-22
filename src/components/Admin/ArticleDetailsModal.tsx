import React, { useEffect, useState } from 'react';
import { X, MessageCircle, ThumbsUp, ThumbsDown, User, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import { Article } from '../../hooks/useArticles';

interface Comment {
  id: number;
  article_id: number;
  user_name: string;
  content: string;
  created_at: string;
}

interface Feedback {
  id: number;
  article_id: number;
  useful: boolean;
  created_at: string;
}

interface ArticleDetailsModalProps {
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ArticleDetailsModal: React.FC<ArticleDetailsModalProps> = ({
  article,
  isOpen,
  onClose
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'comments' | 'feedback'>('comments');

  useEffect(() => {
    if (isOpen && article) {
      loadArticleData();
    }
  }, [isOpen, article]);

  const loadArticleData = async () => {
    if (!article) return;

    setLoading(true);
    try {
      // Carregar comentários
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('article_id', article.id)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      // Carregar feedbacks
      const { data: feedbacksData, error: feedbacksError } = await supabase
        .from('feedback')
        .select('*')
        .eq('article_id', article.id)
        .order('created_at', { ascending: false });

      if (feedbacksError) throw feedbacksError;

      setComments(commentsData || []);
      setFeedbacks(feedbacksData || []);
    } catch (error) {
      console.error('Erro ao carregar dados do artigo:', error);
    } finally {
      setLoading(false);
    }
  };

  const positiveFeedbacks = feedbacks.filter(f => f.useful).length;
  const negativeFeedbacks = feedbacks.filter(f => !f.useful).length;
  const totalFeedbacks = feedbacks.length;
  const approvalRate = totalFeedbacks > 0 ? (positiveFeedbacks / totalFeedbacks) * 100 : 0;

  if (!isOpen || !article) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-black bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-darker-surface border border-neon-purple/20 shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-orbitron font-bold text-white mb-2">
                Detalhes do Artigo
              </h3>
              <p className="text-sm text-futuristic-gray truncate">
                {article.title}
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 text-futuristic-gray hover:text-white transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Métricas Resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-darker-surface/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <ThumbsUp className="h-5 w-5 text-lime-green" />
              </div>
              <p className="text-2xl font-bold text-lime-green">{positiveFeedbacks}</p>
              <p className="text-xs text-futuristic-gray">Positivos</p>
            </div>
            <div className="bg-darker-surface/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <ThumbsDown className="h-5 w-5 text-red-400" />
              </div>
              <p className="text-2xl font-bold text-red-400">{negativeFeedbacks}</p>
              <p className="text-xs text-futuristic-gray">Negativos</p>
            </div>
            <div className="bg-darker-surface/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <MessageCircle className="h-5 w-5 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-blue-400">{comments.length}</p>
              <p className="text-xs text-futuristic-gray">Comentários</p>
            </div>
            <div className="bg-darker-surface/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-neon-purple" />
              </div>
              <p className="text-2xl font-bold text-neon-purple">{Math.round(approvalRate)}%</p>
              <p className="text-xs text-futuristic-gray">Aprovação</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-darker-surface/50 mb-6">
            <button
              onClick={() => setActiveTab('comments')}
              className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'comments'
                  ? 'text-neon-purple border-b-2 border-neon-purple'
                  : 'text-futuristic-gray hover:text-white'
              }`}
            >
              Comentários ({comments.length})
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'feedback'
                  ? 'text-neon-purple border-b-2 border-neon-purple'
                  : 'text-futuristic-gray hover:text-white'
              }`}
            >
              Feedbacks ({feedbacks.length})
            </button>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-purple"></div>
              </div>
            ) : (
              <>
                {activeTab === 'comments' && (
                  <div className="space-y-4">
                    {comments.length > 0 ? (
                      comments.map((comment) => (
                        <div key={comment.id} className="bg-darker-surface/30 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-neon-purple/20 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-neon-purple" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <p className="text-sm font-medium text-white">
                                  {comment.user_name}
                                </p>
                                <div className="flex items-center text-xs text-futuristic-gray">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {format(new Date(comment.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                </div>
                              </div>
                              <p className="text-sm text-futuristic-gray">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <MessageCircle className="h-12 w-12 text-futuristic-gray mx-auto mb-4" />
                        <p className="text-futuristic-gray">Nenhum comentário encontrado</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'feedback' && (
                  <div className="space-y-4">
                    {feedbacks.length > 0 ? (
                      feedbacks.map((feedback) => (
                        <div key={feedback.id} className="bg-darker-surface/30 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                feedback.useful ? 'bg-lime-green/20' : 'bg-red-400/20'
                              }`}>
                                {feedback.useful ? (
                                  <ThumbsUp className="h-4 w-4 text-lime-green" />
                                ) : (
                                  <ThumbsDown className="h-4 w-4 text-red-400" />
                                )}
                              </div>
                              <span className={`text-sm font-medium ${
                                feedback.useful ? 'text-lime-green' : 'text-red-400'
                              }`}>
                                {feedback.useful ? 'Útil' : 'Não útil'}
                              </span>
                            </div>
                            <div className="flex items-center text-xs text-futuristic-gray">
                              <Calendar className="h-3 w-3 mr-1" />
                              {format(new Date(feedback.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <TrendingUp className="h-12 w-12 text-futuristic-gray mx-auto mb-4" />
                        <p className="text-futuristic-gray">Nenhum feedback encontrado</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end mt-6 pt-4 border-t border-darker-surface/50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-futuristic-gray hover:text-white transition-colors duration-200"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};