import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

// Constante para desabilitar comentários se necessário
const COMMENTS_DISABLED = false;

export interface Comment {
  id: string;
  article_id: string;
  user_name: string;
  content: string;
  created_at: string;
  parent_id?: string | null;  // NOVO: ID do comentário pai para respostas
  likes: number;              // NOVO: Contador de curtidas
  replies?: Comment[];        // NOVO: Array de respostas (computed)
}

export interface CommentFormData {
  user_name: string;
  content: string;
  parent_id?: string | null;  // NOVO: Para respostas
}

// Função para verificar se é um ID mock (não é UUID válido)
const isMockId = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return !uuidRegex.test(id);
};

export const useComments = (articleId: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const COMMENTS_PER_PAGE = 10;

  // Função para carregar comentários
  const loadComments = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!articleId || COMMENTS_DISABLED) return;

    // Se for um ID mock, retornar dados mock
    if (isMockId(articleId)) {
      console.log('💬 [COMMENTS] Usando dados mock para ID:', articleId);
      setLoading(false);
      setError(null);
      setComments([
        {
          id: 'mock-1',
          article_id: articleId,
          user_name: 'João Silva',
          content: 'Excelente artigo! Muito esclarecedor sobre o futuro da IA.',
          created_at: '2024-01-20T10:30:00Z',
          parent_id: null,
          likes: 5,
          replies: [
            {
              id: 'mock-1-reply-1',
              article_id: articleId,
              user_name: 'Ana Costa',
              content: 'Concordo! Especialmente a parte sobre machine learning.',
              created_at: '2024-01-20T10:45:00Z',
              parent_id: 'mock-1',
              likes: 2
            }
          ]
        },
        {
          id: 'mock-2',
          article_id: articleId,
          user_name: 'Maria Santos',
          content: 'Concordo plenamente. A IA realmente vai transformar nossa sociedade.',
          created_at: '2024-01-20T11:15:00Z',
          parent_id: null,
          likes: 3,
          replies: []
        },
        {
          id: 'mock-3',
          article_id: articleId,
          user_name: 'Pedro Costa',
          content: 'Muito interessante a parte sobre ética em IA. Precisamos mesmo pensar nisso.',
          created_at: '2024-01-20T12:00:00Z',
          parent_id: null,
          likes: 8,
          replies: []
        }
      ]);
      setHasMore(false);
      return;
    }

    try {
      // Cancelar requisição anterior apenas se ainda estiver ativa
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        abortControllerRef.current.abort();
      }

      // Criar novo AbortController para esta requisição
      const currentController = new AbortController();
      abortControllerRef.current = currentController;
      
      setError(null);
      if (!append) {
        setLoading(true);
      }

      // console.log(`💬 [DEBUG] Carregando comentários - página ${pageNum}, append: ${append}`);
      // Verificar se a requisição foi cancelada antes de fazer a query
      if (currentController.signal.aborted) {
        return;
      }

      const from = (pageNum - 1) * COMMENTS_PER_PAGE;
      const to = from + COMMENTS_PER_PAGE - 1;

      const { data, error: fetchError } = await supabase
        .from('comments')
        .select(`
          *,
          replies:comments!parent_id(
            id,
            user_name,
            content,
            created_at,
            likes,
            parent_id
          )
        `)
        .eq('article_id', articleId)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .range(from, to);

      // Verificar novamente se foi cancelada após a requisição
      if (currentController.signal.aborted) {
        return;
      }

      if (fetchError) {
        throw fetchError;
      }

      const newComments = data || [];
      
      if (append) {
        setComments(prev => [...prev, ...newComments]);
      } else {
        setComments(newComments);
      }

      // Verificar se há mais comentários
      setHasMore(newComments.length === COMMENTS_PER_PAGE);
      
      // console.log(`✅ [DEBUG] Comentários carregados: ${newComments.length}, hasMore: ${newComments.length === COMMENTS_PER_PAGE}`);

    } catch (err) {
      // Não mostrar erro se a requisição foi cancelada
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ Erro ao carregar comentários:', err);
      setError(`Erro ao carregar comentários: ${errorMessage}`);
      toast.error('Erro ao carregar comentários');
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  // Função para carregar mais comentários
  const loadMoreComments = useCallback(async () => {
    if (loading || !hasMore) return;
    
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    await loadComments(nextPage, true);
  }, [currentPage, hasMore, loading, loadComments]);

  // Função para adicionar comentário
  const addComment = useCallback(async (commentData: CommentFormData) => {
    if (!articleId || COMMENTS_DISABLED) return false;

    // Se for um ID mock, simular adição
    if (isMockId(articleId)) {
      console.log('💬 [COMMENTS] Simulando adição de comentário para ID mock:', articleId);
      const newComment: Comment = {
        id: `mock-${Date.now()}`,
        article_id: articleId,
        user_name: commentData.user_name,
        content: commentData.content,
        created_at: new Date().toISOString(),
        parent_id: commentData.parent_id || null,
        likes: 0,
        replies: []
      };
      setComments(prev => [newComment, ...prev]);
      toast.success('Comentário adicionado com sucesso!');
      return true;
    }

    try {
      setSubmitting(true);
      setError(null);

      const { error: insertError } = await supabase
        .from('comments')
        .insert([
          {
            article_id: articleId,
            user_name: commentData.user_name.trim(),
            content: commentData.content.trim(),
            parent_id: commentData.parent_id || null
          }
        ]);

      if (insertError) {
        throw insertError;
      }

      // Recarregar comentários após adicionar
      await loadComments(1, false);
      setCurrentPage(1);
      
      toast.success('Comentário adicionado com sucesso!');
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ Erro ao adicionar comentário:', err);
      setError(`Erro ao adicionar comentário: ${errorMessage}`);
      toast.error('Erro ao adicionar comentário');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [articleId, loadComments]);

  // Função para atualizar comentários
  const refreshComments = useCallback(async () => {
    setCurrentPage(1);
    await loadComments(1, false);
  }, [loadComments]);

  // Carregar comentários iniciais
  useEffect(() => {
    if (articleId) {
      setCurrentPage(1);
      loadComments(1, false);
    }

    // Cleanup: cancelar requisições pendentes
    return () => {
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        abortControllerRef.current.abort();
      }
    };
  }, [articleId, loadComments]);

  // Função para curtir comentário
  const likeComment = useCallback(async (commentId: string) => {
    if (!commentId || COMMENTS_DISABLED) return false;

    // Se for um ID mock, simular curtida
    if (isMockId(commentId)) {
      console.log('💬 [COMMENTS] Simulando curtida para ID mock:', commentId);
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          return { ...comment, likes: comment.likes + 1 };
        }
        // Verificar nas respostas também
        if (comment.replies) {
          const updatedReplies = comment.replies.map(reply => 
            reply.id === commentId ? { ...reply, likes: reply.likes + 1 } : reply
          );
          return { ...comment, replies: updatedReplies };
        }
        return comment;
      }));
      toast.success('Curtida adicionada!');
      return true;
    }

    try {
      // Verificar controle de spam via localStorage
      const likedComments = JSON.parse(localStorage.getItem('likedComments') || '[]');
      if (likedComments.includes(commentId)) {
        toast.error('Você já curtiu este comentário');
        return false;
      }

      const { data, error } = await supabase.rpc('increment_comment_likes', {
        comment_id: commentId
      });

      if (error) {
        throw error;
      }

      // Atualizar localStorage para controle de spam
      likedComments.push(commentId);
      localStorage.setItem('likedComments', JSON.stringify(likedComments));

      // Atualizar estado local
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          return { ...comment, likes: data };
        }
        // Verificar nas respostas também
        if (comment.replies) {
          const updatedReplies = comment.replies.map(reply => 
            reply.id === commentId ? { ...reply, likes: data } : reply
          );
          return { ...comment, replies: updatedReplies };
        }
        return comment;
      }));

      toast.success('Curtida adicionada!');
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ Erro ao curtir comentário:', err);
      toast.error('Erro ao curtir comentário');
      return false;
    }
  }, []);

  return {
    comments,
    loading,
    submitting,
    error,
    hasMore,
    addComment,
    loadMoreComments,
    refreshComments,
    likeComment
  };
};