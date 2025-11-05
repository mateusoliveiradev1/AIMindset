import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Eye, Globe, BarChart3, RefreshCw, CheckCircle, AlertTriangle, Clock, Target, Zap, FileText, Tag, Link as LinkIcon, Image, Check, Square, CheckSquare, Download, Trash2, Copy, ExternalLink, Database, Calendar, Bell, Filter, TrendingDown, Keyboard, Wand2, Lightbulb, Accessibility, Moon, Sun } from 'lucide-react';
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
  // Novas estatísticas baseadas na análise
  excellentPages: number;
  goodPages: number;
  needsImprovementPages: number;
  poorPages: number;
  averageScore: number;
  // Métricas avançadas
  duplicatedTitles: number;
  longUrls: number;
  withoutSchema: number;
  recentUpdates: number;
  shortDescriptions: number;
  withoutKeywords: number;
  unoptimizedUrls: number;
}

interface SEOAnalysis {
  score: number;
  status: 'excellent' | 'good' | 'needs-improvement' | 'poor';
  issues: string[];
  suggestions: string[];
}

interface SEODataWithAnalysis extends SEOData {
  analysis: SEOAnalysis;
}

// Componentes de Loading Skeleton
const StatCardSkeleton = () => (
  <Card className="glass-effect">
    <div className="p-4 animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="w-6 h-6 bg-futuristic-gray/20 rounded"></div>
        <div className="w-8 h-4 bg-futuristic-gray/20 rounded"></div>
      </div>
      <div className="w-16 h-8 bg-futuristic-gray/20 rounded mb-1"></div>
      <div className="w-24 h-4 bg-futuristic-gray/20 rounded"></div>
    </div>
  </Card>
);

const PageCardSkeleton = () => (
  <Card className="glass-effect">
    <div className="p-4 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="w-3/4 h-5 bg-futuristic-gray/20 rounded mb-2"></div>
          <div className="w-full h-4 bg-futuristic-gray/20 rounded mb-1"></div>
          <div className="w-2/3 h-4 bg-futuristic-gray/20 rounded"></div>
        </div>
        <div className="w-16 h-6 bg-futuristic-gray/20 rounded"></div>
      </div>
      <div className="flex items-center justify-between">
        <div className="w-20 h-4 bg-futuristic-gray/20 rounded"></div>
        <div className="flex gap-2">
          <div className="w-8 h-8 bg-futuristic-gray/20 rounded"></div>
          <div className="w-8 h-8 bg-futuristic-gray/20 rounded"></div>
        </div>
      </div>
    </div>
  </Card>
);

export const SEODashboard: React.FC = () => {
  const [seoData, setSeoData] = useState<SEOData[]>([]);
  const [seoDataWithAnalysis, setSeoDataWithAnalysis] = useState<SEODataWithAnalysis[]>([]);
  const [stats, setStats] = useState<SEOStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'optimized' | 'needs-attention' | 'excellent' | 'good' | 'poor'>('all');
  const [selectedPage, setSelectedPage] = useState<SEODataWithAnalysis | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'google' | 'social'>('google');
  
  // Estado para controlar a aba ativa (Dashboard ou Relatórios)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports'>('dashboard');
  
  // Estados para bulk operations
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [bulkOperationInProgress, setBulkOperationInProgress] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, currentPage: '' });

  // Estados para busca avançada
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);

  // Estados para otimizações de performance
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [cachedData, setCachedData] = useState<Map<string, any>>(new Map());
  const [loadingSkeleton, setLoadingSkeleton] = useState(false);

  // Estados para filtros avançados
  const [scoreFilter, setScoreFilter] = useState<'all' | 'excellent' | 'good' | 'needs-improvement' | 'poor'>('all');
  const [pageTypeFilter, setPageTypeFilter] = useState<'all' | 'article' | 'category' | 'static'>('all');
  const [problemFilter, setProblemFilter] = useState<'all' | 'duplicate-title' | 'short-description' | 'no-keywords' | 'long-url' | 'no-og-image' | 'no-schema'>('all');
  const [sortBy, setSortBy] = useState<'score-desc' | 'score-asc' | 'updated-desc' | 'updated-asc' | 'type-asc' | 'title-asc'>('score-desc');

  // Estados para correções automáticas
  const [autoFixInProgress, setAutoFixInProgress] = useState<{[key: string]: boolean}>({});
  const [fixProgress, setFixProgress] = useState<{current: number, total: number, type: string}>({current: 0, total: 0, type: ''});
  const [fixResults, setFixResults] = useState<{[key: string]: {success: number, failed: number, details: string[]}}>({});

  // Carregar dados SEO
  const loadSEOData = async () => {
    try {
      setLoading(true);
      setLoadingSkeleton(true);
      
      // Buscar todos os dados SEO
      const { data: seoPages, error } = await supabase
        .from('seo_metadata')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setSeoData(seoPages || []);
      
      // Analisar qualidade SEO de cada página
      const analyzedData: SEODataWithAnalysis[] = (seoPages || []).map(page => ({
        ...page,
        analysis: analyzeSEOQuality(page, seoPages || [])
      }));
      
      setSeoDataWithAnalysis(analyzedData);
      
      // Calcular estatísticas
      if (seoPages) {
        const totalPages = seoPages.length;
        const missingDescriptions = seoPages.filter(p => !p.description || (p.description?.length || 0) < 50).length;
        const missingKeywords = seoPages.filter(p => !p.keywords || p.keywords.length === 0).length;
        const missingOgImages = seoPages.filter(p => !p.og_image).length;
        
        const optimizedPages = totalPages - Math.max(missingDescriptions, missingKeywords, missingOgImages);
        
        const avgDescLength = seoPages
          .filter(p => p.description)
          .reduce((acc, p) => acc + (p.description?.length || 0), 0) / seoPages.filter(p => p.description).length || 0;
          
        const avgKeywordsCount = seoPages
          .filter(p => p.keywords && p.keywords.length > 0)
          .reduce((acc, p) => acc + p.keywords.length, 0) / seoPages.filter(p => p.keywords && p.keywords.length > 0).length || 0;

        // Calcular estatísticas da análise SEO
        const excellentPages = analyzedData.filter(p => p.analysis.status === 'excellent').length;
        const goodPages = analyzedData.filter(p => p.analysis.status === 'good').length;
        const needsImprovementPages = analyzedData.filter(p => p.analysis.status === 'needs-improvement').length;
        const poorPages = analyzedData.filter(p => p.analysis.status === 'poor').length;
        const averageScore = Math.round(analyzedData.reduce((acc, p) => acc + p.analysis.score, 0) / analyzedData.length) || 0;

        // Calcular métricas avançadas
        const titles = seoPages.map(p => p.title?.toLowerCase().trim() || '');
        const duplicatedTitles = titles.length - new Set(titles).size;
        
        const longUrls = seoPages.filter(p => p.page_url?.length > 60).length;
        
        const withoutSchema = seoPages.filter(p => !p.schema_data || Object.keys(p.schema_data).length === 0).length;
        
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentUpdates = seoPages.filter(p => new Date(p.updated_at) > sevenDaysAgo).length;
        
        const shortDescriptions = seoPages.filter(p => p.description && p.description?.length < 120).length;
        
        const withoutKeywords = seoPages.filter(p => !p.keywords || p.keywords.length === 0).length;
        
        const unoptimizedUrls = seoPages.filter(p => {
          const url = p.page_url?.toLowerCase() || '';
          return url.includes('?') || url.includes('&') || url.includes('%') || url.match(/\d{4,}/);
        }).length;

        setStats({
          totalPages,
          optimizedPages,
          missingDescriptions,
          missingKeywords,
          missingOgImages,
          averageDescriptionLength: Math.round(avgDescLength),
          averageKeywordsCount: Math.round(avgKeywordsCount),
          excellentPages,
          goodPages,
          needsImprovementPages,
          poorPages,
          averageScore,
          // Métricas avançadas
          duplicatedTitles,
          longUrls,
          withoutSchema,
          recentUpdates,
          shortDescriptions,
          withoutKeywords,
          unoptimizedUrls
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados SEO:', error);
      toast.error('Erro ao carregar dados SEO');
    } finally {
      setLoading(false);
      setLoadingSkeleton(false);
    }
  };

  // Função para analisar qualidade SEO de uma página
  const analyzeSEOQuality = (page: SEOData, allPages: SEOData[]): SEOAnalysis => {
    let score = 0;
    const issues: string[] = [];
    const suggestions: string[] = [];

    // 1. Análise do título (20 pontos)
    if (page.title) {
      const titleLength = page.title?.length || 0;
      if (titleLength >= 30 && titleLength <= 60) {
        score += 20;
      } else if (titleLength < 30) {
        issues.push('Título muito curto');
        suggestions.push(`Título tem ${titleLength} caracteres. Recomendado: 30-60 caracteres.`);
      } else {
        issues.push('Título muito longo');
        suggestions.push(`Título tem ${titleLength} caracteres. Recomendado: 30-60 caracteres.`);
      }
    } else {
      issues.push('Título ausente');
      suggestions.push('Adicione um título otimizado para SEO.');
    }

    // 2. Análise da descrição (20 pontos)
    if (page.description) {
      const descLength = page.description?.length || 0;
      if (descLength >= 120 && descLength <= 155) {
        score += 20;
      } else if (descLength < 120) {
        issues.push('Descrição muito curta');
        suggestions.push(`Descrição tem ${descLength} caracteres. Recomendado: 120-155 caracteres.`);
      } else {
        issues.push('Descrição muito longa');
        suggestions.push(`Descrição tem ${descLength} caracteres. Recomendado: 120-155 caracteres.`);
      }
    } else {
      issues.push('Descrição ausente');
      suggestions.push('Adicione uma meta descrição atrativa e informativa.');
    }

    // 3. Análise das keywords (15 pontos)
    if (page.keywords && page.keywords.length > 0) {
      const keywordCount = page.keywords.length;
      if (keywordCount >= 3 && keywordCount <= 8) {
        score += 15;
      } else if (keywordCount < 3) {
        issues.push('Poucas keywords');
        suggestions.push(`Apenas ${keywordCount} keywords. Recomendado: 3-8 keywords relevantes.`);
      } else {
        issues.push('Muitas keywords');
        suggestions.push(`${keywordCount} keywords podem ser excessivas. Recomendado: 3-8 keywords.`);
      }
    } else {
      issues.push('Keywords ausentes');
      suggestions.push('Adicione 3-8 keywords relevantes para melhor indexação.');
    }

    // 4. Análise da imagem OG (15 pontos)
    if (page.og_image && page.og_image.trim() !== '') {
      score += 15;
    } else {
      issues.push('Imagem OG ausente');
      suggestions.push('Adicione uma imagem Open Graph para melhor compartilhamento social.');
    }

    // 5. Análise da URL canônica (10 pontos)
    if (page.canonical_url && page.canonical_url.trim() !== '') {
      score += 10;
    } else {
      issues.push('URL canônica ausente');
      suggestions.push('Defina uma URL canônica para evitar conteúdo duplicado.');
    }

    // 6. Análise do Schema.org (10 pontos)
    if (page.schema_data && Object.keys(page.schema_data).length > 0) {
      score += 10;
    } else {
      issues.push('Schema.org ausente');
      suggestions.push('Adicione dados estruturados Schema.org para melhor compreensão pelos buscadores.');
    }

    // 7. Verificação de título único (10 pontos)
    const duplicateTitles = allPages.filter(p => p.id !== page.id && p.title === page.title);
    if (duplicateTitles.length === 0) {
      score += 10;
    } else {
      issues.push('Título duplicado');
      suggestions.push(`Título duplicado em ${duplicateTitles.length} outras páginas. Use títulos únicos.`);
    }

    // Determinar status baseado no score
    let status: SEOAnalysis['status'];
    if (score >= 90) status = 'excellent';
    else if (score >= 70) status = 'good';
    else if (score >= 50) status = 'needs-improvement';
    else status = 'poor';

    return {
      score,
      status,
      issues,
      suggestions
    };
  };

  // Função para obter cores e ícones baseados no status SEO
  const getStatusConfig = (status: SEOAnalysis['status']) => {
    switch (status) {
      case 'excellent':
        return {
          color: 'text-green-400',
          bgColor: 'bg-green-400/20',
          borderColor: 'border-green-400/30',
          icon: CheckCircle,
          label: 'Excelente'
        };
      case 'good':
        return {
          color: 'text-lime-green',
          bgColor: 'bg-lime-green/20',
          borderColor: 'border-lime-green/30',
          icon: Target,
          label: 'Bom'
        };
      case 'needs-improvement':
        return {
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-400/20',
          borderColor: 'border-yellow-400/30',
          icon: AlertTriangle,
          label: 'Precisa Melhorar'
        };
      case 'poor':
        return {
          color: 'text-red-400',
          bgColor: 'bg-red-400/20',
          borderColor: 'border-red-400/30',
          icon: AlertTriangle,
          label: 'Ruim'
        };
    }
  };

  // Componente Badge de Score SEO
  const SEOScoreBadge: React.FC<{ analysis: SEOAnalysis }> = ({ analysis }) => {
    const config = getStatusConfig(analysis.status);
    const IconComponent = config.icon;
    
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${config.bgColor} ${config.borderColor}`}>
        <IconComponent className={`w-4 h-4 ${config.color}`} />
        <span className={`text-sm font-medium ${config.color}`}>
          {analysis.score}/100
        </span>
        <span className="text-xs text-futuristic-gray">
          {config.label}
        </span>
      </div>
    );
  };

  // Componente Barra de Progresso SEO
  const SEOProgressBar: React.FC<{ score: number; status: SEOAnalysis['status'] }> = ({ score, status }) => {
    const config = getStatusConfig(status);
    
    return (
      <div className="w-full bg-darker-surface rounded-full h-2 overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${config.bgColor.replace('/20', '')}`}
          style={{ width: `${score}%` }}
        />
      </div>
    );
  };

  // Componente GooglePreview - Simula como a página aparece no Google
  const GooglePreview: React.FC<{ page: SEODataWithAnalysis }> = ({ page }) => {
    const truncateTitle = (title: string, maxLength: number = 60) => {
      if (title.length <= maxLength) return title;
      return title.substring(0, maxLength - 3) + '...';
    };

    const truncateDescription = (description: string, maxLength: number = 155) => {
      if (!description) return '';
      if (description.length <= maxLength) return description;
      return description.substring(0, maxLength - 3) + '...';
    };

    const formatUrl = (url: string) => {
      if (!url) return 'aimindset.com.br';
      return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    };

    const isTitleTruncated = page.title && (page.title?.length || 0) > 60;
    const isDescriptionTruncated = page.description && (page.description?.length || 0) > 155;

    return (
      <div className="bg-white p-4 rounded-lg font-sans text-sm">
        {/* Favicon e URL */}
        <div className="flex items-center mb-1">
          <div className="w-4 h-4 bg-blue-600 rounded-sm mr-2 flex items-center justify-center">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <span className="text-green-700 text-sm">
            {formatUrl(page.canonical_url)}
          </span>
        </div>

        {/* Título */}
        <div className="mb-1">
          <h3 className="text-blue-800 text-xl hover:underline cursor-pointer leading-tight">
            {truncateTitle(page.title || 'Título não definido')}
          </h3>
          {isTitleTruncated && (
            <div className="text-xs text-orange-600 mt-1">
              ⚠️ Título truncado ({page.title?.length} caracteres)
            </div>
          )}
        </div>

        {/* Descrição */}
        <div className="text-gray-600 leading-relaxed">
          {truncateDescription(page.description || 'Descrição não definida')}
          {isDescriptionTruncated && (
            <div className="text-xs text-orange-600 mt-1">
              ⚠️ Descrição truncada ({page.description?.length} caracteres)
            </div>
          )}
        </div>

        {/* Contador de caracteres */}
        <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
          <span>Título: {page.title?.length || 0}/60</span>
          <span>Descrição: {page.description?.length || 0}/155</span>
        </div>
      </div>
    );
  };

  // Componente SocialPreview - Simula como a página aparece nas redes sociais
  const SocialPreview: React.FC<{ page: SEODataWithAnalysis }> = ({ page }) => {
    const formatUrl = (url: string) => {
      if (!url) return 'AIMINDSET.COM.BR';
      return url.replace(/^https?:\/\//, '').toUpperCase();
    };

    const hasOgImage = page.og_image && page.og_image.trim() !== '';

    return (
      <div className="bg-white border border-gray-300 rounded-lg overflow-hidden font-sans max-w-lg">
        {/* Imagem OG */}
        <div className="relative">
          {hasOgImage ? (
            <img
              src={page.og_image}
              alt="Open Graph"
              className="w-full h-48 object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const placeholder = target.nextElementSibling as HTMLElement;
                if (placeholder) placeholder.style.display = 'flex';
              }}
            />
          ) : null}
          
          {/* Placeholder para imagem ausente */}
          <div 
            className={`w-full h-48 bg-gray-200 flex items-center justify-center ${hasOgImage ? 'hidden' : 'flex'}`}
          >
            <div className="text-center text-gray-500">
              <Image className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">Imagem OG não definida</p>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-3">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            {formatUrl(page.canonical_url)}
          </div>
          
          <h3 className="font-semibold text-gray-900 text-base leading-tight mb-1 line-clamp-2">
            {page.title || 'Título não definido'}
          </h3>
          
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
            {page.description || 'Descrição não definida'}
          </p>

          {/* Avisos */}
          {!hasOgImage && (
            <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
              ⚠️ Imagem OG ausente - adicione uma imagem para melhor engajamento
            </div>
          )}
        </div>
      </div>
    );
   };

  // Componente PreviewTabs - Sistema de tabs para alternar entre previews
  const PreviewTabs: React.FC<{ page: SEODataWithAnalysis }> = ({ page }) => {
    return (
      <div className="mb-6 p-4 bg-darker-surface/30 rounded-lg border border-neon-purple/10">
        <h4 className="text-lg font-medium text-white mb-4 flex items-center">
          <Eye className="w-5 h-5 mr-2 text-blue-400" />
          Preview nos Buscadores e Redes Sociais
        </h4>

        {/* Tabs Navigation */}
        <div className="flex space-x-1 mb-4 bg-darker-surface rounded-lg p-1">
          <button
            onClick={() => setActivePreviewTab('google')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activePreviewTab === 'google'
                ? 'bg-neon-purple text-white shadow-lg'
                : 'text-futuristic-gray hover:text-white hover:bg-darker-surface/50'
            }`}
          >
            <div className="flex items-center justify-center">
              <Search className="w-4 h-4 mr-2" />
              Google
            </div>
          </button>
          <button
            onClick={() => setActivePreviewTab('social')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activePreviewTab === 'social'
                ? 'bg-neon-purple text-white shadow-lg'
                : 'text-futuristic-gray hover:text-white hover:bg-darker-surface/50'
            }`}
          >
            <div className="flex items-center justify-center">
              <Globe className="w-4 h-4 mr-2" />
              Redes Sociais
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[200px]">
          {activePreviewTab === 'google' && (
            <div>
              <div className="mb-3 text-sm text-futuristic-gray">
                Como sua página aparecerá nos resultados do Google:
              </div>
              <GooglePreview page={page} />
            </div>
          )}
          
          {activePreviewTab === 'social' && (
            <div>
              <div className="mb-3 text-sm text-futuristic-gray">
                Como sua página aparecerá quando compartilhada nas redes sociais:
              </div>
              <div className="flex justify-center">
                <SocialPreview page={page} />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Regenerar SEO para uma página específica
  const regenerateSEO = async (pageId: string) => {
    try {
      setLoading(true);
      toast.info('Regenerando SEO...');
      
      // Buscar dados da página SEO atual
      const { data: seoPage, error: seoError } = await supabase
        .from('seo_metadata')
        .select('*')
        .eq('id', pageId)
        .single();

      if (seoError || !seoPage) {
        console.error('❌ Erro ao buscar página SEO:', seoError);
        throw new Error('Página SEO não encontrada');
      }



      let updatedSEOData: any = {};

      // Regenerar baseado no tipo de página
      if (seoPage.page_type === 'article' && seoPage.page_slug) {
        // Buscar dados do artigo
        const { data: article, error: articleError } = await supabase
          .from('articles')
          .select('*')
          .eq('slug', seoPage.page_slug)
          .single();

        if (articleError || !article) {
          throw new Error('Artigo não encontrado');
        }

        // Regenerar SEO do artigo usando a mesma lógica dos triggers
        const seoTitle = `${article.title} | AIMindset - Inteligência Artificial`;
        
        let seoDescription = '';
        if (article.excerpt && article.excerpt.length > 50) {
          seoDescription = article.excerpt.substring(0, 150);
        } else {
          // Extrair texto do conteúdo HTML
          const textContent = article.content
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          seoDescription = textContent.substring(0, 150);
        }
        
        // Adicionar call-to-action se houver espaço
        if (seoDescription.length < 130) {
          seoDescription += ' Descubra mais sobre IA e tecnologia.';
        }

        // Gerar keywords baseadas nas tags
        let keywords = ['inteligência artificial', 'IA', 'produtividade'];
        if (article.tags) {
          const articleTags = Array.isArray(article.tags) 
            ? article.tags 
            : article.tags.split(',').map(tag => tag.trim());
          keywords = [...keywords, ...articleTags];
        }

        const canonicalUrl = `https://aimindset.com.br/artigo/${article.slug}`;
        
        // Schema.org data
        const schemaData = {
          '@context': 'https://schema.org',
          '@type': 'Article',
          'headline': article.title,
          'description': seoDescription,
          'author': {
            '@type': 'Organization',
            'name': 'AIMindset'
          },
          'publisher': {
            '@type': 'Organization',
            'name': 'AIMindset',
            'logo': {
              '@type': 'ImageObject',
              'url': 'https://aimindset.com.br/logo.png'
            }
          },
          'datePublished': article.created_at,
          'dateModified': article.updated_at,
          'mainEntityOfPage': {
            '@type': 'WebPage',
            '@id': canonicalUrl
          },
          'image': article.image_url || 'https://aimindset.com.br/og-image.jpg',
          'keywords': keywords.join(', ')
        };

        updatedSEOData = {
          title: seoTitle,
          description: seoDescription,
          keywords: keywords,
          og_image: article.image_url || 'https://aimindset.com.br/og-image.jpg',
          canonical_url: canonicalUrl,
          schema_data: schemaData,
          updated_at: new Date().toISOString()
        };

      } else if (seoPage.page_type === 'category' && seoPage.page_slug) {
        // Buscar dados da categoria
        const { data: category, error: categoryError } = await supabase
          .from('categories')
          .select('*')
          .eq('slug', seoPage.page_slug)
          .single();

        if (categoryError || !category) {
          throw new Error('Categoria não encontrada');
        }

        const seoTitle = `${category.name} | AIMindset - Artigos sobre ${category.name}`;
        const seoDescription = category.description || 
          `Explore artigos sobre ${category.name} no AIMindset. Conteúdo especializado em inteligência artificial e tecnologia.`;
        
        const keywords = [category.name.toLowerCase(), 'inteligência artificial', 'IA', 'artigos', 'tecnologia'];
        const canonicalUrl = `https://aimindset.com.br/categoria/${category.slug}`;

        const schemaData = {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          'name': seoTitle,
          'description': seoDescription,
          'url': canonicalUrl,
          'mainEntity': {
            '@type': 'ItemList',
            'name': `Artigos sobre ${category.name}`
          }
        };

        updatedSEOData = {
          title: seoTitle,
          description: seoDescription,
          keywords: keywords,
          og_image: 'https://aimindset.com.br/og-image.jpg',
          canonical_url: canonicalUrl,
          schema_data: schemaData,
          updated_at: new Date().toISOString()
        };

      } else {
        // Para páginas estáticas, usar dados padrão otimizados
        const staticPages = {
          'home': {
            title: 'AIMindset - Portal de Inteligência Artificial e Tecnologia do Futuro',
            description: 'Descubra como a inteligência artificial pode transformar sua produtividade. Artigos, dicas e insights sobre IA, automação e tecnologia.',
            keywords: ['inteligência artificial', 'IA', 'produtividade', 'automação', 'tecnologia', 'futuro'],
            canonical_url: 'https://aimindset.com.br/'
          },
          'about': {
            title: 'Sobre - AIMindset | Nossa Missão e Visão',
            description: 'Conheça a missão do AIMindset: democratizar o conhecimento sobre inteligência artificial e ajudar pessoas a serem mais produtivas.',
            keywords: ['sobre', 'missão', 'inteligência artificial', 'equipe', 'visão'],
            canonical_url: 'https://aimindset.com.br/sobre'
          },
          'contact': {
            title: 'Contato - AIMindset | Entre em Contato Conosco',
            description: 'Entre em contato com a equipe AIMindset. Tire suas dúvidas, envie sugestões ou proponha parcerias.',
            keywords: ['contato', 'suporte', 'dúvidas', 'parcerias', 'comunicação'],
            canonical_url: 'https://aimindset.com.br/contato'
          },
          'newsletter': {
            title: 'Newsletter AIMindset - Receba Conteúdo Exclusivo sobre IA',
            description: 'Inscreva-se na newsletter da AIMindset e receba semanalmente conteúdo exclusivo sobre Inteligência Artificial e tecnologia.',
            keywords: ['newsletter', 'inscrição', 'conteúdo exclusivo', 'inteligência artificial', 'IA'],
            canonical_url: 'https://aimindset.com.br/newsletter'
          },
          'privacy': {
            title: 'Política de Privacidade - AIMindset',
            description: 'Leia nossa política de privacidade e saiba como protegemos seus dados pessoais no AIMindset.',
            keywords: ['privacidade', 'dados pessoais', 'LGPD', 'proteção', 'política'],
            canonical_url: 'https://aimindset.com.br/privacidade'
          }
        };

        const pageData = staticPages[seoPage.page_type as keyof typeof staticPages];
        if (pageData) {
          updatedSEOData = {
            ...pageData,
            og_image: 'https://aimindset.com.br/og-image.jpg',
            schema_data: {
              '@context': 'https://schema.org',
              '@type': 'WebPage',
              'name': pageData.title,
              'description': pageData.description,
              'url': pageData.canonical_url
            },
            updated_at: new Date().toISOString()
          };
        }
      }

      // Atualizar os metadados SEO no banco
      const { error: updateError } = await supabase
        .from('seo_metadata')
        .update(updatedSEOData)
        .eq('id', pageId);

      if (updateError) {
        console.error('❌ Erro ao atualizar SEO no banco:', updateError);
        throw updateError;
      }

      toast.success('SEO regenerado com sucesso!');
      await loadSEOData();
      
    } catch (error) {
      console.error('Erro ao regenerar SEO:', error);
      toast.error(`Erro ao regenerar SEO: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSEOData();
  }, []);

  // Hook para debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Hook para cache de dados
  useEffect(() => {
    const cacheKey = `seo-data-${filterType}-${debouncedSearchTerm}`;
    if (cachedData.has(cacheKey)) {
      // Usar dados do cache se disponível
      return;
    }
    
    // Cache dos dados filtrados
    if (seoDataWithAnalysis.length > 0) {
      const newCache = new Map(cachedData);
      newCache.set(cacheKey, filteredData);
      setCachedData(newCache);
    }
  }, [seoDataWithAnalysis, filterType, debouncedSearchTerm]);

  // Hook para atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'a':
            event.preventDefault();
            toggleSelectAll();
            break;
          case 'f':
            event.preventDefault();
            document.getElementById('search-input')?.focus();
            break;
          case 'r':
            event.preventDefault();
            loadSEOData();
            break;
          case 'ArrowLeft':
            if (event.ctrlKey || event.metaKey) {
              event.preventDefault();
              setCurrentPage(Math.max(1, currentPage - 1));
            }
            break;
          case 'ArrowRight':
            if (event.ctrlKey || event.metaKey) {
              event.preventDefault();
              setCurrentPage(Math.min(totalPages, currentPage + 1));
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Função para busca avançada
  const parseAdvancedSearch = (searchTerm: string) => {
    const filters: any = {};
    const terms = searchTerm.split(' ');
    
    terms.forEach(term => {
      if (term.includes(':')) {
        const [key, value] = term.split(':');
        filters[key] = value;
      } else if (term.trim()) {
        filters.text = (filters.text || '') + ' ' + term;
      }
    });
    
    return filters;
  };

  // Filtrar dados com busca avançada
  const filteredData = seoDataWithAnalysis.filter(page => {
    // Busca avançada
    if (debouncedSearchTerm.includes(':')) {
      const filters = parseAdvancedSearch(debouncedSearchTerm);
      
      // Filtro por score
      if (filters.score) {
        const scoreFilter = filters.score;
        if (scoreFilter.startsWith('<')) {
          const maxScore = parseInt(scoreFilter.substring(1));
          if (page.analysis.score >= maxScore) return false;
        } else if (scoreFilter.startsWith('>')) {
          const minScore = parseInt(scoreFilter.substring(1));
          if (page.analysis.score <= minScore) return false;
        } else {
          const exactScore = parseInt(scoreFilter);
          if (page.analysis.score !== exactScore) return false;
        }
      }
      
      // Filtro por tipo
      if (filters.type && !page.page_type.toLowerCase().includes(filters.type.toLowerCase())) {
        return false;
      }
      
      // Filtro por data
      if (filters.updated) {
        const days = parseInt(filters.updated.replace('d', ''));
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - days);
        if (new Date(page.updated_at) < daysAgo) return false;
      }
      
      // Filtro por problemas
      if (filters.problem) {
        const problemType = filters.problem.toLowerCase();
        const alerts = getSEOAlerts(page, seoDataWithAnalysis);
        const hasSpecificProblem = alerts.some(alert => 
          alert.type.includes(problemType) || alert.message.toLowerCase().includes(problemType)
        );
        if (!hasSpecificProblem) return false;
      }
      
      // Busca textual restante
      if (filters.text) {
        const textMatch = page.title.toLowerCase().includes(filters.text.toLowerCase()) ||
                         page.page_type.toLowerCase().includes(filters.text.toLowerCase()) ||
                         page.page_url.toLowerCase().includes(filters.text.toLowerCase());
        if (!textMatch) return false;
      }
    } else if (debouncedSearchTerm) {
      // Busca normal por texto
      const matchesSearch = page.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           page.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           page.keywords?.some(keyword => keyword.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
                           page.page_type.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           page.page_url.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      if (!matchesSearch) return false;
    }

    // Aplicar filtro por Score SEO
    if (scoreFilter !== 'all') {
      const score = page.analysis.score;
      switch (scoreFilter) {
        case 'excellent':
          if (score < 90) return false;
          break;
        case 'good':
          if (score < 70 || score >= 90) return false;
          break;
        case 'needs-improvement':
          if (score < 50 || score >= 70) return false;
          break;
        case 'poor':
          if (score >= 50) return false;
          break;
      }
    }

    // Aplicar filtro por Tipo de Página
    if (pageTypeFilter !== 'all') {
      switch (pageTypeFilter) {
        case 'article':
          if (page.page_type !== 'article') return false;
          break;
        case 'category':
          if (page.page_type !== 'category') return false;
          break;
        case 'static':
          if (!['home', 'about', 'contact', 'newsletter', 'privacy'].includes(page.page_type)) return false;
          break;
      }
    }

    // Aplicar filtro por Problemas Específicos
    if (problemFilter !== 'all') {
      const alerts = getSEOAlerts(page, seoDataWithAnalysis);
      let hasProblem = false;
      
      switch (problemFilter) {
        case 'duplicate-title':
          hasProblem = alerts.some(alert => alert.type.includes('title') && alert.message.includes('duplicado'));
          break;
        case 'short-description':
          hasProblem = !page.description || page.description.length < 120;
          break;
        case 'no-keywords':
          hasProblem = !page.keywords || page.keywords.length === 0;
          break;
        case 'long-url':
          hasProblem = page.page_url.length > 100;
          break;
        case 'no-og-image':
          hasProblem = !page.og_image;
          break;
        case 'no-schema':
          hasProblem = !page.schema_data || Object.keys(page.schema_data).length === 0;
          break;
      }
      
      if (!hasProblem) return false;
    }

    // Aplicar filtros de tipo legados (manter compatibilidade)
    if (filterType === 'all') return true;
    
    // Filtros baseados na análise SEO
    if (filterType === 'excellent') return page.analysis.status === 'excellent';
    if (filterType === 'good') return page.analysis.status === 'good';
    if (filterType === 'poor') return page.analysis.status === 'poor' || page.analysis.status === 'needs-improvement';
    
    // Filtros legados
    const hasIssues = !page.description || (page.description?.length || 0) < 50 || 
                     !page.keywords || page.keywords.length === 0 || 
                     !page.og_image;

    if (filterType === 'needs-attention') return hasIssues;
    if (filterType === 'optimized') return !hasIssues;

    return true;
  });

  // Aplicar ordenação
  const sortedData = [...filteredData].sort((a, b) => {
    switch (sortBy) {
      case 'score-desc':
        return b.analysis.score - a.analysis.score;
      case 'score-asc':
        return a.analysis.score - b.analysis.score;
      case 'updated-desc':
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      case 'updated-asc':
        return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      case 'type-asc':
        return a.page_type.localeCompare(b.page_type);
      case 'title-asc':
        return a.title.localeCompare(b.title);
      default:
        return b.analysis.score - a.analysis.score;
    }
  });

  // Paginação
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  // Reset da página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, filterType, scoreFilter, pageTypeFilter, problemFilter, sortBy]);

  // Função para obter status da página
  const getPageStatus = (page: SEOData) => {
    const issues = [];
    if (!page.description || (page.description?.length || 0) < 50) issues.push('Descrição');
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

  // Função para detectar alertas SEO
  const getSEOAlerts = (page: SEODataWithAnalysis, allPages: SEODataWithAnalysis[]) => {
    const alerts: Array<{type: string, message: string, severity: 'high' | 'medium' | 'low'}> = [];

    // Alerta para títulos duplicados
    const duplicateTitle = allPages.filter(p => p.id !== page.id && p.title?.toLowerCase().trim() === page.title?.toLowerCase().trim()).length > 0;
    if (duplicateTitle) {
      alerts.push({
        type: 'duplicate-title',
        message: 'Título duplicado encontrado',
        severity: 'high'
      });
    }

    // Alerta para descrições muito curtas
    if (page.description && (page.description?.length || 0) < 120) {
      alerts.push({
        type: 'short-description',
        message: 'Descrição muito curta (<120 chars)',
        severity: 'medium'
      });
    }

    // Alerta para páginas sem keywords
    if (!page.keywords || page.keywords.length === 0) {
      alerts.push({
        type: 'no-keywords',
        message: 'Sem palavras-chave definidas',
        severity: 'medium'
      });
    }

    // Alerta para URLs não otimizadas
    const url = page.page_url?.toLowerCase() || '';
    if (url.includes('?') || url.includes('&') || url.includes('%') || url.match(/\d{4,}/)) {
      alerts.push({
        type: 'unoptimized-url',
        message: 'URL não otimizada para SEO',
        severity: 'low'
      });
    }

    return alerts;
  };

  // Funções para bulk operations
  const togglePageSelection = (pageId: string) => {
    const newSelection = new Set(selectedPages);
    if (newSelection.has(pageId)) {
      newSelection.delete(pageId);
    } else {
      newSelection.add(pageId);
    }
    setSelectedPages(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedPages.size === sortedData.length) {
      setSelectedPages(new Set());
    } else {
      setSelectedPages(new Set(sortedData.map(page => page.id)));
    }
  };

  const clearSelection = () => {
    setSelectedPages(new Set());
  };

  const selectPagesByScore = (maxScore: number) => {
    const lowScorePages = sortedData
      .filter(page => page.analysis.score < maxScore)
      .map(page => page.id);
    setSelectedPages(new Set(lowScorePages));
  };

  const selectPagesWithIssues = () => {
    const pagesWithIssues = sortedData
      .filter(page => page.analysis.issues.length > 0)
      .map(page => page.id);
    setSelectedPages(new Set(pagesWithIssues));
  };

  // Função para regenerar SEO em lote
  const bulkRegenerateSEO = async () => {
    if (selectedPages.size === 0) {
      toast.error('Selecione pelo menos uma página');
      return;
    }

    const confirmed = window.confirm(
      `Tem certeza que deseja regenerar o SEO de ${selectedPages.size} página(s)? Esta operação pode levar alguns minutos.`
    );

    if (!confirmed) return;

    setBulkOperationInProgress(true);
    setBulkProgress({ current: 0, total: selectedPages.size, currentPage: '' });

    const selectedPagesArray = Array.from(selectedPages);
    const results = { success: 0, errors: 0, errorMessages: [] as string[] };

    for (let i = 0; i < selectedPagesArray.length; i++) {
      const pageId = selectedPagesArray[i];
      const page = seoDataWithAnalysis.find(p => p.id === pageId);
      
      setBulkProgress({ 
        current: i + 1, 
        total: selectedPages.size, 
        currentPage: page?.title || 'Página desconhecida' 
      });

      try {
        await regenerateSEO(pageId);
        results.success++;
        // Pequena pausa para evitar sobrecarga
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        results.errors++;
        results.errorMessages.push(`${page?.title}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    setBulkOperationInProgress(false);
    setBulkProgress({ current: 0, total: 0, currentPage: '' });
    setSelectedPages(new Set());

    // Mostrar resultado
    if (results.errors === 0) {
      toast.success(`✅ SEO regenerado com sucesso para ${results.success} página(s)!`);
    } else {
      toast.warning(`⚠️ Operação concluída: ${results.success} sucessos, ${results.errors} erros`);
      if (results.errorMessages.length > 0) {
        console.error('Erros durante regeneração em lote:', results.errorMessages);
      }
    }

    // Recarregar dados
    await loadSEOData();
  };

  // Função para exportar relatório CSV
  const exportCSVReport = () => {
    if (selectedPages.size === 0) {
      toast.error('Selecione pelo menos uma página para exportar');
      return;
    }

    const selectedData = seoDataWithAnalysis.filter(page => selectedPages.has(page.id));
    
    const csvHeaders = [
      'URL',
      'Título',
      'Descrição',
      'Keywords',
      'Score SEO',
      'Status',
      'Problemas',
      'Tipo de Página',
      'Última Atualização'
    ];

    const csvRows = selectedData.map(page => [
      page.page_url,
      `"${page.title.replace(/"/g, '""')}"`,
      `"${(page.description || '').replace(/"/g, '""')}"`,
      `"${(page.keywords || []).join(', ')}"`,
      page.analysis.score,
      page.analysis.status,
      `"${page.analysis.issues.join('; ')}"`,
      formatPageType(page.page_type),
      new Date(page.updated_at).toLocaleDateString('pt-BR')
    ]);

    const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-seo-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`📊 Relatório exportado com ${selectedData.length} página(s)`);
  };

  // Função para correção automática de problemas simples
  const autoFixSimpleIssues = async () => {
    if (selectedPages.size === 0) {
      toast.error('Selecione pelo menos uma página');
      return;
    }

    const confirmed = window.confirm(
      `Deseja corrigir automaticamente problemas simples em ${selectedPages.size} página(s)? Isso incluirá:\n\n• Ajustar títulos muito curtos/longos\n• Expandir descrições curtas\n• Adicionar keywords básicas\n• Otimizar URLs`
    );

    if (!confirmed) return;

    setBulkOperationInProgress(true);
    setBulkProgress({ current: 0, total: selectedPages.size, currentPage: '' });

    const selectedPagesArray = Array.from(selectedPages);
    const results = { success: 0, errors: 0, fixes: [] as string[] };

    for (let i = 0; i < selectedPagesArray.length; i++) {
      const pageId = selectedPagesArray[i];
      const page = seoDataWithAnalysis.find(p => p.id === pageId);
      
      if (!page) continue;

      setBulkProgress({ 
        current: i + 1, 
        total: selectedPages.size, 
        currentPage: page.title || 'Página desconhecida' 
      });

      try {
        const fixes = [];
        const updates: any = {};

        // Corrigir título
        if (page.title && (page.title?.length || 0) < 30) {
          updates.title = page.title + ' - Guia Completo | AIMindset';
          fixes.push('Título expandido');
        } else if (page.title && (page.title?.length || 0) > 60) {
          updates.title = page.title?.substring(0, 57) + '...';
          fixes.push('Título encurtado');
        }

        // Corrigir descrição
        if (!page.description || (page.description?.length || 0) < 120) {
          const baseDesc = page.description || `Descubra tudo sobre ${page.title || 'este tópico'}`;
          updates.description = baseDesc.padEnd(120, '. Aprenda mais sobre este assunto importante e transforme seu conhecimento em resultados práticos.');
          fixes.push('Descrição expandida');
        }

        // Adicionar keywords básicas
        if (!page.keywords || page.keywords.length === 0) {
          const titleWords = (page.title || '').toLowerCase().split(' ').filter(word => word.length > 3);
          updates.keywords = titleWords.slice(0, 5);
          fixes.push('Keywords adicionadas');
        }

        // Aplicar correções se houver
        if (Object.keys(updates).length > 0) {
          const { error } = await supabase
            .from('seo_metadata')
            .update(updates)
            .eq('id', pageId);

          if (error) throw error;

          results.success++;
          results.fixes.push(`${page.title}: ${fixes.join(', ')}`);
        }

        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        results.errors++;
        console.error(`Erro ao corrigir página ${page?.title}:`, error);
      }
    }

    setBulkOperationInProgress(false);
    setBulkProgress({ current: 0, total: 0, currentPage: '' });
    setSelectedPages(new Set());

    // Mostrar resultado
    if (results.errors === 0) {
      toast.success(`🔧 Correções aplicadas com sucesso em ${results.success} página(s)!`);
    } else {
      toast.warning(`⚠️ Operação concluída: ${results.success} sucessos, ${results.errors} erros`);
    }

    // Recarregar dados
    await loadSEOData();
  };

  // Função para gerar template de SEO
  const generateSEOTemplate = (pageType: string) => {
    const templates = {
      article: {
        titleSuffix: ' - Guia Completo | AIMindset',
        descriptionTemplate: 'Descubra tudo sobre [TÓPICO]. Guia completo com dicas práticas, estratégias comprovadas e insights valiosos para transformar seu conhecimento em resultados.',
        keywords: ['guia', 'dicas', 'estratégias', 'tutorial', 'como fazer']
      },
      category: {
        titleSuffix: ' - Categoria | AIMindset',
        descriptionTemplate: 'Explore nossa categoria [CATEGORIA] com os melhores conteúdos, artigos e recursos para aprofundar seu conhecimento e alcançar seus objetivos.',
        keywords: ['categoria', 'conteúdos', 'artigos', 'recursos', 'conhecimento']
      },
      home: {
        titleSuffix: ' | AIMindset - Transforme seu Mindset',
        descriptionTemplate: 'Transforme seu mindset e alcance seus objetivos com nossos conteúdos exclusivos sobre desenvolvimento pessoal, produtividade e sucesso.',
        keywords: ['mindset', 'desenvolvimento pessoal', 'produtividade', 'sucesso', 'transformação']
      }
    };

    return templates[pageType as keyof typeof templates] || templates.article;
  };

  // Funções específicas de correção automática
  const fixDuplicateTitles = async () => {
    if (autoFixInProgress['duplicateTitles']) return;
    
    setAutoFixInProgress(prev => ({ ...prev, duplicateTitles: true }));
    
    try {
      // Encontrar páginas com títulos duplicados
      const titleGroups = seoDataWithAnalysis.reduce((acc, page) => {
        const title = page.title?.toLowerCase().trim();
        if (title) {
          if (!acc[title]) acc[title] = [];
          acc[title].push(page);
        }
        return acc;
      }, {} as {[key: string]: SEODataWithAnalysis[]});

      const duplicateGroups = Object.values(titleGroups).filter(group => group.length > 1);
      const totalPages = duplicateGroups.reduce((sum, group) => sum + group.length - 1, 0);

      if (totalPages === 0) {
        toast.info('Nenhum título duplicado encontrado!');
        return;
      }

      const confirmed = window.confirm(
        `Encontrados ${totalPages} títulos duplicados em ${duplicateGroups.length} grupos.\n\nDeseja corrigir automaticamente adicionando sufixos únicos?`
      );

      if (!confirmed) return;

      setFixProgress({ current: 0, total: totalPages, type: 'Títulos Duplicados' });

      const suffixes = [
        '- Guia Completo',
        '- Dicas Essenciais', 
        '- Tutorial Prático',
        '- Estratégias Avançadas',
        '- Passo a Passo',
        '- Métodos Eficazes',
        '- Técnicas Comprovadas'
      ];

      let current = 0;
      const results = { success: 0, failed: 0, details: [] as string[] };

      for (const group of duplicateGroups) {
        // Manter o primeiro, corrigir os demais
        for (let i = 1; i < group.length; i++) {
          const page = group[i];
          const suffix = suffixes[(i - 1) % suffixes.length];
          const newTitle = `${page.title} ${suffix}`;

          try {
            const { error } = await supabase
              .from('seo_metadata')
              .update({ title: newTitle })
              .eq('id', page.id);

            if (error) throw error;

            results.success++;
            results.details.push(`✅ ${page.title} → ${newTitle}`);
          } catch (error) {
            results.failed++;
            results.details.push(`❌ Erro ao corrigir: ${page.title}`);
          }

          current++;
          setFixProgress({ current, total: totalPages, type: 'Títulos Duplicados' });
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      setFixResults(prev => ({ ...prev, duplicateTitles: results }));
      
      if (results.failed === 0) {
        toast.success(`🔧 ${results.success} títulos duplicados corrigidos com sucesso!`);
      } else {
        toast.warning(`⚠️ Correção concluída: ${results.success} sucessos, ${results.failed} falhas`);
      }

      await loadSEOData();
    } catch (error) {
      console.error('Erro ao corrigir títulos duplicados:', error);
      toast.error('Erro ao corrigir títulos duplicados');
    } finally {
      setAutoFixInProgress(prev => ({ ...prev, duplicateTitles: false }));
      setFixProgress({ current: 0, total: 0, type: '' });
    }
  };

  const fixShortDescriptions = async () => {
    if (autoFixInProgress['shortDescriptions']) return;
    
    setAutoFixInProgress(prev => ({ ...prev, shortDescriptions: true }));
    
    try {
      const pagesWithShortDesc = seoDataWithAnalysis.filter(page => 
        !page.description || (page.description?.length || 0) < 120
      );

      if (pagesWithShortDesc.length === 0) {
        toast.info('Nenhuma descrição curta encontrada!');
        return;
      }

      const confirmed = window.confirm(
        `Encontradas ${pagesWithShortDesc.length} páginas com descrições curtas ou ausentes.\n\nDeseja expandir automaticamente?`
      );

      if (!confirmed) return;

      setFixProgress({ current: 0, total: pagesWithShortDesc.length, type: 'Descrições Curtas' });

      const results = { success: 0, failed: 0, details: [] as string[] };

      for (let i = 0; i < pagesWithShortDesc.length; i++) {
        const page = pagesWithShortDesc[i];
        
        try {
          const baseDesc = page.description || `Descubra tudo sobre ${page.title || 'este tópico importante'}`;
          const expandedDesc = baseDesc.length < 120 
            ? `${baseDesc}. Aprenda estratégias práticas, dicas essenciais e métodos comprovados para alcançar resultados excepcionais. Transforme seu conhecimento em ação com nosso guia completo e detalhado.`
            : baseDesc;

          const { error } = await supabase
            .from('seo_metadata')
            .update({ description: expandedDesc.substring(0, 160) })
            .eq('id', page.id);

          if (error) throw error;

          results.success++;
          results.details.push(`✅ ${page.title}: Descrição expandida`);
        } catch (error) {
          results.failed++;
          results.details.push(`❌ Erro ao expandir: ${page.title}`);
        }

        setFixProgress({ current: i + 1, total: pagesWithShortDesc.length, type: 'Descrições Curtas' });
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      setFixResults(prev => ({ ...prev, shortDescriptions: results }));
      
      if (results.failed === 0) {
        toast.success(`🔧 ${results.success} descrições expandidas com sucesso!`);
      } else {
        toast.warning(`⚠️ Correção concluída: ${results.success} sucessos, ${results.failed} falhas`);
      }

      await loadSEOData();
    } catch (error) {
      console.error('Erro ao expandir descrições:', error);
      toast.error('Erro ao expandir descrições');
    } finally {
      setAutoFixInProgress(prev => ({ ...prev, shortDescriptions: false }));
      setFixProgress({ current: 0, total: 0, type: '' });
    }
  };

  const fixMissingKeywords = async () => {
    if (autoFixInProgress['missingKeywords']) return;
    
    setAutoFixInProgress(prev => ({ ...prev, missingKeywords: true }));
    
    try {
      const pagesWithoutKeywords = seoDataWithAnalysis.filter(page => 
        !page.keywords || page.keywords.length === 0
      );

      if (pagesWithoutKeywords.length === 0) {
        toast.info('Todas as páginas já possuem palavras-chave!');
        return;
      }

      const confirmed = window.confirm(
        `Encontradas ${pagesWithoutKeywords.length} páginas sem palavras-chave.\n\nDeseja gerar automaticamente baseado no título e tipo?`
      );

      if (!confirmed) return;

      setFixProgress({ current: 0, total: pagesWithoutKeywords.length, type: 'Palavras-chave' });

      const results = { success: 0, failed: 0, details: [] as string[] };

      for (let i = 0; i < pagesWithoutKeywords.length; i++) {
        const page = pagesWithoutKeywords[i];
        
        try {
          // Gerar keywords baseadas no título
          const titleWords = (page.title || '').toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(' ')
            .filter(word => word.length > 3);

          // Keywords base por tipo de página
          const baseKeywords = {
            article: ['guia', 'tutorial', 'dicas', 'estratégias'],
            category: ['categoria', 'conteúdos', 'artigos'],
            home: ['mindset', 'desenvolvimento', 'produtividade'],
            static: ['informações', 'sobre', 'contato']
          };

          const typeKeywords = baseKeywords[page.page_type as keyof typeof baseKeywords] || baseKeywords.article;
          const generatedKeywords = [...new Set([...titleWords.slice(0, 3), ...typeKeywords])].slice(0, 5);

          const { error } = await supabase
            .from('seo_metadata')
            .update({ keywords: generatedKeywords })
            .eq('id', page.id);

          if (error) throw error;

          results.success++;
          results.details.push(`✅ ${page.title}: ${generatedKeywords.length} keywords adicionadas`);
        } catch (error) {
          results.failed++;
          results.details.push(`❌ Erro ao adicionar keywords: ${page.title}`);
        }

        setFixProgress({ current: i + 1, total: pagesWithoutKeywords.length, type: 'Palavras-chave' });
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      setFixResults(prev => ({ ...prev, missingKeywords: results }));
      
      if (results.failed === 0) {
        toast.success(`🔧 Keywords adicionadas em ${results.success} páginas!`);
      } else {
        toast.warning(`⚠️ Correção concluída: ${results.success} sucessos, ${results.failed} falhas`);
      }

      await loadSEOData();
    } catch (error) {
      console.error('Erro ao adicionar keywords:', error);
      toast.error('Erro ao adicionar keywords');
    } finally {
      setAutoFixInProgress(prev => ({ ...prev, missingKeywords: false }));
      setFixProgress({ current: 0, total: 0, type: '' });
    }
  };

  const fixLongUrls = async () => {
    if (autoFixInProgress['longUrls']) return;
    
    setAutoFixInProgress(prev => ({ ...prev, longUrls: true }));
    
    try {
      const pagesWithLongUrls = seoDataWithAnalysis.filter(page => 
        (page.page_url?.length || 0) > 60
      );

      if (pagesWithLongUrls.length === 0) {
        toast.info('Nenhuma URL longa encontrada!');
        return;
      }

      const confirmed = window.confirm(
        `Encontradas ${pagesWithLongUrls.length} URLs longas (>60 caracteres).\n\nDeseja otimizar automaticamente?`
      );

      if (!confirmed) return;

      setFixProgress({ current: 0, total: pagesWithLongUrls.length, type: 'URLs Longas' });

      const results = { success: 0, failed: 0, details: [] as string[] };

      for (let i = 0; i < pagesWithLongUrls.length; i++) {
        const page = pagesWithLongUrls[i];
        
        try {
          // Otimizar URL
          const optimizedUrl = (page.page_url || '')
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 50)
            .replace(/-$/, '');

          const { error } = await supabase
            .from('seo_metadata')
            .update({ page_url: optimizedUrl })
            .eq('id', page.id);

          if (error) throw error;

          results.success++;
          results.details.push(`✅ ${page.title}: URL otimizada`);
        } catch (error) {
          results.failed++;
          results.details.push(`❌ Erro ao otimizar URL: ${page.title}`);
        }

        setFixProgress({ current: i + 1, total: pagesWithLongUrls.length, type: 'URLs Longas' });
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      setFixResults(prev => ({ ...prev, longUrls: results }));
      
      if (results.failed === 0) {
        toast.success(`🔧 ${results.success} URLs otimizadas com sucesso!`);
      } else {
        toast.warning(`⚠️ Correção concluída: ${results.success} sucessos, ${results.failed} falhas`);
      }

      await loadSEOData();
    } catch (error) {
      console.error('Erro ao otimizar URLs:', error);
      toast.error('Erro ao otimizar URLs');
    } finally {
      setAutoFixInProgress(prev => ({ ...prev, longUrls: false }));
      setFixProgress({ current: 0, total: 0, type: '' });
    }
  };

  const fixMissingSchema = async () => {
    if (autoFixInProgress['missingSchema']) return;
    
    setAutoFixInProgress(prev => ({ ...prev, missingSchema: true }));
    
    try {
      const pagesWithoutSchema = seoDataWithAnalysis.filter(page => 
        !page.schema_data || Object.keys(page.schema_data).length === 0
      );

      if (pagesWithoutSchema.length === 0) {
        toast.info('Todas as páginas já possuem Schema.org!');
        return;
      }

      const confirmed = window.confirm(
        `Encontradas ${pagesWithoutSchema.length} páginas sem dados estruturados Schema.org.\n\nDeseja adicionar automaticamente?`
      );

      if (!confirmed) return;

      setFixProgress({ current: 0, total: pagesWithoutSchema.length, type: 'Schema.org' });

      const results = { success: 0, failed: 0, details: [] as string[] };

      for (let i = 0; i < pagesWithoutSchema.length; i++) {
        const page = pagesWithoutSchema[i];
        
        try {
          // Gerar schema básico baseado no tipo de página
          const baseSchema = {
            "@context": "https://schema.org",
            "@type": page.page_type === 'article' ? 'Article' : 'WebPage',
            "name": page.title,
            "description": page.description,
            "url": page.page_url,
            "publisher": {
              "@type": "Organization",
              "name": "AIMindset"
            }
          };

          if (page.page_type === 'article') {
            Object.assign(baseSchema, {
              "author": {
                "@type": "Organization",
                "name": "AIMindset"
              },
              "datePublished": page.created_at,
              "dateModified": page.updated_at
            });
          }

          const { error } = await supabase
            .from('seo_metadata')
            .update({ schema_data: baseSchema })
            .eq('id', page.id);

          if (error) throw error;

          results.success++;
          results.details.push(`✅ ${page.title}: Schema.org adicionado`);
        } catch (error) {
          results.failed++;
          results.details.push(`❌ Erro ao adicionar Schema: ${page.title}`);
        }

        setFixProgress({ current: i + 1, total: pagesWithoutSchema.length, type: 'Schema.org' });
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      setFixResults(prev => ({ ...prev, missingSchema: results }));
      
      if (results.failed === 0) {
        toast.success(`🔧 Schema.org adicionado em ${results.success} páginas!`);
      } else {
        toast.warning(`⚠️ Correção concluída: ${results.success} sucessos, ${results.failed} falhas`);
      }

      await loadSEOData();
    } catch (error) {
      console.error('Erro ao adicionar Schema.org:', error);
      toast.error('Erro ao adicionar Schema.org');
    } finally {
      setAutoFixInProgress(prev => ({ ...prev, missingSchema: false }));
      setFixProgress({ current: 0, total: 0, type: '' });
    }
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

      {/* Sistema de Abas */}
      <div className="flex space-x-1 bg-dark-gray/30 p-1 rounded-lg border border-futuristic-gray/20">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
            activeTab === 'dashboard'
              ? 'bg-neon-purple text-white shadow-lg shadow-neon-purple/25'
              : 'text-futuristic-gray hover:text-white hover:bg-futuristic-gray/10'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
            activeTab === 'reports'
              ? 'bg-neon-purple text-white shadow-lg shadow-neon-purple/25'
              : 'text-futuristic-gray hover:text-white hover:bg-futuristic-gray/10'
          }`}
        >
          <FileText className="w-4 h-4" />
          Relatórios
        </button>
      </div>

      {/* Conteúdo da Aba Dashboard */}
      {activeTab === 'dashboard' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {loadingSkeleton ? (
          // Loading Skeletons
          <>
            {Array.from({ length: 5 }).map((_, index) => (
              <StatCardSkeleton key={index} />
            ))}
          </>
        ) : stats ? (
          // Dados reais
          <>
          <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neon-purple/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 hover:border-white/20 hover:ring-white/20 transition-all hover:translate-y-[-1px] hover:shadow-[0_8px_30px_rgba(99,102,241,0.25)]">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-futuristic-gray font-orbitron text-[11px]">Score Médio</p>
                  <p className="text-2xl font-orbitron font-bold text-white">
                    {stats.averageScore}
                  </p>
                  <p className="text-xs text-futuristic-gray">
                    De 100 pontos
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-neon-purple" />
              </div>
            </div>
          </Card>

          <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-400/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 hover:border-white/20 hover:ring-white/20 transition-all hover:translate-y-[-1px] hover:shadow-[0_8px_30px_rgba(34,197,94,0.25)]">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-futuristic-gray font-orbitron text-[11px]">Excelente</p>
                  <p className="text-2xl font-orbitron font-bold text-green-400">
                    {stats.excellentPages}
                  </p>
                  <p className="text-xs text-futuristic-gray">
                    90-100 pontos
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-lime-green/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 hover:border-white/20 hover:ring-white/20 transition-all hover:translate-y-[-1px] hover:shadow-[0_8px_30px_rgba(132,204,22,0.25)]">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-futuristic-gray font-orbitron text-[11px]">Bom</p>
                  <p className="text-2xl font-orbitron font-bold text-lime-green">
                    {stats.goodPages}
                  </p>
                  <p className="text-xs text-futuristic-gray">
                    70-89 pontos
                  </p>
                </div>
                <Target className="w-8 h-8 text-lime-green" />
              </div>
            </div>
          </Card>

          <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-400/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 hover:border-white/20 hover:ring-white/20 transition-all hover:translate-y-[-1px] hover:shadow-[0_8px_30px_rgba(250,204,21,0.25)]">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-futuristic-gray font-orbitron text-[11px]">Precisa Melhorar</p>
                  <p className="text-2xl font-orbitron font-bold text-yellow-400">
                    {stats.needsImprovementPages}
                  </p>
                  <p className="text-xs text-futuristic-gray">
                    50-69 pontos
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
          </Card>

          <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-400/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 hover:border-white/20 hover:ring-white/20 transition-all hover:translate-y-[-1px] hover:shadow-[0_8px_30px_rgba(248,113,113,0.25)]">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-futuristic-gray font-orbitron text-[11px]">Ruim</p>
                  <p className="text-2xl font-orbitron font-bold text-red-400">
                    {stats.poorPages}
                  </p>
                  <p className="text-xs text-futuristic-gray">
                    0-49 pontos
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </div>
          </Card>
          </>
        ) : null}
      </div>

      {/* Métricas Avançadas */}
      {stats && (
        <>
        <div className="mt-6">
          <h3 className="text-lg font-orbitron font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-neon-purple" />
            Métricas Avançadas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-400/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 hover:border-white/20 hover:ring-white/20 transition-all hover:translate-y-[-1px] hover:shadow-[0_8px_30px_rgba(251,146,60,0.25)]">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-futuristic-gray font-orbitron text-[11px]">Títulos Duplicados</p>
                    <p className="text-2xl font-orbitron font-bold text-orange-400">
                      {stats.duplicatedTitles}
                    </p>
                    <p className="text-xs text-futuristic-gray">
                      Páginas afetadas
                    </p>
                  </div>
                  <Copy className="w-8 h-8 text-orange-400" />
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-400/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 hover:border-white/20 hover:ring-white/20 transition-all hover:translate-y-[-1px] hover:shadow-[0_8px_30px_rgba(250,204,21,0.25)]">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-futuristic-gray font-orbitron text-[11px]">URLs Longas</p>
                    <p className="text-2xl font-orbitron font-bold text-yellow-400">
                      {stats.longUrls}
                    </p>
                    <p className="text-xs text-futuristic-gray">
                      Mais de 60 caracteres
                    </p>
                  </div>
                  <ExternalLink className="w-8 h-8 text-yellow-400" />
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-400/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 hover:border-white/20 hover:ring-white/20 transition-all hover:translate-y-[-1px] hover:shadow-[0_8px_30px_rgba(248,113,113,0.25)]">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-futuristic-gray font-orbitron text-[11px]">Sem Schema.org</p>
                    <p className="text-2xl font-orbitron font-bold text-red-400">
                      {stats.withoutSchema}
                    </p>
                    <p className="text-xs text-futuristic-gray">
                      Dados estruturados
                    </p>
                  </div>
                  <Database className="w-8 h-8 text-red-400" />
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-400/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 hover:border-white/20 hover:ring-white/20 transition-all hover:translate-y-[-1px] hover:shadow-[0_8px_30px_rgba(34,197,94,0.25)]">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-futuristic-gray font-orbitron text-[11px]">Atualizações Recentes</p>
                    <p className="text-2xl font-orbitron font-bold text-green-400">
                      {stats.recentUpdates}
                    </p>
                    <p className="text-xs text-futuristic-gray">
                      Últimos 7 dias
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-green-400" />
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ações Prioritárias */}
            <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neon-purple/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 transition-all">
              <div className="p-4">
                <h4 className="text-md font-medium text-white mb-4">Ações Prioritárias</h4>
                <div className="space-y-3">
                  {(() => {
                    const actions = [];
                    
                    if (stats.duplicatedTitles > 0) {
                      actions.push({
                        priority: 'high',
                        action: `Corrigir ${stats.duplicatedTitles} título(s) duplicado(s)`,
                        impact: 'Alto impacto no SEO'
                      });
                    }
                    
                    if (stats.shortDescriptions > 0) {
                      actions.push({
                        priority: 'medium',
                        action: `Expandir ${stats.shortDescriptions} descrição(ões) curta(s)`,
                        impact: 'Melhora CTR'
                      });
                    }
                    
                    if (stats.withoutKeywords > 0) {
                      actions.push({
                        priority: 'medium',
                        action: `Adicionar keywords em ${stats.withoutKeywords} página(s)`,
                        impact: 'Melhora relevância'
                      });
                    }
                    
                    if (stats.longUrls > 0) {
                      actions.push({
                        priority: 'low',
                        action: `Otimizar ${stats.longUrls} URL(s) longa(s)`,
                        impact: 'Melhora usabilidade'
                      });
                    }
                    
                    return actions.slice(0, 4).map((action, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-darker-surface/50 rounded-lg">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          action.priority === 'high' ? 'bg-red-400' :
                          action.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">{action.action}</p>
                          <p className="text-futuristic-gray text-xs">{action.impact}</p>
                        </div>
                      </div>
                    ));
                  })()}
                  
                  {stats.duplicatedTitles === 0 && stats.shortDescriptions === 0 && stats.withoutKeywords === 0 && (
                    <div className="text-center py-4">
                      <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <p className="text-green-400 font-medium">Excelente trabalho!</p>
                      <p className="text-futuristic-gray text-sm">Não há ações prioritárias no momento</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
        </>
      )}

      {/* Relatório de Tendências */}
      <Card className="glass-effect mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-orbitron font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-neon-purple" />
              Relatório de Tendências
            </h3>
            <div className="text-sm text-futuristic-gray">
              Últimos 30 dias
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Evolução */}
            <div>
              <h4 className="text-lg font-medium text-white mb-4">Evolução do Score Médio</h4>
              <div className="bg-darker-surface rounded-lg p-4">
                {/* Simulação de gráfico simples */}
                <div className="flex items-end justify-between h-32 gap-2">
                  {[65, 68, 70, 72, 69, 74, 76, 78, 75, 80, 82, 85].map((score, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-gradient-to-t from-neon-purple/60 to-neon-purple rounded-t-sm transition-all duration-500"
                        style={{ height: `${(score / 100) * 100}%` }}
                        title={`Semana ${index + 1}: ${score} pontos`}
                      ></div>
                      <div className="text-xs text-futuristic-gray mt-1">
                        {index % 3 === 0 ? `S${index + 1}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-futuristic-gray mt-2">
                  <span>Início</span>
                  <span>Hoje</span>
                </div>
              </div>
            </div>

            {/* Páginas que Melhoraram/Pioraram */}
            <div>
              <h4 className="text-lg font-medium text-white mb-4">Mudanças Significativas</h4>
              <div className="space-y-3">
                {/* Páginas que melhoraram */}
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-medium">Melhoraram</span>
                    <span className="text-green-400 text-sm">+12 páginas</span>
                  </div>
                  <div className="text-sm text-futuristic-gray">
                    Principais: Blog posts, Páginas de produto, Landing pages
                  </div>
                </div>

                {/* Páginas que pioraram */}
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 font-medium">Pioraram</span>
                    <span className="text-red-400 text-sm">-3 páginas</span>
                  </div>
                  <div className="text-sm text-futuristic-gray">
                    Principais: Páginas antigas, Conteúdo desatualizado
                  </div>
                </div>

                {/* Comparação com período anterior */}
                <div className="bg-neon-purple/10 border border-neon-purple/20 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">Score Médio</span>
                    <div className="flex items-center gap-2">
                      <span className="text-futuristic-gray text-sm">78.5</span>
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 text-sm">+5.2%</span>
                    </div>
                  </div>
                  <div className="text-sm text-futuristic-gray">
                    Comparado com o mês anterior
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Insights e Recomendações */}
          <div className="mt-6 p-4 bg-neon-purple/5 border border-neon-purple/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <h5 className="text-white font-medium mb-2">Insights Automáticos</h5>
                <ul className="text-sm text-futuristic-gray space-y-1">
                  <li>• Páginas com títulos otimizados tiveram +15% melhor performance</li>
                  <li>• Conteúdos atualizados nos últimos 7 dias mostram +8% no score</li>
                  <li>• Páginas com schema.org têm 23% mais chances de ter score excelente</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Filtros */}
      <Card className="glass-effect">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Busca Avançada */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-futuristic-gray w-5 h-5" />
              <input
                id="search-input"
                type="text"
                placeholder="Buscar páginas... (ex: score:<70, type:article, updated:7d, problem:title)"
                value={searchTerm}
                aria-label="Buscar páginas SEO com comandos avançados"
                aria-describedby="search-help"
                role="searchbox"
                autoComplete="off"
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  // Gerar sugestões em tempo real
                  if (e.target.value.length > 0) {
                    const suggestions = [
                      'score:<70',
                      'score:>80',
                      'type:article',
                      'type:home',
                      'updated:7d',
                      'updated:30d',
                      'problem:title',
                      'problem:description',
                      'problem:keywords'
                    ].filter(s => s.includes(e.target.value.toLowerCase()));
                    setSearchSuggestions(suggestions.slice(0, 5));
                  } else {
                    setSearchSuggestions([]);
                  }
                }}
                onFocus={() => setShowAdvancedSearch(true)}
                onBlur={() => setTimeout(() => setShowAdvancedSearch(false), 200)}
                className="w-full pl-10 pr-12 py-2 bg-darker-surface border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-lime-green transition-colors"
              />
              <button
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-futuristic-gray hover:text-neon-purple transition-colors"
              >
                <Filter className="w-4 h-4" />
              </button>
              
              {/* Sugestões de Busca */}
              {showAdvancedSearch && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-darker-surface border border-neon-purple/20 rounded-lg shadow-lg z-10">
                  {searchSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchTerm(suggestion);
                        setShowAdvancedSearch(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-futuristic-gray hover:bg-neon-purple/10 hover:text-white transition-colors first:rounded-t-lg last:rounded-b-lg"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filtro por status */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 bg-darker-surface border border-neon-purple/20 rounded-lg text-white focus:outline-none focus:border-lime-green transition-colors"
            >
              <option value="all">Todas as páginas</option>
              <option value="excellent">🟢 Excelente (90-100)</option>
              <option value="good">🟡 Bom (70-89)</option>
              <option value="poor">🔴 Precisa Melhorar (0-69)</option>
              <option value="optimized">Otimizadas (legado)</option>
              <option value="needs-attention">Precisam atenção (legado)</option>
            </select>
          </div>

          {/* Filtros Avançados */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4 pt-4 border-t border-neon-purple/20">
            {/* Filtro por Score SEO */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-futuristic-gray mb-2">
                Score SEO
              </label>
              <select
                value={scoreFilter}
                onChange={(e) => {
                  console.log('🎯 Score filter changed:', e.target.value);
                  setScoreFilter(e.target.value as 'all' | 'excellent' | 'good' | 'needs-improvement' | 'poor');
                }}
                className="w-full px-3 py-2 bg-darker-surface border border-neon-purple/20 rounded-lg text-white focus:outline-none focus:border-lime-green transition-colors"
              >
                <option value="all">Todos os Scores</option>
                <option value="excellent">🟢 Excelente (90-100)</option>
                <option value="good">🟡 Bom (70-89)</option>
                <option value="needs-improvement">🟠 Precisa Melhorar (50-69)</option>
                <option value="poor">🔴 Ruim (0-49)</option>
              </select>
            </div>

            {/* Filtro por Tipo de Página */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-futuristic-gray mb-2">
                Tipo de Página
              </label>
              <select
                value={pageTypeFilter}
                onChange={(e) => {
                  console.log('📄 Page type filter changed:', e.target.value);
                  setPageTypeFilter(e.target.value as 'all' | 'article' | 'category' | 'static');
                }}
                className="w-full px-3 py-2 bg-darker-surface border border-neon-purple/20 rounded-lg text-white focus:outline-none focus:border-lime-green transition-colors"
              >
                <option value="all">Todos os Tipos</option>
                <option value="article">📝 Artigos</option>
                <option value="category">📂 Categorias</option>
                <option value="page">📄 Páginas Estáticas</option>
                <option value="home">🏠 Página Inicial</option>
              </select>
            </div>

            {/* Filtro por Problemas Específicos */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-futuristic-gray mb-2">
                Problemas Específicos
              </label>
              <select
                value={problemFilter}
                onChange={(e) => {
                  console.log('⚠️ Problem filter changed:', e.target.value);
                  setProblemFilter(e.target.value as 'all' | 'duplicate-title' | 'short-description' | 'no-keywords' | 'long-url' | 'no-og-image' | 'no-schema');
                }}
                className="w-full px-3 py-2 bg-darker-surface border border-neon-purple/20 rounded-lg text-white focus:outline-none focus:border-lime-green transition-colors"
              >
                <option value="all">Todos os Problemas</option>
                <option value="duplicate-title">🔄 Título Duplicado</option>
                <option value="short-description">📏 Descrição Muito Curta</option>
                <option value="no-keywords">🔑 Sem Keywords</option>
                <option value="long-url">🔗 URL Muito Longa</option>
                <option value="no-og-image">🖼️ Sem Imagem OG</option>
                <option value="no-schema">📋 Sem Schema.org</option>
              </select>
            </div>

            {/* Sistema de Ordenação */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-futuristic-gray mb-2">
                Ordenar Por
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  console.log('🔄 Sort changed:', e.target.value);
                  setSortBy(e.target.value as 'score-desc' | 'score-asc' | 'updated-desc' | 'updated-asc' | 'type-asc' | 'title-asc');
                }}
                className="w-full px-3 py-2 bg-darker-surface border border-neon-purple/20 rounded-lg text-white focus:outline-none focus:border-lime-green transition-colors"
              >
                <option value="score-desc">📊 Score (Maior → Menor)</option>
                <option value="score-asc">📊 Score (Menor → Maior)</option>
                <option value="updated-desc">📅 Mais Recente</option>
                <option value="updated-asc">📅 Mais Antiga</option>
                <option value="type-asc">📂 Tipo (A-Z)</option>
                <option value="title-asc">📝 Título (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Resultados e Seleção */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-neon-purple/20">
            <div className="flex items-center gap-4">
              <span className="text-futuristic-gray text-sm">
                {sortedData.length} página{sortedData.length !== 1 ? 's' : ''} encontrada{sortedData.length !== 1 ? 's' : ''}
              </span>
              
              {sortedData.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 text-sm text-neon-purple hover:text-lime-green transition-colors"
                  >
                    {selectedPages.size === sortedData.length ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    Selecionar Todas
                  </button>
                  
                  {selectedPages.size > 0 && (
                    <span className="text-xs text-futuristic-gray">
                      ({selectedPages.size} selecionada{selectedPages.size !== 1 ? 's' : ''})
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Filtros Avançados de Seleção */}
            {sortedData.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={selectPagesWithIssues}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Selecionar com Problemas
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => selectPagesByScore(70)}
                  className="text-xs text-yellow-400 hover:text-yellow-300"
                >
                  Selecionar Score &lt; 70
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Barra de Ações em Lote */}
      {selectedPages.size > 0 && (
        <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neon-purple/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 hover:border-white/20 hover:ring-white/20 transition-all hover:translate-y-[-1px] hover:shadow-[0_8px_30px_rgba(99,102,241,0.25)] border-neon-purple/30">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-lime-green" />
                  <span className="text-white font-medium">
                    {selectedPages.size} página{selectedPages.size !== 1 ? 's' : ''} selecionada{selectedPages.size !== 1 ? 's' : ''}
                  </span>
                </div>
                
                {bulkOperationInProgress && (
                  <div className="flex items-center gap-2 text-sm text-futuristic-gray">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neon-purple"></div>
                    <span>
                      Processando {bulkProgress.current}/{bulkProgress.total}: {bulkProgress.currentPage}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={bulkRegenerateSEO}
                  disabled={bulkOperationInProgress}
                  className="bg-lime-green hover:bg-lime-green/80 text-black"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Regenerar SEO
                </Button>
                
                <Button
                  size="sm"
                  onClick={exportCSVReport}
                  disabled={bulkOperationInProgress}
                  className="bg-blue-600 hover:bg-blue-700"
                  title="Exportar relatório detalhado em CSV"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
                
                <Button
                  size="sm"
                  onClick={autoFixSimpleIssues}
                  disabled={bulkOperationInProgress}
                  className="bg-green-600 hover:bg-green-700"
                  title="Corrigir automaticamente problemas simples como títulos curtos, descrições vazias e keywords ausentes"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Correção Automática
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearSelection}
                  disabled={bulkOperationInProgress}
                  className="text-futuristic-gray hover:text-white"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar Seleção
                </Button>
              </div>
            </div>

            {/* Barra de Progresso para Bulk Operations */}
            {bulkOperationInProgress && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-futuristic-gray">Progresso da operação</span>
                  <span className="text-sm text-white">
                    {Math.round((bulkProgress.current / bulkProgress.total) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-darker-surface rounded-full h-2">
                  <div 
                    className="bg-lime-green h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Lista de Páginas */}
      <div className="grid grid-cols-1 gap-4">
        {paginatedData.map((page) => {
          return (
            <Card key={page.id} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-neon-purple/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 transition-all hover:border-white/20 hover:ring-white/20 hover:translate-y-[-1px] hover:shadow-[0_8px_30px_rgba(99,102,241,0.25)] ${selectedPages.has(page.id) ? 'border-lime-green/50 ring-lime-green/30 bg-lime-green/5' : ''}`}>
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  {/* Checkbox de Seleção */}
                  <button
                    onClick={() => togglePageSelection(page.id)}
                    className="mt-1 flex-shrink-0 p-1 rounded hover:bg-neon-purple/20 transition-colors"
                  >
                    {selectedPages.has(page.id) ? (
                      <CheckSquare className="w-5 h-5 text-lime-green" />
                    ) : (
                      <Square className="w-5 h-5 text-futuristic-gray hover:text-neon-purple" />
                    )}
                  </button>

                  {/* Avatar/Iniciais */}
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full bg-neon-gradient text-white font-orbitron text-sm flex items-center justify-center shadow-lg shadow-neon-purple/20">
                      {page.title?.[0]?.toUpperCase() || page.page_type?.[0]?.toUpperCase() || 'P'}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-orbitron font-bold text-white truncate">
                        {page.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        {/* Badges de Alerta */}
                        {(() => {
                          const alerts = getSEOAlerts(page, seoDataWithAnalysis);
                          return alerts.map((alert, index) => (
                            <div
                              key={index}
                              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                alert.severity === 'high' 
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                                  : alert.severity === 'medium'
                                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                  : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                              }`}
                              title={alert.message}
                            >
                              <Bell className="w-3 h-3" />
                              {alert.type === 'duplicate-title' && 'Duplicado'}
                              {alert.type === 'short-description' && 'Desc. Curta'}
                              {alert.type === 'no-keywords' && 'Sem Keywords'}
                              {alert.type === 'unoptimized-url' && 'URL'}
                            </div>
                          ));
                        })()}
                        {/* Status Badge */}
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            page.analysis.status === 'excellent'
                              ? 'bg-lime-green/20 text-lime-green border border-lime-green/30'
                              : page.analysis.status === 'good'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : page.analysis.status === 'needs-improvement'
                              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {page.analysis.status === 'excellent'
                            ? 'Excelente'
                            : page.analysis.status === 'good'
                            ? 'Bom'
                            : page.analysis.status === 'needs-improvement'
                            ? 'Precisa Melhorar'
                            : 'Ruim'}
                        </span>
                        <SEOScoreBadge analysis={page.analysis} />
                      </div>
                    </div>
                    
                    {/* Barra de Progresso SEO */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-futuristic-gray">Qualidade SEO</span>
                        <span className="text-xs text-futuristic-gray">{page.analysis.score}/100</span>
                      </div>
                      <SEOProgressBar score={page.analysis.score} status={page.analysis.status} />
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-futuristic-gray mb-2">
                      <span className="flex items-center">
                        <FileText className="w-4 h-4 mr-1" />
                        {formatPageType(page.page_type)}
                      </span>
                      <span className="flex items-center truncate max-w-[40%]">
                        <LinkIcon className="w-4 h-4 mr-1" />
                        <span className="truncate">{page.page_url}</span>
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
                            className="px-2 py-1 bg-neon-purple/20 text-neon-purple text-xs rounded-full border border-neon-purple/30"
                          >
                            {keyword}
                          </span>
                        ))}
                        {page.keywords.length > 5 && (
                          <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full border border-white/10">
                            +{page.keywords.length - 5}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Issues SEO */}
                    {page.analysis.issues.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {page.analysis.issues.slice(0, 3).map((issue, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full flex items-center border border-red-500/30"
                          >
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {issue}
                          </span>
                        ))}
                        {page.analysis.issues.length > 3 && (
                          <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full border border-white/10">
                            +{page.analysis.issues.length - 3} problemas
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  
                  <div className="flex space-x-2 flex-shrink-0 mt-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedPage(page)}
                      className="text-blue-400 hover:text-blue-300 transition-transform hover:-translate-y-0.5"
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => await regenerateSEO(page.id)}
                      className="text-lime-green hover:text-lime-green/80 transition-transform hover:-translate-y-0.5"
                      title="Regenerar SEO"
                      disabled={loading || bulkOperationInProgress}
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

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-futuristic-gray">
            Mostrando {startIndex + 1}-{Math.min(endIndex, sortedData.length)} de {sortedData.length} páginas
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="text-futuristic-gray hover:text-white"
              title="Página anterior (Seta esquerda)"
            >
              ←
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    size="sm"
                    variant={currentPage === pageNum ? "primary" : "ghost"}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 p-0 ${
                      currentPage === pageNum 
                        ? 'bg-neon-purple text-white' 
                        : 'text-futuristic-gray hover:text-white'
                    }`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="text-futuristic-gray hover:text-white"
              title="Próxima página (Seta direita)"
            >
              →
            </Button>
          </div>
        </div>
      )}

      {sortedData.length === 0 && (
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
        </>
      )}

      {/* Conteúdo da Aba Relatórios */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Métricas Gerais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats && (
              <>
                <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neon-purple/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 hover:border-white/20 hover:ring-white/20 transition-all hover:translate-y-[-1px] hover:shadow-[0_8px_30px_rgba(99,102,241,0.25)]">
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-futuristic-gray font-orbitron text-[11px]">Total de Páginas</p>
                        <p className="text-2xl font-orbitron font-bold text-white">
                          {stats.totalPages}
                        </p>
                      </div>
                      <Globe className="w-8 h-8 text-neon-purple" />
                    </div>
                  </div>
                </Card>

                <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-lime-green/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 hover:border-white/20 hover:ring-white/20 transition-all hover:translate-y-[-1px] hover:shadow-[0_8px_30px_rgba(132,204,22,0.25)]">
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-futuristic-gray font-orbitron text-[11px]">Score Médio</p>
                        <p className="text-2xl font-orbitron font-bold text-white">
                          {stats.averageScore}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-lime-green" />
                    </div>
                  </div>
                </Card>

                <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-400/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 hover:border-white/20 hover:ring-white/20 transition-all hover:translate-y-[-1px] hover:shadow-[0_8px_30px_rgba(34,197,94,0.25)]">
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-futuristic-gray font-orbitron text-[11px]">Páginas Excelentes</p>
                        <p className="text-2xl font-orbitron font-bold text-white">
                          {stats.excellentPages}
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-lime-green" />
                    </div>
                  </div>
                </Card>

                <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-400/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 hover:border-white/20 hover:ring-white/20 transition-all hover:translate-y-[-1px] hover:shadow-[0_8px_30px_rgba(250,204,21,0.25)]">
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-futuristic-gray font-orbitron text-[11px]">Precisam Melhorar</p>
                        <p className="text-2xl font-orbitron font-bold text-white">
                          {stats.needsImprovementPages + stats.poorPages}
                        </p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-yellow-500" />
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>

          {/* Distribuição por Status */}
          <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neon-purple/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 mb-6">
            <div className="p-6">
              <h3 className="text-xl font-orbitron font-bold text-white mb-4">
                Distribuição por Status SEO
              </h3>
              {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-lime-green/20 flex items-center justify-center">
                      <span className="text-2xl font-bold text-lime-green">{stats.excellentPages}</span>
                    </div>
                    <p className="text-sm text-futuristic-gray">Excelente</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-green-500/20 flex items-center justify-center">
                      <span className="text-2xl font-bold text-green-400">{stats.goodPages}</span>
                    </div>
                    <p className="text-sm text-futuristic-gray">Bom</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <span className="text-2xl font-bold text-yellow-400">{stats.needsImprovementPages}</span>
                    </div>
                    <p className="text-sm text-futuristic-gray">Precisa Melhorar</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-red-500/20 flex items-center justify-center">
                      <span className="text-2xl font-bold text-red-400">{stats.poorPages}</span>
                    </div>
                    <p className="text-sm text-futuristic-gray">Ruim</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Problemas Identificados */}
          <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neon-purple/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-orbitron font-bold text-white">
                  Problemas Identificados
                </h3>
                {fixProgress.total > 0 && (
                  <div className="text-sm text-neon-purple">
                    {fixProgress.type}: {fixProgress.current}/{fixProgress.total}
                  </div>
                )}
              </div>
              
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    {/* Títulos Duplicados */}
                    <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-red-400">Títulos Duplicados</span>
                        <span className="font-bold text-white">{stats.duplicatedTitles}</span>
                      </div>
                      {stats.duplicatedTitles > 0 && (
                        <Button
                          onClick={fixDuplicateTitles}
                          disabled={autoFixInProgress['duplicateTitles']}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs px-2 py-1 h-auto"
                        >
                          {autoFixInProgress['duplicateTitles'] ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <>🔧 Corrigir</>
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Descrições Curtas */}
                    <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-yellow-400">Descrições Curtas</span>
                        <span className="font-bold text-white">{stats.shortDescriptions}</span>
                      </div>
                      {stats.shortDescriptions > 0 && (
                        <Button
                          onClick={fixShortDescriptions}
                          disabled={autoFixInProgress['shortDescriptions']}
                          className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 text-xs px-2 py-1 h-auto"
                        >
                          {autoFixInProgress['shortDescriptions'] ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <>🔧 Corrigir</>
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Sem Palavras-chave */}
                    <div className="flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-orange-400">Sem Palavras-chave</span>
                        <span className="font-bold text-white">{stats.withoutKeywords}</span>
                      </div>
                      {stats.withoutKeywords > 0 && (
                        <Button
                          onClick={fixMissingKeywords}
                          disabled={autoFixInProgress['missingKeywords']}
                          className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 text-xs px-2 py-1 h-auto"
                        >
                          {autoFixInProgress['missingKeywords'] ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <>🔧 Corrigir</>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {/* URLs Longas */}
                    <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-blue-400">URLs Longas</span>
                        <span className="font-bold text-white">{stats.longUrls}</span>
                      </div>
                      {stats.longUrls > 0 && (
                        <Button
                          onClick={fixLongUrls}
                          disabled={autoFixInProgress['longUrls']}
                          className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs px-2 py-1 h-auto"
                        >
                          {autoFixInProgress['longUrls'] ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <>🔧 Corrigir</>
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Sem Schema.org */}
                    <div className="flex items-center justify-between p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-purple-400">Sem Schema.org</span>
                        <span className="font-bold text-white">{stats.withoutSchema}</span>
                      </div>
                      {stats.withoutSchema > 0 && (
                        <Button
                          onClick={fixMissingSchema}
                          disabled={autoFixInProgress['missingSchema']}
                          className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-xs px-2 py-1 h-auto"
                        >
                          {autoFixInProgress['missingSchema'] ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <>🔧 Corrigir</>
                          )}
                        </Button>
                      )}
                    </div>

                    {/* URLs Não Otimizadas */}
                    <div className="flex items-center justify-between p-3 bg-gray-500/10 border border-gray-500/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400">URLs Não Otimizadas</span>
                        <span className="font-bold text-white">{stats.unoptimizedUrls}</span>
                      </div>
                      {stats.unoptimizedUrls > 0 && (
                        <Button
                          onClick={fixLongUrls} // Usa a mesma função de URLs longas
                          disabled={autoFixInProgress['longUrls']}
                          className="bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 text-xs px-2 py-1 h-auto"
                        >
                          {autoFixInProgress['longUrls'] ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <>🔧 Corrigir</>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Barra de Progresso Global */}
              {fixProgress.total > 0 && (
                <div className="mt-4 p-3 bg-neon-purple/10 border border-neon-purple/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-neon-purple font-medium">
                      Corrigindo {fixProgress.type}...
                    </span>
                    <span className="text-xs text-futuristic-gray">
                      {Math.round((fixProgress.current / fixProgress.total) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-dark-gray/50 rounded-full h-2">
                    <div 
                      className="bg-neon-gradient h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(fixProgress.current / fixProgress.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Resultados das Correções */}
              {Object.keys(fixResults).length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium text-white">Últimas Correções:</h4>
                  {Object.entries(fixResults).map(([type, result]) => (
                    <div key={type} className="text-xs p-2 bg-dark-gray/30 rounded border border-futuristic-gray/20">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-neon-purple font-medium">{type}</span>
                        <span className="text-green-400">
                          ✅ {result.success} | ❌ {result.failed}
                        </span>
                      </div>
                      {result.details.slice(0, 3).map((detail, idx) => (
                        <div key={idx} className="text-futuristic-gray truncate">
                          {detail}
                        </div>
                      ))}
                      {result.details.length > 3 && (
                        <div className="text-futuristic-gray/60">
                          +{result.details.length - 3} mais...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Placeholder para Gráficos Futuros */}
          <Card className="glass-effect">
            <div className="p-6">
              <h3 className="text-xl font-orbitron font-bold text-white mb-4">
                Análise Temporal
              </h3>
              <div className="flex items-center justify-center h-64 border-2 border-dashed border-futuristic-gray/30 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 text-futuristic-gray mx-auto mb-4" />
                  <p className="text-futuristic-gray">Gráficos de evolução temporal serão implementados em breve</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Detalhes */}
      {selectedPage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-darker-surface border border-neon-purple/20 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-orbitron font-bold text-white">
                    Detalhes SEO
                  </h3>
                  <SEOScoreBadge analysis={selectedPage.analysis} />
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedPage(null)}
                  className="text-futuristic-gray hover:text-white"
                >
                  ✕
                </Button>
              </div>

              {/* Análise SEO */}
              <div className="mb-6 p-4 bg-darker-surface/30 rounded-lg border border-neon-purple/10">
                <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-lime-green" />
                  Análise de Qualidade SEO
                </h4>
                
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-futuristic-gray">Score Geral</span>
                    <span className="text-sm font-medium text-white">{selectedPage.analysis.score}/100</span>
                  </div>
                  <SEOProgressBar score={selectedPage.analysis.score} status={selectedPage.analysis.status} />
                </div>

                {/* Problemas Encontrados */}
                {selectedPage.analysis.issues.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-red-400 mb-2 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Problemas Encontrados ({selectedPage.analysis.issues.length})
                    </h5>
                    <div className="space-y-1">
                      {selectedPage.analysis.issues.map((issue, index) => (
                        <div key={index} className="text-sm text-red-300 flex items-center">
                          <span className="w-1 h-1 bg-red-400 rounded-full mr-2"></span>
                          {issue}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sugestões de Melhoria */}
                {selectedPage.analysis.suggestions.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-blue-400 mb-2 flex items-center">
                      <Target className="w-4 h-4 mr-1" />
                      Sugestões de Melhoria ({selectedPage.analysis.suggestions.length})
                    </h5>
                    <div className="space-y-2">
                      {selectedPage.analysis.suggestions.map((suggestion, index) => (
                        <div key={index} className="text-sm text-blue-300 bg-blue-500/10 p-2 rounded border-l-2 border-blue-400">
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Preview nos Buscadores e Redes Sociais */}
              <PreviewTabs page={selectedPage} />

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
                  onClick={async () => {
                    await regenerateSEO(selectedPage.id);
                    setSelectedPage(null);
                  }}
                  className="bg-neon-gradient hover:bg-neon-gradient/80"
                  disabled={loading}
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