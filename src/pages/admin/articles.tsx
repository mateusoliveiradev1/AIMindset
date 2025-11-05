import React, { useMemo, useState } from 'react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { FileText, Search, Filter, Edit3, Trash2, Eye, Star } from 'lucide-react';
import { useArticles } from '@/hooks/useArticles';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function AdminArticles() {
  const navigate = useNavigate();
  const { articles, categories, loading, refreshArticles, updateArticlePublished, deleteArticle, updateArticle } = useArticles();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');

  const filteredArticles = useMemo(() => {
    return (articles || [])
      .filter((article) => {
        const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (article.content || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' ||
          (filterStatus === 'published' && article.published) ||
          (filterStatus === 'draft' && !article.published);
        return matchesSearch && matchesFilter;
      });
  }, [articles, searchTerm, filterStatus]);

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-orbitron font-bold text-white">Gerenciamento de Artigos</h3>
        <Button onClick={handleNewArticle} className="bg-neon-gradient hover:bg-neon-gradient/80">
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
                  placeholder="Buscar artigos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple text-sm sm:text-base"
                />
              </div>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white focus:outline-none focus:border-neon-purple text-sm sm:text-base min-w-0 sm:min-w-[160px]"
            >
              <option value="all">Todos</option>
              <option value="published">Publicados</option>
              <option value="draft">Rascunhos</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Articles List */}
      <Card className="glass-effect">
        <div className="p-3 sm:p-6">
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-purple mx-auto mb-4"></div>
              <p className="text-futuristic-gray">Carregando artigos...</p>
            </div>
          )}

          {!loading && filteredArticles.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-gradient-to-br from-futuristic-gray/10 to-futuristic-gray/5 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-futuristic-gray" />
              </div>
              <p className="text-futuristic-gray font-medium">Nenhum artigo encontrado</p>
              <p className="text-futuristic-gray/60 text-sm mt-1">Crie seu primeiro artigo para começar</p>
              <Button className="mt-3 bg-neon-gradient hover:bg-neon-gradient/80 min-h-[40px] px-4" onClick={handleNewArticle}>
                Novo Artigo
              </Button>
            </div>
          )}

          <div className="space-y-4 overflow-x-auto">
            {filteredArticles.map((article) => (
              <div key={article.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-4 bg-darker-surface/30 rounded-lg hover:bg-darker-surface/50 transition-colors gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium text-base sm:text-lg mb-1 truncate">{article.title}</h4>
                  <p className="text-futuristic-gray text-xs sm:text-sm mb-2 line-clamp-2">
                    {(article.content || '').substring(0, 100)}...
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs text-futuristic-gray">
                    <span className="truncate">Categoria: {categories.find(c => c.id === article.category_id)?.name || 'N/A'}</span>
                    {article.created_at && (
                      <span>Criado: {new Date(article.created_at).toLocaleDateString('pt-BR')}</span>
                    )}
                    {article.updated_at && (
                      <span className="hidden sm:inline">Atualizado: {new Date(article.updated_at).toLocaleDateString('pt-BR')}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-2 lg:gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      article.published 
                        ? 'bg-lime-green/20 text-lime-green' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {article.published ? 'Publicado' : 'Rascunho'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-1 lg:space-x-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-blue-400 hover:text-blue-300 min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] p-2 sm:p-1 lg:p-2"
                      onClick={() => navigate(`/artigo/${article.slug}`)}
                      title="Visualizar artigo"
                    >
                      <Eye className="w-4 h-4 sm:w-3 sm:h-3 lg:w-4 lg:h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className={`min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] p-2 sm:p-1 lg:p-2 ${
                        article.is_featured_manual === true
                          ? 'text-neon-purple hover:text-neon-purple/80 bg-neon-purple/10' 
                          : 'text-futuristic-gray hover:text-neon-purple'
                      }`}
                      onClick={() => handleToggleFeaturedManual(article)}
                      title={article.is_featured_manual === true ? 'Remover do destaque fixo' : 'Marcar como destaque fixo (Hero)'}
                    >
                      <Star className={`w-4 h-4 sm:w-3 sm:h-3 lg:w-4 lg:h-4 ${article.is_featured_manual === true ? 'fill-current' : ''}`} />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-yellow-400 hover:text-yellow-300 min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] p-2 sm:p-1 lg:p-2"
                      onClick={() => handleEditArticle(article)}
                      title="Editar artigo"
                    >
                      <Edit3 className="w-4 h-4 sm:w-3 sm:h-3 lg:w-4 lg:h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className={`${article.published ? 'text-orange-400 hover:text-orange-300' : 'text-green-400 hover:text-green-300'} min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] p-2 sm:p-1 lg:p-2`}
                      onClick={() => handleTogglePublish(article.id, article.published)}
                      title={article.published ? 'Despublicar artigo' : 'Publicar artigo'}
                    >
                      {article.published ? 'Despublicar' : 'Publicar'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-red-400 hover:text-red-300 min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] p-2 sm:p-1 lg:p-2"
                      onClick={() => handleDeleteArticle(article.id)}
                      title="Excluir artigo"
                    >
                      <Trash2 className="w-4 h-4 sm:w-3 sm:h-3 lg:w-4 lg:h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}