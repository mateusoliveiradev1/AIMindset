import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, Clock, ThumbsUp, MessageCircle } from 'lucide-react';
import type { Comment, CommentFormData } from '../../hooks/useComments';
import { CommentForm } from './CommentForm';

interface CommentItemProps {
  comment: Comment;
  onLike?: (commentId: string) => Promise<boolean>;
  onReply?: (data: CommentFormData) => Promise<boolean>;
  submitting?: boolean;
}

export const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, 
  onLike, 
  onReply, 
  submitting = false 
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

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
      setShowReplyForm(false);
    }
    return success;
  };

  return (
    <div className="space-y-4">
      {/* Comentário principal */}
      <div className="bg-darker-surface/30 border border-neon-purple/20 rounded-lg p-6 hover:border-neon-purple/40 transition-all duration-300 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          {/* Avatar com gradiente */}
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-neon-purple/30 to-neon-blue/30 rounded-full flex items-center justify-center border border-neon-purple/30">
            <User className="w-6 h-6 text-white" />
          </div>
          
          {/* Conteúdo do comentário */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <h4 className="font-montserrat font-semibold text-white text-base truncate">
                {comment.user_name}
              </h4>
              <div className="flex items-center gap-1 text-xs text-futuristic-gray flex-shrink-0">
                <Clock className="w-3 h-3" />
                <span>{formatDate(comment.created_at)}</span>
              </div>
            </div>
            
            <p className="text-futuristic-gray text-sm leading-relaxed whitespace-pre-wrap break-words mb-4">
              {comment.content}
            </p>

            {/* Botões de ação */}
            <div className="flex items-center gap-4">
              {/* Botão Curtir */}
              {onLike && (
                <button
                  onClick={handleLike}
                  disabled={isLiking}
                  className={`
                    flex items-center gap-2 text-xs transition-all duration-300 touch-target
                    ${isLiking 
                      ? 'text-futuristic-gray/50 cursor-not-allowed' 
                      : 'text-futuristic-gray hover:text-neon-purple hover:scale-105'
                    }
                  `}
                >
                  <ThumbsUp className={`w-4 h-4 ${isLiking ? 'animate-pulse' : ''}`} />
                  <span>{comment.likes || 0}</span>
                </button>
              )}

              {/* Botão Responder */}
              {onReply && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="flex items-center gap-2 text-xs text-futuristic-gray hover:text-lime-green transition-all duration-300 touch-target hover:scale-105"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Responder</span>
                </button>
              )}

              {/* Contador de respostas */}
              {comment.replies && comment.replies.length > 0 && (
                <span className="text-xs text-futuristic-gray">
                  {comment.replies.length} {comment.replies.length === 1 ? 'resposta' : 'respostas'}
                </span>
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
          />
        </div>
      )}

      {/* Respostas */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 sm:ml-12 space-y-4">
          {comment.replies.map((reply) => (
            <div 
              key={reply.id}
              className="bg-darker-surface/20 border border-neon-purple/10 rounded-lg p-4 hover:border-neon-purple/30 transition-all duration-300 backdrop-blur-sm border-l-2 border-l-neon-purple/40"
            >
              <div className="flex items-start gap-3">
                {/* Avatar menor para respostas */}
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-neon-purple/20 to-neon-blue/20 rounded-full flex items-center justify-center border border-neon-purple/20">
                  <User className="w-4 h-4 text-white" />
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
                    {reply.content}
                  </p>

                  {/* Botão curtir para respostas */}
                  {onLike && (
                    <button
                      onClick={() => onLike(reply.id)}
                      className="flex items-center gap-2 text-xs text-futuristic-gray hover:text-neon-purple transition-all duration-300 touch-target hover:scale-105"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>{reply.likes || 0}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};