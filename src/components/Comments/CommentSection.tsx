import React, { useEffect } from 'react';
import { Zap } from 'lucide-react';
import { CommentList } from './CommentList';
import { CommentForm } from './CommentForm';
import { useComments } from '../../hooks/useComments';
import { useRealTimeInteractions } from '../../hooks/useRealTimeInteractions';

interface CommentSectionProps {
  articleId: string | number;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ articleId }) => {
  const {
    comments,
    loading,
    submitting,
    hasMore,
    error,
    addComment,
    loadMoreComments,
    refreshComments,
    likeComment
  } = useComments(String(articleId));

  // 🚀 NOVO: Hook para tempo real de comentários
  const { 
    stats: realTimeStats, 
    isConnected,
    forceStatsUpdate,
    interactions
  } = useRealTimeInteractions({
    articleIds: [String(articleId)],
    enableNotifications: false, // Sem notificações para não incomodar
    debounceMs: 500 // Resposta rápida para comentários
  });

  // Atualizar comentários quando houver mudanças em tempo real
  useEffect(() => {
    const articleStats = realTimeStats[String(articleId)];
    if (articleStats) {
      // Verificar se há novos comentários
      const lastCommentInteraction = interactions.find(
        interaction => 
          interaction.type === 'comment' && 
          interaction.articleId === String(articleId) &&
          interaction.action === 'insert'
      );
      
      if (lastCommentInteraction) {
        refreshComments();
      }
    }
  }, [realTimeStats, interactions, articleId, refreshComments]);

  const handleAddComment = async (commentData: any) => {
    const success = await addComment(commentData);
    if (success) {
      // Forçar atualização das stats em tempo real
      forceStatsUpdate(String(articleId));
    }
    return success;
  };

  const handleLikeComment = async (commentId: string) => {
    const success = await likeComment(commentId);
    if (success) {
      // Forçar atualização das stats em tempo real
      forceStatsUpdate(String(articleId));
    }
    return success;
  };

  console.log('📊 [DEBUG] CommentSection - Estado atual:', {
    commentsCount: comments.length,
    loading,
    submitting,
    hasMore,
    error,
    realTimeConnected: isConnected
  });

  return (
    <div 
      className="mt-8 space-y-6" 
      data-comments-section="true"
      id="comments"
    >
      {/* 🚀 NOVO: Indicador de tempo real para comentários */}
      {isConnected && (
        <div className="flex items-center justify-center gap-2 text-xs text-lime-green bg-darker-surface/20 rounded-lg p-2 border border-lime-green/20">
          <Zap className="h-3 w-3" />
          <span>Comentários em tempo real ativo</span>
        </div>
      )}

      {/* Mostrar erro de conectividade se houver */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
            <button
              onClick={refreshComments}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {/* Lista de comentários */}
      <CommentList
        comments={comments}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={loadMoreComments}
        onLike={handleLikeComment}
        onReply={handleAddComment}
        submitting={submitting}
      />

      {/* Formulário para adicionar comentário */}
      <CommentForm
        onSubmit={handleAddComment}
        submitting={submitting}
      />
    </div>
  );
};