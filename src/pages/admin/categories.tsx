import React, { useMemo, useState } from 'react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { TrendingUp, Search, PlusCircle, Edit3, Trash2, FileText, Brain, BarChart3 } from 'lucide-react';
import { useArticles } from '@/hooks/useArticles';
import { toast } from 'sonner';

export default function AdminCategories() {
  const { categories, articles, loading, error, createCategory, updateCategory, deleteCategory, refresh } = useArticles();

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'with-articles' | 'without-articles'>('all');
  const [form, setForm] = useState<{ id?: string; name: string; slug: string; description?: string }>({ name: '', slug: '', description: '' });
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    return categories
      .filter((category) => {
        const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (category.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          category.slug.toLowerCase().includes(searchTerm.toLowerCase());
        const hasArticles = articles.some(a => a.category_id === category.id);
        const matchesFilter = filter === 'all' || (filter === 'with-articles' && hasArticles) || (filter === 'without-articles' && !hasArticles);
        return matchesSearch && matchesFilter;
      });
  }, [categories, articles, searchTerm, filter]);

  const resetForm = () => setForm({ name: '', slug: '', description: '' });

  const handleCreateOrUpdate = async () => {
    if (!form.name.trim()) {
      toast.error('Nome da categoria é obrigatório');
      return;
    }
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), slug: form.slug.trim() || form.name.toLowerCase().replace(/\s+/g, '-'), description: form.description?.trim() || '' };
      const ok = form.id ? await updateCategory(form.id, payload) : await createCategory(payload as any);
      if (ok) {
        toast.success(form.id ? 'Categoria atualizada!' : 'Categoria criada!');
        resetForm();
        await refresh();
      } else {
        toast.error('Não foi possível salvar a categoria');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar categoria');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (cat: any) => setForm({ id: cat.id, name: cat.name, slug: cat.slug, description: cat.description || '' });
  const handleDelete = async (id: string) => {
    const confirmed = confirm('Deseja excluir esta categoria?');
    if (!confirmed) return;
    const ok = await deleteCategory(id);
    if (ok) {
      toast.success('Categoria excluída');
      await refresh();
    } else {
      toast.error('Falha ao excluir categoria');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-orbitron font-bold text-white">Gerenciamento de Categorias</h3>
          <p className="text-futuristic-gray text-sm">
            Total: {categories.length} categorias • {categories.filter(c => articles.some(a => a.category_id === c.id)).length} com artigos
          </p>
        </div>
        <Button onClick={() => resetForm()} className="bg-neon-gradient hover:bg-neon-gradient/80 whitespace-nowrap">
          <PlusCircle className="w-4 h-4 mr-2" />
          Nova Categoria
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
                  placeholder="Buscar categorias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple w-full sm:w-64"
                />
              </div>
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white focus:outline-none focus:border-neon-purple"
            >
              <option value="all">Todas</option>
              <option value="with-articles">Com artigos</option>
              <option value="without-articles">Sem artigos</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-effect">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-futuristic-gray text-sm">Total de Categorias</p>
                <p className="text-2xl font-bold text-white">{categories.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-lime-green" />
            </div>
          </div>
        </Card>

        <Card className="glass-effect">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-futuristic-gray text-sm">Com Artigos</p>
                <p className="text-2xl font-bold text-white">
                  {categories.filter(c => articles.some(a => a.category_id === c.id)).length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-neon-purple" />
            </div>
          </div>
        </Card>

        <Card className="glass-effect">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-futuristic-gray text-sm">Sem Artigos</p>
                <p className="text-2xl font-bold text-white">
                  {categories.filter(c => !articles.some(a => a.category_id === c.id)).length}
                </p>
              </div>
              <Brain className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
        </Card>

        <Card className="glass-effect">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-futuristic-gray text-sm">Mais Popular</p>
                <p className="text-sm font-medium text-white truncate">
                  {categories.length > 0 
                    ? categories.reduce((prev, current) => {
                        const prevCount = articles.filter(a => a.category_id === prev.id).length;
                        const currentCount = articles.filter(a => a.category_id === current.id).length;
                        return currentCount > prevCount ? current : prev;
                      }).name
                    : 'N/A'
                  }
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Categories List */}
      <Card className="glass-effect">
        <div className="p-6">
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-green mx-auto mb-4"></div>
              <p className="text-futuristic-gray">Carregando categorias...</p>
            </div>
          )}
          {error && <div className="text-red-400 text-sm">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((category) => {
              const articleCount = articles.filter(a => a.category_id === category.id).length;
              return (
                <div key={category.id} className="p-4 bg-darker-surface/30 rounded-lg hover:bg-darker-surface/50 transition-colors border border-neon-purple/10 hover:border-neon-purple/30">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium text-lg mb-1 truncate">{category.name}</h4>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xs px-2 py-1 bg-neon-purple/20 text-neon-purple rounded-full">
                          {category.slug}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          articleCount > 0 
                            ? 'bg-lime-green/20 text-lime-green' 
                            : 'bg-yellow-400/20 text-yellow-400'
                        }`}>
                          {articleCount} artigo{articleCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-2 flex-shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(category)} className="text-yellow-400 hover:text-yellow-300 min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] p-2 sm:p-1 lg:p-2" title="Editar categoria">
                        <Edit3 className="w-4 h-4 sm:w-3 sm:h-3 lg:w-4 lg:h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(category.id)} className="text-red-400 hover:text-red-300 min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] p-2 sm:p-1 lg:p-2" title="Excluir categoria">
                        <Trash2 className="w-4 h-4 sm:w-3 sm:h-3 lg:w-4 lg:h-4" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-futuristic-gray text-xs sm:text-sm mb-3 line-clamp-2">
                    {category.description || 'Sem descrição'}
                  </p>

                  {articleCount > 0 && (
                    <div className="text-xs text-futuristic-gray">
                      <span className="font-medium">Artigos recentes:</span>
                      <div className="mt-1 space-y-1">
                        {articles
                          .filter(a => a.category_id === category.id)
                          .slice(0, 2)
                          .map(article => (
                            <div key={article.id} className="truncate">
                              • {article.title}
                            </div>
                          ))
                        }
                        {articleCount > 2 && (
                          <div className="text-neon-purple">
                            +{articleCount - 2} mais...
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && !loading && (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-futuristic-gray mx-auto mb-4" />
              <h4 className="text-white font-medium text-lg mb-2">
                {searchTerm || filter !== 'all' 
                  ? 'Nenhuma categoria encontrada' 
                  : 'Nenhuma categoria cadastrada'
                }
              </h4>
              <p className="text-futuristic-gray text-sm mb-4">
                {searchTerm || filter !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando sua primeira categoria'
                }
              </p>
              {(!searchTerm && filter === 'all') && (
                <Button onClick={() => resetForm()} className="bg-neon-gradient hover:bg-neon-gradient/80">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Criar Primeira Categoria
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}