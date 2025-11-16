import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, Clock, ThumbsUp, MessageCircle } from 'lucide-react';
import { AvatarImage } from '../Performance/ImageOptimizer';
import { useAuth } from '../../contexts/AuthContext';
import type { Comment, CommentFormData } from '../../hooks/useComments';
import { CommentForm } from './CommentForm';

interface CommentItemProps {
  comment: Comment;
  onLike?: (commentId: string) => Promise<boolean>;
  onReply?: (data: CommentFormData) => Promise<boolean>;
  submitting?: boolean;
  fetchReplies?: (parentId: string, page?: number) => Promise<{ replies: Comment[]; hasMore: boolean }>;
  isCommentLiked?: (commentId: string) => boolean;
  currentUserId?: string;
  onUpdate?: (id: string, content: string) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean>;
  activeReplyId?: string | null;
  onActivateReply?: (id: string | null) => void;
  countReplies?: (parentId: string) => Promise<number>;
  initialRepliesCount?: number;
}

export const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, 
  onLike, 
  onReply, 
  submitting = false,
  fetchReplies,
  isCommentLiked,
  currentUserId,
  onUpdate,
  onDelete,
  activeReplyId,
  onActivateReply,
  countReplies,
  initialRepliesCount
}) => {
  const { supabaseUser, user } = useAuth();
  const showReplyForm = activeReplyId === comment.id;
  const [isLiking, setIsLiking] = useState(false);
  const [repliesVisible, setRepliesVisible] = useState(false);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [repliesPage, setRepliesPage] = useState(1);
  const [repliesHasMore, setRepliesHasMore] = useState(false);
  const [replies, setReplies] = useState<Comment[]>(comment.replies || []);
  const [repliesCount, setRepliesCount] = useState<number>(
    typeof initialRepliesCount === 'number' 
      ? initialRepliesCount 
      : (comment.replies ? comment.replies.length : 0)
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { 
        addSuffix: true, 
        locale: ptBR 
      });
    } catch {
      return 'Data inválida';
    }
  };

  const handleLike = async () => {
    if (!onLike || isLiking) return;
    
    setIsLiking(true);
    try {
      await onLike(comment.id);
    } finally {
      setIsLiking(false);
    }
  };

  const handleReply = async (data: CommentFormData) => {
    if (!onReply) return false;
    
    const replyData = {
      ...data,
      parent_id: comment.id
    };
    
    const success = await onReply(replyData);
    if (success) {
      if (onActivateReply) onActivateReply(null);
      setRepliesCount(prev => prev + 1);
      if (repliesVisible && fetchReplies) {
        setRepliesPage(1);
        setRepliesLoading(true);
        const res = await fetchReplies(comment.id, 1);
        setReplies(res.replies);
        setRepliesHasMore(res.hasMore);
        setRepliesLoading(false);
      }
    }
    return success;
  };

  const toggleReplies = async () => {
    if (repliesLoading) return;
    if (!fetchReplies) {
      setRepliesVisible(!repliesVisible);
      return;
    }
    if (!repliesVisible) {
      setRepliesLoading(true);
      const res = await fetchReplies(comment.id, 1);
      setReplies(res.replies);
      setRepliesHasMore(res.hasMore);
      setRepliesPage(1);
      setRepliesCount(Array.isArray(res.replies) ? res.replies.length : 0);
      setRepliesLoading(false);
      setRepliesVisible(true);
    } else {
      setRepliesVisible(false);
    }
  };

  const loadMoreReplies = async () => {
    if (!fetchReplies || repliesLoading || !repliesHasMore) return;
    const next = repliesPage + 1;
    setRepliesLoading(true);
    const res = await fetchReplies(comment.id, next);
    setReplies(prev => [...prev, ...res.replies]);
    setRepliesHasMore(res.hasMore);
    setRepliesPage(next);
    setRepliesCount(prev => prev + (Array.isArray(res.replies) ? res.replies.length : 0));
    setRepliesLoading(false);
  };

  React.useEffect(() => {
    if (typeof initialRepliesCount === 'number') {
      setRepliesCount(initialRepliesCount);
    }
  }, [initialRepliesCount]);

  // Removido fetch automático de contagem para evitar excesso de requisições

  const isOwner = currentUserId && comment.user_id === currentUserId;
  const canEdit = !!onUpdate && !!isOwner;
  const canDelete = !!onDelete && !!isOwner;

  return (
    <div className="space-y-4">
      {/* Comentário principal */}
      <div className="bg-darker-surface/30 border border-neon-purple/20 rounded-lg p-6 hover:border-neon-purple/40 transition-all duration-300 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-12 h-12 ${supabaseUser && comment.user_id === supabaseUser.id ? 'rounded-full ring-2 ring-lime-green/60 shadow-[0_0_12px_rgba(163,230,53,0.25)]' : ''}`}>
            {(() => {
              const own = supabaseUser && comment.user_id === supabaseUser.id;
              const src = own ? (supabaseUser?.user_metadata as any)?.avatar_url : (comment as any).user_avatar_url;
              if (src) return <AvatarImage src={src} alt="Avatar" size={48} />;
              return (
                <div className={`w-12 h-12 bg-gradient-to-br from-neon-purple/30 to-neon-blue/30 rounded-full flex items-center justify-center border ${own ? 'border-lime-green/60' : 'border-neon-purple/30'}`}>
                  <User className="w-6 h-6 text-white" />
                </div>
              );
            })()}
          </div>
          
          {/* Conteúdo do comentário */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <h4 className="font-montserrat font-semibold text-white text-base truncate">
                {(() => {
                  const own = supabaseUser && comment.user_id === supabaseUser.id;
                  if (own) {
                    const meta: any = supabaseUser?.user_metadata || {};
                    return meta.name || meta.full_name || supabaseUser?.email?.split('@')[0] || comment.user_name;
                  }
                  return comment.user_name;
                })()}
              </h4>
              {supabaseUser && comment.user_id === supabaseUser.id && (
                <span className="text-xs text-lime-green border border-lime-green/30 rounded-full px-2 py-[1px]" aria-label="Autor">Autor</span>
              )}
              <div className="flex items-center gap-1 text-xs text-futuristic-gray flex-shrink-0">
                <Clock className="w-3 h-3" />
                <span>{formatDate(comment.created_at)}</span>
              </div>
            </div>
            
            {!isEditing ? (
              <p className="text-futuristic-gray text-sm leading-relaxed whitespace-pre-wrap break-words mb-4">
                {comment.content.split(/(\@[A-Za-zÀ-ÿ\s]{2,50})/g).map((part, i) => part.startsWith('@') ? (
                  <span key={i} className="text-neon-blue">{part}</span>
                ) : (
                  <span key={i}>{part}</span>
                ))}
              </p>
            ) : (
              <div className="mb-4">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full min-h-[90px] text-sm bg-transparent border border-white/10 rounded-md p-2 text-white"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={async () => {
                      if (!onUpdate) return;
                      const ok = await onUpdate(comment.id, editContent);
                      if (ok) setIsEditing(false);
                    }}
                    className="px-3 py-1 text-xs rounded-md border border-neon-purple/40 text-white hover:bg-neon-purple/20"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => { setIsEditing(false); setEditContent(comment.content); }}
                    className="px-3 py-1 text-xs rounded-md border border-white/10 text-futuristic-gray hover:bg-white/5"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex items-center gap-4">
              {/* Botão Curtir */}
              {onLike && (
                <button
                  onClick={handleLike}
                  disabled={isLiking || (isCommentLiked ? isCommentLiked(comment.id) : false)}
                  className={`
                    flex items-center gap-2 text-xs transition-all duration-300 touch-target
                    ${isLiking || (isCommentLiked ? isCommentLiked(comment.id) : false)
                      ? 'text-futuristic-gray/50 cursor-not-allowed'
                      : 'text-futuristic-gray hover:text-neon-purple hover:scale-105'
                    }
                  `}
                  aria-label={`Curtir comentário de ${comment.user_name}`}
                >
                  <ThumbsUp className={`w-4 h-4 ${isLiking ? 'animate-pulse' : ''}`} />
                  <span>{comment.likes || 0}</span>
                </button>
              )}

              {/* Botão Responder */}
              {onReply && !isOwner && (
                <button
                  onClick={() => {
                    if (!onActivateReply) return;
                    onActivateReply(showReplyForm ? null : comment.id);
                  }}
                  className="flex items-center gap-2 text-xs text-futuristic-gray hover:text-lime-green transition-all duration-300 touch-target hover:scale-105"
                  aria-label={`Responder a ${(() => {
                    const own = supabaseUser && comment.user_id === supabaseUser.id;
                    if (own) {
                      const meta: any = supabaseUser?.user_metadata || {};
                      return meta.name || meta.full_name || supabaseUser?.email?.split('@')[0] || comment.user_name;
                    }
                    return comment.user_name;
                  })()}`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Responder</span>
                </button>
              )}

              {/* Contador de respostas */}
              <button onClick={toggleReplies} disabled={repliesLoading} className={`text-xs transition-all duration-300 ${repliesLoading ? 'text-futuristic-gray/50 cursor-not-allowed' : 'text-futuristic-gray hover:text-neon-blue'}`} aria-expanded={repliesVisible} aria-controls={`replies_${comment.id}`}>
                {repliesLoading ? 'Carregando respostas...' : (repliesVisible ? `Ocultar respostas (${repliesCount})` : `Ver respostas (${repliesCount})`)}
              </button>

              {canEdit && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-futuristic-gray hover:text-white transition-all duration-300"
                  aria-label="Editar comentário"
                >
                  Editar
                </button>
              )}

              {canDelete && (
                <button
                  onClick={async () => { if (onDelete) await onDelete(comment.id); }}
                  className="text-xs text-red-400 hover:text-red-300 transition-all duration-300"
                  aria-label="Excluir comentário"
                >
                  Excluir
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Formulário de resposta */}
      {showReplyForm && onReply && (
        <div className="ml-8 sm:ml-12">
          <CommentForm 
            onSubmit={handleReply}
            submitting={submitting}
            parentId={comment.id}
            placeholder="Escreva sua resposta..."
            compact={true}
            replyingToName={comment.user_name}
            autoFocus={true}
            articleId={comment.article_id}
            onCancel={() => onActivateReply && onActivateReply(null)}
            mentionSuggestions={[...new Set([comment.user_name, ...replies.map(r => r.user_name)].filter(Boolean))]}
          />
          <div className="mt-2">
            <button
              onClick={() => onActivateReply && onActivateReply(null)}
              className="text-xs text-futuristic-gray hover:text-white transition-all duration-300"
            >
              Cancelar resposta
            </button>
          </div>
        </div>
      )}

      {/* Respostas */}
      {repliesVisible && (
        <div id={`replies_${comment.id}`} className="ml-8 sm:ml-12 space-y-4">
          {replies.map((reply) => (
            <div 
              key={reply.id}
              className="bg-darker-surface/20 border border-neon-purple/10 rounded-lg p-4 hover:border-neon-purple/30 transition-all duration-300 backdrop-blur-sm border-l-2 border-l-neon-purple/40"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8">
                  {(() => {
                    const own = supabaseUser && reply.user_id === supabaseUser.id;
                    const src = own ? (supabaseUser?.user_metadata as any)?.avatar_url : (reply as any).user_avatar_url;
                    if (src) return <AvatarImage src={src} alt="Avatar" size={32} />;
                    return (
                      <div className="w-8 h-8 bg-gradient-to-br from-neon-purple/20 to-neon-blue/20 rounded-full flex items-center justify-center border border-neon-purple/20">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    );
                  })()}
                </div>
                
                {/* Conteúdo da resposta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h5 className="font-montserrat font-medium text-white text-sm truncate">
                      {reply.user_name}
                    </h5>
                    <div className="flex items-center gap-1 text-xs text-futuristic-gray flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(reply.created_at)}</span>
                    </div>
                  </div>
                  
                  <p className="text-futuristic-gray text-sm leading-relaxed whitespace-pre-wrap break-words mb-3">
                    {reply.content.split(/(\@[A-Za-zÀ-ÿ\s]{2,50})/g).map((part, i) => part.startsWith('@') ? (
                      <span key={i} className="text-neon-blue">{part}</span>
                    ) : (
                      <span key={i}>{part}</span>
                    ))}
                  </p>

                  {/* Botão curtir para respostas */}
                  {onLike && (
                    <button
                      onClick={() => onLike(reply.id)}
                      disabled={isCommentLiked ? isCommentLiked(reply.id) : false}
                      className={`flex items-center gap-2 text-xs transition-all duration-300 touch-target ${isCommentLiked && isCommentLiked(reply.id) ? 'text-futuristic-gray/50 cursor-not-allowed' : 'text-futuristic-gray hover:text-neon-purple hover:scale-105'}`}
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>{reply.likes || 0}</span>
                    </button>
                  )}

                  {currentUserId && reply.user_id === currentUserId && onDelete && (
                    <button
                      onClick={async () => { await onDelete(reply.id); }}
                      className="ml-3 text-xs text-red-400 hover:text-red-300 transition-all duration-300"
                    >
                      Excluir
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div className="flex justify-center pt-2">
            <button onClick={loadMoreReplies} disabled={repliesLoading || !repliesHasMore} className={`text-xs px-4 py-1 rounded-md border ${repliesHasMore ? 'border-neon-purple/30 text-white' : 'border-neon-purple/20 text-futuristic-gray cursor-not-allowed'}`}>
              {repliesLoading ? 'Carregando respostas...' : (repliesHasMore ? 'Carregar mais respostas' : 'Sem mais respostas')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
