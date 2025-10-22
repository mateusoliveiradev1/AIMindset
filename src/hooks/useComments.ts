import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { validateComment, sanitizeUserName, sanitizeCommentContent } from '../utils/commentValidation';
import { toast } from 'sonner';

export interface Comment {
  id: string;
  article_id: number;
  user_name: string;
  content: string;
  created_at: string;
}

export interface CommentFormData {
  user_name: string;
  content: string;
}

const COMMENTS_PER_PAGE = 10;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export const useComments = (articleId: number) => {
  console.log('🎯 [DEBUG] useComments hook iniciado com articleId:', articleId);
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  
  // Ref para verificar se o componente ainda está montado
  const mountedRef = useRef(true);
  const loadingRef = useRef(false);

  // Função para carregar comentários
  const loadComments = useCallback(async (reset = false, retryCount = 0) => {
    console.log('🚀 [DEBUG] Iniciando loadComments - reset:', reset, 'retryCount:', retryCount);
    
    // Verificar se o componente ainda está montado
    if (!mountedRef.current) {
      console.log('⚠️ [DEBUG] Componente não montado - cancelando loadComments');
      return;
    }

    // Evitar requisições simultâneas
    if (loadingRef.current) {
      console.log('⚠️ [DEBUG] Requisição já em andamento - cancelando loadComments');
      return;
    }

    if (reset) {
      console.log('🔄 [DEBUG] Reset ativado - limpando estado');
      setComments([]);
      setOffset(0);
      setError(null);
    }

    loadingRef.current = true;
    setLoading(true);
    console.log('🔄 [DEBUG] setLoading(true) executado');

    try {
      console.log('📡 [DEBUG] Fazendo requisição ao Supabase para articleId:', articleId);
      
      const { data, error: supabaseError } = await supabase
        .from('comments')
        .select('*')
        .eq('article_id', articleId)
        .order('created_at', { ascending: false })
        .range(reset ? 0 : offset, reset ? COMMENTS_PER_PAGE - 1 : offset + COMMENTS_PER_PAGE - 1);

      console.log('📊 [DEBUG] Resposta do Supabase:', { data, error: supabaseError });
      console.log('📊 [DEBUG] mountedRef.current após requisição:', mountedRef.current);

      // Verificar se o componente ainda está montado após a requisição
      if (!mountedRef.current) {
        console.log('⚠️ [DEBUG] Componente desmontado durante requisição');
        return;
      }

      if (supabaseError) {
        console.error('❌ [DEBUG] Erro do Supabase:', supabaseError);
        throw supabaseError;
      }

      // CORREÇÃO: Sempre processar a resposta, mesmo se data for null ou array vazio
      const commentsData = data || [];
      console.log(`📊 [DEBUG] Processando ${commentsData.length} comentários`);
      
      if (reset) {
        setComments(commentsData);
        setOffset(COMMENTS_PER_PAGE);
      } else {
        setComments(prev => [...prev, ...commentsData]);
        setOffset(prev => prev + COMMENTS_PER_PAGE);
      }
      
      setHasMore(commentsData.length === COMMENTS_PER_PAGE);
      console.log(`✅ [DEBUG] Estado atualizado - hasMore: ${commentsData.length === COMMENTS_PER_PAGE}`);
      console.log(`✅ [DEBUG] Total de comentários carregados: ${reset ? commentsData.length : comments.length + commentsData.length}`);
      
    } catch (err: any) {
      console.log('🚨 [DEBUG] Entrando no catch - erro:', err);
      
      // Verificar se o componente ainda está montado
      if (!mountedRef.current) {
        console.log('⚠️ [DEBUG] Componente não montado no catch - retornando');
        return;
      }

      // Ignorar erros de abort
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        console.log('⚠️ [DEBUG] Erro de abort ignorado');
        return;
      }

      // Retry logic para erros de rede
      if (retryCount < MAX_RETRIES && (
        err.message?.includes('NetworkError') ||
        err.message?.includes('INSUFFICIENT_RESOURCES') ||
        err.message?.includes('Failed to fetch')
      )) {
        console.log(`🔄 [DEBUG] Tentativa ${retryCount + 1}/${MAX_RETRIES} em ${RETRY_DELAY * (retryCount + 1)}ms...`);
        setTimeout(() => {
          if (mountedRef.current) {
            loadComments(reset, retryCount + 1);
          }
        }, RETRY_DELAY * (retryCount + 1));
        return;
      }

      // Se todas as tentativas falharam ou erro não é de rede
      console.error('❌ [DEBUG] Erro final ao carregar comentários:', err);
      setError(err.message || 'Erro ao carregar comentários');
      
    } finally {
      console.log('🏁 [DEBUG] Entrando no finally - mountedRef.current:', mountedRef.current);
      if (mountedRef.current) {
        loadingRef.current = false;
        setLoading(false);
        console.log('🏁 [DEBUG] Finalizando loading - setLoading(false) executado');
      } else {
        console.log('⚠️ [DEBUG] Componente não montado no finally - não executando setLoading(false)');
      }
    }
  }, [articleId, offset]);

  // Função para carregar mais comentários
  const loadMoreComments = useCallback(() => {
    if (!loading && hasMore) {
      loadComments(false);
    }
  }, [loading, hasMore, loadComments]);

  // Função para atualizar comentários
  const refreshComments = useCallback(() => {
    loadComments(true);
  }, [loadComments]);

  // Função para enviar comentário
  const submitComment = useCallback(async (formData: CommentFormData): Promise<boolean> => {
    if (!mountedRef.current) return false;

    setSubmitting(true);
    setError(null);

    try {
      // Validar dados
      const validation = validateComment(formData);
      if (!validation.isValid) {
        toast.error(validation.errors.join(', '));
        return false;
      }

      // Sanitizar dados
      const sanitizedData = {
        article_id: articleId,
        user_name: sanitizeUserName(formData.user_name),
        content: sanitizeCommentContent(formData.content)
      };

      const { error: supabaseError } = await supabase
        .from('comments')
        .insert([sanitizedData]);

      if (supabaseError) {
        throw supabaseError;
      }

      // Recarregar comentários após inserção bem-sucedida
      await loadComments(true);
      
      toast.success('Comentário enviado com sucesso!');
      return true;

    } catch (err: any) {
      console.error('Erro ao enviar comentário:', err);
      const errorMessage = err.message || 'Erro ao enviar comentário';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      if (mountedRef.current) {
        setSubmitting(false);
      }
    }
  }, [articleId, loadComments]);

  // Carregar comentários iniciais quando o articleId muda
  useEffect(() => {
    console.log('🔄 [DEBUG] useEffect disparado - articleId:', articleId);
    
    if (!articleId) {
      console.log('⚠️ [DEBUG] articleId inválido, não carregando comentários');
      setLoading(false);
      return;
    }

    // Reset do estado
    console.log('🔄 [DEBUG] Resetando estado...');
    setComments([]);
    setOffset(0);
    setError(null);
    setHasMore(false);

    // Carregar comentários diretamente sem timeout
    console.log('🚀 [DEBUG] Carregando comentários diretamente');
    loadComments(true);

  }, [articleId]); // REMOVIDO loadComments da dependência

  // Cleanup quando o componente é desmontado
  useEffect(() => {
    // Garantir que o componente está montado no início
    mountedRef.current = true;
    console.log('🔧 [DEBUG] Componente montado - mountedRef.current:', mountedRef.current);
    
    return () => {
      console.log('🧹 [DEBUG] Componente desmontado - cleanup');
      mountedRef.current = false;
    };
  }, []);

  return {
    comments,
    loading,
    submitting,
    hasMore,
    error,
    submitComment,
    loadMoreComments,
    refreshComments
  };
};