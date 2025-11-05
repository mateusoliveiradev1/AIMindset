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
  parent_id?: string | null;
  likes: number;
  replies?: Comment[];
}

interface Feedback {
  id: string;
  article_id: string;
  type: 'positive' | 'negative';
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
  const [activeTab, setActiveTab] = useState<'comments' | 'feedback' | 'stats'>('feedback');
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
          .select('id, article_id, user_name, content, created_at, parent_id, likes')
          .eq('article_id', article.id)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('feedbacks')
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
          table: 'feedbacks',
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

  // Bloquear scroll do body quando o modal estiver aberto (dentro do componente)
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = 'hidden';
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
    return;
  }, [isOpen]);

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

  const positiveFeedbacks = Array.isArray(feedbacks) ? feedbacks.filter(f => f?.type === 'positive').length : 0;
  const negativeFeedbacks = Array.isArray(feedbacks) ? feedbacks.filter(f => f?.type === 'negative').length : 0;
  const totalFeedbacks = Array.isArray(feedbacks) ? feedbacks.length : 0;
  const approvalRate = totalFeedbacks > 0 ? (positiveFeedbacks / totalFeedbacks) * 100 : 0;

  // Métricas de comentários aprimoradas
  const totalComments = Array.isArray(comments) ? comments.length : 0;
  const totalLikes = Array.isArray(comments) ? comments.reduce((sum, comment) => sum + (comment.likes || 0), 0) : 0;
  const repliesCount = Array.isArray(comments) ? comments.filter(comment => comment.parent_id).length : 0;
  const mainCommentsCount = totalComments - repliesCount;
  const averageLikesPerComment = totalComments > 0 ? (totalLikes / totalComments).toFixed(1) : '0';
  
  // Organizar comentários em estrutura hierárquica
  const organizedComments = useMemo(() => {
    if (!Array.isArray(comments)) return [];
    
    const mainComments = comments.filter(comment => !comment.parent_id);
    const repliesMap = new Map<string, Comment[]>();
    
    // Agrupar respostas por comentário pai
    comments.filter(comment => comment.parent_id).forEach(reply => {
      const parentId = reply.parent_id!;
      if (!repliesMap.has(parentId)) {
        repliesMap.set(parentId, []);
      }
      repliesMap.get(parentId)!.push(reply);
    });
    
    // Adicionar respostas aos comentários principais
    return mainComments.map(comment => ({
      ...comment,
      replies: repliesMap.get(comment.id) || []
    }));
  }, [comments]);

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
        className="relative w-full max-w-4xl max-h-[90vh] glass-effect backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 ring-1 ring-white/10 shadow-[0_20px_60px_rgba(99,102,241,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/10 bg-black/20">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-orbitron font-bold text-white mb-2">
              Detalhes do Artigo
            </h3>
            <p className="text-[11px] font-orbitron tracking-wide text-futuristic-gray truncate">
              {article.title}
            </p>
          </div>
          <button
            onClick={handleCloseClick}
            className="ml-4 p-2 text-futuristic-gray hover:text-white hover:bg-white/10 rounded-lg ring-1 ring-white/10 transition-all duration-200"
            style={{ zIndex: 10000 }}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Error Message */}
          {error && (
            <div className="m-6 p-4 bg-red-400/10 border border-red-400/30 ring-1 ring-red-400/10 rounded-lg flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-[11px] font-orbitron tracking-wide text-red-300">Erro ao carregar dados</p>
                <p className="text-[11px] font-orbitron tracking-wide text-red-300 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Métricas Resumo */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 m-6">
            <div className="relative overflow-hidden glass-effect backdrop-blur-sm rounded-xl p-4 text-center border border-white/10 ring-1 ring-white/10 hover:shadow-[0_8px_30px_rgba(99,102,241,0.25)]">
              <div className="flex items-center justify-center mb-2">
                <ThumbsUp className="h-5 w-5 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-green-400">{positiveFeedbacks}</p>
              <p className="text-[11px] font-orbitron tracking-wide text-futuristic-gray">Positivos</p>
            </div>
            <div className="relative overflow-hidden glass-effect backdrop-blur-sm rounded-xl p-4 text-center border border-white/10 ring-1 ring-white/10 hover:shadow-[0_8px_30px_rgba(99,102,241,0.25)]">
              <div className="flex items-center justify-center mb-2">
                <ThumbsDown className="h-5 w-5 text-red-400" />
              </div>
              <p className="text-2xl font-bold text-red-400">{negativeFeedbacks}</p>
              <p className="text-[11px] font-orbitron tracking-wide text-futuristic-gray">Negativos</p>
            </div>
            <div className="relative overflow-hidden glass-effect backdrop-blur-sm rounded-xl p-4 text-center border border-white/10 ring-1 ring-white/10 hover:shadow-[0_8px_30px_rgba(99,102,241,0.25)]">
              <div className="flex items-center justify-center mb-2">
                <MessageCircle className="h-5 w-5 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-blue-400">{totalComments}</p>
              <p className="text-[11px] font-orbitron tracking-wide text-futuristic-gray">Comentários</p>
            </div>
            <div className="relative overflow-hidden glass-effect backdrop-blur-sm rounded-xl p-4 text-center border border-white/10 ring-1 ring-white/10 hover:shadow-[0_8px_30px_rgba(99,102,241,0.25)]">
              <div className="flex items-center justify-center mb-2">
                <ThumbsUp className="h-5 w-5 text-yellow-400" />
              </div>
              <p className="text-2xl font-bold text-yellow-400">{totalLikes}</p>
              <p className="text-[11px] font-orbitron tracking-wide text-futuristic-gray">Curtidas</p>
            </div>
            <div className="relative overflow-hidden glass-effect backdrop-blur-sm rounded-xl p-4 text-center border border-white/10 ring-1 ring-white/10 hover:shadow-[0_8px_30px_rgba(99,102,241,0.25)]">
              <div className="flex items-center justify-center mb-2">
                <MessageCircle className="h-5 w-5 text-cyan-400" />
              </div>
              <p className="text-2xl font-bold text-cyan-400">{repliesCount}</p>
              <p className="text-[11px] font-orbitron tracking-wide text-futuristic-gray">Respostas</p>
            </div>
            <div className="relative overflow-hidden glass-effect backdrop-blur-sm rounded-xl p-4 text-center border border-white/10 ring-1 ring-white/10 hover:shadow-[0_8px_30px_rgba(99,102,241,0.25)]">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-purple-400">{averageLikesPerComment}</p>
              <p className="text-[11px] font-orbitron tracking-wide text-futuristic-gray">Média Curtidas</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10 mx-6">
            <button
              onClick={() => setActiveTab('comments')}
              className={`px-4 py-3 text-[11px] font-orbitron tracking-wide transition-all duration-200 ${
                activeTab === 'comments'
                  ? 'text-neon-purple border-b-2 border-neon-purple bg-neon-purple/10'
                  : 'text-futuristic-gray hover:text-white hover:bg-white/5'
              }`}
            >
              Comentários ({totalComments})
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`px-4 py-3 text-[11px] font-orbitron tracking-wide transition-all duration-200 ${
                activeTab === 'feedback'
                  ? 'text-neon-purple border-b-2 border-neon-purple bg-neon-purple/10'
                  : 'text-futuristic-gray hover:text-white hover:bg-white/5'
              }`}
            >
              Feedbacks ({feedbacks.length})
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-3 text-[11px] font-orbitron tracking-wide transition-all duration-200 ${
                activeTab === 'stats'
                  ? 'text-neon-purple border-b-2 border-neon-purple bg-neon-purple/10'
                  : 'text-futuristic-gray hover:text-white hover:bg-white/5'
              }`}
            >
              Estatísticas
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-purple"></div>
                <p className="ml-3 text-futuristic-gray">Carregando dados...</p>
              </div>
            ) : (
              <>
                {activeTab === 'comments' && (
                  <div className="space-y-4">
                    {organizedComments.length > 0 ? (
                      organizedComments.map((comment) => (
                        <div key={comment.id} className="space-y-3">
                          {/* Comentário Principal */}
                          <div className="relative overflow-hidden glass-effect backdrop-blur-sm rounded-xl p-4 border border-white/10 ring-1 ring-white/10 hover:shadow-[0_8px_30px_rgba(99,102,241,0.25)]">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-neon-purple/20 rounded-full ring-1 ring-white/10 flex items-center justify-center">
                                  <User className="h-4 w-4 text-neon-purple" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <p className="text-sm font-semibold text-white">
                                    {comment.user_name}
                                  </p>
                                  <div className="flex items-center text-[11px] font-orbitron tracking-wide text-futuristic-gray">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {format(new Date(comment.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                  </div>
                                  <div className="flex items-center text-[11px] font-orbitron tracking-wide text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-full ring-1 ring-white/10">
                                    <ThumbsUp className="h-3 w-3 mr-1" />
                                    {comment.likes || 0}
                                  </div>
                                </div>
                                <p className="text-sm text-futuristic-gray">
                                  {comment.content}
                                </p>
                              </div>
                              <div className="flex-shrink-0">
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  disabled={deletingCommentId === comment.id}
                                  className="p-2 text-futuristic-gray hover:text-red-400 hover:bg-red-500/10 rounded-lg ring-1 ring-white/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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

                          {/* Respostas (indentadas) */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="ml-8 space-y-2">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className="relative overflow-hidden glass-effect backdrop-blur-sm rounded-xl p-3 border border-white/10 ring-1 ring-white/10 hover:shadow-[0_8px_30px_rgba(99,102,241,0.25)] border-l-4 border-l-cyan-400">
                                  <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                      <div className="w-6 h-6 bg-cyan-500/20 rounded-full ring-1 ring-white/10 flex items-center justify-center">
                                        <User className="h-3 w-3 text-cyan-400" />
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <p className="text-sm font-semibold text-white">
                                          {reply.user_name}
                                        </p>
                                        <div className="flex items-center text-[11px] font-orbitron tracking-wide text-futuristic-gray">
                                          <Calendar className="h-3 w-3 mr-1" />
                                          {format(new Date(reply.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                        </div>
                                      </div>
                                      <p className="text-sm text-futuristic-gray">
                                        {reply.content}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-futuristic-gray">Este artigo ainda não recebeu comentários</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'feedback' && (
                  <div className="space-y-4">
                    {feedbacks.length > 0 ? (
                      feedbacks.map((feedback) => (
                        <div key={feedback.id} className="relative overflow-hidden glass-effect backdrop-blur-sm rounded-xl p-4 border border-white/10 ring-1 ring-white/10 hover:shadow-[0_8px_30px_rgba(99,102,241,0.25)]">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full ring-1 ring-white/10 flex items-center justify-center ${
                                feedback.type === 'positive' ? 'bg-green-500/20' : 'bg-red-500/20'
                              }`}>
                                {feedback.type === 'positive' ? (
                                  <ThumbsUp className="h-4 w-4 text-green-400" />
                                ) : (
                                  <ThumbsDown className="h-4 w-4 text-red-400" />
                                )}
                              </div>
                              <span className={`text-sm font-medium ${
                                feedback.type === 'positive' ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {feedback.type === 'positive' ? 'Útil' : 'Não útil'}
                              </span>
                            </div>
                            <div className="flex items-center text-[11px] font-orbitron tracking-wide text-futuristic-gray">
                              <Calendar className="h-3 w-3 mr-1" />
                              {format(new Date(feedback.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-futuristic-gray">Nenhum feedback registrado</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'stats' && (
                  <div className="space-y-4">
                    <div className="relative overflow-hidden glass-effect backdrop-blur-sm rounded-xl p-4 border border-white/10 ring-1 ring-white/10">
                      <h5 className="text-[11px] font-orbitron tracking-wide text-futuristic-gray uppercase">Resumo</h5>
                      <div className="space-y-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-orbitron tracking-wide text-futuristic-gray">Total de feedbacks:</span>
                          <span className="text-sm font-medium text-white">{totalFeedbacks}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-orbitron tracking-wide text-futuristic-gray">Feedbacks positivos:</span>
                          <span className="text-sm font-medium text-lime-green">{positiveFeedbacks}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-orbitron tracking-wide text-futuristic-gray">Feedbacks negativos:</span>
                          <span className="text-sm font-medium text-red-400">{negativeFeedbacks}</span>
                        </div>
                      </div>
                    </div>
                    <div className="relative overflow-hidden glass-effect backdrop-blur-sm rounded-xl p-4 border border-white/10 ring-1 ring-white/10">
                      <h5 className="text-[11px] font-orbitron tracking-wide text-futuristic-gray uppercase">Métricas</h5>
                      <div className="space-y-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-orbitron tracking-wide text-futuristic-gray">Taxa de aprovação:</span>
                          <span className="text-sm font-medium text-neon-purple">{approvalRate.toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-orbitron tracking-wide text-futuristic-gray">Comentários principais:</span>
                          <span className="text-sm font-medium text-white">{mainCommentsCount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-orbitron tracking-wide text-futuristic-gray">Curtidas totais:</span>
                          <span className="text-sm font-medium text-yellow-400">{totalLikes}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Usar createPortal para renderizar no body
  return createPortal(modalContent, document.body);
};