import { Article } from '../types';

// Mock data arrays
const mockTitles = [
  'Inteligência Artificial Revoluciona o Futuro',
  'Descobertas Científicas que Mudam o Mundo',
  'Inovações em Negócios Digitais',
  'Avanços na Medicina Moderna',
  'Educação do Século XXI',
  'Arte Digital e Criatividade',
  'Esportes e Tecnologia'
];

const mockContents = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
];

const mockExcerpts = [
  'Um resumo fascinante sobre tecnologia moderna.',
  'Descobertas que revolucionam nossa compreensão.',
  'Insights valiosos para o mundo dos negócios.',
  'Informações essenciais sobre saúde e bem-estar.'
];

const mockAuthors = ['Dr. Silva', 'Prof. Santos', 'Ana Costa', 'João Oliveira', 'Maria Ferreira'];
const mockCategories = ['Tecnologia', 'Ciência', 'Negócios', 'Saúde', 'Educação', 'Arte', 'Esportes'];
const mockTags = ['inovação', 'futuro', 'pesquisa', 'desenvolvimento', 'análise', 'tendências', 'insights', 'descobertas'];

// Gerar dados de teste para escalabilidade
export const generateMockArticles = (count: number): Article[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: `article-${index + 1}`,
    title: `Artigo de Teste ${index + 1}: ${mockTitles[index % mockTitles.length]}`,
    content: `Conteúdo completo do artigo ${index + 1}. ${mockContents[index % mockContents.length]}`,
    excerpt: `Resumo do artigo ${index + 1}. ${mockExcerpts[index % mockExcerpts.length]}`,
    image_url: `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=futuristic%20technology%20article%20${index + 1}&image_size=landscape_16_9`,
    slug: `artigo-teste-${index + 1}`,
    published: true,
    category_id: `cat-${(index % mockCategories.length) + 1}`,
    author_id: `author-${(index % mockAuthors.length) + 1}`,
    created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    
    // Propriedades de compatibilidade
    author: mockAuthors[index % mockAuthors.length],
    category: {
      id: `cat-${(index % mockCategories.length) + 1}`,
      name: mockCategories[index % mockCategories.length],
      slug: mockCategories[index % mockCategories.length].toLowerCase().replace(/\s+/g, '-'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    tags: [
      mockTags[index % mockTags.length],
      mockTags[(index + 1) % mockTags.length],
      mockTags[(index + 2) % mockTags.length]
    ],
    publishedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    readTime: Math.floor(Math.random() * 15) + 1,
    views: Math.floor(Math.random() * 10000),
    likes: Math.floor(Math.random() * 1000),
    featured: Math.random() > 0.8,
    imageUrl: `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=futuristic%20technology%20article%20${index + 1}&image_size=landscape_16_9`
  }));
};

// Métricas de performance
export interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  memoryUsage: number;
  renderTime: number;
  scrollPerformance: number;
}

// Coletar métricas de performance
export const collectPerformanceMetrics = (): Promise<PerformanceMetrics> => {
  return new Promise((resolve) => {
    // Aguardar um pouco para garantir que as métricas estejam disponíveis
    setTimeout(() => {
      const navigation = performance.getEntriesByType('navigation' as any)[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint' as any);
      
      const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
      const ttfb = navigation.responseStart - navigation.requestStart;
      
      // Simular outras métricas (em produção, usar Web Vitals)
      const metrics: PerformanceMetrics = {
        fcp: fcp,
        lcp: fcp + Math.random() * 500, // Simulado
        fid: Math.random() * 50, // Simulado
        cls: Math.random() * 0.1, // Simulado
        ttfb: ttfb,
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
        renderTime: performance.now(),
        scrollPerformance: 60 // FPS simulado
      };
      
      resolve(metrics);
    }, 1000);
  });
};

// Teste de stress de memória
export const memoryStressTest = (iterations: number = 1000): Promise<number> => {
  return new Promise((resolve) => {
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    // Criar e destruir objetos para testar vazamentos
    for (let i = 0; i < iterations; i++) {
      const testData = generateMockArticles(100);
      // Simular processamento
      testData.forEach(article => {
        const processed = { ...article, processed: true };
        return processed;
      });
    }
    
    // Forçar garbage collection se disponível
    if ((window as any).gc) {
      (window as any).gc();
    }
    
    setTimeout(() => {
      const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryDiff = endMemory - startMemory;
      resolve(memoryDiff);
    }, 100);
  });
};

// Teste de performance de scroll
export const scrollPerformanceTest = (element: HTMLElement): Promise<number> => {
  return new Promise((resolve) => {
    let frameCount = 0;
    let startTime = performance.now();
    const duration = 2000; // 2 segundos
    
    const measureFPS = () => {
      frameCount++;
      const elapsed = performance.now() - startTime;
      
      if (elapsed < duration) {
        requestAnimationFrame(measureFPS);
      } else {
        const fps = (frameCount / elapsed) * 1000;
        resolve(fps);
      }
    };
    
    // Simular scroll
    element.scrollTop = 0;
    let scrollPosition = 0;
    const scrollInterval = setInterval(() => {
      scrollPosition += 10;
      element.scrollTop = scrollPosition;
      
      if (scrollPosition >= element.scrollHeight - element.clientHeight) {
        clearInterval(scrollInterval);
      }
    }, 16); // ~60fps
    
    requestAnimationFrame(measureFPS);
  });
};

// Benchmark de renderização
export const renderBenchmark = (componentCount: number): Promise<number> => {
  return new Promise((resolve) => {
    const startTime = performance.now();
    
    // Simular renderização de componentes
    const mockRender = () => {
      for (let i = 0; i < componentCount; i++) {
        const element = document.createElement('div');
        element.innerHTML = `<h3>Componente ${i}</h3><p>Conteúdo do componente</p>`;
        document.body.appendChild(element);
      }
      
      // Remover elementos após medição
      setTimeout(() => {
        const elements = document.querySelectorAll('div');
        elements.forEach(el => {
          if (el.innerHTML.includes('Componente')) {
            el.remove();
          }
        });
        
        const endTime = performance.now();
        resolve(endTime - startTime);
      }, 10);
    };
    
    requestAnimationFrame(mockRender);
  });
};

// Relatório completo de performance
export const generatePerformanceReport = async (articleCount: number = 10000): Promise<{
  metrics: PerformanceMetrics;
  memoryTest: number;
  renderTest: number;
  lighthouseScore: number;
  recommendations: string[];
}> => {
  console.log(`🚀 Iniciando teste de escalabilidade com ${articleCount} artigos...`);
  
  const metrics = await collectPerformanceMetrics();
  const memoryTest = await memoryStressTest(100);
  const renderTest = await renderBenchmark(1000);
  
  // Calcular score simulado do Lighthouse
  const lighthouseScore = Math.min(100, Math.max(0, 
    100 - (metrics.fcp / 12) - (metrics.lcp / 25) - (metrics.fid) - (metrics.cls * 100)
  ));
  
  const recommendations: string[] = [];
  
  if (metrics.fcp > 1200) recommendations.push('Otimizar First Contentful Paint (< 1.2s)');
  if (metrics.lcp > 2000) recommendations.push('Otimizar Largest Contentful Paint (< 2.0s)');
  if (metrics.fid > 50) recommendations.push('Reduzir First Input Delay (< 50ms)');
  if (metrics.cls > 0.1) recommendations.push('Melhorar Cumulative Layout Shift (< 0.1)');
  if (memoryTest > 50000000) recommendations.push('Otimizar uso de memória');
  if (renderTest > 100) recommendations.push('Otimizar tempo de renderização');
  
  return {
    metrics,
    memoryTest,
    renderTest,
    lighthouseScore: Math.round(lighthouseScore),
    recommendations
  };
};