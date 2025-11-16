import React, { useEffect } from 'react';
import { Zap } from 'lucide-react';
import { CommentList } from './CommentList';
import { CommentForm } from './CommentForm';
import { useComments } from '../../hooks/useComments';
import type { CommentFormData } from '../../hooks/useComments';
import { useRealTimeInteractions } from '../../hooks/useRealTimeInteractions';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

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
    likeComment,
    sortMode,
    setSorting,
    fetchReplies,
    isCommentLiked,
    updateComment,
    deleteComment,
    countReplies,
    replyCounts
  } = useComments(String(articleId));

  const { supabaseUser, isAuthenticated, updateUserName } = useAuth();
  const [editingName, setEditingName] = React.useState(false);
  const [displayName, setDisplayName] = React.useState<string>('');
  const skipSyncUntil = React.useRef<number>(0);
  const [activeReplyId, setActiveReplyId] = React.useState<string | null>(null);
  const [globalMentionNames, setGlobalMentionNames] = React.useState<string[]>([]);

  React.useEffect(() => {
    try {
      const key = `commentsSort:${String(articleId)}`;
      const saved = localStorage.getItem(key);
      if (saved === 'likes' || saved === 'recent') {
        setSorting(saved as any);
        refreshComments();
      }
    } catch {}
  }, [articleId]);

  React.useEffect(() => {
    let canceled = false;
    const loadGlobalNames = async () => {
      if (!isAuthenticated) { setGlobalMentionNames([]); return; }
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('name')
          .limit(100);
        if (error) return;
        const names = (data || [])
          .map((r: any) => r?.name)
          .filter((n: any) => typeof n === 'string' && n.trim());
        if (!canceled) setGlobalMentionNames(Array.from(new Set(names)) as string[]);
      } catch {}
    };
    loadGlobalNames();
    return () => { canceled = true; };
  }, [isAuthenticated]);

  React.useEffect(() => {
    if (editingName) return;
    if (Date.now() < skipSyncUntil.current) return;
    const meta: any = supabaseUser?.user_metadata || {};
    let preferred = '';
    try {
      const key = `aimindset.preferred_name:${supabaseUser?.email || ''}`;
      preferred = localStorage.getItem(key) || '';
    } catch {}
    const initialName = preferred || meta.name || meta.full_name || supabaseUser?.email?.split('@')[0] || '';
    if (initialName && initialName !== displayName) {
      setDisplayName(initialName);
    }
  }, [supabaseUser, editingName]);

  // Sincronizar nome quando user_metadata mudar (após edição)
  React.useEffect(() => {
    if (editingName) return; // Não atualizar se estiver editando
    if (Date.now() < skipSyncUntil.current) return; // Evita sobrescrever imediatamente após salvar
    const meta: any = supabaseUser?.user_metadata || {};
    let preferred = '';
    try {
      const key = `aimindset.preferred_name:${supabaseUser?.email || ''}`;
      preferred = localStorage.getItem(key) || '';
    } catch {}
    const currentName = preferred || meta.name || meta.full_name || supabaseUser?.email?.split('@')[0] || '';
    if (currentName !== displayName && currentName) {
      setDisplayName(currentName);
    }
  }, [supabaseUser?.user_metadata, editingName]);

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

  const handleAddComment = async (commentData: CommentFormData) => {
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

  const handleUpdateComment = async (id: string, content: string) => {
    return updateComment(id, content);
  };

  const handleDeleteComment = async (id: string) => {
    return deleteComment(id);
  };

  const handleGoogleLogin = async () => {
    const siteUrl = import.meta.env.VITE_SITE_URL || import.meta.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${siteUrl}/auth/v1/callback` } });
  };

  const handleSaveDisplayName = async () => {
    if (!isAuthenticated || !supabaseUser) return;
    
    try {
      console.log('💾 Salvando nome de exibição:', displayName.trim());
      
      // Usar a função do contexto para atualizar o nome
      const success = await updateUserName(displayName.trim());
      
      if (!success) {
        console.error('❌ Erro ao atualizar nome no contexto');
        return;
      }
      skipSyncUntil.current = Date.now() + 2000; // Evita piscar para o nome antigo
      setDisplayName(displayName.trim());
      try {
        const key = `aimindset.preferred_name:${supabaseUser?.email || ''}`;
        localStorage.setItem(key, displayName.trim());
      } catch {}
      
      // Atualizar todos os comentários do usuário
      const { error: commentsError } = await supabase
        .from('comments')
        .update({ user_name: displayName.trim() })
        .eq('user_id', supabaseUser.id);
      
      if (commentsError) {
        console.error('❌ Erro ao atualizar comentários:', commentsError);
      }
      
      setEditingName(false);
      await refreshComments();
      
      console.log('✅ Nome de exibição salvo com sucesso!');
    } catch (error) {
      console.error('💥 Erro ao salvar nome:', error);
    }
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
      {!isAuthenticated && (
        <div className="flex justify-center">
          <button
            onClick={handleGoogleLogin}
            className="px-4 py-2 text-xs rounded-md border border-neon-purple/40 text-white hover:bg-neon-purple/20"
          >
            Entrar com Google
          </button>
        </div>
      )}

      {isAuthenticated && (
        <div className="flex items-center justify-between p-3 rounded-md border border-white/10 bg-black/20">
          {!editingName ? (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-futuristic-gray">Nome exibido:</span>
              <span className="text-white font-medium">{displayName || 'Usuário'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="px-3 py-1 text-xs bg-transparent border border-white/10 rounded-md text-white"
              />
              <button onClick={handleSaveDisplayName} className="px-3 py-1 text-xs rounded-md border border-neon-purple/40 text-white hover:bg-neon-purple/20">Salvar</button>
              <button onClick={() => { const meta: any = supabaseUser?.user_metadata || {}; setEditingName(false); setDisplayName(meta.name || meta.full_name || supabaseUser?.email?.split('@')[0] || ''); }} className="px-3 py-1 text-xs rounded-md border border-white/10 text-futuristic-gray hover:bg-white/5">Cancelar</button>
            </div>
          )}
          <div>
            {!editingName ? (
              <button onClick={() => setEditingName(true)} className="px-3 py-1 text-xs rounded-md border border-white/10 text-futuristic-gray hover:bg-white/5">Editar nome</button>
            ) : null}
          </div>
        </div>
      )}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => { setSorting('recent'); try { localStorage.setItem(`commentsSort:${String(articleId)}`, 'recent'); } catch {}; refreshComments(); }}
          disabled={loading}
          className={`px-3 py-1 text-xs rounded-md border ${sortMode === 'recent' ? 'border-neon-purple text-white bg-neon-purple/20' : 'border-neon-purple/20 text-futuristic-gray'}`}
        >
          Mais recentes
        </button>
        <button
          onClick={() => { setSorting('likes'); try { localStorage.setItem(`commentsSort:${String(articleId)}`, 'likes'); } catch {}; refreshComments(); }}
          disabled={loading}
          className={`px-3 py-1 text-xs rounded-md border ${sortMode === 'likes' ? 'border-neon-purple text-white bg-neon-purple/20' : 'border-neon-purple/20 text-futuristic-gray'}`}
        >
          Mais curtidos
        </button>
      </div>
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
        fetchReplies={async (parentId: string, page: number = 1) => fetchReplies(parentId, page)}
        isCommentLiked={(id: string) => isCommentLiked(id)}
        currentUserId={supabaseUser?.id}
        onUpdate={handleUpdateComment}
        onDelete={handleDeleteComment}
        activeReplyId={activeReplyId}
        onActivateReply={(id) => setActiveReplyId(id)}
        countReplies={async (parentId: string) => countReplies(parentId)}
        replyCounts={replyCounts}
      />

      {/* Formulário para adicionar comentário - ocultar quando houver resposta ativa */}
      {!activeReplyId && (
        <CommentForm
          onSubmit={handleAddComment}
          submitting={submitting}
          articleId={String(articleId)}
          mentionSuggestions={[...new Set([
            ...comments.map(c => c.user_name).filter(Boolean),
            ...globalMentionNames
          ])]}
        />
      )}
    </div>
  );
};
