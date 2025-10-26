// Web Worker para processamento pesado de artigos
// Executa operações intensivas sem bloquear a UI principal

self.onmessage = function(e) {
  const { type, data } = e.data;

  try {
    switch (type) {
      case 'PROCESS_ARTICLES':
        processArticles(data);
        break;
      
      case 'SEARCH_ARTICLES':
        searchArticles(data);
        break;
      
      case 'SORT_ARTICLES':
        sortArticles(data);
        break;
      
      case 'FILTER_ARTICLES':
        filterArticles(data);
        break;
      
      case 'GENERATE_ANALYTICS':
        generateAnalytics(data);
        break;
      
      case 'OPTIMIZE_IMAGES':
        optimizeImages(data);
        break;
      
      default:
        self.postMessage({
          type: 'ERROR',
          error: `Tipo de operação desconhecido: ${type}`
        });
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: error.message
    });
  }
};

// Processar artigos em lote
function processArticles({ articles, options = {} }) {
  const startTime = performance.now();
  const processed = [];
  
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    
    // Processamento pesado: análise de conteúdo, extração de keywords, etc.
    const processedArticle = {
      ...article,
      wordCount: countWords(article.content || ''),
      readingTime: calculateReadingTime(article.content || ''),
      keywords: extractKeywords(article.content || ''),
      sentiment: analyzeSentiment(article.content || ''),
      complexity: calculateComplexity(article.content || ''),
      seoScore: calculateSEOScore(article),
      processedAt: Date.now()
    };
    
    processed.push(processedArticle);
    
    // Reportar progresso a cada 100 artigos
    if (i % 100 === 0) {
      self.postMessage({
        type: 'PROGRESS',
        progress: (i / articles.length) * 100,
        processed: i,
        total: articles.length
      });
    }
  }
  
  const endTime = performance.now();
  
  self.postMessage({
    type: 'PROCESS_ARTICLES_COMPLETE',
    data: processed,
    processingTime: endTime - startTime,
    totalProcessed: processed.length
  });
}

// Busca avançada em artigos
function searchArticles({ articles, query, options = {} }) {
  const startTime = performance.now();
  const results = [];
  const queryLower = query.toLowerCase();
  
  for (const article of articles) {
    let score = 0;
    let matches = [];
    
    // Busca no título (peso maior)
    if (article.title && article.title.toLowerCase().includes(queryLower)) {
      score += 10;
      matches.push('title');
    }
    
    // Busca no conteúdo
    if (article.content && article.content.toLowerCase().includes(queryLower)) {
      score += 5;
      matches.push('content');
    }
    
    // Busca nas tags
    if (article.tags && article.tags.some(tag => tag.toLowerCase().includes(queryLower))) {
      score += 3;
      matches.push('tags');
    }
    
    // Busca na categoria
    if (article.category && article.category.toLowerCase().includes(queryLower)) {
      score += 2;
      matches.push('category');
    }
    
    if (score > 0) {
      results.push({
        ...article,
        searchScore: score,
        searchMatches: matches
      });
    }
  }
  
  // Ordenar por relevância
  results.sort((a, b) => b.searchScore - a.searchScore);
  
  const endTime = performance.now();
  
  self.postMessage({
    type: 'SEARCH_ARTICLES_COMPLETE',
    data: results,
    searchTime: endTime - startTime,
    totalResults: results.length,
    query
  });
}

// Ordenação avançada de artigos
function sortArticles({ articles, sortBy, order = 'desc' }) {
  const startTime = performance.now();
  
  const sorted = [...articles].sort((a, b) => {
    let valueA, valueB;
    
    switch (sortBy) {
      case 'date':
        valueA = new Date(a.publishedAt || a.createdAt);
        valueB = new Date(b.publishedAt || b.createdAt);
        break;
      case 'views':
        valueA = a.views || 0;
        valueB = b.views || 0;
        break;
      case 'likes':
        valueA = a.likes || 0;
        valueB = b.likes || 0;
        break;
      case 'readingTime':
        valueA = a.readingTime || 0;
        valueB = b.readingTime || 0;
        break;
      case 'title':
        valueA = a.title || '';
        valueB = b.title || '';
        break;
      default:
        valueA = a[sortBy] || 0;
        valueB = b[sortBy] || 0;
    }
    
    if (typeof valueA === 'string') {
      return order === 'asc' 
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }
    
    return order === 'asc' ? valueA - valueB : valueB - valueA;
  });
  
  const endTime = performance.now();
  
  self.postMessage({
    type: 'SORT_ARTICLES_COMPLETE',
    data: sorted,
    sortTime: endTime - startTime,
    sortBy,
    order
  });
}

// Filtrar artigos por critérios complexos
function filterArticles({ articles, filters }) {
  const startTime = performance.now();
  
  const filtered = articles.filter(article => {
    // Filtro por categoria
    if (filters.category && article.category !== filters.category) {
      return false;
    }
    
    // Filtro por tags
    if (filters.tags && filters.tags.length > 0) {
      const hasTag = filters.tags.some(tag => 
        article.tags && article.tags.includes(tag)
      );
      if (!hasTag) return false;
    }
    
    // Filtro por data
    if (filters.dateFrom) {
      const articleDate = new Date(article.publishedAt || article.createdAt);
      if (articleDate < new Date(filters.dateFrom)) return false;
    }
    
    if (filters.dateTo) {
      const articleDate = new Date(article.publishedAt || article.createdAt);
      if (articleDate > new Date(filters.dateTo)) return false;
    }
    
    // Filtro por tempo de leitura
    if (filters.minReadingTime && (article.readingTime || 0) < filters.minReadingTime) {
      return false;
    }
    
    if (filters.maxReadingTime && (article.readingTime || 0) > filters.maxReadingTime) {
      return false;
    }
    
    // Filtro por visualizações
    if (filters.minViews && (article.views || 0) < filters.minViews) {
      return false;
    }
    
    return true;
  });
  
  const endTime = performance.now();
  
  self.postMessage({
    type: 'FILTER_ARTICLES_COMPLETE',
    data: filtered,
    filterTime: endTime - startTime,
    totalFiltered: filtered.length,
    filters
  });
}

// Gerar analytics dos artigos
function generateAnalytics({ articles }) {
  const startTime = performance.now();
  
  const analytics = {
    totalArticles: articles.length,
    totalViews: articles.reduce((sum, article) => sum + (article.views || 0), 0),
    totalLikes: articles.reduce((sum, article) => sum + (article.likes || 0), 0),
    averageReadingTime: 0,
    categoriesStats: {},
    tagsStats: {},
    monthlyStats: {},
    topArticles: [],
    engagementRate: 0
  };
  
  // Calcular tempo médio de leitura
  const totalReadingTime = articles.reduce((sum, article) => sum + (article.readingTime || 0), 0);
  analytics.averageReadingTime = totalReadingTime / articles.length;
  
  // Estatísticas por categoria
  articles.forEach(article => {
    if (article.category) {
      if (!analytics.categoriesStats[article.category]) {
        analytics.categoriesStats[article.category] = {
          count: 0,
          views: 0,
          likes: 0
        };
      }
      analytics.categoriesStats[article.category].count++;
      analytics.categoriesStats[article.category].views += article.views || 0;
      analytics.categoriesStats[article.category].likes += article.likes || 0;
    }
  });
  
  // Estatísticas por tags
  articles.forEach(article => {
    if (article.tags) {
      article.tags.forEach(tag => {
        if (!analytics.tagsStats[tag]) {
          analytics.tagsStats[tag] = {
            count: 0,
            views: 0,
            likes: 0
          };
        }
        analytics.tagsStats[tag].count++;
        analytics.tagsStats[tag].views += article.views || 0;
        analytics.tagsStats[tag].likes += article.likes || 0;
      });
    }
  });
  
  // Estatísticas mensais
  articles.forEach(article => {
    const date = new Date(article.publishedAt || article.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!analytics.monthlyStats[monthKey]) {
      analytics.monthlyStats[monthKey] = {
        articles: 0,
        views: 0,
        likes: 0
      };
    }
    
    analytics.monthlyStats[monthKey].articles++;
    analytics.monthlyStats[monthKey].views += article.views || 0;
    analytics.monthlyStats[monthKey].likes += article.likes || 0;
  });
  
  // Top artigos por visualizações
  analytics.topArticles = [...articles]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 10)
    .map(article => ({
      id: article.id,
      title: article.title,
      views: article.views || 0,
      likes: article.likes || 0,
      category: article.category
    }));
  
  // Taxa de engajamento
  if (analytics.totalViews > 0) {
    analytics.engagementRate = (analytics.totalLikes / analytics.totalViews) * 100;
  }
  
  const endTime = performance.now();
  
  self.postMessage({
    type: 'GENERATE_ANALYTICS_COMPLETE',
    data: analytics,
    processingTime: endTime - startTime
  });
}

// Otimizar imagens (simulação)
function optimizeImages({ images }) {
  const startTime = performance.now();
  const optimized = [];
  
  images.forEach((image, index) => {
    // Simular otimização de imagem
    const optimizedImage = {
      ...image,
      originalSize: image.size || 1024000,
      optimizedSize: Math.floor((image.size || 1024000) * 0.7), // 30% de redução
      format: 'webp',
      optimizedAt: Date.now()
    };
    
    optimized.push(optimizedImage);
    
    // Reportar progresso
    if (index % 10 === 0) {
      self.postMessage({
        type: 'PROGRESS',
        progress: (index / images.length) * 100,
        processed: index,
        total: images.length
      });
    }
  });
  
  const endTime = performance.now();
  
  self.postMessage({
    type: 'OPTIMIZE_IMAGES_COMPLETE',
    data: optimized,
    processingTime: endTime - startTime,
    totalOptimized: optimized.length
  });
}

// Funções auxiliares
function countWords(text) {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

function calculateReadingTime(text) {
  const wordsPerMinute = 200;
  const wordCount = countWords(text);
  return Math.ceil(wordCount / wordsPerMinute);
}

function extractKeywords(text) {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  const frequency = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  return Object.entries(frequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
}

function analyzeSentiment(text) {
  // Análise de sentimento simplificada
  const positiveWords = ['bom', 'ótimo', 'excelente', 'incrível', 'fantástico'];
  const negativeWords = ['ruim', 'péssimo', 'terrível', 'horrível', 'decepcionante'];
  
  const words = text.toLowerCase().split(/\s+/);
  let score = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) score += 1;
    if (negativeWords.includes(word)) score -= 1;
  });
  
  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

function calculateComplexity(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = countWords(text);
  
  if (sentences.length === 0) return 0;
  
  const avgWordsPerSentence = words / sentences.length;
  
  if (avgWordsPerSentence < 15) return 'easy';
  if (avgWordsPerSentence < 25) return 'medium';
  return 'hard';
}

function calculateSEOScore(article) {
  let score = 0;
  
  // Título presente e com tamanho adequado
  if (article.title && article.title.length >= 30 && article.title.length <= 60) {
    score += 20;
  }
  
  // Descrição presente
  if (article.description && article.description.length >= 120 && article.description.length <= 160) {
    score += 20;
  }
  
  // Tags presentes
  if (article.tags && article.tags.length >= 3 && article.tags.length <= 8) {
    score += 15;
  }
  
  // Categoria definida
  if (article.category) {
    score += 10;
  }
  
  // Conteúdo com tamanho adequado
  if (article.content && countWords(article.content) >= 300) {
    score += 20;
  }
  
  // Imagem presente
  if (article.image) {
    score += 15;
  }
  
  return Math.min(score, 100);
}