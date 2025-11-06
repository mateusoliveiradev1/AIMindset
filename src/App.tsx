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
import { 
  OptimizedAdminLogs, 
  OptimizedAdminBackup, 
  OptimizedAdminNewsletter, 
  OptimizedAdminFeedback 
} from './components/Performance/OptimizedLazyLoad';
import { PerformanceDashboard } from '@/components/Admin/PerformanceDashboard';

// Lazy loading otimizado com chunks nomeados
import LazyComponents from './components/LazyComponents';

// Componentes que não estão no LazyComponents ainda
const Category = lazy(() => import('./pages/Category'));
const Categories = lazy(() => import('./pages/Categories'));
const Article = lazy(() => import('./pages/Article'));
const Newsletter = lazy(() => import('./pages/Newsletter'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Admin = lazy(() => import('./pages/Admin'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminLayout = lazy(() => import('./pages/admin/layout'));
const AdminDashboard = lazy(() => import('./pages/admin/index'));
const AdminFeedback = lazy(() => import('./pages/admin/feedback'));
const AdminArticles = lazy(() => import('./pages/admin/articles'));
const AdminEditor = lazy(() => import('./pages/admin/editor'));
const AdminNewsletter = lazy(() => import('./pages/admin/newsletter'));
const AdminUsers = lazy(() => import('./pages/admin/users'));
const AdminCategories = lazy(() => import('./pages/admin/categories'));
const AdminSEO = lazy(() => import('./pages/admin/seo'));
const AdminLogs = lazy(() => import('./pages/admin/logs'));
const AdminBackup = lazy(() => import('./pages/admin/backup'));
const AdminNotifications = lazy(() => import('./pages/admin/notifications'));
const AdminSettings = lazy(() => import('./pages/admin/settings'));

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
        
        {/* Rota antiga - redirect para nova estrutura */}
        <Route path="/admin-old" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        
        {/* Novas rotas admin modulares com lazy loading otimizado */}
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="articles" element={<AdminArticles />} />
          <Route path="editor" element={<AdminEditor />} />
          <Route path="newsletter" element={<OptimizedAdminNewsletter />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="feedback" element={<OptimizedAdminFeedback />} />
          <Route path="seo" element={<AdminSEO />} />
                <Route path="performance" element={<PerformanceDashboard />} />
                <Route path="logs" element={<OptimizedAdminLogs />} />
                <Route path="backup" element={<OptimizedAdminBackup />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="settings" element={<AdminSettings />} />
        </Route>
        
        {/* Performance Test routes - usando componentes lazy otimizados */}
        <Route path="/performance-test" element={<Layout><LazyComponents.PerformanceTest /></Layout>} />
        <Route path="/scalability-test" element={<Layout><LazyComponents.ScalabilityTest /></Layout>} />
      </Routes>
    </Suspense>
    
    {/* Botão Voltar ao Topo - Global */}
    <ScrollToTop />
    </>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-dark-surface">
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
                  <Toaster 
                    position="top-right"
                    toastOptions={{
                      style: {
                        background: '#1a1a1a',
                        color: '#ffffff',
                        border: '1px solid #333333'
                      }
                    }}
                  />
                </Router>
              </AccessibilityManager>
            </PerformanceManager>
          </ToastProvider>
        </AuthProvider>
      </HelmetProvider>
    </div>
  );
}

export default App;
