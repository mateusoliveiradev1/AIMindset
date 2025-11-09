import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CountdownTimer } from './CountdownTimer';
import { LazyImage } from '../LazyImage';
import type { ScheduledArticle } from '@/types';

interface ScheduledArticleCardProps {
  article: ScheduledArticle;
  className?: string;
}

// Componente mobile-first para exibir o próximo artigo agendado
export const ScheduledArticleCard: React.FC<ScheduledArticleCardProps> = ({ 
  article, 
  className = '' 
}) => {
  // Fallback inteligente para tempo de leitura
  // Para artigos agendados (preview), calcular estimativa baseada no excerpt
  const readingTime = useMemo(() => {
    const words = (article.excerpt || '').trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200)); // 200 wpm
  }, [article.excerpt]);

  return (
    <div className={`relative overflow-hidden rounded-2xl group ${className}`}>
      {/* Background gradiente animado - tema futurista */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/40 via-fuchsia-500/30 to-lime-400/20 animate-gradient-shift transition-transform duration-300 group-hover:scale-105" />
      
      {/* Glass overlay para legibilidade */}
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 glass-panel neon-glow-border" />
      
      {/* Conteúdo do card */}
      <div className="relative z-10 p-6 text-white">
        {/* Badge "EM BREVE" com neon */}
        <div className="flex items-center gap-3 mb-4 animate-fade-in-up">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs font-semibold neon-glow-border">
            <span className="w-2 h-2 bg-lime-green rounded-full animate-pulse" />
            EM BREVE
          </span>
          
          {/* Contador regressivo com chip neon */}
          <CountdownTimer targetDate={article.scheduled_for} className="countdown-chip" showProgress />
        </div>
        
        {/* Título do artigo - tipografia futurista */}
        <h3 className="text-xl md:text-2xl font-orbitron font-bold mb-3 line-clamp-2 leading-tight animate-fade-in-up">
          {article.title}
        </h3>
        
        {/* Preview ultra-minimalista: sem metadados/descrição */}
        
        {/* Botão de ação - estilo neon/glass */}
        <Link
          to={`/artigo/${article.slug}?preview=true`}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors duration-200 min-h-[48px] neon-glow-border"
        >
          Ver Preview
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
      
      {/* Imagem de fundo com overlay gradiente */}
      {article.featured_image && (
        <div className="absolute inset-0 z-0">
          <LazyImage
            src={article.featured_image}
            alt={article.title}
            className="w-full h-full object-cover opacity-30 transition-transform duration-300 group-hover:scale-105"
            priority={true}
          />
          {/* Overlay gradiente para legibilidade */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          {/* Watermark PREVIEW */}
          <div className="preview-watermark">
            <span className="text-2xl sm:text-3xl">PREVIEW</span>
          </div>
        </div>
      )}
    </div>
  );
};