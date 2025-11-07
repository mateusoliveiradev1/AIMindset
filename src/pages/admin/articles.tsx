import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { FileText, Search, Filter, Edit3, Trash2, Eye, Star } from 'lucide-react';
import { useArticles } from '@/hooks/useArticles';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import SEOManager from '@/components/SEO/SEOManager';

// Skeleton para linha de artigo (refinado)
const ArticleRowSkeleton: React.FC = () => (
  <div className="flex flex-col lg:flex-row lg:items-center justify-between p-4 bg-darker-surface/30 rounded-lg">
    <div className="flex-1 min-w-0 space-y-2">
      <div className="h-4 w-3/4 bg-gradient-to-r from-neon-purple/20 via-neon-purple/10 to-transparent animate-pulse rounded" />
      <div className="h-3 w-full bg-gradient-to-r from-neon-purple/10 via-neon-purple/5 to-transparent animate-pulse rounded" />
      <div className="flex gap-2">
        <div className="h-3 w-24 bg-gradient-to-r from-neon-purple/10 via-neon-purple/5 to-transparent animate-pulse rounded" />
        <div className="h-3 w-24 bg-gradient-to-r from-neon-purple/10 via-neon-purple/5 to-transparent animate-pulse rounded" />
        <div className="h-3 w-24 bg-gradient-to-r from-neon-purple/10 via-neon-purple/5 to-transparent animate-pulse rounded hidden sm:block" />
      </div>
    </div>
    <div className="flex items-center gap-2 mt-3 lg:mt-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-9 w-9 sm:h-8 sm:w-8 bg-gradient-to-br from-neon-purple/10 to-transparent animate-pulse rounded" />
      ))}
    </div>
  </div>
);

export default function AdminArticles() {
  const navigate = useNavigate();
  const { articles, categories, loading, refreshArticles, updateArticlePublished, deleteArticle, updateArticle } = useArticles();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'updated' | 'title' | 'views'>('updated');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Atalhos de teclado: Ctrl+K ou "/" foca busca, "n" cria novo artigo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const typing = tag === 'input' || tag === 'textarea' || tag === 'select';
      if ((e.key === '/' || (e.ctrlKey && e.key.toLowerCase() === 'k')) && !typing) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key.toLowerCase() === 'n' && !typing) {
        e.preventDefault();
        handleNewArticle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filteredArticles = useMemo(() => {
    const arr = (articles || []).filter((article) => {
      const needle = debouncedSearch.toLowerCase();
      const matchesSearch = (article.title || '').toLowerCase().includes(needle) ||
        (article.content || '').toLowerCase().includes(needle);
      const matchesFilter = filterStatus === 'all' ||
        (filterStatus === 'published' && article.published) ||
        (filterStatus === 'draft' && !article.published);
      const matchesCategory = categoryFilter === 'all' || String(article.category_id) === String(categoryFilter);
      return matchesSearch && matchesFilter && matchesCategory;
    });

    const result = arr.slice();
    result.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'updated':
          return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
        case 'recent':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'views':
    return (b.total_views || 0) - (a.total_views || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [articles, debouncedSearch, filterStatus, categoryFilter, sortBy]);

  const handleNewArticle = () => {
    navigate('/admin/editor');
  };

  const handleEditArticle = (article: any) => {
    const id = article?.id;
    const slug = article?.slug;
    if (slug) {
      navigate(`/admin/editor?slug=${slug}`);
    } else if (id) {
      navigate(`/admin/editor?id=${id}`);
    } else {
      toast.error('Artigo inválido para edição');
    }
  };

  const handleToggleFeaturedManual = async (article: any) => {
    try {
      const next = !(article?.is_featured_manual === true);
      // Se vamos marcar como destaque, desmarcar outros artigos previamente destacados
      if (next) {
        const previouslyFeatured = (articles || []).filter((a) => a.is_featured_manual === true && a.id !== article.id);
        for (const prev of previouslyFeatured) {
          try {
            await updateArticle(prev.id, { is_featured_manual: false });
          } catch (e) {
            console.warn('Falha ao desmarcar destaque anterior', prev.id, e);
          }
        }
      }
      await updateArticle(article.id, { is_featured_manual: next });
      toast.success(next ? 'Marcado como destaque fixo (exclusivo)' : 'Removido do destaque fixo');
      await refreshArticles();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao atualizar destaque');
    }
  };

  const handleTogglePublish = async (id: string, current: boolean) => {
    try {
      await updateArticlePublished(id, !current);
      toast.success(current ? 'Artigo despublicado!' : 'Artigo publicado!');
      await refreshArticles();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao atualizar publicação');
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este artigo?')) return;
    try {
      await deleteArticle(id);
      toast.success('Artigo excluído com sucesso');
      await refreshArticles();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao excluir artigo');
    }
  };

  return (
    <div className="space-y-6">
      <SEOManager metadata={{
        title: 'Artigos - Admin AIMindset',
        description: 'Gerencie artigos, publicação, destaques e métricas.',
        keywords: ['artigos', 'publicação', 'destaque', 'admin'],
        canonicalUrl: 'https://aimindset.com.br/admin/articles',
        type: 'webpage',
        language: 'pt-BR',
        robots: 'noindex, nofollow',
        breadcrumbs: [
          { name: 'Admin', url: 'https://aimindset.com.br/admin', position: 1 },
          { name: 'Artigos', url: 'https://aimindset.com.br/admin/articles', position: 2 }
        ]
      }} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl sm:text-3xl font-orbitron font-bold text-white tracking-tight">Gerenciamento de Artigos</h3>
        <Button onClick={handleNewArticle} className="bg-neon-gradient hover:bg-neon-gradient/80 transition-all duration-200 hover:scale-[1.02] focus:ring-2 focus:ring-neon-purple/30">
          <FileText className="w-4 h-4 mr-2" />
          Novo Artigo
        </Button>
      </div>

      {/* Filters */}
      <Card className="glass-effect">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-futuristic-gray w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar artigos (Ctrl+K ou /)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  ref={searchInputRef}
                  className="w-full pl-10 pr-4 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple text-sm sm:text-base transition-colors"
                />
              </div>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white focus:outline-none focus:border-neon-purple text-sm sm:text-base min-w-0 sm:min-w-[160px] transition-colors"
            >
              <option value="all">Todos</option>
              <option value="published">Publicados</option>
              <option value="draft">Rascunhos</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white focus:outline-none focus:border-neon-purple text-sm sm:text-base min-w-0 sm:min-w-[180px] transition-colors"
            >
              <option value="all">Todas categorias</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white focus:outline-none focus:border-neon-purple text-sm sm:text-base min-w-0 sm:min-w-[160px] transition-colors"
            >
              <option value="updated">Atualizados</option>
              <option value="recent">Recentes</option>
              <option value="title">Título (A–Z)</option>
              <option value="views">Mais vistos</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Articles List */}
      <Card className="glass-effect">
        <div className="p-3 sm:p-6">
          {loading && (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <ArticleRowSkeleton key={i} />
              ))}
            </div>
          )}

          {!loading && filteredArticles.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-gradient-to-br from-futuristic-gray/10 to-futuristic-gray/5 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-futuristic-gray" />
              </div>
              <p className="text-futuristic-gray font-medium">Nenhum artigo encontrado</p>
              <p className="text-futuristic-gray/60 text-sm mt-1">Crie seu primeiro artigo para começar</p>
              <Button className="mt-3 bg-neon-gradient hover:bg-neon-gradient/80 min-h-[40px] px-4 transition-all duration-200 hover:scale-[1.02]" onClick={handleNewArticle}>
                Novo Artigo
              </Button>
            </div>
          )}

          <div className="space-y-4 overflow-x-auto">
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                className="flex flex-col lg:flex-row lg:items-center justify-between p-4 bg-darker-surface/30 rounded-lg hover:bg-darker-surface/50 transition-all duração-200 hover:shadow-lg hover:shadow-neon-purple/20 hover:-translate-y-[1px] ring-1 ring-transparent hover:ring-neon-purple/20 gap-4"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-semibold text-base sm:text-lg mb-1 truncate">{article.title}</h4>
                  <p className="text-futuristic-gray text-xs sm:text-sm mb-2 line-clamp-2">
                    {(article.content || '').substring(0, 100)}...
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs text-futuristic-gray">
                    <span className="truncate">Categoria: {categories.find(c => c.id === article.category_id)?.name || 'N/A'}</span>
                    {article.created_at && (
                      <span>Criado: {new Date(article.created_at).toLocaleDateString('pt-BR')}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => handleEditArticle(article)} aria-label="Editar artigo" title="Editar artigo">
                    <Edit3 className="w-4 h-4" />
                    <span className="ml-1 hidden sm:inline">Editar</span>
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => handleTogglePublish(article.id, article.published)} aria-label={article.published ? 'Despublicar' : 'Publicar'} title={article.published ? 'Despublicar' : 'Publicar'}>
                    {article.published ? 'Despublicar' : 'Publicar'}
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => handleToggleFeaturedManual(article)} aria-label={article.is_featured_manual ? 'Remover destaque' : 'Marcar como destaque'} title={article.is_featured_manual ? 'Remover destaque' : 'Marcar como destaque'}>
                    <Star className={`w-4 h-4 ${article.is_featured_manual ? 'text-yellow-400' : 'text-futuristic-gray'}`} />
                    <span className="ml-1 hidden sm:inline">{article.is_featured_manual ? 'Remover destaque' : 'Destacar'}</span>
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30" onClick={() => handleDeleteArticle(article.id)} aria-label="Excluir artigo" title="Excluir artigo">
                    <Trash2 className="w-4 h-4" />
                    <span className="ml-1 hidden sm:inline">Excluir</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}