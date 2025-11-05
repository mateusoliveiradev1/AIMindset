import React, { useMemo, useState } from 'react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { TrendingUp, Search, PlusCircle, Edit3, Trash2, FileText, Brain, BarChart3, X } from 'lucide-react';
import { useArticles } from '@/hooks/useArticles';
import { toast } from 'sonner';

export default function AdminCategories() {
  const { categories, articles, loading, error, createCategory, updateCategory, deleteCategory, refresh } = useArticles();

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'with-articles' | 'without-articles'>('all');
  const [form, setForm] = useState<{ id?: string; name: string; slug: string; description?: string }>({ name: '', slug: '', description: '' });
  const [saving, setSaving] = useState(false);

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<any | null>(null);

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
        setShowEditModal(false);
        setShowNewModal(false);
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

  const handleEdit = (cat: any) => {
    setForm({ id: cat.id, name: cat.name, slug: cat.slug, description: cat.description || '' });
    setShowEditModal(true);
  };

  const handleAskDelete = (cat: any) => {
    setCategoryToDelete(cat);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    const hasArticles = articles.some(a => a.category_id === categoryToDelete.id);
    if (hasArticles) {
      toast.error('Não é possível excluir: há artigos vinculados.');
      return;
    }
    const ok = await deleteCategory(categoryToDelete.id);
    if (ok) {
      toast.success('Categoria excluída');
      setCategoryToDelete(null);
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
        <Button onClick={() => { resetForm(); setShowNewModal(true); }} className="bg-neon-gradient hover:bg-neon-gradient/80 whitespace-nowrap" title="Criar nova categoria">
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
        <Card className="glass-effect transition-all duration-300 hover:scale-[1.01]">
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

        <Card className="glass-effect transition-all duration-300 hover:scale-[1.01]">
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

        <Card className="glass-effect transition-all duration-300 hover:scale-[1.01]">
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

        <Card className="glass-effect transition-all duration-300 hover:scale-[1.01]">
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
                <div key={category.id} className="p-4 bg-darker-surface/30 rounded-lg hover:bg-darker-surface/50 transition-all duration-300 border border-neon-purple/10 hover:border-neon-purple/30 hover:shadow-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium text-lg mb-1 truncate">{category.name}</h4>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xs px-2 py-1 bg-neon-purple/20 text-neon-purple rounded-full">
                          {category.slug}
                        </span>
                        <span className={`${'text-xs px-2 py-1 rounded-full '} ${
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
                      <Button size="sm" variant="ghost" onClick={() => handleAskDelete(category)} className="text-red-400 hover:text-red-300 min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] p-2 sm:p-1 lg:p-2" title="Excluir categoria">
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
                <Button onClick={() => { resetForm(); setShowNewModal(true); }} className="bg-neon-gradient hover:bg-neon-gradient/80" title="Criar primeira categoria">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Criar Primeira Categoria
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Modal de Edição */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
          <div className="bg-darker-surface border border-neon-purple/20 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-orbitron font-bold text-white">Editar Categoria</h3>
              <button onClick={() => { setShowEditModal(false); }} className="text-futuristic-gray hover:text-white" aria-label="Fechar">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-futuristic-gray text-sm mb-2">Nome *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple"
                  placeholder="Ex: Inteligência Artificial"
                />
              </div>
              <div>
                <label className="block text-futuristic-gray text-sm mb-2">Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple"
                  placeholder="inteligencia-artificial"
                />
              </div>
              <div>
                <label className="block text-futuristic-gray text-sm mb-2">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple"
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button onClick={() => setShowEditModal(false)} variant="outline" className="flex-1">Cancelar</Button>
              <Button onClick={handleCreateOrUpdate} className="flex-1 bg-neon-gradient hover:bg-neon-gradient/80" disabled={saving || !form.name.trim() || !form.slug.trim()}>
                Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Categoria */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
          <div className="bg-darker-surface border border-neon-purple/20 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-orbitron font-bold text-white">Nova Categoria</h3>
              <button onClick={() => { setShowNewModal(false); }} className="text-futuristic-gray hover:text-white" aria-label="Fechar">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-futuristic-gray text-sm mb-2">Nome *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple"
                  placeholder="Ex: Desenvolvimento Web"
                />
              </div>
              <div>
                <label className="block text-futuristic-gray text-sm mb-2">Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple"
                  placeholder="desenvolvimento-web"
                />
              </div>
              <div>
                <label className="block text-futuristic-gray text-sm mb-2">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple"
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button onClick={() => setShowNewModal(false)} variant="outline" className="flex-1">Cancelar</Button>
              <Button onClick={handleCreateOrUpdate} className="flex-1 bg-neon-gradient hover:bg-neon-gradient/80" disabled={saving || !form.name.trim() || !form.slug.trim()}>
                Criar Categoria
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {categoryToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
          <div className="bg-darker-surface border border-neon-purple/20 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-orbitron font-bold text-white">Excluir Categoria</h3>
              <button onClick={() => setCategoryToDelete(null)} className="text-futuristic-gray hover:text-white" aria-label="Fechar">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-futuristic-gray mb-4">Tem certeza que deseja excluir <span className="text-white font-medium">{categoryToDelete.name}</span>?</p>
            {(() => {
              const count = articles.filter(a => a.category_id === categoryToDelete.id).length;
              const blocked = count > 0;
              return (
                <div className="space-y-2">
                  <p className={`text-sm ${blocked ? 'text-yellow-400' : 'text-futuristic-gray'}`}>
                    {blocked ? `Ação bloqueada: ${count} artigo${count !== 1 ? 's' : ''} vinculado${count !== 1 ? 's' : ''}.` : 'Esta ação é permanente.'}
                  </p>
                  <div className="flex gap-3 mt-4">
                    <Button onClick={() => setCategoryToDelete(null)} variant="outline" className="flex-1">Cancelar</Button>
                    <Button onClick={confirmDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white" disabled={blocked}>
                      Excluir
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}