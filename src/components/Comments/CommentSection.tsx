import React from 'react';
import { CommentList } from './CommentList';
import { CommentForm } from './CommentForm';
import { useComments } from '../../hooks/useComments';

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
    addComment, // Corrigido: usar addComment em vez de submitComment
    loadMoreComments,
    refreshComments
  } = useComments(String(articleId));

  console.log('📊 [DEBUG] CommentSection - Estado atual:', {
    commentsCount: comments.length,
    loading,
    submitting,
    hasMore,
    error
  });

  return (
    <div className="mt-8 space-y-6">
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
              className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {/* Seção de comentários existentes */}
      <CommentList
        comments={comments}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={loadMoreComments}
      />

       {/* Formulário para novo comentário */}
       <CommentForm
         onSubmit={addComment}
         submitting={submitting}
       />
     </div>
   );
 };