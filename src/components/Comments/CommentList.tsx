import React from 'react';
import { Loader2, MessageCircle, Sparkles } from 'lucide-react';
import { CommentItem } from './CommentItem';
import type { Comment, CommentFormData } from '../../hooks/useComments';

interface CommentListProps {
  comments: Comment[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onLike?: (commentId: string) => Promise<boolean>;
  onReply?: (data: CommentFormData) => Promise<boolean>;
  submitting?: boolean;
  fetchReplies?: (parentId: string, page?: number) => Promise<{ replies: Comment[]; hasMore: boolean }>;
  isCommentLiked?: (commentId: string) => boolean;
}

export const CommentList: React.FC<CommentListProps> = ({
  comments,
  loading,
  hasMore,
  onLoadMore,
  onLike,
  onReply,
  submitting,
  fetchReplies,
  isCommentLiked
}) => {
  console.log('🔍 [DEBUG] CommentList - Props recebidas:', {
    commentsLength: comments.length,
    loading,
    hasMore
  });

  if (loading && comments.length === 0) {
    console.log('🔄 [DEBUG] CommentList - Mostrando loading (loading=true, comments=0)');
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-neon-purple" />
        <span className="ml-3 text-futuristic-gray">Carregando comentários...</span>
      </div>
    );
  }

  if (!loading && comments.length === 0) {
    console.log('✨ [DEBUG] CommentList - Mostrando estado vazio (loading=false, comments=0)');
    return (
      <div className="text-center py-12 px-6">
        <div className="relative">
          <MessageCircle className="w-16 h-16 text-futuristic-gray/50 mx-auto mb-4" />
          <Sparkles className="w-6 h-6 text-neon-purple absolute -top-1 -right-2 animate-pulse" />
        </div>
        <h3 className="text-xl font-montserrat font-semibold text-white mb-3">
          Seja o primeiro a comentar!
        </h3>
        <p className="text-futuristic-gray text-base mb-4 max-w-md mx-auto leading-relaxed">
          Compartilhe suas ideias, dúvidas ou experiências sobre este artigo. 
          Sua opinião é valiosa para a comunidade!
        </p>
        <div className="inline-flex items-center gap-2 text-sm text-neon-purple font-medium">
          <Sparkles className="w-4 h-4" />
          <span>Inicie a conversa agora</span>
        </div>
      </div>
    );
  }

  console.log('📝 [DEBUG] CommentList - Mostrando lista de comentários');
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-montserrat font-semibold text-white">
          Comentários ({comments.length})
        </h3>
        <div className="flex items-center gap-2 text-sm text-futuristic-gray">
          <MessageCircle className="w-4 h-4" />
          <span>{comments.length} {comments.length === 1 ? 'comentário' : 'comentários'}</span>
        </div>
      </div>
      
      <div className="space-y-4">
        {comments.map((comment) => (
          <CommentItem 
            key={comment.id} 
            comment={comment} 
            onLike={onLike}
            onReply={onReply}
            submitting={submitting}
            fetchReplies={fetchReplies}
            isCommentLiked={isCommentLiked}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-6">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className={`
              flex items-center gap-3 px-8 py-3 rounded-lg font-medium text-sm
              transition-all duration-300 transform
              ${loading
                ? 'bg-darker-surface/50 text-futuristic-gray cursor-not-allowed'
                : 'bg-gradient-to-r from-neon-purple/20 to-neon-blue/20 text-white hover:from-neon-purple/30 hover:to-neon-blue/30 hover:scale-105 active:scale-95 border border-neon-purple/30 hover:border-neon-purple/50'
              }
            `}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Carregando mais comentários...
              </>
            ) : (
              <>
                <MessageCircle className="w-5 h-5" />
                Carregar mais comentários
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
