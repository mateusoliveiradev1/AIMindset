import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, Tag, Share2, Twitter, Linkedin, Facebook, ArrowLeft, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { useArticles } from '../hooks/useArticles';
import { mockCategories } from '../data/mockData';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';

const Article: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { articles, categories, loading, refreshArticles } = useArticles();
  
  useEffect(() => {
    refreshArticles();
  }, [refreshArticles]);
  
  const article = (articles || []).find(art => art?.slug === slug && art.published);
  const articleCategory = categories.find(cat => cat.id === article?.category_id);
  const relatedArticles = (articles || [])
    .filter(art => 
      art?.slug && 
      art.slug !== article?.slug && 
      art.published &&
      art.category_id === article?.category_id
    )
    .slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-green mx-auto mb-4"></div>
          <p className="text-futuristic-gray">Carregando artigo...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-orbitron font-bold text-2xl text-white mb-4">Artigo não encontrado</h1>
          <Link to="/">
            <Button>Voltar ao início</Button>
          </Link>
        </div>
      </div>
    );
  }

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
    <div className="py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                {article.read_time || '5'} min de leitura
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-futuristic-gray mr-2">Compartilhar:</span>
              <button
                onClick={() => handleShare('copy')}
                className="p-2 text-futuristic-gray hover:text-lime-green transition-colors duration-300 hover-lift"
                title="Copiar link"
              >
                <Share2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleShare('twitter')}
                className="p-2 text-futuristic-gray hover:text-lime-green transition-colors duration-300 hover-lift"
                title="Compartilhar no Twitter"
              >
                <Twitter className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="p-2 text-futuristic-gray hover:text-lime-green transition-colors duration-300 hover-lift"
                title="Compartilhar no LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleShare('facebook')}
                className="p-2 text-futuristic-gray hover:text-lime-green transition-colors duration-300 hover-lift"
                title="Compartilhar no Facebook"
              >
                <Facebook className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="relative w-full bg-darker-surface rounded-lg overflow-hidden">
            <img
              src={article.image_url || '/placeholder-image.jpg'}
              alt={article.title}
              className="w-full h-auto object-contain transition-transform duration-300 hover:scale-105"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://via.placeholder.com/1200x600/1a1a2e/ffffff?text=Imagem+Indisponível';
              }}
            />
          </div>
        </header>

        {/* Article Content */}
        <article className="prose prose-invert prose-lg max-w-none mb-12">
          <div className="font-roboto text-futuristic-gray leading-relaxed whitespace-pre-wrap">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
                h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 text-white">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-bold mb-3 text-white">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-bold mb-2 text-white">{children}</h3>,
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
          </div>
        </article>

        {/* Tags */}
        <div className="mb-12">
          <h3 className="font-montserrat font-semibold text-white mb-4">Tags:</h3>
          <div className="flex flex-wrap gap-2">
            {(() => {
              const tags = article.tags;
              if (!tags) return null;
              
              // Se for string, dividir por vírgula
              if (typeof tags === 'string') {
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
              return tags.map((tag, index) => (
                <span
                  key={tag?.id || index}
                  className="px-3 py-1 text-sm font-roboto bg-lime-green/10 text-lime-green rounded-md hover:bg-lime-green/20 transition-colors duration-300"
                >
                  {typeof tag === 'string' ? tag : tag?.name || 'Tag'}
                </span>
              ));
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
                      src={relatedArticle.image_url || 'https://via.placeholder.com/400x200/1a1a2e/ffffff?text=Sem+Imagem'}
                      alt={relatedArticle.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/400x200/1a1a2e/ffffff?text=Sem+Imagem';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/80 to-transparent"></div>
                  </Link>

                  <div className="p-4">
                    <h4 className="font-montserrat font-semibold text-sm text-white mb-2 line-clamp-2 group-hover:text-lime-green transition-colors duration-300">
                      {relatedArticle.title}
                    </h4>

                    <div className="flex items-center text-xs text-futuristic-gray mb-3">
                      <Clock className="h-3 w-3 mr-1" />
                      {relatedArticle.read_time || '5'} min
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

        {/* Newsletter CTA */}
        <Card variant="glass" className="p-8 text-center">
          <h3 className="font-montserrat font-semibold text-xl text-white mb-4">
            Gostou deste artigo?
          </h3>
          <p className="text-futuristic-gray mb-6">
            Receba mais conteúdos como este diretamente no seu email
          </p>
          <Link to="/newsletter">
            <Button size="lg">
              Assinar Newsletter Gratuita
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default Article;