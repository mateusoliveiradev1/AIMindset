import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Layout from './components/Layout/Layout';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './hooks/useToast';
import { ScrollToTop } from './components/ScrollToTop';
import { useScrollToTop } from './hooks/useScrollToTop';
import { SecurityHeaders } from './utils/securityHeaders';
import { initializeSecurityConfig } from './utils/corsConfig';
import { PerformanceManager } from './components/PerformanceManager';
import { AccessibilityManager } from './components/AccessibilityManager';
import { CriticalCSS } from './components/Performance/CriticalCSS';
import { WebVitalsOptimizer } from './components/Performance/WebVitalsOptimizer';
import { ResourceOptimizer } from './components/Performance/ResourceOptimizer';
import { useServiceWorker } from './hooks/useServiceWorker';
import { ProgressiveEnhancementProvider } from './components/ProgressiveEnhancement/ProgressiveEnhancement';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { Card } from './components/UI/Card';
import { Button } from './components/UI/Button';

// Lazy loading otimizado com chunks nomeados
import LazyComponents from './components/LazyComponents';

// Componentes que não estão no LazyComponents ainda
const Category = lazy(() => import('./pages/Category'));
const Categories = lazy(() => import('./pages/Categories'));
const Article = lazy(() => import('./pages/Article'));
const Newsletter = lazy(() => import('./pages/Newsletter'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Admin = lazy(() => import('./pages/Admin').then(module => ({ default: module.Admin })));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));

// Loading component otimizado
const PageLoader = () => (
  <div className="min-h-screen bg-dark-surface flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-green mx-auto mb-4"></div>
      <p className="text-futuristic-gray">Carregando...</p>
    </div>
  </div>
);

// Componente interno para usar hooks do Router
function AppContent() {
  // Hook para scroll automático ao topo em mudanças de rota
  useScrollToTop();
  
  // Hook para Service Worker - TEMPORARIAMENTE DESABILITADO PARA PREVIEW
  // const { register, isSupported, isRegistered, hasUpdate, skipWaiting } = useServiceWorker();

  // Initialize security headers and protections
  useEffect(() => {
    SecurityHeaders.initialize();
    initializeSecurityConfig();
  }, []);

  // Registrar Service Worker - TEMPORARIAMENTE DESABILITADO PARA PREVIEW
  // useEffect(() => {
  //   if (isSupported && !isRegistered) {
  //     register().catch(console.error);
  //   }
  // }, [isSupported, isRegistered, register]);

  // Mostrar notificação de atualização disponível - TEMPORARIAMENTE DESABILITADO PARA PREVIEW
  // useEffect(() => {
  //   if (hasUpdate) {
  //     const shouldUpdate = window.confirm(
  //       'Uma nova versão está disponível. Deseja atualizar agora?'
  //     );
  //     if (shouldUpdate) {
  //       skipWaiting();
  //     }
  //   }
  // }, [hasUpdate, skipWaiting]);

  return (
    <>
      <WebVitalsOptimizer 
        enableReporting={true}
        enableOptimizations={true}
      />
      <ResourceOptimizer>
        <Suspense fallback={<PageLoader />}>
          <Routes>
          {/* Public routes with Layout - usando componentes lazy otimizados */}
          <Route path="/" element={<Layout><LazyComponents.Home /></Layout>} />
          <Route path="/categoria" element={<Layout><Categories /></Layout>} />
          <Route path="/categoria/:slug" element={<Layout><Category /></Layout>} />
          <Route path="/artigo/:slug" element={<Layout><Article /></Layout>} />
          <Route path="/artigos" element={<Layout><LazyComponents.AllArticles /></Layout>} />
          <Route path="/contato" element={<Layout><LazyComponents.Contact /></Layout>} />
          <Route path="/newsletter" element={<Layout><Newsletter /></Layout>} />
          <Route path="/sobre" element={<Layout><LazyComponents.About /></Layout>} />
          <Route path="/politica-privacidade" element={<Layout><Privacy /></Layout>} />
          
          {/* Admin routes without Layout */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          
          {/* Performance Test routes - usando componentes lazy otimizados */}
          <Route path="/performance-test" element={<Layout><LazyComponents.PerformanceTest /></Layout>} />
          <Route path="/scalability-test" element={<Layout><LazyComponents.ScalabilityTest /></Layout>} />
        </Routes>
      </Suspense>
      
      {/* Botão Voltar ao Topo - Global */}
      <ScrollToTop />
      </ResourceOptimizer>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen bg-dark-surface flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center">
            <div className="text-4xl mb-4">🚨</div>
            <h2 className="text-xl font-bold text-white mb-4">Erro na Aplicação</h2>
            <p className="text-futuristic-gray mb-6">
              Algo deu errado. Tente recarregar a página.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-lime-green to-neon-purple">
                🔄 Recarregar
              </Button>
            </div>
          </Card>
        </div>
      }
    >
      <ProgressiveEnhancementProvider>
        <CriticalCSS>
          <HelmetProvider>
            <AuthProvider>
              <ToastProvider>
                <PerformanceManager
                  criticalResources={[]}
                  prefetchResources={[
                    '/artigos',
                    '/categorias',
                    '/sobre',
                    '/contato'
                  ]}
                  enableImageOptimization={true}
                  enableLazyLoading={true}
                  cacheStrategy="moderate"
                >
                  <AccessibilityManager
                    enableAutoAria={true}
                    enableKeyboardNavigation={true}
                    enableScreenReaderOptimizations={true}
                    enableFocusManagement={true}
                    announcePageChanges={true}
                  >
                    <Router>
                      <AppContent />
                    </Router>
                  </AccessibilityManager>
                </PerformanceManager>
              </ToastProvider>
              <Toaster 
                theme="dark"
                position="bottom-right"
                toastOptions={{
                  style: {
                    background: '#1A1A1A',
                    color: '#B0B0B0',
                    border: '1px solid rgba(106, 13, 173, 0.3)',
                  },
                }}
              />
            </AuthProvider>
          </HelmetProvider>
        </CriticalCSS>
      </ProgressiveEnhancementProvider>
    </ErrorBoundary>
  );
}

export default App;
