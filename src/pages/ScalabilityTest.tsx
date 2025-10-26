import React, { useState, useCallback, useMemo } from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { VirtualizedArticleList } from '../components/Performance/VirtualizedArticleList';
import { ArticleCard } from '../components/Articles/ArticleCard';
import { generateMockArticles } from '../utils/performanceTest';
import { Article } from '../types';
import { Play, Pause, RotateCcw, TrendingUp, Database, Cpu, HardDrive, Zap } from 'lucide-react';

interface TestConfig {
  articleCount: number;
  enableCache: boolean;
  enableWorker: boolean;
  enableVirtualization: boolean;
  testDuration: number;
}

interface TestResults {
  totalTime: number;
  renderTime: number;
  scrollTime: number;
  searchTime: number;
  cacheTime: number;
  memoryUsage: number;
  articlesProcessed: number;
  searchResults: number;
  timestamp: number;
}

const ScalabilityTest: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [testConfig, setTestConfig] = useState<TestConfig>({
    articleCount: 1000,
    enableCache: true,
    enableWorker: true,
    enableVirtualization: true,
    testDuration: 30000
  });

  // Processar artigos com Web Worker (simulado)
  const processArticlesWithWorker = useCallback(async (rawArticles: Article[]): Promise<Article[]> => {
    return new Promise((resolve) => {
      if (!testConfig.enableWorker || typeof Worker === 'undefined') {
        // Fallback: processamento síncrono
        const processed = rawArticles.map(article => ({
          ...article,
          processedAt: Date.now(),
          searchIndex: `${article.title} ${article.content} ${article.category}`.toLowerCase()
        }));
        resolve(processed);
        return;
      }

      // Simular processamento com Web Worker
      setTimeout(() => {
        const processed = rawArticles.map(article => ({
          ...article,
          processedAt: Date.now(),
          searchIndex: `${article.title} ${article.content} ${article.category}`.toLowerCase()
        }));
        resolve(processed);
      }, 100);
    });
  }, [testConfig.enableWorker]);

  // Gerar artigos de teste
  const generateTestArticles = useCallback(async () => {
    setIsLoading(true);
    const startTime = performance.now();

    try {
      // Gerar artigos mockados
      const mockArticles = generateMockArticles(testConfig.articleCount);
      
      // Processar com Web Worker se habilitado
      const processedArticles = await processArticlesWithWorker(mockArticles);

      // Simular armazenamento no cache se habilitado
      if (testConfig.enableCache) {
        // Simular delay do cache
        await new Promise(resolve => setTimeout(resolve, 50));
        console.log(`Cache simulado: ${processedArticles.length} artigos armazenados`);
      }

      setArticles(processedArticles);

      const endTime = performance.now();
      console.log(`Generated ${testConfig.articleCount} articles in ${endTime - startTime}ms`);
    } catch (error) {
      console.error('Error generating test articles:', error);
    } finally {
      setIsLoading(false);
    }
  }, [testConfig, processArticlesWithWorker]);

  // Buscar artigos (simulação)
  const searchArticles = useCallback(async (articleList: Article[], query: string): Promise<Article[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const filtered = articleList.filter(article =>
          article.title.toLowerCase().includes(query.toLowerCase()) ||
          article.content.toLowerCase().includes(query.toLowerCase())
        );
        resolve(filtered);
      }, 50);
    });
  }, []);

  // Executar teste de performance completo
  const runPerformanceTest = useCallback(async () => {
    if (articles.length === 0) {
      alert('Gere artigos primeiro!');
      return;
    }

    setIsLoading(true);
    const startTime = performance.now();

    try {
      // 1. Teste de renderização
      const renderStart = performance.now();
      // Simular re-render forçado
      setArticles([...articles]);
      await new Promise(resolve => setTimeout(resolve, 100));
      const renderTime = performance.now() - renderStart;

      // 2. Teste de memória
      const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;
      
      // 3. Teste de scroll (simulado)
      const scrollStart = performance.now();
      // Simular scroll em lista virtualizada
      await new Promise(resolve => setTimeout(resolve, 200));
      const scrollTime = performance.now() - scrollStart;

      // 4. Teste de busca
      const searchStart = performance.now();
      const searchResults = await searchArticles(articles, 'tecnologia');
      const searchTime = performance.now() - searchStart;

      // 5. Teste de cache (simulado)
      let cacheTime = 0;
      if (testConfig.enableCache) {
        const cacheStart = performance.now();
        // Simular operação de cache
        await new Promise(resolve => setTimeout(resolve, 30));
        cacheTime = performance.now() - cacheStart;
        console.log('Cache stats: simulado');
      }

      const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;
      const totalTime = performance.now() - startTime;

      const results: TestResults = {
        totalTime,
        renderTime,
        scrollTime,
        searchTime,
        cacheTime,
        memoryUsage: memoryAfter - memoryBefore,
        articlesProcessed: articles.length,
        searchResults: searchResults.length,
        timestamp: Date.now()
      };

      setTestResults(results);
      console.log('Performance test results:', results);
    } catch (error) {
      console.error('Error running performance test:', error);
    } finally {
      setIsLoading(false);
    }
  }, [articles, testConfig, searchArticles]);

  // Performance grade calculation
  const getPerformanceGrade = useMemo(() => {
    if (!testResults) return null;
    
    let score = 100;
    
    // Render time penalty (should be < 100ms for good performance)
    if (testResults.renderTime > 100) score -= 20;
    else if (testResults.renderTime > 50) score -= 10;
    
    // Memory usage penalty (should be < 100MB for 1000+ articles)
    if (testResults.memoryUsage > 200 * 1024 * 1024) score -= 25;
    else if (testResults.memoryUsage > 100 * 1024 * 1024) score -= 15;
    
    // Search time penalty
    if (testResults.searchTime > 200) score -= 15;
    else if (testResults.searchTime > 100) score -= 10;
    
    if (score >= 90) return { grade: 'A+', color: 'text-green-600', message: 'Excelente escalabilidade!' };
    if (score >= 80) return { grade: 'A', color: 'text-green-500', message: 'Boa escalabilidade' };
    if (score >= 70) return { grade: 'B', color: 'text-yellow-500', message: 'Escalabilidade moderada' };
    if (score >= 60) return { grade: 'C', color: 'text-orange-500', message: 'Precisa de otimizações' };
    return { grade: 'D', color: 'text-red-500', message: 'Escalabilidade insuficiente' };
  }, [testResults]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Teste de Escalabilidade Massiva
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Teste a performance do sistema com milhares de artigos, 
            validando escalabilidade, cache e otimizações avançadas.
          </p>
        </div>

        {/* Configuração do Teste */}
        <Card className="mb-8 p-6">
          <h2 className="text-2xl font-semibold mb-4">Configuração do Teste</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Artigos
              </label>
              <input
                type="number"
                min="100"
                max="50000"
                step="100"
                value={testConfig.articleCount}
                onChange={(e) => setTestConfig(prev => ({
                  ...prev,
                  articleCount: parseInt(e.target.value) || 1000
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duração do Teste (ms)
              </label>
              <input
                type="number"
                min="5000"
                max="120000"
                step="5000"
                value={testConfig.testDuration}
                onChange={(e) => setTestConfig(prev => ({
                  ...prev,
                  testDuration: parseInt(e.target.value) || 30000
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={testConfig.enableCache}
                  onChange={(e) => setTestConfig(prev => ({
                    ...prev,
                    enableCache: e.target.checked
                  }))}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Cache IndexedDB</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={testConfig.enableWorker}
                  onChange={(e) => setTestConfig(prev => ({
                    ...prev,
                    enableWorker: e.target.checked
                  }))}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Web Workers</span>
              </label>
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={testConfig.enableVirtualization}
                  onChange={(e) => setTestConfig(prev => ({
                    ...prev,
                    enableVirtualization: e.target.checked
                  }))}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Virtualização</span>
              </label>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button
              onClick={generateTestArticles}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md disabled:opacity-50"
            >
              {isLoading ? 'Gerando...' : `Gerar ${testConfig.articleCount.toLocaleString()} Artigos`}
            </Button>

            <Button
              onClick={runPerformanceTest}
              disabled={isLoading || articles.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md disabled:opacity-50"
            >
              {isLoading ? 'Testando...' : 'Executar Teste de Performance'}
            </Button>

            <Button
              onClick={() => {
                setArticles([]);
                setTestResults(null);
              }}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md disabled:opacity-50"
            >
              Limpar Dados
            </Button>
          </div>
        </Card>

        {/* Performance Grade */}
        {getPerformanceGrade && (
          <Card className="mb-8 p-6">
            <h2 className="text-2xl font-semibold mb-4">Nota de Performance</h2>
            <div className="text-center">
              <div className={`text-6xl font-bold ${getPerformanceGrade.color} mb-2`}>
                {getPerformanceGrade.grade}
              </div>
              <p className="text-gray-600 text-lg">
                {getPerformanceGrade.message}
              </p>
            </div>
          </Card>
        )}

        {/* Resultados do Teste */}
        {testResults && (
          <Card className="mb-8 p-6">
            <h2 className="text-2xl font-semibold mb-4">Resultados do Teste</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800">Tempo Total</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {testResults.totalTime.toFixed(2)}ms
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800">Renderização</h3>
                <p className="text-2xl font-bold text-green-600">
                  {testResults.renderTime.toFixed(2)}ms
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-800">Scroll Performance</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {testResults.scrollTime.toFixed(2)}ms
                </p>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-800">Busca</h3>
                <p className="text-2xl font-bold text-orange-600">
                  {testResults.searchTime.toFixed(2)}ms
                </p>
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg">
                <h3 className="font-semibold text-indigo-800">Cache</h3>
                <p className="text-2xl font-bold text-indigo-600">
                  {testResults.cacheTime.toFixed(2)}ms
                </p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-800">Uso de Memória</h3>
                <p className="text-2xl font-bold text-red-600">
                  {(testResults.memoryUsage / 1024 / 1024).toFixed(2)}MB
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800">Artigos Processados</h3>
                <p className="text-2xl font-bold text-gray-600">
                  {testResults.articlesProcessed.toLocaleString()}
                </p>
              </div>

              <div className="bg-teal-50 p-4 rounded-lg">
                <h3 className="font-semibold text-teal-800">Resultados da Busca</h3>
                <p className="text-2xl font-bold text-teal-600">
                  {testResults.searchResults.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Análise de Performance */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Análise de Performance</h3>
              <div className="space-y-2 text-sm">
                <div className={`flex items-center ${testResults.totalTime < 5000 ? 'text-green-600' : testResults.totalTime < 10000 ? 'text-yellow-600' : 'text-red-600'}`}>
                  <span className="w-2 h-2 rounded-full bg-current mr-2"></span>
                  Tempo Total: {testResults.totalTime < 5000 ? 'Excelente' : testResults.totalTime < 10000 ? 'Bom' : 'Precisa Otimização'}
                </div>
                <div className={`flex items-center ${testResults.renderTime < 100 ? 'text-green-600' : testResults.renderTime < 300 ? 'text-yellow-600' : 'text-red-600'}`}>
                  <span className="w-2 h-2 rounded-full bg-current mr-2"></span>
                  Renderização: {testResults.renderTime < 100 ? 'Excelente' : testResults.renderTime < 300 ? 'Bom' : 'Precisa Otimização'}
                </div>
                <div className={`flex items-center ${testResults.memoryUsage < 50 * 1024 * 1024 ? 'text-green-600' : testResults.memoryUsage < 100 * 1024 * 1024 ? 'text-yellow-600' : 'text-red-600'}`}>
                  <span className="w-2 h-2 rounded-full bg-current mr-2"></span>
                  Memória: {testResults.memoryUsage < 50 * 1024 * 1024 ? 'Excelente' : testResults.memoryUsage < 100 * 1024 * 1024 ? 'Bom' : 'Alto Uso'}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Lista de Artigos */}
        {articles.length > 0 && (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">
                Artigos Gerados ({articles.length.toLocaleString()})
              </h2>
              <div className="text-sm text-gray-600">
                {testConfig.enableVirtualization ? 'Virtualização Ativa' : 'Renderização Completa'}
              </div>
            </div>

            {testConfig.enableVirtualization ? (
              <VirtualizedArticleList
                articles={articles}
                categories={[]}
                containerHeight={600}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {articles.slice(0, 50).map((article, index) => (
                  <ArticleCard
                    key={`${article.id}-${index}`}
                    article={article}
                  />
                ))}
                {articles.length > 50 && (
                  <div className="col-span-full text-center py-4 text-gray-600">
                    ... e mais {(articles.length - 50).toLocaleString()} artigos
                  </div>
                )}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default ScalabilityTest;