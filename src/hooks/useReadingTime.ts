import { useMemo } from 'react';

// Util puro para cálculo consistente de tempo de leitura
export const computeReadingTime = (
  content: string,
  options?: { wordsPerMinute?: number; includeImages?: boolean }
): number => {
  if (!content) return 1;

  const wordsPerMinute = options?.wordsPerMinute ?? 230; // média entre 200–250 wpm
  const includeImages = options?.includeImages ?? true;

  // Remover sintaxes de markdown e tags HTML para contagem de palavras real
  const cleanContent = content
    .replace(/```[\s\S]*?```/g, '') // blocos de código
    .replace(/`[^`]*`/g, '') // código inline
    .replace(/!\[.*?\]\(.*?\)/g, '') // imagens
    .replace(/\[.*?\]\(.*?\)/g, '') // links
    .replace(/#{1,6}\s/g, '') // headers
    .replace(/[*_~`]/g, '') // formatações
    .replace(/<[^>]*>/g, '') // tags HTML
    .replace(/\s+/g, ' ') // espaços
    .trim();

  // Contar palavras
  const words = cleanContent.split(' ').filter(word => word.length > 0).length;

  // Tempo adicional por imagem (12s = 0.2min), opcional
  const imageMatches = includeImages ? (content.match(/!\[.*?\]\(.*?\)/g) || []) : [];
  const imageTime = includeImages ? imageMatches.length * 0.2 : 0; // minutos

  // Calcular tempo total
  const readingTimeMinutes = words / wordsPerMinute + imageTime;

  // Arredondar para minutos inteiros, mínimo de 1
  return Math.max(1, Math.round(readingTimeMinutes));
};

// Hook que usa o util puro
export const useReadingTime = (content: string) => {
  const readingTime = useMemo(() => computeReadingTime(content), [content]);
  return readingTime;
};