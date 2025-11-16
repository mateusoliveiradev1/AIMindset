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
import { initWebVitals } from './utils/webVitals';
import { supabase } from './lib/supabase';
import { 
  OptimizedAdminLogs, 
  OptimizedAdminBackup, 
  OptimizedAdminNewsletter, 
  OptimizedAdminFeedback 
} from './components/Performance/OptimizedLazyLoad';

// Lazy loading otimizado com chunks nomeados
import LazyComponents from './components/LazyComponents';

// Componentes que não estão no LazyComponents ainda
const Category = lazy(() => import('./pages/Category'));
const Categories = lazy(() => import('./pages/Categories'));
const Article = lazy(() => import('./pages/Article'));
const Newsletter = lazy(() => import('./pages/Newsletter'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Profile = lazy(() => import('./pages/Profile'));
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
const AuthCallback = lazy(() => import('./pages/AuthCallback'));

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
    // Inicializar Web Vitals
    try {
      initWebVitals();
    } catch (e) {
      console.warn('Falha ao inicializar Web Vitals:', e);
    }
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

  // 🔁 Restauração automática de sessão com menor polling e por visibilidade/online
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('⚠️ Erro ao obter sessão na inicialização:', error.message);
        }
        if (session) {
          const payload = JSON.stringify(session);
          try {
            localStorage.setItem('aimindset_session', payload);
          } catch (e) {
            try {
              sessionStorage.setItem('aimindset_session', payload);
            } catch (e2) {
              console.error('💥 Falha ao persistir sessão em qualquer storage:', e2);
            }
          }
        } else {
          // Se não há sessão, tentar detectar sessão do SDK e salvar se existir
          try {
            const { data } = await supabase.auth.getSession();
            if (data?.session) {
              const payload2 = JSON.stringify(data.session);
              localStorage.setItem('aimindset_session', payload2);
            }
          } catch {}
        }
      } catch (err: any) {
        console.warn('⚠️ Exceção ao restaurar sessão:', err?.message || err);
      }
    };

    restoreSession();

    let interval: number | null = null;
    const startInterval = () => {
      if (interval) return;
      interval = window.setInterval(async () => {
        try {
          const { data } = await supabase.auth.getSession();
          if (data?.session) {
            const stored = localStorage.getItem('aimindset_session') || sessionStorage.getItem('aimindset_session');
            if (!stored) {
              const payload = JSON.stringify(data.session);
              try {
                localStorage.setItem('aimindset_session', payload);
              } catch {
                try { sessionStorage.setItem('aimindset_session', payload); } catch {}
              }
              console.log('🔄 [App] Sessão sincronizada periodicamente no storage.');
            }
          }
        } catch {}
      }, 30000);
    };
    const stopInterval = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        restoreSession();
        startInterval();
      } else {
        stopInterval();
      }
    };
    const handleOnline = () => {
      restoreSession();
    };

    handleVisibility();
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('online', handleOnline);

    return () => {
      stopInterval();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

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
        <Route path="/perfil" element={<Layout><Profile /></Layout>} />
        
        {/* Admin routes without Layout */}
        <Route path="/admin/login" element={<AdminLogin />} />
        
        {/* Rota antiga - redirect para nova estrutura */}
        <Route path="/admin-old" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        
        {/* OAuth callback route */}
        <Route path="/auth/v1/callback" element={<AuthCallback />} />
        
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
