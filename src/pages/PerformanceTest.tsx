import React, { useState, useEffect } from 'react';
import { generateMockArticles, generatePerformanceReport, PerformanceMetrics } from '../utils/performanceTest';
import { Button } from '../components/UI/Button';
import { Card } from '../components/UI/Card';
import { ArticleCard } from '../components/Articles/ArticleCard';
import { VirtualizedList } from "../components/Performance/VirtualizedList";

interface PerformanceReport {
  metrics: PerformanceMetrics;
  memoryTest: number;
  renderTest: number;
  lighthouseScore: number;
  recommendations: string[];
}

const PerformanceTest: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [articleCount, setArticleCount] = useState(10000);
  const [testArticles, setTestArticles] = useState<any[]>([]);
  const [showVirtualized, setShowVirtualized] = useState(false);

  const runPerformanceTest = async () => {
    setIsRunning(true);
    setReport(null);
    
    try {
      console.log('🚀 Iniciando teste de performance...');
      
      // Gerar artigos de teste
      const articles = generateMockArticles(articleCount);
      setTestArticles(articles);
      
      // Executar relatório de performance
      const performanceReport = await generatePerformanceReport(articleCount);
      setReport(performanceReport);
      
      console.log('✅ Teste de performance concluído:', performanceReport);
    } catch (error) {
      console.error('❌ Erro no teste de performance:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-dark-surface text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-lime-green to-neon-purple bg-clip-text text-transparent">
            Teste de Escalabilidade & Performance
          </h1>
          <p className="text-futuristic-gray text-lg">
            Teste a capacidade do sistema para lidar com milhares de artigos sem travamento
          </p>
        </div>

        {/* Controles do Teste */}
        <Card className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Número de Artigos:</label>
              <input
                type="number"
                value={articleCount}
                onChange={(e) => setArticleCount(Number(e.target.value))}
                className="bg-darker-surface border border-futuristic-gray rounded px-3 py-2 w-24"
                min="1000"
                max="50000"
                step="1000"
                disabled={isRunning}
              />
            </div>
            
            <Button
              onClick={runPerformanceTest}
              disabled={isRunning}
              className="bg-gradient-to-r from-lime-green to-neon-purple"
            >
              {isRunning ? '🔄 Executando Teste...' : '🚀 Executar Teste'}
            </Button>

            {testArticles.length > 0 && (
              <Button
                onClick={() => setShowVirtualized(!showVirtualized)}
                variant="secondary"
              >
                {showVirtualized ? '📋 Lista Normal' : '⚡ Lista Virtualizada'}
              </Button>
            )}
          </div>
        </Card>

        {/* Resultados do Teste */}
        {report && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Score Lighthouse */}
            <Card>
              <h3 className="text-xl font-semibold mb-4">Score Lighthouse</h3>
              <div className="text-center">
                <div className={`text-6xl font-bold ${getScoreColor(report.lighthouseScore)}`}>
                  {report.lighthouseScore}
                </div>
                <div className="text-futuristic-gray">/ 100</div>
              </div>
            </Card>

            {/* Métricas Web Vitals */}
            <Card>
              <h3 className="text-xl font-semibold mb-4">Web Vitals</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>FCP:</span>
                  <span className={report.metrics.fcp < 1200 ? 'text-green-500' : 'text-red-500'}>
                    {report.metrics.fcp.toFixed(0)}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>LCP:</span>
                  <span className={report.metrics.lcp < 2000 ? 'text-green-500' : 'text-red-500'}>
                    {report.metrics.lcp.toFixed(0)}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>FID:</span>
                  <span className={report.metrics.fid < 50 ? 'text-green-500' : 'text-red-500'}>
                    {report.metrics.fid.toFixed(0)}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>CLS:</span>
                  <span className={report.metrics.cls < 0.1 ? 'text-green-500' : 'text-red-500'}>
                    {report.metrics.cls.toFixed(3)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Uso de Memória */}
            <Card>
              <h3 className="text-xl font-semibold mb-4">Memória & Renderização</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Uso de Memória:</span>
                  <span>{formatBytes(report.metrics.memoryUsage)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Teste de Stress:</span>
                  <span className={report.memoryTest < 50000000 ? 'text-green-500' : 'text-red-500'}>
                    {formatBytes(report.memoryTest)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tempo de Render:</span>
                  <span className={report.renderTest < 100 ? 'text-green-500' : 'text-red-500'}>
                    {report.renderTest.toFixed(0)}ms
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Recomendações */}
        {report && report.recommendations.length > 0 && (
          <Card className="mb-8">
            <h3 className="text-xl font-semibold mb-4">📋 Recomendações de Otimização</h3>
            <ul className="space-y-2">
              {report.recommendations.map((rec, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="text-yellow-500">⚠️</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Lista de Artigos de Teste */}
        {testArticles.length > 0 && (
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                📚 {testArticles.length.toLocaleString()} Artigos de Teste
              </h3>
              <div className="text-sm text-futuristic-gray">
                {showVirtualized ? '⚡ Lista Virtualizada' : '📋 Lista Normal'}
              </div>
            </div>
            
            <div className="h-96 overflow-auto">
              {showVirtualized ? (
                <VirtualizedList
                  items={testArticles}
                  itemHeight={200}
                  renderItem={(article, index) => (
                    <div key={article.id} className="p-2">
                      <ArticleCard article={article} />
                    </div>
                  )}
                />
              ) : (
                <div className="space-y-4">
                  {testArticles.slice(0, 50).map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                  {testArticles.length > 50 && (
                    <div className="text-center text-futuristic-gray py-4">
                      ... e mais {(testArticles.length - 50).toLocaleString()} artigos
                      <br />
                      <span className="text-sm">Use a lista virtualizada para ver todos</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Informações sobre o Teste */}
        <Card className="mt-8">
          <h3 className="text-xl font-semibold mb-4">ℹ️ Sobre o Teste</h3>
          <div className="text-futuristic-gray space-y-2">
            <p>• <strong>Objetivo:</strong> Verificar se o sistema suporta milhares de artigos sem travamento</p>
            <p>• <strong>Métricas:</strong> Web Vitals, uso de memória, performance de renderização</p>
            <p>• <strong>Meta Lighthouse:</strong> Score 95-100/100 para performance otimizada</p>
            <p>• <strong>Limites Recomendados:</strong> FCP &lt; 1.2s, LCP &lt; 2.0s, FID &lt; 50ms</p>
            <p>• <strong>Lista Virtualizada:</strong> Renderiza apenas itens visíveis para melhor performance</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PerformanceTest;