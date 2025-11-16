// Web Worker para processamento pesado de artigos
import type { Article, Category, SortBy } from '../types/index';

export interface ProcessingTask {
  id: string;
  type: 'SEARCH' | 'FILTER' | 'SORT' | 'ANALYZE' | 'GENERATE_SUMMARY';
  data: any;
  priority: 'low' | 'medium' | 'high';
}

export interface ProcessingResult {
  taskId: string;
  result: any;
  error?: string;
  processingTime: number;
}

// Cache para resultados de processamento
const processingCache = new Map<string, any>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutos

// Fila de tarefas com prioridade
class TaskQueue {
  private tasks: ProcessingTask[] = [];
  private processing = false;

  add(task: ProcessingTask) {
    this.tasks.push(task);
    this.tasks.sort((a, b) => {
      const priorities = { high: 3, medium: 2, low: 1 };
      return priorities[b.priority] - priorities[a.priority];
    });
    
    if (!this.processing) {
      this.processNext();
    }
  }

  private async processNext() {
    if (this.tasks.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const task = this.tasks.shift()!;
    
    try {
      const result = await this.processTask(task);
      self.postMessage({
        type: 'TASK_COMPLETED',
        taskId: task.id,
        result,
        processingTime: result.processingTime
      });
    } catch (error) {
      self.postMessage({
        type: 'TASK_ERROR',
        taskId: task.id,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }

    // Processar próxima tarefa
    setTimeout(() => this.processNext(), 0);
  }

  private async processTask(task: ProcessingTask): Promise<any> {
    const startTime = performance.now();
    let result: any;

    // Verificar cache primeiro
    const cacheKey = `${task.type}_${JSON.stringify(task.data)}`;
    const cached = processingCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
      return {
        ...cached.result,
        processingTime: performance.now() - startTime,
        fromCache: true
      };
    }

    switch (task.type) {
      case 'SEARCH':
        result = await this.performSearch(task.data);
        break;
      case 'FILTER':
        result = await this.performFilter(task.data);
        break;
      case 'SORT':
        result = await this.performSort(task.data);
        break;
      case 'ANALYZE':
        result = await this.performAnalysis(task.data);
        break;
      case 'GENERATE_SUMMARY':
        result = await this.generateSummary(task.data);
        break;
      default:
        throw new Error(`Tipo de tarefa não suportado: ${task.type}`);
    }

    const processingTime = performance.now() - startTime;
    const finalResult = { ...result, processingTime, fromCache: false };

    // Cachear resultado
    processingCache.set(cacheKey, {
      result: finalResult,
      timestamp: Date.now()
    });

    return finalResult;
  }

  private async performSearch(data: { articles: Article[]; query: string; options?: any }): Promise<any> {
    const { articles, query, options = {} } = data;
    const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}+/gu, '').toLowerCase();
    const filters = options.filters || {};
    const baseTerms = query.toLowerCase().split(' ').filter(term => term.length > 2 && !term.includes(':') && !term.startsWith('-'));
    const normalizedTerms = baseTerms.map(t => normalize(t));
    const synonyms: Record<string, string[]> = {
      'ia': ['inteligencia artificial','ai'],
      'ml': ['machine learning'],
      'dl': ['deep learning']
    };
    const expandedTerms = new Set<string>();
    normalizedTerms.forEach(t => {
      expandedTerms.add(t);
      const syns = synonyms[t];
      if (syns) syns.forEach(s => expandedTerms.add(normalize(s)));
    });
    const searchTerms = Array.from(expandedTerms);
    const excludeTerms: string[] = Array.isArray(filters.exclude) ? filters.exclude.map((t: string) => normalize(t)) : [];
    
    if (searchTerms.length === 0) {
      return { results: articles, totalFound: articles.length };
    }

    const results = articles.filter(article => {
      const searchableText = [
        article.title,
        article.content,
        article.excerpt,
        typeof article.category === 'string' ? article.category : article.category?.name,
        ...(article.tags || [])
      ].join(' ');
      const searchableNorm = normalize(searchableText);
      if (excludeTerms.length > 0 && excludeTerms.some(term => searchableNorm.includes(term))) {
        return false;
      }
      if (filters.title) {
        const t = normalize(filters.title);
        if (!normalize(article.title).includes(t)) return false;
      }
      if (filters.tag) {
        let tagsArray: string[] = [];
        if (Array.isArray(article.tags)) {
          tagsArray = article.tags.map(tag => typeof tag === 'string' ? tag : String(tag));
        } else if (typeof article.tags === 'string') {
          tagsArray = article.tags.split(/[\,\s]+/).map(t => t.trim());
        }
        const target = normalize(filters.tag);
        const hasTag = tagsArray.some(tag => normalize(tag).includes(target));
        if (!hasTag) return false;
      }
      if (filters.category) {
        const target = normalize(filters.category);
        const catName = typeof article.category === 'string' ? article.category : article.category?.name;
        if (!catName || !normalize(String(catName)).includes(target)) return false;
      }
      if (filters.dateRange) {
        const date = new Date(article.created_at);
        const now = new Date();
        const diffDays = Math.ceil((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        const ok = filters.dateRange === 'all' ||
          (filters.dateRange === 'week' && diffDays <= 7) ||
          (filters.dateRange === 'month' && diffDays <= 30) ||
          (filters.dateRange === 'year' && diffDays <= 365);
        if (!ok) return false;
      }

      // Busca fuzzy simples
      if (options.fuzzy) {
        return searchTerms.some(term => 
          this.fuzzyMatch(searchableNorm, term, options.threshold || 0.8)
        );
      }

      // Busca exata
      return searchTerms.every(term => searchableNorm.includes(term));
    });

    // Calcular relevância
    const scoredResults = results.map(article => {
      let score = 0;
      const titleLower = normalize(article.title);
      const contentLower = normalize(article.content);
      const excerptLower = article.excerpt ? normalize(article.excerpt) : '';
      const matchedFields: string[] = [];

      searchTerms.forEach(term => {
        if (titleLower.includes(term)) { score += 10; if (!matchedFields.includes('title')) matchedFields.push('title'); }
        if (titleLower.startsWith(term)) { score += 20; if (!matchedFields.includes('title')) matchedFields.push('title'); }
        if (contentLower.includes(term)) { score += 1; if (!matchedFields.includes('content')) matchedFields.push('content'); }
        if (excerptLower && excerptLower.includes(term)) { score += 2; if (!matchedFields.includes('excerpt')) matchedFields.push('excerpt'); }
      });

      return { ...article, relevanceScore: score, matchedFields };
    });

    // Ordenar por relevância
    scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return {
      results: scoredResults,
      totalFound: scoredResults.length,
      searchTerms
    };
  }

  private async performFilter(data: { articles: Article[]; filters: any }): Promise<any> {
    const { articles, filters } = data;
    let filtered = [...articles];

    // Filtro por categoria
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(article => {
        const categoryName = typeof article.category === 'string' 
          ? article.category 
          : article.category?.name;
        return categoryName === filters.category;
      });
    }

    // Filtro por data
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      filtered = filtered.filter(article => {
        const articleDate = new Date(article.created_at);
        return articleDate >= new Date(start) && articleDate <= new Date(end);
      });
    }

    // Filtro por tags
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(article => 
        filters.tags.some((tag: string) => 
          article.tags?.includes(tag)
        )
      );
    }

    // Filtro por status de publicação
    if (filters.published !== undefined) {
      filtered = filtered.filter(article => article.published === filters.published);
    }

    return {
      results: filtered,
      totalFiltered: filtered.length,
      appliedFilters: filters
    };
  }

  private async performSort(data: { articles: Article[]; sortBy: string; order: 'asc' | 'desc' }): Promise<any> {
    const { articles, sortBy, order } = data;
    
    const sorted = [...articles];
    
    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'rating':
          // Ordenação por rating usando approval_rate
          const aRating = a.approval_rate || 0;
          const bRating = b.approval_rate || 0;
          comparison = aRating - bRating;
          break;
        case 'relevance':
          comparison = (a as any).relevanceScore - (b as any).relevanceScore;
          break;
        default:
          return 0;
      }

      return order === 'desc' ? -comparison : comparison;
    });

    return {
      results: sorted,
      sortedBy: sortBy,
      order
    };
  }

  private async performAnalysis(data: { articles: Article[] }): Promise<any> {
    const { articles } = data;
    
    // Análise de categorias
    const categoryStats = new Map<string, number>();
    const tagStats = new Map<string, number>();
    const monthlyStats = new Map<string, number>();

    articles.forEach(article => {
      // Estatísticas de categoria
      const categoryName = typeof article.category === 'string' 
        ? article.category 
        : article.category?.name || 'Sem categoria';
      categoryStats.set(categoryName, (categoryStats.get(categoryName) || 0) + 1);

      // Estatísticas de tags
      (Array.isArray(article.tags) ? article.tags : []).forEach(tag => {
        tagStats.set(tag, (tagStats.get(tag) || 0) + 1);
      });

      // Estatísticas mensais
      const month = new Date(article.created_at).toISOString().slice(0, 7);
      monthlyStats.set(month, (monthlyStats.get(month) || 0) + 1);
    });

    // Análise de conteúdo
    const avgContentLength = articles.reduce((sum, article) => 
      sum + article.content.length, 0) / articles.length;

    const avgTitleLength = articles.reduce((sum, article) => 
      sum + article.title.length, 0) / articles.length;

    return {
      totalArticles: articles.length,
      categoryDistribution: Object.fromEntries(categoryStats),
      topTags: Array.from(tagStats.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10),
      monthlyDistribution: Object.fromEntries(monthlyStats),
      contentAnalysis: {
        avgContentLength: Math.round(avgContentLength),
        avgTitleLength: Math.round(avgTitleLength),
        publishedCount: articles.filter(a => a.published).length,
        draftCount: articles.filter(a => !a.published).length
      }
    };
  }

  private async generateSummary(data: { article: Article }): Promise<any> {
    const { article } = data;
    
    // Extrair primeiras sentenças como resumo
    const sentences = article.content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20);

    const summary = sentences.slice(0, 3).join('. ') + '.';

    // Extrair palavras-chave
    const words = article.content
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 4);

    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    const keywords = Array.from(wordFreq.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);

    return {
      summary,
      keywords,
      wordCount: words.length,
      readingTime: Math.ceil(words.length / 200), // ~200 palavras por minuto
      sentiment: this.analyzeSentiment(article.content)
    };
  }

  private fuzzyMatch(text: string, pattern: string, threshold: number): boolean {
    const textLen = text.length;
    const patternLen = pattern.length;
    
    if (patternLen === 0) return true;
    if (textLen === 0) return false;

    let matches = 0;
    let textIndex = 0;

    for (let i = 0; i < patternLen; i++) {
      const char = pattern[i];
      while (textIndex < textLen && text[textIndex] !== char) {
        textIndex++;
      }
      if (textIndex < textLen) {
        matches++;
        textIndex++;
      }
    }

    return (matches / patternLen) >= threshold;
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    // Análise de sentimento simples baseada em palavras-chave
    const positiveWords = ['bom', 'ótimo', 'excelente', 'incrível', 'fantástico', 'maravilhoso'];
    const negativeWords = ['ruim', 'péssimo', 'terrível', 'horrível', 'problemático'];

    const lowerText = text.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach(word => {
      const matches = (lowerText.match(new RegExp(word, 'g')) || []).length;
      positiveCount += matches;
    });

    negativeWords.forEach(word => {
      const matches = (lowerText.match(new RegExp(word, 'g')) || []).length;
      negativeCount += matches;
    });

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }
}

// Instância global da fila de tarefas
const taskQueue = new TaskQueue();

// Listener para mensagens do thread principal
self.addEventListener('message', (event) => {
  const { type, task } = event.data;

  switch (type) {
    case 'PROCESS_TASK':
      taskQueue.add(task);
      break;
    case 'CLEAR_CACHE':
      processingCache.clear();
      self.postMessage({ type: 'CACHE_CLEARED' });
      break;
    case 'GET_CACHE_SIZE':
      self.postMessage({ 
        type: 'CACHE_SIZE', 
        size: processingCache.size 
      });
      break;
    default:
      console.warn('Tipo de mensagem não reconhecido:', type);
  }
});

// Limpeza periódica do cache
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of processingCache.entries()) {
    if (now - value.timestamp > CACHE_EXPIRY) {
      processingCache.delete(key);
    }
  }
}, 60000); // Limpar a cada minuto

// Notificar que o worker está pronto
self.postMessage({ type: 'WORKER_READY' });