import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, Clock } from 'lucide-react';
import type { Comment } from '../../hooks/useComments';

interface CommentItemProps {
  comment: Comment;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
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

  return (
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
          
          <p className="text-futuristic-gray text-sm leading-relaxed whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        </div>
      </div>
    </div>
  );
};