import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight, Tag } from 'lucide-react';
import { useArticles } from '../../hooks/useArticles';
import { useAutoFeedbackSync } from '../../hooks/useAutoFeedbackSync';
import { Article } from '../../types';
import Card from '../UI/Card';
import Button from '../UI/Button';
// import LazyImage from '../Performance/LazyImage';

const FeaturedArticles: React.FC = () => {
  const { articles, loading, refreshArticles } = useArticles();
  
  // Sistema 100% automático de sincronização de feedbacks
  const { forceSyncNow, isActive } = useAutoFeedbackSync();
  
  // Função para ordenar artigos por rating/feedback (mesma lógica do usePerformanceOptimization)
  const sortArticlesByRating = (articles: Article[]) => {
    return [...articles].sort((a, b) => {
      const getTotalFeedback = (article: Article): number => {
        return (article.positive_feedback || 0) + (article.negative_feedback || 0);
      };

      const getRating = (article: Article): number => {
        // Usar approval_rate se disponível
        if (typeof article.approval_rate === 'number') {
          return article.approval_rate;
        }
         
        // Fallback para campos antigos se approval_rate não estiver disponível
        const positive = article.positive_feedback || 0;
        const negative = article.negative_feedback || 0;
        const total = positive + negative;
         
        if (total === 0) {
          return 0;
        }
         
        return (positive / total) * 100;
      };

      const totalFeedbackA = getTotalFeedback(a);
      const totalFeedbackB = getTotalFeedback(b);
      const ratingA = getRating(a);
      const ratingB = getRating(b);
      
      console.log(`🏆 [Featured] Comparando: "${a.title}" (${totalFeedbackA} feedback, ${ratingA.toFixed(1)}%) vs "${b.title}" (${totalFeedbackB} feedback, ${ratingB.toFixed(1)}%)`);
      
      // PRIORIDADE 1: Artigos com mais feedback primeiro
      if (totalFeedbackA !== totalFeedbackB) {
        return totalFeedbackB - totalFeedbackA;
      }
      
      // PRIORIDADE 2: Se total de feedback igual, ordenar por approval rate
      if (ratingA !== ratingB) {
        return ratingB - ratingA;
      }
      
      // PRIORIDADE 3: Se tudo igual, ordenar por data (mais recente primeiro)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  };
  
  // Selecionar os 3 MELHORES artigos publicados (não aleatórios)
  const featuredArticles = sortArticlesByRating(
    articles.filter(article => article.published)
  ).slice(0, 3);

  // Debug logs - VERSÃO NOVA COM ORDENAÇÃO
  console.log('🔍 FeaturedArticles Debug - NOVA VERSÃO COM ORDENAÇÃO:', {
    articles: articles.length,
    loading,
    featuredArticles: featuredArticles.length,
    featuredTitles: featuredArticles.map(a => a.title),
    featuredRatings: featuredArticles.map(a => ({
      title: a.title,
      positive: a.positive_feedback || 0,
      negative: a.negative_feedback || 0,
      total: (a.positive_feedback || 0) + (a.negative_feedback || 0),
      approval_rate: a.approval_rate || 0,
      created_at: a.created_at
    })),
    allArticles: articles,
    autoSyncActive: isActive
  });

  // Carregar artigos quando o componente montar
  React.useEffect(() => {
    if (!loading && articles.length === 0) {
      refreshArticles();
    }
  }, [loading, articles.length, refreshArticles]);

  // Sistema automático: escutar mudanças de feedback
  React.useEffect(() => {
    const handleFeedbackChange = (event: CustomEvent) => {
      console.log('🔄 [Featured] Feedback mudou automaticamente:', event.detail);
      // Recarregar artigos automaticamente quando feedback muda
      refreshArticles();
    };

    const handleForceSync = () => {
      console.log('🔄 [Featured] Sincronização forçada detectada');
      refreshArticles();
    };

    // Escutar eventos de mudança de feedback
    window.addEventListener('feedbackChanged', handleFeedbackChange as EventListener);
    window.addEventListener('forceFeedbackSync', handleForceSync);

    return () => {
      window.removeEventListener('feedbackChanged', handleFeedbackChange as EventListener);
      window.removeEventListener('forceFeedbackSync', handleForceSync);
    };
  }, [refreshArticles]);

  // Forçar refresh para testar
  React.useEffect(() => {
    console.log('🔄 FeaturedArticles: Componente montado/atualizado - Sistema automático:', isActive);
  }, [isActive]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <section className="py-20 bg-darker-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-orbitron font-bold text-3xl md:text-4xl mb-4">
            <span className="gradient-text">Artigos em Destaque</span>
          </h2>
          <p className="font-roboto text-lg text-futuristic-gray max-w-2xl mx-auto">
            Explore nossos conteúdos mais populares sobre inteligência artificial e tecnologia
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-green mx-auto mb-4"></div>
            <p className="text-futuristic-gray">Carregando artigos...</p>
          </div>
        ) : featuredArticles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-futuristic-gray text-lg">Nenhum artigo publicado ainda.</p>
            <p className="text-futuristic-gray text-sm mt-2">Seja o primeiro a criar conteúdo!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {featuredArticles.map((article, index) => (
            <Card key={article.id} variant="glass" className="overflow-hidden group">
              <div className="relative">
                <Link to={`/artigo/${article.slug}`} className="block relative w-full aspect-[4/3] sm:aspect-video overflow-hidden cursor-pointer">
                  {article.image_url ? (
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      width={400}
                      height={225}
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-neon-purple/20 to-lime-green/20 flex items-center justify-center">
                      <div className="text-center">
                        <Tag className="w-12 h-12 text-futuristic-gray mx-auto mb-2" />
                        <p className="text-futuristic-gray text-sm">Sem imagem</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/80 to-transparent pointer-events-none"></div>
                </Link>
                <div className="absolute top-4 left-4 z-10 pointer-events-none">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-montserrat font-semibold bg-neon-purple/20 text-neon-purple border border-neon-purple/30">
                    <Tag className="h-3 w-3 mr-1" />
                    {(article.category as any)?.name || 'Sem categoria'}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center space-x-4 text-sm text-futuristic-gray mb-3">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(article.created_at)}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {Math.ceil(article.content.split(' ').length / 200)} min
                  </div>
                </div>

                <h3 className="font-montserrat font-semibold text-xl text-white mb-3 line-clamp-2 group-hover:text-lime-green transition-colors duration-300">
                  {article.title}
                </h3>

                <p className="font-roboto text-futuristic-gray text-sm mb-4 line-clamp-3">
                  {article.excerpt}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {article.tags && Array.isArray(article.tags) && article.tags.length > 0 ? (
                    article.tags.slice(0, 3).map((tag, tagIndex) => (
                      <span key={tagIndex} className="px-2 py-1 text-xs font-roboto bg-lime-green/10 text-lime-green rounded-md">
                        {typeof tag === 'string' ? tag : (typeof tag === 'object' && tag && 'name' in tag ? (tag as any).name : String(tag))}
                      </span>
                    ))
                  ) : article.tags && typeof article.tags === 'string' && article.tags.trim() ? (
                    article.tags.split(',').slice(0, 3).map((tag, tagIndex) => (
                      <span key={tagIndex} className="px-2 py-1 text-xs font-roboto bg-lime-green/10 text-lime-green rounded-md">
                        {tag.trim()}
                      </span>
                    ))
                  ) : (
                    <span className="px-2 py-1 text-xs font-roboto bg-neon-purple/10 text-neon-purple rounded-md">
                      {(article.category as any)?.name || 'Artigo'}
                    </span>
                  )}
                </div>

                <Link
                  to={`/artigo/${article.slug}`}
                  className="inline-flex items-center text-lime-green hover:text-lime-green/80 font-montserrat font-medium text-sm transition-colors duration-300"
                >
                  Ler artigo completo
                  <ArrowRight className="h-4 w-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </Card>
            ))}
          </div>
        )}

        {!loading && featuredArticles.length > 0 && (
          <div className="text-center">
            <Link to="/artigos">
              <Button variant="outline" size="lg">
                Ver Todos os Artigos
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedArticles;