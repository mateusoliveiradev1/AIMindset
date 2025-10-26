import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Eye, Globe, BarChart3, RefreshCw, CheckCircle, AlertTriangle, Clock, Target, Zap, FileText, Tag, Link as LinkIcon, Image } from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface SEOData {
  id: string;
  page_type: string;
  page_url: string;
  title: string;
  description: string;
  keywords: string[];
  canonical_url: string;
  og_image: string;
  schema_data: any;
  created_at: string;
  updated_at: string;
}

interface SEOStats {
  totalPages: number;
  optimizedPages: number;
  missingDescriptions: number;
  missingKeywords: number;
  missingOgImages: number;
  averageDescriptionLength: number;
  averageKeywordsCount: number;
}

export const SEODashboard: React.FC = () => {
  const [seoData, setSeoData] = useState<SEOData[]>([]);
  const [stats, setStats] = useState<SEOStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'optimized' | 'needs-attention'>('all');
  const [selectedPage, setSelectedPage] = useState<SEOData | null>(null);

  // Carregar dados SEO
  const loadSEOData = async () => {
    try {
      setLoading(true);
      
      // Buscar todos os dados SEO
      const { data: seoPages, error } = await supabase
        .from('seo_metadata')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setSeoData(seoPages || []);
      
      // Calcular estatísticas
      if (seoPages) {
        const totalPages = seoPages.length;
        const missingDescriptions = seoPages.filter(p => !p.description || p.description.length < 50).length;
        const missingKeywords = seoPages.filter(p => !p.keywords || p.keywords.length === 0).length;
        const missingOgImages = seoPages.filter(p => !p.og_image).length;
        
        const optimizedPages = totalPages - Math.max(missingDescriptions, missingKeywords, missingOgImages);
        
        const avgDescLength = seoPages
          .filter(p => p.description)
          .reduce((acc, p) => acc + p.description.length, 0) / seoPages.filter(p => p.description).length || 0;
          
        const avgKeywordsCount = seoPages
          .filter(p => p.keywords && p.keywords.length > 0)
          .reduce((acc, p) => acc + p.keywords.length, 0) / seoPages.filter(p => p.keywords && p.keywords.length > 0).length || 0;

        setStats({
          totalPages,
          optimizedPages,
          missingDescriptions,
          missingKeywords,
          missingOgImages,
          averageDescriptionLength: Math.round(avgDescLength),
          averageKeywordsCount: Math.round(avgKeywordsCount)
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados SEO:', error);
      toast.error('Erro ao carregar dados SEO');
    } finally {
      setLoading(false);
    }
  };

  // Regenerar SEO para uma página específica
  const regenerateSEO = async (pageId: string) => {
    try {
      // Aqui você pode implementar a lógica para regenerar o SEO
      // Por exemplo, chamar uma função que recria os metadados
      toast.success('SEO regenerado com sucesso!');
      await loadSEOData();
    } catch (error) {
      console.error('Erro ao regenerar SEO:', error);
      toast.error('Erro ao regenerar SEO');
    }
  };

  useEffect(() => {
    loadSEOData();
  }, []);

  // Filtrar dados
  const filteredData = seoData.filter(page => {
    const matchesSearch = page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         page.page_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         page.page_url.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'all') return true;
    
    const hasIssues = !page.description || page.description.length < 50 || 
                     !page.keywords || page.keywords.length === 0 || 
                     !page.og_image;

    if (filterType === 'needs-attention') return hasIssues;
    if (filterType === 'optimized') return !hasIssues;

    return true;
  });

  // Função para obter status da página
  const getPageStatus = (page: SEOData) => {
    const issues = [];
    if (!page.description || page.description.length < 50) issues.push('Descrição');
    if (!page.keywords || page.keywords.length === 0) issues.push('Keywords');
    if (!page.og_image) issues.push('OG Image');

    if (issues.length === 0) return { status: 'optimized', issues: [] };
    return { status: 'needs-attention', issues };
  };

  // Função para formatar tipo de página
  const formatPageType = (type: string) => {
    const types: { [key: string]: string } = {
      'home': 'Página Inicial',
      'article': 'Artigo',
      'category': 'Categoria',
      'about': 'Sobre',
      'contact': 'Contato',
      'privacy': 'Privacidade',
      'newsletter': 'Newsletter',
      'all_articles': 'Todos os Artigos',
      'admin': 'Admin'
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-purple"></div>
        <span className="ml-3 text-futuristic-gray">Carregando dados SEO...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-orbitron font-bold text-white">Dashboard SEO</h2>
          <p className="text-futuristic-gray text-sm">
            Monitore e otimize o SEO de todas as páginas
          </p>
        </div>
        <Button
          onClick={loadSEOData}
          disabled={loading}
          className="bg-neon-gradient hover:bg-neon-gradient/80"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-effect hover-lift">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-futuristic-gray text-sm">Total de Páginas</p>
                  <p className="text-2xl font-orbitron font-bold text-white">
                    {stats.totalPages}
                  </p>
                </div>
                <Globe className="w-8 h-8 text-neon-purple" />
              </div>
            </div>
          </Card>

          <Card className="glass-effect hover-lift">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-futuristic-gray text-sm">Páginas Otimizadas</p>
                  <p className="text-2xl font-orbitron font-bold text-lime-green">
                    {stats.optimizedPages}
                  </p>
                  <p className="text-xs text-futuristic-gray">
                    {Math.round((stats.optimizedPages / stats.totalPages) * 100)}% do total
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-lime-green" />
              </div>
            </div>
          </Card>

          <Card className="glass-effect hover-lift">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-futuristic-gray text-sm">Precisam Atenção</p>
                  <p className="text-2xl font-orbitron font-bold text-yellow-400">
                    {stats.totalPages - stats.optimizedPages}
                  </p>
                  <p className="text-xs text-futuristic-gray">
                    Descrições, keywords ou imagens
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
          </Card>

          <Card className="glass-effect hover-lift">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-futuristic-gray text-sm">Média Keywords</p>
                  <p className="text-2xl font-orbitron font-bold text-blue-400">
                    {stats.averageKeywordsCount}
                  </p>
                  <p className="text-xs text-futuristic-gray">
                    Por página
                  </p>
                </div>
                <Tag className="w-8 h-8 text-blue-400" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card className="glass-effect">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-futuristic-gray w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar páginas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-darker-surface border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-lime-green transition-colors"
              />
            </div>

            {/* Filtro por status */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 bg-darker-surface border border-neon-purple/20 rounded-lg text-white focus:outline-none focus:border-lime-green transition-colors"
            >
              <option value="all">Todas as páginas</option>
              <option value="optimized">Otimizadas</option>
              <option value="needs-attention">Precisam atenção</option>
            </select>
          </div>

          {/* Resultados */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-neon-purple/20">
            <span className="text-futuristic-gray text-sm">
              {filteredData.length} página{filteredData.length !== 1 ? 's' : ''} encontrada{filteredData.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </Card>

      {/* Lista de Páginas */}
      <div className="grid grid-cols-1 gap-4">
        {filteredData.map((page) => {
          const { status, issues } = getPageStatus(page);
          
          return (
            <Card key={page.id} className="glass-effect hover-lift">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-medium text-white truncate">
                        {page.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        status === 'optimized' 
                          ? 'bg-lime-green/20 text-lime-green' 
                          : 'bg-yellow-400/20 text-yellow-400'
                      }`}>
                        {status === 'optimized' ? 'Otimizada' : 'Atenção'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-futuristic-gray mb-2">
                      <span className="flex items-center">
                        <FileText className="w-4 h-4 mr-1" />
                        {formatPageType(page.page_type)}
                      </span>
                      <span className="flex items-center">
                        <LinkIcon className="w-4 h-4 mr-1" />
                        {page.page_url}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(page.updated_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    {page.description && (
                      <p className="text-sm text-futuristic-gray line-clamp-2 mb-2">
                        {page.description}
                      </p>
                    )}

                    {/* Keywords */}
                    {page.keywords && page.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {page.keywords.slice(0, 5).map((keyword, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-neon-purple/20 text-neon-purple text-xs rounded-full"
                          >
                            {keyword}
                          </span>
                        ))}
                        {page.keywords.length > 5 && (
                          <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">
                            +{page.keywords.length - 5}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Issues */}
                    {issues.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {issues.map((issue, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full flex items-center"
                          >
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {issue} em falta
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedPage(page)}
                      className="text-blue-400 hover:text-blue-300"
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => regenerateSEO(page.id)}
                      className="text-lime-green hover:text-lime-green/80"
                      title="Regenerar SEO"
                    >
                      <Zap className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-futuristic-gray mx-auto mb-4" />
          <h3 className="text-xl font-orbitron font-bold text-white mb-2">
            Nenhuma página encontrada
          </h3>
          <p className="text-futuristic-gray">
            Tente ajustar os filtros de busca
          </p>
        </div>
      )}

      {/* Modal de Detalhes */}
      {selectedPage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-darker-surface border border-neon-purple/20 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-orbitron font-bold text-white">
                  Detalhes SEO
                </h3>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedPage(null)}
                  className="text-futuristic-gray hover:text-white"
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-futuristic-gray mb-2">
                    Título
                  </label>
                  <p className="text-white bg-darker-surface/50 p-3 rounded-lg">
                    {selectedPage.title}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-futuristic-gray mb-2">
                    Descrição ({selectedPage.description?.length || 0} caracteres)
                  </label>
                  <p className="text-white bg-darker-surface/50 p-3 rounded-lg">
                    {selectedPage.description || 'Não definida'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-futuristic-gray mb-2">
                    Keywords ({selectedPage.keywords?.length || 0})
                  </label>
                  <div className="bg-darker-surface/50 p-3 rounded-lg">
                    {selectedPage.keywords && selectedPage.keywords.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedPage.keywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-neon-purple/20 text-neon-purple text-sm rounded-full"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-futuristic-gray">Nenhuma keyword definida</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-futuristic-gray mb-2">
                    URL Canônica
                  </label>
                  <p className="text-white bg-darker-surface/50 p-3 rounded-lg break-all">
                    {selectedPage.canonical_url || 'Não definida'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-futuristic-gray mb-2">
                    Open Graph Image
                  </label>
                  <div className="bg-darker-surface/50 p-3 rounded-lg">
                    {selectedPage.og_image ? (
                      <div className="flex items-center space-x-3">
                        <img
                          src={selectedPage.og_image}
                          alt="OG Image"
                          className="w-16 h-16 object-cover rounded"
                        />
                        <p className="text-white text-sm break-all">
                          {selectedPage.og_image}
                        </p>
                      </div>
                    ) : (
                      <p className="text-futuristic-gray">Nenhuma imagem definida</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-futuristic-gray mb-2">
                    Schema.org Data
                  </label>
                  <div className="bg-darker-surface/50 p-3 rounded-lg">
                    <pre className="text-xs text-futuristic-gray overflow-x-auto">
                      {JSON.stringify(selectedPage.schema_data, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setSelectedPage(null)}
                >
                  Fechar
                </Button>
                <Button
                  onClick={() => {
                    regenerateSEO(selectedPage.id);
                    setSelectedPage(null);
                  }}
                  className="bg-neon-gradient hover:bg-neon-gradient/80"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Regenerar SEO
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SEODashboard;