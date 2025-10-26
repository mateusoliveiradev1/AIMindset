import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, Tag, Share2, Twitter, Linkedin, Facebook, ArrowLeft, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { useArticles } from '../hooks/useArticles';
import { useReadingTime } from '../hooks/useReadingTime';
import { useSEO } from '../hooks/useSEO';
import { mockCategories } from '../data/mockData';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import SEOManager from '../components/SEO/SEOManager';
import PreloadManager from '../components/Performance/PreloadManager';
// import LazyImage from '../components/Performance/LazyImage';
import { 
  ReadingProgressBarLazy,
  TableOfContentsLazy,
  ArticleNavigationLazy,
  FeedbackSectionLazy,
  CommentSectionLazy
} from '../components/LazyComponents';
// Importação direta para debug
import { TableOfContents } from '../components/TableOfContents';

const Article: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { articles, categories, loading, error, refreshArticles } = useArticles();
  
  // Debug logs para investigar o problema
  console.log('🔍 Article.tsx - Renderizando página do artigo');
  console.log('🔍 Article.tsx - Slug recebido:', slug);
  console.log('🔍 Article.tsx - Artigos carregados:', articles?.length || 0);
  console.log('🔍 Article.tsx - Loading:', loading);
  console.log('🔍 Article.tsx - Error:', error);
  console.log('🔍 Article.tsx - Todos os artigos:', articles?.map(a => ({ slug: a.slug, title: a.title, published: a.published })));
  
  useEffect(() => {
    refreshArticles();
  }, [refreshArticles]);
  
  const article = (articles || []).find(art => art?.slug === slug && art.published);
  const articleCategory = categories.find(cat => cat.id === article?.category_id);
  
  console.log('🔍 Article.tsx - Artigo encontrado:', article ? `ID: ${article.id}, Título: ${article.title}` : 'NENHUM ARTIGO ENCONTRADO');
  

  

  
  // SEO Hook - melhorado para usar dados do artigo
  const seoHook = useSEO({
    pageType: 'article',
    pageSlug: slug,
    fallbackTitle: article ? `${article.title} | AIMindset` : 'Artigo - AIMindset',
    fallbackDescription: article?.excerpt || 'Descubra insights sobre IA e tecnologia no AIMindset.',
    fallbackKeywords: article?.tags ? 
      [...article.tags.split(',').map(tag => tag.trim()), 'inteligência artificial', 'IA', 'produtividade'] :
      ['inteligência artificial', 'IA', 'produtividade', 'artigo', 'blog']
  });

  const metadata = seoHook.getMetadata();
  
  // console.log('🔍 Article.tsx - Artigo encontrado:', article ? `ID: ${article.id}, Título: ${article.title}` : 'NENHUM ARTIGO ENCONTRADO');
  
  // Calculate dynamic reading time
  const dynamicReadingTime = useReadingTime(article?.content || '');
  
  const relatedArticles = (articles || [])
    .filter(art => 
      art?.slug && 
      art.slug !== article?.slug && 
      art.published &&
      art.category_id === article?.category_id
    )
    .slice(0, 3);

  if (loading) {
    // console.log('🔍 Article.tsx - Mostrando loading...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-green mx-auto mb-4"></div>
          <p className="text-futuristic-gray">Carregando artigo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    // console.log('🔍 Article.tsx - Mostrando erro:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Erro ao carregar artigo</h1>
          <p className="text-futuristic-gray">{error}</p>
        </div>
      </div>
    );
  }

  if (!article) {
    // console.log('🔍 Article.tsx - Artigo não encontrado, mostrando 404');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Artigo não encontrado</h1>
          <p className="text-futuristic-gray mb-6">O artigo que você está procurando não existe ou foi removido.</p>
          <Link 
            to="/" 
            className="inline-flex items-center px-6 py-3 bg-lime-green text-dark-surface font-medium rounded-lg hover:bg-lime-green/90 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  // console.log('🔍 Article.tsx - Renderizando artigo completo, incluindo CommentSection');

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data não disponível';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Data inválida';
      
      return date.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = article.title;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      default:
        navigator.clipboard.writeText(url);
        toast.success('Link copiado para a área de transferência!');
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  return (
    <>
      {/* SEO Manager */}
      <SEOManager metadata={metadata} />
      
      {/* Reading Progress Bar */}
      <ReadingProgressBarLazy target="article-content" />
      
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar - Table of Contents */}
            <aside className="lg:w-64 order-2 lg:order-1">
              <div className="lg:sticky lg:top-20 lg:h-screen lg:overflow-y-auto lg:pb-20">
                {console.log('🔍 [ARTICLE DEBUG] Renderizando TableOfContents com slug:', slug)}
                <TableOfContents articleSlug={slug} />
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 lg:max-w-4xl order-1 lg:order-2">
              {/* Back Button */}
              <div className="mb-8">
                <Link
                  to={`/categoria/${articleCategory?.slug || ''}`}
                  className="inline-flex items-center text-futuristic-gray hover:text-lime-green transition-colors duration-300"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para {articleCategory?.name || 'Categoria'}
                </Link>
              </div>
    
              {/* Article Header */}
              <header className="mb-12">
                <div className="mb-6">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-montserrat font-semibold bg-neon-purple/20 text-neon-purple border border-neon-purple/30">
                    <Tag className="h-3 w-3 mr-1" />
                    {articleCategory?.name || 'Categoria'}
                  </span>
                </div>
    
                <h1 className="font-orbitron font-bold text-3xl md:text-4xl lg:text-5xl text-white mb-6 leading-tight">
                  {article.title}
                </h1>
    
                <p className="font-roboto text-lg text-futuristic-gray mb-8 leading-relaxed">
                  {article.excerpt}
                </p>
    
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                  <div className="flex items-center space-x-6 text-sm text-futuristic-gray">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(article.created_at)}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      {dynamicReadingTime} min de leitura
                    </div>
                  </div>
    
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-futuristic-gray mr-2">Compartilhar:</span>
                    <button
                      onClick={() => handleShare('copy')}
                      className="p-2 text-futuristic-gray hover:text-lime-green transition-colors duration-300 hover-lift"
                      title="Copiar link"
                      aria-label="Copiar link do artigo"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleShare('twitter')}
                      className="p-2 text-futuristic-gray hover:text-lime-green transition-colors duration-300 hover-lift"
                      title="Compartilhar no Twitter"
                      aria-label="Compartilhar artigo no Twitter"
                    >
                      <Twitter className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleShare('linkedin')}
                      className="p-2 text-futuristic-gray hover:text-lime-green transition-colors duration-300 hover-lift"
                      title="Compartilhar no LinkedIn"
                      aria-label="Compartilhar artigo no LinkedIn"
                    >
                      <Linkedin className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleShare('facebook')}
                      className="p-2 text-futuristic-gray hover:text-lime-green transition-colors duration-300 hover-lift"
                      title="Compartilhar no Facebook"
                      aria-label="Compartilhar artigo no Facebook"
                    >
                      <Facebook className="h-4 w-4" />
                    </button>
                  </div>
                </div>
    
                <div className="relative w-full max-h-[400px] sm:max-h-[500px] lg:max-h-[600px] bg-darker-surface rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src={article.image_url || '/placeholder-image.svg'}
                    alt={article.title}
                    className="w-full h-auto max-h-full object-contain transition-transform duration-300 hover:scale-105"
                    width={1200}
                    height={600}
                    loading="eager"
                    onLoad={(e) => {
                      console.log('✅ [IMAGE DEBUG] Imagem carregada com sucesso:', e.currentTarget.src);
                    }}
                    onError={(e) => {
                      console.log('❌ [IMAGE DEBUG] Erro ao carregar imagem:', e.currentTarget.src);
                      console.log('❌ [IMAGE DEBUG] Tentando fallback para placeholder...');
                      e.currentTarget.src = '/placeholder-image.svg';
                    }}
                  />
                </div>
              </header>
    
              {/* Article Content */}
              <article id="article-content" data-article-content className="prose prose-invert prose-lg max-w-none mb-12">
                {/* DEBUG: Log do conteúdo do artigo */}
                {console.log('🔍 [ARTICLE DEBUG] Conteúdo do artigo:', article.content.substring(0, 500))}
                {console.log('🔍 [ARTICLE DEBUG] Artigo completo:', article)}

                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  className="font-roboto text-futuristic-gray leading-relaxed"
                  components={{
                    p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
                    h1: ({ children, ...props }) => {
                      console.log('🎯 [MARKDOWN DEBUG] H1 renderizado:', children);
                      return (
                        <h1 {...props} className="text-2xl font-bold mb-4 text-white">
                          {children}
                        </h1>
                      );
                    },
                    h2: ({ children, ...props }) => {
                      console.log('🎯 [MARKDOWN DEBUG] H2 renderizado:', children);
                      return (
                        <h2 {...props} className="text-xl font-bold mb-3 text-white">
                          {children}
                        </h2>
                      );
                    },
                    h3: ({ children, ...props }) => {
                      console.log('🎯 [MARKDOWN DEBUG] H3 renderizado:', children);
                      return (
                        <h3 {...props} className="text-lg font-bold mb-2 text-white">
                          {children}
                        </h3>
                      );
                    },
                    h4: ({ children, ...props }) => (
                      <h4 {...props} className="text-base font-bold mb-2 text-white">
                        {children}
                      </h4>
                    ),
                    h5: ({ children, ...props }) => (
                      <h5 {...props} className="text-sm font-bold mb-2 text-white">
                        {children}
                      </h5>
                    ),
                    h6: ({ children, ...props }) => (
                      <h6 {...props} className="text-xs font-bold mb-2 text-white">
                        {children}
                      </h6>
                    ),
                    ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>,
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-lime-green pl-4 my-4 italic text-lime-green/80">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="bg-darker-surface px-2 py-1 rounded text-lime-green font-mono text-sm">
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre className="bg-darker-surface p-4 rounded-lg overflow-x-auto mb-4">
                        {children}
                      </pre>
                    )
                  }}
                >
                  {article.content}
                </ReactMarkdown>
              </article>
    
              {/* Tags */}
              <div className="mb-12">
                <h3 className="font-montserrat font-semibold text-white mb-4">Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const tags = article.tags;
                    if (!tags) return null;
                    
                    // Se for string, dividir por vírgula
                    if (typeof tags === 'string' && tags.length > 0) {
                      return tags.split(',').map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 text-sm font-roboto bg-lime-green/10 text-lime-green rounded-md hover:bg-lime-green/20 transition-colors duration-300"
                        >
                          {tag.trim()}
                        </span>
                      ));
                    }
                    
                    // Se for array
                    if (Array.isArray(tags) && tags.length > 0) {
                      return tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 text-sm font-roboto bg-lime-green/10 text-lime-green rounded-md hover:bg-lime-green/20 transition-colors duration-300"
                        >
                          {typeof tag === 'string' ? tag : String(tag)}
                        </span>
                      ));
                    }
                    
                    return null;
                  })()}
                </div>
              </div>
    
              {/* Related Articles */}
              {relatedArticles && relatedArticles.length > 0 && (
                <section className="mb-12">
                  <h3 className="font-orbitron font-bold text-2xl text-white mb-8">
                    <span className="gradient-text">Artigos Relacionados</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(relatedArticles || []).map((relatedArticle) => (
                      <Card key={relatedArticle.id} variant="glass" className="overflow-hidden group">
                        <Link to={`/artigo/${relatedArticle.slug}`} className="block relative w-full aspect-[3/2] overflow-hidden cursor-pointer">
                          <img
                            src={relatedArticle.image_url || '/placeholder-image.svg'}
                            alt={relatedArticle.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            width={300}
                            height={200}
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/80 to-transparent"></div>
                        </Link>
    
                        <div className="p-4">
                          <h4 className="font-montserrat font-semibold text-sm text-white mb-2 line-clamp-2 group-hover:text-lime-green transition-colors duration-300">
                            {relatedArticle.title}
                          </h4>
    
                          <div className="flex items-center text-xs text-futuristic-gray mb-3">
                            <Clock className="h-3 w-3 mr-1" />
                            {relatedArticle.reading_time || '5'} min
                          </div>
    
                          <Link
                            to={`/artigo/${relatedArticle.slug}`}
                            className="inline-flex items-center text-lime-green hover:text-lime-green/80 font-montserrat font-medium text-xs transition-colors duration-300"
                          >
                            Ler artigo
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Link>
                        </div>
                      </Card>
                    ))}
                  </div>
                </section>
              )}
    
               {/* Article Navigation */}
               <ArticleNavigationLazy 
                 currentSlug={article.slug} 
                 categoryId={article.category_id}
                 className="mb-12"
               />
     
               {/* Feedback Section */}
               <FeedbackSectionLazy articleId={article.id} />

               {/* Comments Section */}
               <CommentSectionLazy articleId={article.id} />
             </div>
           </div>
         </div>
       </div>
     </>
   );
};

export default Article;