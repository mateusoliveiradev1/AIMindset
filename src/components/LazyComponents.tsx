import { Suspense, ComponentType } from 'react';
import { createLazyComponent, createNamedChunk } from '@/utils/lazyLoader';
import { Loader2 } from 'lucide-react';

// Loading component otimizado
const LoadingSpinner = ({ message = 'Carregando...' }: { message?: string }) => (
  <div className="flex items-center justify-center min-h-[200px] bg-dark-surface/30 rounded-lg">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 text-lime-green animate-spin" />
      <p className="text-futuristic-gray text-sm">{message}</p>
    </div>
  </div>
);

// Error boundary para componentes lazy
const LazyErrorBoundary = ({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode;
  fallback?: ComponentType;
}) => {
  const FallbackComponent = fallback || (() => (
    <div className="flex items-center justify-center min-h-[200px] bg-red-900/20 rounded-lg border border-red-500/30">
      <div className="text-center">
        <p className="text-red-400 mb-2">Erro ao carregar componente</p>
        <button 
          onClick={() => window.location.reload()} 
          className="text-sm text-lime-green hover:underline"
        >
          Recarregar página
        </button>
      </div>
    </div>
  ));

  return (
    <Suspense fallback={<LoadingSpinner />}>
      {children}
    </Suspense>
  );
};

// Wrapper para componentes lazy com error boundary
export const withLazyLoading = <P extends Record<string, any>>(
  LazyComponent: React.LazyExoticComponent<ComponentType<P>>,
  loadingMessage?: string,
  fallback?: ComponentType
) => {
  return (props: P) => (
    <LazyErrorBoundary fallback={fallback}>
      <Suspense fallback={<LoadingSpinner message={loadingMessage} />}>
        <LazyComponent {...(props as any)} />
      </Suspense>
    </LazyErrorBoundary>
  );
};

// Componentes lazy para páginas principais
export const LazyHome = createNamedChunk(
  'HomePage',
  () => import('@/pages/Home'),
  { minLoadingTime: 100 }
);

export const LazyArticles = createNamedChunk(
  'ArticlesPage', 
  () => import('@/pages/Articles'),
  { minLoadingTime: 150 }
);

export const LazyAllArticles = createNamedChunk(
  'AllArticlesPage',
  () => import('@/pages/AllArticles'),
  { minLoadingTime: 150 }
);

export const LazyArticleDetail = createNamedChunk(
  'ArticleDetailPage',
  () => import('@/pages/Article'),
  { minLoadingTime: 100 }
);

export const LazyAbout = createNamedChunk(
  'AboutPage',
  () => import('@/pages/About'),
  { minLoadingTime: 100 }
);

export const LazyContact = createNamedChunk(
  'ContactPage',
  () => import('@/pages/Contact'),
  { minLoadingTime: 100 }
);

export const LazyFAQ = createNamedChunk(
  'FAQPage',
  () => import('@/pages/FAQ'),
  { minLoadingTime: 100 }
);

// Componentes lazy para área administrativa
export const LazyAdminDashboard = createNamedChunk(
  'AdminDashboard',
  () => import('@/pages/Admin'),
  { minLoadingTime: 200 }
);

export const LazyAdminArticles = createNamedChunk(
  'AdminArticles',
  () => import('@/pages/Admin'),
  { minLoadingTime: 200 }
);

export const LazyAdminCategories = createNamedChunk(
  'AdminCategories',
  () => import('@/pages/Admin'),
  { minLoadingTime: 150 }
);

export const LazyAdminSettings = createNamedChunk(
  'AdminSettings',
  () => import('@/pages/Admin'),
  { minLoadingTime: 150 }
);

// Componentes lazy para funcionalidades específicas
export const LazyPerformanceTest = createNamedChunk(
  'PerformanceTest',
  () => import('@/pages/PerformanceTest'),
  { minLoadingTime: 100 }
);

export const LazyScalabilityTest = createNamedChunk(
  'ScalabilityTest',
  () => import('@/pages/ScalabilityTest'),
  { minLoadingTime: 100 }
);

export const LazyVirtualizedArticleList = createNamedChunk(
  'VirtualizedArticleList',
  () => import('@/components/Performance/VirtualizedArticleList').then(module => ({ default: module.VirtualizedArticleList })),
  { minLoadingTime: 50 }
);

// Componentes lazy para feedback e comentários
export const LazyFeedbackSection = createNamedChunk(
  'FeedbackSection',
  () => import('@/components/Feedback/FeedbackSection').then(module => ({ default: module.FeedbackSection })),
  { minLoadingTime: 50 }
);

export const LazyCommentSection = createNamedChunk(
  'CommentSection',
  () => import('@/components/Comments/CommentSection').then(module => ({ default: module.CommentSection })),
  { minLoadingTime: 50 }
);

// Componentes lazy para navegação e progresso
export const LazyReadingProgressBar = createNamedChunk(
  'ReadingProgressBar',
  () => import('@/components/ReadingProgressBar').then(module => ({ default: module.ReadingProgressBar })),
  { minLoadingTime: 50 }
);

export const LazyTableOfContents = createNamedChunk(
  'TableOfContents',
  () => import('@/components/TableOfContents').then(module => ({ default: module.TableOfContents })),
  { minLoadingTime: 50 }
);

export const LazyArticleNavigation = createNamedChunk(
  'ArticleNavigation',
  () => import('@/components/ArticleNavigation').then(module => ({ default: module.ArticleNavigation })),
  { minLoadingTime: 50 }
);

// Wrappers com loading otimizado
export const HomeWithLoading = withLazyLoading(LazyHome, 'Carregando página inicial...');
export const ArticlesWithLoading = withLazyLoading(LazyArticles, 'Carregando artigos...');
export const AllArticlesWithLoading = withLazyLoading(LazyAllArticles, 'Carregando todos os artigos...');
export const ArticleDetailWithLoading = withLazyLoading(LazyArticleDetail, 'Carregando artigo...');
export const AboutWithLoading = withLazyLoading(LazyAbout, 'Carregando sobre...');
export const ContactWithLoading = withLazyLoading(LazyContact, 'Carregando contato...');
export const FAQWithLoading = withLazyLoading(LazyFAQ, 'Carregando FAQ...');

// Wrappers para admin
export const AdminDashboardWithLoading = withLazyLoading(LazyAdminDashboard, 'Carregando dashboard...');
export const AdminArticlesWithLoading = withLazyLoading(LazyAdminArticles, 'Carregando gerenciamento de artigos...');
export const AdminCategoriesWithLoading = withLazyLoading(LazyAdminCategories, 'Carregando categorias...');
export const AdminSettingsWithLoading = withLazyLoading(LazyAdminSettings, 'Carregando configurações...');

// Wrappers para testes
export const PerformanceTestWithLoading = withLazyLoading(LazyPerformanceTest, 'Carregando teste de performance...');
export const ScalabilityTestWithLoading = withLazyLoading(LazyScalabilityTest, 'Carregando teste de escalabilidade...');

// Wrappers para feedback e comentários
export const FeedbackSectionLazy = withLazyLoading(LazyFeedbackSection, 'Carregando feedback...');
export const CommentSectionLazy = withLazyLoading(LazyCommentSection, 'Carregando comentários...');

// Wrappers para navegação e progresso
export const ReadingProgressBarLazy = withLazyLoading(LazyReadingProgressBar, 'Carregando barra de progresso...');
export const TableOfContentsLazy = withLazyLoading(LazyTableOfContents, 'Carregando índice...');
export const ArticleNavigationLazy = withLazyLoading(LazyArticleNavigation, 'Carregando navegação...');

// Export default para facilitar importação
export default {
  Home: HomeWithLoading,
  Articles: ArticlesWithLoading,
  AllArticles: AllArticlesWithLoading,
  ArticleDetail: ArticleDetailWithLoading,
  About: AboutWithLoading,
  Contact: ContactWithLoading,
  FAQ: FAQWithLoading,
  AdminDashboard: AdminDashboardWithLoading,
  AdminArticles: AdminArticlesWithLoading,
  AdminCategories: AdminCategoriesWithLoading,
  AdminSettings: AdminSettingsWithLoading,
  PerformanceTest: PerformanceTestWithLoading,
  ScalabilityTest: ScalabilityTestWithLoading
};