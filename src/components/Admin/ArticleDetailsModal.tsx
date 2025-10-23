import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, ThumbsUp, ThumbsDown, MessageCircle, TrendingUp, User, Calendar, AlertCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import { Article } from '../../hooks/useArticles';
import { toast } from 'sonner';
import { useRealTimeMetrics } from '../../hooks/useRealTimeMetrics';

interface Comment {
  id: string;
  article_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

interface Feedback {
  id: string;
  article_id: string;
  useful: boolean;
  created_at: string;
}

interface ArticleDetailsModalProps {
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ArticleDetailsModal: React.FC<ArticleDetailsModalProps> = ({
  isOpen,
  onClose,
  article
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'comments' | 'feedback'>('feedback');
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  // Memoizar articleIds para evitar re-renders desnecessários
  const articleIds = useMemo(() => {
    return article ? [article.id.toString()] : [];
  }, [article?.id]);

  // Usar Real-Time Metrics para dados 100% reais e atualizados
  const { metrics: realTimeMetrics, loading: metricsLoading, lastUpdate } = useRealTimeMetrics(articleIds);

  // Função para carregar dados reais do banco
  const loadRealData = useCallback(async () => {
    if (!article) return;

    console.log('📖 [MODAL] Iniciando carregamento de dados 100% REAIS para:', article.title);
    setLoading(true);
    setError(null);
    
    try {
      // Queries diretas ao Supabase - dados 100% reais
      const [commentsResult, feedbacksResult] = await Promise.allSettled([
        supabase
          .from('comments')
          .select('*')
          .eq('article_id', article.id)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('feedback')
          .select('*')
          .eq('article_id', article.id)
          .order('created_at', { ascending: false })
      ]);

      // Processar resultados - sempre dados reais
      let commentsData: Comment[] = [];
      let feedbacksData: Feedback[] = [];

      if (commentsResult.status === 'fulfilled') {
        commentsData = commentsResult.value?.data || [];
        console.log(`✅ [MODAL] Comentários REAIS carregados: ${commentsData.length}`);
      } else {
        console.warn('⚠️ [MODAL] Erro ao carregar comentários:', commentsResult.reason);
      }

      if (feedbacksResult.status === 'fulfilled') {
        feedbacksData = feedbacksResult.value?.data || [];
        console.log(`✅ [MODAL] Feedbacks REAIS carregados: ${feedbacksData.length}`);
      } else {
        console.warn('⚠️ [MODAL] Erro ao carregar feedbacks:', feedbacksResult.reason);
      }

      console.log(`✅ [MODAL] Dados 100% REAIS carregados: ${commentsData.length} comentários, ${feedbacksData.length} feedbacks`);
      
      setComments(commentsData);
      setFeedbacks(feedbacksData);

    } catch (error: any) {
      console.error('❌ [MODAL] Erro ao carregar dados REAIS:', error);
      setError('Erro ao carregar dados do artigo');
      toast.error('Erro ao carregar dados do artigo');
    } finally {
      setLoading(false);
    }
  }, [article]);

  // Carregar dados quando modal abre
  useEffect(() => {
    if (!isOpen || !article) {
      console.log('🚫 Modal não renderizado - isOpen:', isOpen, 'article:', !!article);
      return;
    }

    console.log('📖 [MODAL] Modal aberto para artigo:', article.title);
    loadRealData();
  }, [isOpen, article, loadRealData]);

  // Configurar Real-Time Subscriptions para atualizações automáticas
  useEffect(() => {
    if (!article || !isOpen) return;

    console.log('📡 [MODAL] Configurando Real-Time Subscriptions para:', article.title);

    // Subscription para comentários
    const commentsChannel = supabase
      .channel(`modal_comments_${article.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `article_id=eq.${article.id}`
        },
        (payload) => {
          console.log('🔄 [MODAL] Comentário atualizado em tempo real:', payload);
          // Recarregar comentários automaticamente
          loadRealData();
          toast.success('Comentários atualizados automaticamente!', {
            duration: 2000,
            position: 'bottom-right'
          });
        }
      )
      .subscribe();

    // Subscription para feedback
    const feedbackChannel = supabase
      .channel(`modal_feedback_${article.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feedback',
          filter: `article_id=eq.${article.id}`
        },
        (payload) => {
          console.log('🔄 [MODAL] Feedback atualizado em tempo real:', payload);
          // Recarregar feedbacks automaticamente
          loadRealData();
          toast.success('Feedbacks atualizados automaticamente!', {
            duration: 2000,
            position: 'bottom-right'
          });
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      console.log('🧹 [MODAL] Limpando subscriptions');
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(feedbackChannel);
    };
  }, [article, isOpen]);

  // Log de atualizações das métricas em tempo real
  useEffect(() => {
    if (lastUpdate && article) {
      console.log(`🔄 [MODAL] Métricas atualizadas em tempo real para ${article.title} às ${lastUpdate.toLocaleTimeString()}`);
    }
  }, [lastUpdate, article]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Só fechar se clicar diretamente no overlay, não nos filhos
    if (e.target === e.currentTarget) {
      console.log('🔒 Fechando modal via overlay');
      onClose();
    }
  };

  const handleCloseClick = () => {
    console.log('🔒 Fechando modal via botão');
    onClose();
  };

  const handleDeleteComment = async (commentId: string) => {
    console.log('🗑️ [DELETE] Iniciando exclusão do comentário:', commentId);
    
    if (!window.confirm('Tem certeza que deseja excluir este comentário? Esta ação não pode ser desfeita.')) {
      console.log('🗑️ [DELETE] Exclusão cancelada pelo usuário');
      return;
    }

    setDeletingCommentId(commentId);
    
    try {
      console.log('🗑️ [DELETE] Executando delete no Supabase...');
      console.log('🗑️ [DELETE] Comment ID:', commentId);
      console.log('🗑️ [DELETE] Usuário atual:', (await supabase.auth.getUser()).data.user?.email);
      
      const { data, error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .select(); // Adicionar select para ver o que foi deletado

      console.log('🗑️ [DELETE] Resposta do Supabase:', { data, error });

      if (error) {
        console.error('🗑️ [DELETE] Erro do Supabase:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('🗑️ [DELETE] Nenhum comentário foi deletado - possível problema de permissão');
        throw new Error('Comentário não encontrado ou sem permissão para excluir');
      }

      console.log('✅ [DELETE] Comentário excluído com sucesso:', data);
      toast.success('Comentário excluído com sucesso!');
      
      // Atualizar lista de comentários IMEDIATAMENTE
      setComments(prev => {
        const updated = prev.filter(comment => comment.id !== commentId);
        console.log('🗑️ [DELETE] Lista atualizada:', updated.length, 'comentários restantes');
        return updated;
      });

      // REMOVIDO: Evento customizado forceMetricsRefresh
      // Sem eventos customizados para evitar múltiplas atualizações e ERR_ABORTED
      
    } catch (error: any) {
      console.error('❌ [DELETE] Erro ao excluir comentário:', error);
      console.error('❌ [DELETE] Stack trace:', error.stack);
      toast.error(`Erro ao excluir comentário: ${error.message}`);
    } finally {
      setDeletingCommentId(null);
      console.log('🗑️ [DELETE] Processo de exclusão finalizado');
    }
  };

  const positiveFeedbacks = Array.isArray(feedbacks) ? feedbacks.filter(f => f?.useful).length : 0;
  const negativeFeedbacks = Array.isArray(feedbacks) ? feedbacks.filter(f => !f?.useful).length : 0;
  const totalFeedbacks = Array.isArray(feedbacks) ? feedbacks.length : 0;
  const approvalRate = totalFeedbacks > 0 ? (positiveFeedbacks / totalFeedbacks) * 100 : 0;

  if (!isOpen || !article) {
    console.log('🚫 Modal não renderizado - isOpen:', isOpen, 'article:', !!article);
    return null;
  }

  console.log('✅ Renderizando modal para:', article.title);

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={handleOverlayClick}
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999
      }}
    >
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-gray-900 border-2 border-purple-500/30 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#1a1a2e',
          borderColor: '#8b5cf6',
          boxShadow: '0 25px 50px -12px rgba(139, 92, 246, 0.25)'
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-purple-500/20 bg-gray-800/50">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-white mb-2 font-mono">
              Detalhes do Artigo
            </h3>
            <p className="text-sm text-gray-300 truncate">
              {article.title}
            </p>
          </div>
          <button
            onClick={handleCloseClick}
            className="ml-4 p-2 text-gray-400 hover:text-white hover:bg-purple-500/20 rounded-lg transition-all duration-200"
            style={{ zIndex: 10000 }}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Error Message */}
          {error && (
            <div className="m-6 p-4 bg-red-500/20 border border-red-500/40 rounded-lg flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-400">Erro ao carregar dados</p>
                <p className="text-xs text-red-300 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Métricas Resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 m-6">
            <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-purple-500/20">
              <div className="flex items-center justify-center mb-2">
                <ThumbsUp className="h-5 w-5 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-green-400">{positiveFeedbacks}</p>
              <p className="text-xs text-gray-400">Positivos</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-purple-500/20">
              <div className="flex items-center justify-center mb-2">
                <ThumbsDown className="h-5 w-5 text-red-400" />
              </div>
              <p className="text-2xl font-bold text-red-400">{negativeFeedbacks}</p>
              <p className="text-xs text-gray-400">Negativos</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-purple-500/20">
              <div className="flex items-center justify-center mb-2">
                <MessageCircle className="h-5 w-5 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-blue-400">{comments.length}</p>
              <p className="text-xs text-gray-400">Comentários</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-purple-500/20">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-purple-400">
                {isNaN(approvalRate) ? '0' : Math.round(approvalRate)}%
              </p>
              <p className="text-xs text-gray-400">Aprovação</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-purple-500/20 mx-6">
            <button
              onClick={() => setActiveTab('comments')}
              className={`px-4 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === 'comments'
                  ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/10'
                  : 'text-gray-400 hover:text-white hover:bg-purple-500/5'
              }`}
            >
              Comentários ({comments.length})
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`px-4 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === 'feedback'
                  ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/10'
                  : 'text-gray-400 hover:text-white hover:bg-purple-500/5'
              }`}
            >
              Feedbacks ({feedbacks.length})
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                <p className="ml-3 text-gray-400">Carregando dados...</p>
              </div>
            ) : (
              <>
                {activeTab === 'comments' && (
                  <div className="space-y-4">
                    {comments.length > 0 ? (
                      comments.map((comment) => (
                        <div key={comment.id} className="bg-gray-800/30 rounded-lg p-4 border border-purple-500/10">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-purple-400" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <p className="text-sm font-medium text-white">
                                  {comment.user_name}
                                </p>
                                <div className="flex items-center text-xs text-gray-400">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {format(new Date(comment.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                </div>
                              </div>
                              <p className="text-sm text-gray-300">
                                {comment.content}
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                disabled={deletingCommentId === comment.id}
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Excluir comentário"
                              >
                                {deletingCommentId === comment.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <MessageCircle className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">Nenhum comentário encontrado</p>
                        <p className="text-xs text-gray-500 mt-2">Este artigo ainda não recebeu comentários</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'feedback' && (
                  <div className="space-y-4">
                    {feedbacks.length > 0 ? (
                      feedbacks.map((feedback) => (
                        <div key={feedback.id} className="bg-gray-800/30 rounded-lg p-4 border border-purple-500/10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                feedback.useful ? 'bg-green-500/20' : 'bg-red-500/20'
                              }`}>
                                {feedback.useful ? (
                                  <ThumbsUp className="h-4 w-4 text-green-400" />
                                ) : (
                                  <ThumbsDown className="h-4 w-4 text-red-400" />
                                )}
                              </div>
                              <span className={`text-sm font-medium ${
                                feedback.useful ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {feedback.useful ? 'Útil' : 'Não útil'}
                              </span>
                            </div>
                            <div className="flex items-center text-xs text-gray-400">
                              <Calendar className="h-3 w-3 mr-1" />
                              {format(new Date(feedback.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <TrendingUp className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">Nenhum feedback encontrado</p>
                        <p className="text-xs text-gray-500 mt-2">Este artigo ainda não recebeu avaliações</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-purple-500/20 bg-gray-800/50">
          <div className="text-xs text-gray-400">
            ID: {article.id} • Atualizado: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
          </div>
          <button
            onClick={handleCloseClick}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-purple-500/20 rounded-lg transition-all duration-200"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );

  // Usar createPortal para renderizar no body
  return createPortal(modalContent, document.body);
};