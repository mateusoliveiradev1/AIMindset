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

// Lazy loading de páginas para code splitting
const Home = lazy(() => import('./pages/Home'));
const Category = lazy(() => import('./pages/Category'));
const Categories = lazy(() => import('./pages/Categories'));
const Article = lazy(() => import('./pages/Article'));
const Articles = lazy(() => import('./pages/Articles'));
const AllArticles = lazy(() => import('./pages/AllArticles'));
const Contact = lazy(() => import('./pages/Contact'));
const Newsletter = lazy(() => import('./pages/Newsletter'));
const About = lazy(() => import('./pages/About'));
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

  // Initialize security headers and protections
  useEffect(() => {
    SecurityHeaders.initialize();
    initializeSecurityConfig();
  }, []);

  return (
    <>
      <WebVitalsOptimizer 
        enableReporting={true}
        enableOptimizations={true}
      />
      <ResourceOptimizer>
        <Suspense fallback={<PageLoader />}>
          <Routes>
          {/* Public routes with Layout */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/categoria" element={<Layout><Categories /></Layout>} />
          <Route path="/categoria/:slug" element={<Layout><Category /></Layout>} />
          <Route path="/artigo/:slug" element={<Layout><Article /></Layout>} />
          <Route path="/artigos" element={<Layout><AllArticles /></Layout>} />
          <Route path="/contato" element={<Layout><Contact /></Layout>} />
          <Route path="/newsletter" element={<Layout><Newsletter /></Layout>} />
          <Route path="/sobre" element={<Layout><About /></Layout>} />
          <Route path="/politica-privacidade" element={<Layout><Privacy /></Layout>} />
          
          {/* Admin routes without Layout */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
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
  );
}

export default App;
