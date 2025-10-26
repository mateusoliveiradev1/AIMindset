import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { useAuth } from '../contexts/AuthContext';
import { useArticles } from '../hooks/useArticles';
import { useNewsletter } from '../hooks/useNewsletter';
import { useNewsletterSubscribers } from '../hooks/useNewsletterSubscribers';
import { useNewsletterCampaigns } from '../hooks/useNewsletterCampaigns';
import { useEmailAutomations } from '../hooks/useEmailAutomations';
import { useContacts } from '../hooks/useContacts';
import { useUsers } from '../hooks/useUsers';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useSEO } from '../hooks/useSEO';
import SEOManager from '../components/SEO/SEOManager';
import { toast } from 'sonner';
import { 
  PlusCircle, 
  Edit3, 
  Trash2, 
  Eye, 
  Users, 
  FileText, 
  TrendingUp,
  Calendar,
  BarChart3,
  LogOut,
  Settings,
  Brain,
  Mail,
  Download,
  Send,
  Activity,
  UserCheck,
  UserX,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Zap,
  Bell,
  MousePointer,
  AlertTriangle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import ArticleEditor from '../components/ArticleEditor';
import { FeedbackDashboard } from '../components/Admin/FeedbackDashboard';
import { CampaignEditor } from '../components/Admin/CampaignEditor';
import { CampaignHistory } from '../components/Admin/CampaignHistory';
import { EmailAutomations } from '../components/Admin/EmailAutomations';
import { EmailTemplates } from '../components/Admin/EmailTemplates';
import { NotificationCenter } from '../components/Admin/NotificationCenter';
import NewsletterLogs from '../components/Admin/NewsletterLogs';
import { SEODashboard } from '../components/Admin/SEODashboard';


export const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'articles' | 'categories' | 'editor' | 'newsletter' | 'users' | 'feedback' | 'seo'>('dashboard');
  const { logout, user } = useAuth();
  
  // Hook para SEO
  const { getMetadata } = useSEO({
    pageType: 'admin',
    breadcrumbs: [
      { name: 'Home', url: '/', position: 1 },
      { name: 'Admin', url: '/admin', position: 2 }
    ]
  });
  const { articles, categories, loading: loadingArticles, refreshArticles, createArticle, createCategory, updateCategory, deleteCategory, updateArticle, deleteArticle, updateArticlePublished } = useArticles();
  const { refreshData: refreshNewsletter, ...newsletterHook } = useNewsletter();
  const { contacts, loading: loadingContacts, refreshContacts } = useContacts();
  
  // Hooks para newsletter com dados reais
  const subscribersHook = useNewsletterSubscribers();
  const campaignsHook = useNewsletterCampaigns();
  const automationsHook = useEmailAutomations();
  
  // Hook para gerenciar usuários reais
  const { 
    users, 
    stats: userStats, 
    loading: loadingUsers, 
    error: usersError,
    updateUserStatus,
    filterUsers,
    refreshUsers 
  } = useUsers();

  // Hook para estatísticas do dashboard com dados reais
  const { 
    stats: dashboardStats, 
    weeklyData, 
    recentActivities, 
    refresh: refreshStats,
    isLoading: loadingDashboard
  } = useDashboardStats();
  
  // Estados para edição de artigos
  const [editingArticle, setEditingArticle] = useState<any>(null);
  
  // Estado para controlar loading de operações
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado para controlar o editor de campanhas
  const [showCampaignEditor, setShowCampaignEditor] = useState(false);
  
  // Estado para controlar as sub-abas da newsletter
  const [newsletterTab, setNewsletterTab] = useState('overview');
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  
  // Estados para filtros da newsletter
  const [subscriberSearchTerm, setSubscriberSearchTerm] = useState('');
  const [subscriberStatusFilter, setSubscriberStatusFilter] = useState<'all' | 'active' | 'inactive' | 'unsubscribed'>('all');
  const [subscriberDateFilter, setSubscriberDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  
  // Estados para filtros das atividades
  const [activityFilters, setActivityFilters] = useState<string[]>([]);
  const [showActivityFilters, setShowActivityFilters] = useState(false);

  // Fechar dropdown de filtros quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showActivityFilters && !target.closest('.activity-filter-dropdown')) {
        setShowActivityFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showActivityFilters]);
  
  // Aplicar filtros automaticamente quando mudarem
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      subscribersHook.fetchSubscribers({
        search: subscriberSearchTerm,
        status: subscriberStatusFilter !== 'all' ? subscriberStatusFilter : undefined,
        dateRange: subscriberDateFilter !== 'all' ? subscriberDateFilter : undefined
      }, 1);
    }, 500); // Debounce de 500ms

    return () => clearTimeout(delayedSearch);
  }, [subscriberSearchTerm, subscriberStatusFilter, subscriberDateFilter]);
  
  // Ref para controlar se já carregou os dados
  const hasLoadedData = useRef<Set<string>>(new Set());

  // Estado para controlar atualização automática
  const [autoRefresh, setAutoRefresh] = useState(true);
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // Verificar se o usuário é admin ou super_admin
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return <Navigate to="/admin/login" replace />;
  }

  // Funções para gerenciar artigos
  const handleEditArticle = (article: any) => {
    console.log('✏️ handleEditArticle chamada com:', article);
    
    // Verificar se o artigo é válido
    if (!article || !article.id) {
      console.error('❌ Artigo inválido:', article);
      toast.error('Artigo inválido para edição');
      return;
    }
    
    // Definir o artigo para edição
    setEditingArticle(article);
    console.log('📝 Artigo definido para edição:', article.id);
    
    // Mudar para a aba do editor
    setActiveTab('editor');
    console.log('🔄 Mudando para aba editor');
    
    // Feedback visual para o usuário
    toast.success(`Editando artigo: ${article.title || 'Sem título'}`);
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este artigo? Esta ação não pode ser desfeita.')) {
      try {
        const success = await deleteArticle(articleId);
        if (success) {
          toast.success('Artigo excluído com sucesso!');
          await refreshArticles();
        } else {
          toast.error('Erro ao excluir artigo');
        }
      } catch (error) {
        console.error('Erro ao excluir artigo:', error);
        toast.error('Erro ao excluir artigo');
      }
    }
  };

  const handleTogglePublish = async (article: any) => {
    console.log('🚨 EMERGÊNCIA - Usando nova função updateArticlePublished para artigo:', article.id, 'Status atual:', article.published);
    
    try {
      const newPublishedStatus = !article.published;
      console.log('📝 Novo status published:', newPublishedStatus);
      
      // USAR A NOVA FUNÇÃO DE EMERGÊNCIA PARA EVITAR ERRO 42883
      const success = await updateArticlePublished(article.id, newPublishedStatus);
      console.log('✅ Resultado do updateArticlePublished:', success);
      
      if (success) {
        toast.success(`Artigo ${newPublishedStatus ? 'publicado' : 'despublicado'} com sucesso!`);
        console.log('🔄 Chamando refreshArticles...');
        await refreshArticles();
        console.log('✅ refreshArticles concluído');
      } else {
        console.error('❌ updateArticlePublished retornou false');
        toast.error('Erro ao atualizar status do artigo');
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar artigo:', error);
      toast.error('Erro ao atualizar status do artigo');
    }
  };

  const handleViewArticle = (article: any) => {
    console.log('🔍 handleViewArticle chamada com:', article);
    
    // Verificar se o artigo tem slug válido
    if (!article.slug) {
      console.error('❌ Artigo sem slug:', article);
      toast.error('Artigo não possui slug válido para visualização');
      return;
    }
    
    // Abrir artigo em nova aba usando URL completa
    const url = `${window.location.origin}/artigo/${article.slug}`;
    console.log('🌐 Abrindo URL:', url);
    window.open(url, '_blank', 'noopener,noreferrer');
    toast.success(`Abrindo artigo: ${article.title}`);
  };

  // Função memoizada para carregar dados
  const loadTabData = useCallback(async (tab: string) => {
    const dataKey = `${tab}-data`;
    
    // Evitar múltiplas chamadas para a mesma aba
    if (hasLoadedData.current.has(dataKey)) {
      return;
    }
    
    hasLoadedData.current.add(dataKey);
    
    try {
      if (tab === 'dashboard' || tab === 'articles' || tab === 'categories' || tab === 'editor') {
        await refreshArticles();
      }
      if (tab === 'dashboard' || tab === 'newsletter') {
        try {
          await refreshNewsletter();
        } catch (newsletterError) {
          console.error('Erro específico na newsletter:', newsletterError);
          // Não bloquear o carregamento de outras abas por erro na newsletter
        }
      }
      if (tab === 'dashboard') {
        await refreshContacts();
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      // Remove da cache em caso de erro para permitir retry
      hasLoadedData.current.delete(dataKey);
    }
  }, [refreshArticles, refreshNewsletter, refreshContacts]);

  // Função para atualização automática dos dados
  const refreshAllData = useCallback(async () => {
    try {
      console.log('🔄 Atualizando dados automaticamente...');
      await Promise.all([
        refreshArticles(),
        refreshNewsletter().catch(err => console.warn('Erro na newsletter:', err)),
        refreshContacts()
      ]);
      console.log('✅ Dados atualizados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar dados:', error);
    }
  }, [refreshArticles, refreshNewsletter, refreshContacts]);

  // Configurar atualização automática
  useEffect(() => {
    if (autoRefresh && activeTab === 'dashboard') {
      // Atualizar a cada 30 segundos
      autoRefreshInterval.current = setInterval(refreshAllData, 30000);
      
      return () => {
        if (autoRefreshInterval.current) {
          clearInterval(autoRefreshInterval.current);
        }
      };
    }
  }, [autoRefresh, activeTab, refreshAllData]);

  // Load data when component mounts or tab changes
  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab, loadTabData]);

  // Reset cache quando o usuário muda
  useEffect(() => {
    hasLoadedData.current.clear();
  }, [user?.id]);

  // Estatísticas reais baseadas nos dados do Supabase
  const stats = {
    totalArticles: articles.length,
    publishedArticles: articles.filter(a => a.published).length,
    totalCategories: categories.length,
    totalViews: 0, // Será implementado com analytics reais
    subscribersCount: newsletterHook.stats.totalSubscribers,
    totalUsers: contacts.length, // Usando dados reais de contatos
    weeklyGrowth: newsletterHook.stats.weeklyGrowth,
    dailyViews: 0 // Será implementado com analytics reais
  };



  // Usar as estatísticas do hook da newsletter
  const newsletterStats = newsletterHook.stats;

  // Additional states for new tabs
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all'); // all, with-articles, without-articles
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // Estados para os modais


  const [newCategoryData, setNewCategoryData] = useState({
    name: '',
    description: '',
    slug: ''
  });

  // Função auxiliar para calcular tempo relativo
  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min atrás`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h atrás`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} dia${days > 1 ? 's' : ''} atrás`;
    }
  };



  // Estados para paginação e filtros
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Estados para usuários (agora usando dados reais do Supabase Auth)
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [currentUserPage, setCurrentUserPage] = useState(1);
  const usersPerPage = 10;

  // Filtrar usuários baseado na busca e filtro
  const filteredUsers = filterUsers(userSearchTerm, userStatusFilter);
  
  // Paginação de usuários
  const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentUserPage - 1) * usersPerPage,
    currentUserPage * usersPerPage
  );

  const handleLogout = () => {
    logout();
  };

  // Função para exportar CSV (removida - agora usa o hook)
  const exportCSV = () => {
    // Esta função foi movida para o hook useNewsletter
    newsletterHook.exportSubscribers();
  };

  // Funções para gerenciar usuários (agora usando o hook useUsers)
  const handleActivateUser = (userId: string) => {
    updateUserStatus(userId, 'active');
  };

  const handleDeactivateUser = (userId: string) => {
    updateUserStatus(userId, 'inactive');
  };

  const handleBanUser = (userId: string) => {
    updateUserStatus(userId, 'banned');
  };

  // Funções para gerenciar categorias
  const handleCreateCategory = async () => {
    if (!newCategoryData.name.trim()) {
      toast.error('Nome da categoria é obrigatório!');
      return;
    }

    const slug = newCategoryData.slug || newCategoryData.name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const categoryData = {
      name: newCategoryData.name,
      description: newCategoryData.description,
      slug: slug
    };

    const success = await createCategory(categoryData);
    
    if (success) {
      setNewCategoryData({ name: '', description: '', slug: '' });
      setShowNewCategoryModal(false);
      toast.success('Categoria criada com sucesso!');
    } else {
      toast.error('Erro ao criar categoria. Tente novamente.');
    }
  };

  // Funções para gerenciar filtros de atividades
  const activityTypes = [
    { id: 'article_published', label: 'Artigos', color: 'neon-purple' },
    { id: 'campaign_sent', label: 'Campanhas', color: 'yellow-400' },
    { id: 'new_comment', label: 'Comentários', color: 'blue-400' },
    { id: 'new_feedback', label: 'Feedback', color: 'orange-400' },
    { id: 'new_contact', label: 'Contatos', color: 'green-400' }
  ];

  const toggleActivityFilter = (filterType: string) => {
    setActivityFilters(prev => 
      prev.includes(filterType) 
        ? prev.filter(f => f !== filterType)
        : [...prev, filterType]
    );
  };

  const clearActivityFilters = () => {
    setActivityFilters([]);
  };

  const filteredActivities = recentActivities?.filter(activity => 
    activityFilters.length === 0 || activityFilters.includes(activity.type)
  ) || [];

  // Função para gerenciar campanhas


  const handleEditCategory = async (categoryData: { name: string; description: string; slug: string }) => {
    if (!editingCategory) return;
    
    const success = await updateCategory(editingCategory.id, categoryData);
    
    if (success) {
      setEditingCategory(null);
      toast.success('Categoria atualizada com sucesso!');
    } else {
      toast.error('Erro ao atualizar categoria. Tente novamente.');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    // Verificar se há artigos vinculados à categoria
    const articlesInCategory = articles.filter(a => a.category_id === categoryId);
    
    if (articlesInCategory.length > 0) {
      toast.error(`Não é possível excluir esta categoria pois há ${articlesInCategory.length} artigo(s) vinculado(s) a ela.`);
      return;
    }

    const success = await deleteCategory(categoryId);
    
    if (success) {
      toast.success('Categoria excluída com sucesso!');
      setShowDeleteConfirmModal(false);
      setCategoryToDelete(null);
    } else {
      toast.error('Erro ao excluir categoria. Tente novamente.');
    }
  };

  // Função para confirmar exclusão
  const confirmDeleteCategory = (category: any) => {
    setCategoryToDelete(category);
    setShowDeleteConfirmModal(true);
  };



  // Filtrar usuários (removido - agora usando o hook useUsers)
  // const filteredUsers = users.filter(user => {
  //   const matchesSearch = (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
  //                        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
  //   const matchesFilter = filterStatus === 'all' || user.status === filterStatus;
  //   return matchesSearch && matchesFilter;
  // });

  // Paginação (removido - agora usando o hook useUsers)
  // const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  // const startIndex = (currentPage - 1) * itemsPerPage;
  // const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <>
      <SEOManager metadata={getMetadata()} />
      <div className="min-h-screen bg-gradient-to-br from-primary-dark via-dark-surface to-darker-surface">
      {/* Admin Header */}
      <div className="bg-darker-surface/80 backdrop-blur-sm border-b border-neon-purple/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-neon-gradient rounded-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-orbitron font-bold text-white">
                  AIMindset Admin
                </h1>
                <p className="text-sm text-futuristic-gray">
                  Bem-vindo, {user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-orbitron font-bold gradient-text mb-2">
            Dashboard
          </h2>
          <p className="text-futuristic-gray">
            Gerencie o conteúdo do seu blog AIMindset
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-darker-surface/50 p-1 rounded-lg backdrop-blur-sm overflow-x-auto scrollbar-hide">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'articles', label: 'Artigos', icon: FileText },
            { id: 'editor', label: 'Novo Artigo', icon: PlusCircle },
            { id: 'newsletter', label: 'Newsletter', icon: Mail },
            { id: 'users', label: 'Usuários', icon: Users },
            { id: 'categories', label: 'Categorias', icon: TrendingUp },
            { id: 'feedback', label: 'Feedback', icon: MessageSquare },
            { id: 'seo', label: 'SEO', icon: Search }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 sm:px-6 py-3 rounded-md font-montserrat font-medium transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-neon-gradient text-white shadow-lg'
                    : 'text-futuristic-gray hover:text-white hover:bg-dark-surface/50'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Dashboard Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-orbitron font-bold text-white">Dashboard</h2>
                  <p className="text-futuristic-gray text-sm">
                    Última atualização: {dashboardStats?.lastUpdate ? new Date(dashboardStats.lastUpdate).toLocaleString('pt-BR') : 'Carregando...'}
                  </p>
                </div>
                <Button
                  onClick={refreshStats}
                  disabled={loadingDashboard}
                  className="bg-neon-gradient hover:bg-neon-gradient/80 disabled:opacity-50"
                >
                  {loadingDashboard ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Activity className="w-4 h-4 mr-2" />
                  )}
                  Atualizar
                </Button>
              </div>

              {/* Loading State */}
              {loadingDashboard && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-purple"></div>
                  <span className="ml-3 text-futuristic-gray">Carregando dados em tempo real...</span>
                </div>
              )}



              {/* Stats Cards - Principais Métricas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
                <Card className="glass-effect hover-lift transition-all duration-300 hover:scale-105">
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-futuristic-gray text-xs sm:text-sm">Total de Artigos</p>
                        <p className="text-xl sm:text-2xl font-orbitron font-bold text-white">
                          {loadingDashboard ? '...' : dashboardStats?.totalArticles?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-lime-green">
                          {dashboardStats?.publishedArticles || 0} publicados
                        </p>
                      </div>
                      <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-neon-purple" />
                    </div>
                  </div>
                </Card>

                <Card className="glass-effect hover-lift transition-all duration-300 hover:scale-105">
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-futuristic-gray text-xs sm:text-sm">Usuários</p>
                        <p className="text-xl sm:text-2xl font-orbitron font-bold text-white">
                          {loadingDashboard ? '...' : dashboardStats?.totalUsers?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-lime-green">
                          +{dashboardStats?.weeklyGrowth || 0}% esta semana
                        </p>
                      </div>
                      <Users className="w-6 h-6 sm:w-8 sm:h-8 text-neon-purple" />
                    </div>
                  </div>
                </Card>

                <Card className="glass-effect hover-lift transition-all duration-300 hover:scale-105">
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-futuristic-gray text-xs sm:text-sm">Inscritos</p>
                        <p className="text-xl sm:text-2xl font-orbitron font-bold text-white">
                          {loadingDashboard ? '...' : dashboardStats?.totalSubscribers?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-lime-green">
                          +{dashboardStats?.monthlyGrowth || 0}% este mês
                        </p>
                      </div>
                      <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-lime-green" />
                    </div>
                  </div>
                </Card>

                <Card className="glass-effect hover-lift transition-all duration-300 hover:scale-105">
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-futuristic-gray text-xs sm:text-sm">Comentários</p>
                        <p className="text-xl sm:text-2xl font-orbitron font-bold text-white">
                          {loadingDashboard ? '...' : dashboardStats?.totalComments?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-blue-400">
                          {dashboardStats?.averageCommentsPerArticle?.toFixed(1) || '0'} por artigo
                        </p>
                      </div>
                      <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                    </div>
                  </div>
                </Card>

                <Card className="glass-effect hover-lift transition-all duration-300 hover:scale-105">
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-futuristic-gray text-xs sm:text-sm">Feedback</p>
                        <p className="text-xl sm:text-2xl font-orbitron font-bold text-white">
                          {loadingDashboard ? '...' : dashboardStats?.totalFeedback?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-yellow-400">
                          {dashboardStats?.positiveFeedbackRate?.toFixed(1) || '0'}% positivo
                        </p>
                      </div>
                      <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />
                    </div>
                  </div>
                </Card>

                <Card className="glass-effect hover-lift transition-all duration-300 hover:scale-105">
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-futuristic-gray text-xs sm:text-sm">Campanhas</p>
                        <p className="text-xl sm:text-2xl font-orbitron font-bold text-white">
                          {loadingDashboard ? '...' : dashboardStats?.totalCampaigns?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-purple-400">
                          Ativas
                        </p>
                      </div>
                      <Send className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Gráficos de Crescimento e Métricas Avançadas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <Card className="glass-effect">
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base sm:text-lg font-orbitron font-bold text-white">
                        Crescimento Semanal
                      </h3>
                      {loadingDashboard && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neon-purple"></div>
                      )}
                    </div>
                    {/* Container com dimensões FIXAS - SEM ResponsiveContainer para evitar width(-1) height(-1) */}
                    <div style={{ width: '100%', height: '320px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {loadingDashboard ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-purple"></div>
                          <span className="ml-2 text-gray-400">Carregando gráfico...</span>
                        </div>
                      ) : (
                        <LineChart 
                          width={400}
                          height={300}
                          data={weeklyData && weeklyData.length > 0 ? weeklyData : [
                            { name: 'Seg', subscribers: 0, users: 0, comments: 0 },
                            { name: 'Ter', subscribers: 0, users: 0, comments: 0 },
                            { name: 'Qua', subscribers: 0, users: 0, comments: 0 },
                            { name: 'Qui', subscribers: 0, users: 0, comments: 0 },
                            { name: 'Sex', subscribers: 0, users: 0, comments: 0 },
                            { name: 'Sáb', subscribers: 0, users: 0, comments: 0 },
                            { name: 'Dom', subscribers: 0, users: 0, comments: 0 }
                          ]} 
                          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        >
                          <defs>
                            <linearGradient id="subscribersGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0.2}/>
                            </linearGradient>
                            <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#6366F1" stopOpacity={0.2}/>
                            </linearGradient>
                            <linearGradient id="commentsGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.2}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                          <XAxis 
                            dataKey="name" 
                            stroke="#9CA3AF" 
                            fontSize={12} 
                            fontWeight={500}
                            tick={{ fill: '#D1D5DB' }}
                          />
                          <YAxis 
                            stroke="#9CA3AF" 
                            fontSize={12} 
                            fontWeight={500}
                            tick={{ fill: '#D1D5DB' }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(17, 24, 39, 0.95)', 
                              border: '1px solid #6366F1',
                              borderRadius: '12px',
                              fontSize: '13px',
                              fontWeight: '500',
                              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                              backdropFilter: 'blur(10px)'
                            }}
                            labelStyle={{ color: '#F3F4F6', fontWeight: '600', marginBottom: '8px' }}
                            formatter={(value, name) => [
                              <span style={{ color: name === 'Inscritos' ? '#10B981' : name === 'Usuários' ? '#6366F1' : '#F59E0B' }}>
                                {value?.toLocaleString() || 0}
                              </span>, 
                              name
                            ]}
                            cursor={{ stroke: '#6366F1', strokeWidth: 1, strokeDasharray: '5 5' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="subscribers" 
                            stroke="url(#subscribersGradient)" 
                            strokeWidth={3} 
                            name="Inscritos" 
                            dot={{ fill: '#10B981', strokeWidth: 2, r: 5, stroke: '#065F46' }} 
                            activeDot={{ r: 7, stroke: '#10B981', strokeWidth: 3, fill: '#ECFDF5' }}
                            animationDuration={1500}
                            animationEasing="ease-in-out"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="users" 
                            stroke="url(#usersGradient)" 
                            strokeWidth={3} 
                            name="Usuários" 
                            dot={{ fill: '#6366F1', strokeWidth: 2, r: 5, stroke: '#312E81' }} 
                            activeDot={{ r: 7, stroke: '#6366F1', strokeWidth: 3, fill: '#EEF2FF' }}
                            animationDuration={1500}
                            animationEasing="ease-in-out"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="comments" 
                            stroke="url(#commentsGradient)" 
                            strokeWidth={2} 
                            name="Comentários" 
                            dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4, stroke: '#92400E' }} 
                            activeDot={{ r: 6, stroke: '#F59E0B', strokeWidth: 3, fill: '#FFFBEB' }}
                            animationDuration={1500}
                            animationEasing="ease-in-out"
                          />
                        </LineChart>
                      )}
                    </div>
                  </div>
                </Card>

                <Card className="glass-effect">
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base sm:text-lg font-orbitron font-bold text-white">
                        Atividade por Dia
                      </h3>
                      {loadingDashboard && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neon-purple"></div>
                      )}
                    </div>
                    {/* Container com dimensões ABSOLUTAS para evitar width(-1) height(-1) */}
                    <div style={{ width: '100%', height: '320px', minWidth: '300px', minHeight: '320px', position: 'relative' }}>
                      {loadingDashboard ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-purple"></div>
                          <span className="ml-2 text-gray-400">Carregando gráfico...</span>
                        </div>
                      ) : (
                        <ResponsiveContainer width={300} height={320} minWidth={300} minHeight={320}>
                          <BarChart 
                            width={300}
                            height={320}
                            data={weeklyData && weeklyData.length > 0 ? weeklyData : [
                              { name: 'Seg', articles: 0, campaigns: 0, feedback: 0 },
                              { name: 'Ter', articles: 0, campaigns: 0, feedback: 0 },
                              { name: 'Qua', articles: 0, campaigns: 0, feedback: 0 },
                              { name: 'Qui', articles: 0, campaigns: 0, feedback: 0 },
                              { name: 'Sex', articles: 0, campaigns: 0, feedback: 0 },
                              { name: 'Sáb', articles: 0, campaigns: 0, feedback: 0 },
                              { name: 'Dom', articles: 0, campaigns: 0, feedback: 0 }
                            ]} 
                            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                            <YAxis stroke="#9CA3AF" fontSize={12} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#1F2937', 
                                border: '1px solid #6366F1',
                                borderRadius: '8px',
                                fontSize: '12px'
                              }}
                            />
                            <Bar dataKey="articles" fill="#6366F1" name="Artigos" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="campaigns" fill="#8B5CF6" name="Campanhas" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="feedback" fill="#F59E0B" name="Feedback" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Últimas Atividades e Dados Recentes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <Card className="glass-effect">
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4 gap-2">
                      <h3 className="text-base sm:text-lg font-orbitron font-bold text-white flex items-center flex-1 min-w-0">
                        <Activity className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-neon-purple flex-shrink-0" />
                        <span className="truncate">Últimas Atividades</span>
                      </h3>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {loadingDashboard && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neon-purple"></div>
                        )}
                        <div className="relative activity-filter-dropdown">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className={`text-xs transition-all duration-300 min-h-[36px] px-3 sm:px-2 ${
                              activityFilters.length > 0 
                                ? 'text-neon-purple bg-neon-purple/10 border border-neon-purple/20 hover:bg-neon-purple/20' 
                                : 'text-futuristic-gray hover:text-white'
                            }`}
                            onClick={() => setShowActivityFilters(!showActivityFilters)}
                          >
                            <Filter className="w-4 h-4 sm:w-3 sm:h-3 mr-1" />
                            <span className="hidden sm:inline">Filtrar</span>
                            <span className="sm:hidden">Filtros</span>
                            {activityFilters.length > 0 && (
                              <span className="ml-1 px-1.5 py-0.5 bg-neon-purple text-white text-xs rounded-full min-w-[20px] text-center">
                                {activityFilters.length}
                              </span>
                            )}
                          </Button>
                          
                          {showActivityFilters && (
                            <div className="absolute right-0 top-full mt-2 w-64 sm:w-72 md:w-80 lg:w-64 bg-darker-surface/95 backdrop-blur-sm border border-darker-surface/50 rounded-xl shadow-2xl z-50 p-3 sm:p-4 max-w-[calc(100vw-2rem)] sm:max-w-none">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-medium text-white truncate">Filtrar por tipo</h4>
                                {activityFilters.length > 0 && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs text-futuristic-gray hover:text-white h-8 px-3 ml-2 flex-shrink-0 min-h-[32px] min-w-[60px]"
                                    onClick={clearActivityFilters}
                                  >
                                    Limpar
                                  </Button>
                                )}
                              </div>
                              
                              <div className="space-y-1 sm:space-y-2">
                                {activityTypes.map((type) => (
                                  <label
                                    key={type.id}
                                    className="flex items-center space-x-3 cursor-pointer group hover:bg-darker-surface/30 rounded-lg p-2 sm:p-3 transition-all duration-200 min-h-[44px] sm:min-h-[40px]"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={activityFilters.includes(type.id)}
                                      onChange={() => toggleActivityFilter(type.id)}
                                      className="sr-only"
                                    />
                                    <div className={`w-5 h-5 sm:w-4 sm:h-4 rounded border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                                      activityFilters.includes(type.id)
                                        ? `bg-${type.color}/20 border-${type.color} shadow-lg`
                                        : 'border-futuristic-gray/30 group-hover:border-futuristic-gray/50'
                                    }`}>
                                      {activityFilters.includes(type.id) && (
                                        <div className={`w-2.5 h-2.5 sm:w-2 sm:h-2 rounded-full bg-${type.color}`} />
                                      )}
                                    </div>
                                    <span className={`text-sm sm:text-sm transition-colors duration-200 flex-1 ${
                                      activityFilters.includes(type.id) 
                                        ? 'text-white font-medium' 
                                        : 'text-futuristic-gray group-hover:text-white'
                                    }`}>
                                      {type.label}
                                    </span>
                                  </label>
                                ))}
                              </div>
                              
                              <div className="mt-3 pt-3 border-t border-darker-surface/50">
                                <p className="text-xs text-futuristic-gray/60 text-center sm:text-left">
                                  {filteredActivities.length} de {recentActivities?.length || 0} atividades
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-80 sm:max-h-96 overflow-y-auto custom-scrollbar">
                      {loadingDashboard ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-purple"></div>
                          <span className="ml-2 text-futuristic-gray">Carregando atividades...</span>
                        </div>
                      ) : recentActivities && recentActivities.length > 0 ? (
                        filteredActivities.length > 0 ? (
                        <>
                          {filteredActivities.slice(0, 8).map((activity, index) => (
                            <div key={index} className="group flex items-start sm:items-center space-x-3 p-3 sm:p-4 bg-gradient-to-r from-darker-surface/20 to-darker-surface/40 rounded-xl hover:from-darker-surface/40 hover:to-darker-surface/60 transition-all duration-300 border border-transparent hover:border-neon-purple/20 min-h-[60px] sm:min-h-[auto]">
                              <div className={`p-2.5 sm:p-2 rounded-full transition-all duration-300 group-hover:scale-110 flex-shrink-0 ${
                
                                activity.type === 'article_published' ? 'bg-gradient-to-br from-neon-purple/30 to-neon-purple/10 shadow-lg shadow-neon-purple/20' :
                                activity.type === 'campaign_sent' ? 'bg-gradient-to-br from-yellow-500/30 to-yellow-500/10 shadow-lg shadow-yellow-500/20' :
                                activity.type === 'new_comment' ? 'bg-gradient-to-br from-blue-400/30 to-blue-400/10 shadow-lg shadow-blue-400/20' :
                                activity.type === 'new_feedback' ? 'bg-gradient-to-br from-orange-500/30 to-orange-500/10 shadow-lg shadow-orange-500/20' :
                                activity.type === 'new_contact' ? 'bg-gradient-to-br from-green-500/30 to-green-500/10 shadow-lg shadow-green-500/20' :
                                'bg-gradient-to-br from-gray-500/30 to-gray-500/10 shadow-lg shadow-gray-500/20'
                              }`}>

                                {activity.type === 'article_published' && <FileText className="w-5 h-5 sm:w-4 sm:h-4 text-neon-purple" />}

                                {activity.type === 'campaign_sent' && <Send className="w-5 h-5 sm:w-4 sm:h-4 text-yellow-400" />}
                                {activity.type === 'new_comment' && <MessageSquare className="w-5 h-5 sm:w-4 sm:h-4 text-blue-400" />}
                                {activity.type === 'new_feedback' && <Zap className="w-5 h-5 sm:w-4 sm:h-4 text-orange-400" />}
                                {activity.type === 'new_contact' && <Mail className="w-5 h-5 sm:w-4 sm:h-4 text-green-400" />}

                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm sm:text-sm font-medium leading-tight group-hover:text-gray-100 transition-colors line-clamp-2 sm:line-clamp-1">
                                  {activity.message}
                                </p>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 sm:mt-1 space-y-1 sm:space-y-0">
                                  <p className="text-futuristic-gray text-xs font-medium order-2 sm:order-1">
                                    {activity.time}
                                  </p>
                                  <div className={`px-2 py-1 sm:py-0.5 rounded-full text-xs font-medium self-start sm:self-auto order-1 sm:order-2 ${
                    
                                    activity.type === 'article_published' ? 'bg-neon-purple/10 text-neon-purple border border-neon-purple/20' :

                                    activity.type === 'campaign_sent' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                    activity.type === 'new_comment' ? 'bg-blue-400/10 text-blue-400 border border-blue-400/20' :
                                    activity.type === 'new_feedback' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                    activity.type === 'new_contact' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                    'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                  }`}>
                                    {activity.type === 'article_published' ? 'Artigo' :

                                     activity.type === 'campaign_sent' ? 'Campanha' :
                                     activity.type === 'new_comment' ? 'Comentário' :
                                     activity.type === 'new_feedback' ? 'Feedback' :
                                     activity.type === 'new_contact' ? 'Contato' :
                                     'Geral'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          {filteredActivities.length > 8 && (
                            <div className="pt-3 border-t border-darker-surface/50">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="w-full text-futuristic-gray hover:text-white hover:bg-darker-surface/30 transition-all duration-300 min-h-[40px] text-sm"
                                onClick={() => {/* TODO: Implementar ver mais */}}
                              >
                                <span className="hidden sm:inline">Ver mais {filteredActivities.length - 8} atividades</span>
                                <span className="sm:hidden">Ver mais ({filteredActivities.length - 8})</span>
                                <ChevronRight className="w-4 h-4 ml-1" />
                              </Button>
                            </div>
                          )}
                        </>
                        ) : (
                          <div className="text-center py-8 sm:py-12 px-4">
                            <div className="bg-gradient-to-br from-futuristic-gray/10 to-futuristic-gray/5 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-4">
                              <Filter className="w-6 h-6 sm:w-8 sm:h-8 text-futuristic-gray" />
                            </div>
                            <p className="text-futuristic-gray font-medium text-sm sm:text-base">Nenhuma atividade encontrada</p>
                            <p className="text-futuristic-gray/60 text-xs sm:text-sm mt-1">Tente ajustar os filtros de busca</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="mt-3 text-neon-purple hover:text-neon-purple/80 min-h-[36px] px-4"
                              onClick={clearActivityFilters}
                            >
                              Limpar filtros
                            </Button>
                          </div>
                        )
                      ) : (
                        <div className="text-center py-8 sm:py-12 px-4">
                          <div className="bg-gradient-to-br from-futuristic-gray/10 to-futuristic-gray/5 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-4">
                            <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-futuristic-gray" />
                          </div>
                          <p className="text-futuristic-gray font-medium text-sm sm:text-base">Nenhuma atividade recente</p>
                          <p className="text-futuristic-gray/60 text-xs sm:text-sm mt-1">As atividades aparecerão aqui conforme acontecem</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                <Card className="glass-effect">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-orbitron font-bold text-white flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-neon-purple" />
                        Conteúdo Recente
                      </h3>
                      <div className="flex items-center space-x-2">
                        {loadingDashboard && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neon-purple"></div>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-xs text-futuristic-gray hover:text-white min-h-[36px] px-3"
                          onClick={() => setActiveTab('articles')}
                        >
                          <span className="hidden sm:inline">Ver todos</span>
                          <span className="sm:hidden">Todos</span>
                          <ChevronRight className="w-4 h-4 sm:w-3 sm:h-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                      {loadingDashboard ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-purple"></div>
                          <span className="ml-2 text-futuristic-gray">Carregando conteúdo...</span>
                        </div>
                      ) : articles && articles.length > 0 ? (
                        <>
                          {(() => {
                            console.log('📊 Dados dos artigos na seção Conteúdo Recente:', {
                              totalArticles: articles.length,
                              articlesData: articles.map(a => ({
                                id: a.id,
                                title: a.title,
                                slug: a.slug,
                                published: a.published,
                                created_at: a.created_at
                              }))
                            });
                            return null;
                          })()}
                          {articles
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .slice(0, 6)
                            .map((article) => (
                              <div key={article.id} className="group flex items-start space-x-3 p-3 bg-gradient-to-r from-darker-surface/20 to-darker-surface/40 rounded-xl hover:from-darker-surface/40 hover:to-darker-surface/60 transition-all duration-300 border border-transparent hover:border-neon-purple/20">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-neon-purple/20 to-neon-purple/5 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                                  <FileText className="w-5 h-5 text-neon-purple" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-white font-medium text-sm leading-tight group-hover:text-gray-100 transition-colors line-clamp-2">
                                    {article.title}
                                  </h4>
                                  <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center space-x-2">
                                      <p className="text-futuristic-gray text-xs font-medium">
                                        {new Date(article.created_at).toLocaleDateString('pt-BR')}
                                      </p>
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                                        article.published 
                                          ? 'bg-lime-green/10 text-lime-green border-lime-green/20' 
                                          : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                      }`}>
                                        {article.published ? 'Publicado' : 'Rascunho'}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-1" style={{ zIndex: 10, position: 'relative' }}>
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-8 w-8 sm:h-7 sm:w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-neon-purple/20 min-h-[32px] min-w-[32px] sm:min-h-[28px] sm:min-w-[28px]"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          console.log('🖱️ Botão Editar clicado para artigo:', article.id);
                                          handleEditArticle(article);
                                        }}
                                        style={{ zIndex: 20, position: 'relative' }}
                                      >
                                        <Edit3 className="w-4 h-4 sm:w-3 sm:h-3" />
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-8 w-8 sm:h-7 sm:w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-blue-500/20 min-h-[32px] min-w-[32px] sm:min-h-[28px] sm:min-w-[28px]"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          console.log('🖱️ Botão Ver clicado para artigo:', article.id);
                                          handleViewArticle(article);
                                        }}
                                        style={{ zIndex: 20, position: 'relative' }}
                                      >
                                        <Eye className="w-4 h-4 sm:w-3 sm:h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  {article.excerpt && (
                                    <p className="text-futuristic-gray/80 text-xs mt-1 line-clamp-1">
                                      {article.excerpt}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          {articles.length > 6 && (
                            <div className="pt-3 border-t border-darker-surface/50">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="w-full text-futuristic-gray hover:text-white hover:bg-darker-surface/30 transition-all duration-300 min-h-[40px] text-sm"
                                onClick={() => setActiveTab('articles')}
                              >
                                <span className="hidden sm:inline">Ver mais {articles.length - 6} artigos</span>
                                <span className="sm:hidden">Ver mais ({articles.length - 6})</span>
                                <ChevronRight className="w-4 h-4 ml-1" />
                              </Button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-12">
                          <div className="bg-gradient-to-br from-futuristic-gray/10 to-futuristic-gray/5 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-futuristic-gray" />
                          </div>
                          <p className="text-futuristic-gray font-medium">Nenhum artigo encontrado</p>
                          <p className="text-futuristic-gray/60 text-sm mt-1">Crie seu primeiro artigo para começar</p>
                          <Button 
                            size="sm" 
                            className="mt-3 bg-neon-gradient hover:bg-neon-gradient/80 min-h-[40px] px-4"
                            onClick={() => setActiveTab('editor')}
                          >
                            <PlusCircle className="w-4 h-4 mr-1" />
                            Criar Artigo
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
          </div>
        )}

        {/* Articles Tab */}
        {activeTab === 'articles' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-orbitron font-bold text-white">
                Gerenciamento de Artigos
              </h3>
              <Button
                onClick={() => setActiveTab('editor')}
                className="bg-neon-gradient hover:bg-neon-gradient/80"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Novo Artigo
              </Button>
            </div>

            {/* Filters */}
            <Card className="glass-effect">
              <div className="p-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-futuristic-gray w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Buscar artigos..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple text-sm sm:text-base"
                      />
                    </div>
                  </div>
                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white focus:outline-none focus:border-neon-purple text-sm sm:text-base min-w-0 sm:min-w-[160px]"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="published">Publicados</option>
                    <option value="draft">Rascunhos</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Articles List */}
            <Card className="glass-effect">
              <div className="p-6">
                <div className="space-y-4">
                  {articles.length > 0 ? articles
                    .filter(article => {
                      const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                          article.content.toLowerCase().includes(searchTerm.toLowerCase());
                      const matchesFilter = filterStatus === 'all' ||
                                          (filterStatus === 'published' && article.published) ||
                                          (filterStatus === 'draft' && !article.published);
                      return matchesSearch && matchesFilter;
                    })
                    .map((article) => (
                    <div key={article.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-4 bg-darker-surface/30 rounded-lg hover:bg-darker-surface/50 transition-colors gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium text-base sm:text-lg mb-1 truncate">{article.title}</h4>
                        <p className="text-futuristic-gray text-xs sm:text-sm mb-2 line-clamp-2">
                          {article.content.substring(0, 100)}...
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs text-futuristic-gray">
                          <span className="truncate">Categoria: {categories.find(c => c.id === article.category_id)?.name || 'N/A'}</span>
                          <span>Criado: {new Date(article.created_at).toLocaleDateString('pt-BR')}</span>
                          {article.updated_at && (
                            <span className="hidden sm:inline">Atualizado: {new Date(article.updated_at).toLocaleDateString('pt-BR')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-2 lg:gap-3">
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          article.published 
                            ? 'bg-lime-green/20 text-lime-green' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {article.published ? 'Publicado' : 'Rascunho'}
                        </span>
                        <div className="flex items-center space-x-2 sm:space-x-1 lg:space-x-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-blue-400 hover:text-blue-300 p-1 sm:p-2"
                            onClick={() => handleViewArticle(article)}
                            title="Visualizar artigo"
                          >
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-yellow-400 hover:text-yellow-300 p-1 sm:p-2"
                            onClick={() => handleEditArticle(article)}
                            title="Editar artigo"
                          >
                            <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className={`p-1 sm:p-2 ${article.published ? 'text-orange-400 hover:text-orange-300' : 'text-green-400 hover:text-green-300'}`}
                            onClick={() => handleTogglePublish(article)}
                            title={article.published ? 'Despublicar artigo' : 'Publicar artigo'}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <div className="animate-spin w-3 h-3 sm:w-4 sm:h-4 border-2 border-current border-t-transparent rounded-full" />
                            ) : (
                              <>
                                <span className="text-xs sm:text-sm lg:inline hidden">{article.published ? 'Despublicar' : 'Publicar'}</span>
                                <span className="lg:hidden">
                                  {article.published ? '📤' : '📥'}
                                </span>
                              </>
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-red-400 hover:text-red-300 p-1 sm:p-2"
                            onClick={() => handleDeleteArticle(article.id.toString())}
                            title="Excluir artigo"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-futuristic-gray mx-auto mb-4" />
                      <p className="text-futuristic-gray text-lg">Nenhum artigo encontrado</p>
                      <p className="text-futuristic-gray text-sm">Comece criando seu primeiro artigo</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Newsletter Tab */}
        {activeTab === 'newsletter' && (
          <div className="space-y-6">
            {/* Newsletter Tabs */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-orbitron font-bold text-white">
                  Gerenciamento da Newsletter
                </h3>
                <p className="text-futuristic-gray text-sm mt-1">
                  Total: {newsletterHook.stats.totalSubscribers} • Ativos: {newsletterHook.stats.activeSubscribers} • Novos hoje: {newsletterHook.stats.newToday}
                </p>
              </div>
            </div>

            {/* Sub-tabs para Newsletter */}
            <div className="flex space-x-1 bg-darker-surface/30 p-1 rounded-lg">
              <button
                onClick={() => setNewsletterTab('overview')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  newsletterTab === 'overview'
                    ? 'bg-neon-purple/20 text-neon-purple'
                    : 'text-futuristic-gray hover:text-white'
                }`}
              >
                Visão Geral
              </button>
              <button
                onClick={() => setNewsletterTab('subscribers')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  newsletterTab === 'subscribers'
                    ? 'bg-neon-purple/20 text-neon-purple'
                    : 'text-futuristic-gray hover:text-white'
                }`}
              >
                Inscritos
              </button>
              <button
                onClick={() => setNewsletterTab('campaigns')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  newsletterTab === 'campaigns'
                    ? 'bg-neon-purple/20 text-neon-purple'
                    : 'text-futuristic-gray hover:text-white'
                }`}
              >
                Campanhas
              </button>
              <button
                onClick={() => setNewsletterTab('automations')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  newsletterTab === 'automations'
                    ? 'bg-neon-purple/20 text-neon-purple'
                    : 'text-futuristic-gray hover:text-white'
                }`}
              >
                Automações
              </button>
              <button
                onClick={() => setNewsletterTab('templates')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  newsletterTab === 'templates'
                    ? 'bg-neon-purple/20 text-neon-purple'
                    : 'text-futuristic-gray hover:text-white'
                }`}
              >
                Templates
              </button>
              <button
                onClick={() => setNewsletterTab('logs')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  newsletterTab === 'logs'
                    ? 'bg-neon-purple/20 text-neon-purple'
                    : 'text-futuristic-gray hover:text-white'
                }`}
              >
                Logs
              </button>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div></div>
              <div className="flex space-x-3">
                <Button
                  onClick={newsletterHook.exportSubscribers}
                  disabled={newsletterHook.loading}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar CSV</span>
                </Button>
                <Button
                  onClick={() => setShowCampaignEditor(true)}
                  className="bg-neon-gradient hover:bg-neon-gradient/80"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Nova Campanha
                </Button>
              </div>
            </div>

            {/* Notification Center Toggle */}
            <div className="flex justify-end mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNotificationCenter(!showNotificationCenter)}
                className="flex items-center space-x-2"
              >
                <Bell className="w-4 h-4" />
                <span>Notificações</span>
              </Button>
            </div>

            {/* Notification Center Modal */}
            {showNotificationCenter && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-end p-4">
                <div className="mt-16 mr-4">
                  <NotificationCenter onClose={() => setShowNotificationCenter(false)} />
                </div>
              </div>
            )}

            {/* Newsletter Content based on active sub-tab */}
            {newsletterTab === 'overview' && (
              <div className="space-y-6">
                {/* Newsletter Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="glass-effect">
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-futuristic-gray text-sm">Total de Inscritos</p>
                          <p className="text-2xl font-orbitron font-bold text-white">
                            {subscribersHook.loading ? '...' : subscribersHook.totalCount}
                          </p>
                        </div>
                        <Mail className="w-8 h-8 text-lime-green" />
                      </div>
                    </div>
                  </Card>

                  <Card className="glass-effect">
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-futuristic-gray text-sm">Ativos</p>
                          <p className="text-2xl font-orbitron font-bold text-white">
                            {subscribersHook.loading ? '...' : subscribersHook.subscribers.filter(s => s.status === 'active').length}
                          </p>
                        </div>
                        <UserCheck className="w-8 h-8 text-lime-green" />
                      </div>
                    </div>
                  </Card>

                  <Card className="glass-effect">
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-futuristic-gray text-sm">Campanhas Enviadas</p>
                          <p className="text-2xl font-orbitron font-bold text-white">
                            {campaignsHook.loading ? '...' : campaignsHook.campaigns.filter(c => c.status === 'sent').length}
                          </p>
                        </div>
                        <Send className="w-8 h-8 text-neon-purple" />
                      </div>
                    </div>
                  </Card>

                  <Card className="glass-effect">
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-futuristic-gray text-sm">Automações Ativas</p>
                          <p className="text-2xl font-orbitron font-bold text-white">
                            {automationsHook.loading ? '...' : automationsHook.automations.filter(a => a.is_active).length}
                          </p>
                        </div>
                        <Zap className="w-8 h-8 text-electric-blue" />
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="glass-effect cursor-pointer hover:bg-darker-surface/30 transition-colors" onClick={() => setNewsletterTab('campaigns')}>
                    <div className="p-6 text-center">
                      <Send className="w-12 h-12 text-neon-purple mx-auto mb-4" />
                      <h4 className="text-lg font-orbitron font-bold text-white mb-2">Nova Campanha</h4>
                      <p className="text-futuristic-gray text-sm">Criar e enviar uma nova campanha de email</p>
                    </div>
                  </Card>

                  <Card className="glass-effect cursor-pointer hover:bg-darker-surface/30 transition-colors" onClick={() => setNewsletterTab('subscribers')}>
                    <div className="p-6 text-center">
                      <Users className="w-12 h-12 text-lime-green mx-auto mb-4" />
                      <h4 className="text-lg font-orbitron font-bold text-white mb-2">Gerenciar Inscritos</h4>
                      <p className="text-futuristic-gray text-sm">Visualizar e gerenciar lista de inscritos</p>
                    </div>
                  </Card>

                  <Card className="glass-effect cursor-pointer hover:bg-darker-surface/30 transition-colors" onClick={() => setNewsletterTab('automations')}>
                    <div className="p-6 text-center">
                      <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                      <h4 className="text-lg font-orbitron font-bold text-white mb-2">Automações</h4>
                      <p className="text-futuristic-gray text-sm">Configurar emails automáticos</p>
                    </div>
                  </Card>
                </div>

                {/* Advanced Analytics Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="glass-effect">
                    <div className="p-6">
                      <h3 className="text-lg font-orbitron font-bold text-white mb-4 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-lime-green" />
                        Crescimento de Inscritos
                      </h3>
                      {/* Container com dimensões ABSOLUTAS para evitar width(-1) height(-1) */}
                      <div style={{ width: '100%', height: '320px', minWidth: '300px', minHeight: '320px', position: 'relative' }}>
                        {loadingDashboard ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-green"></div>
                            <span className="ml-2 text-gray-400">Carregando gráfico...</span>
                          </div>
                        ) : (
                          <ResponsiveContainer width={300} height={320} minWidth={300} minHeight={320}>
                            <LineChart 
                              width={300}
                              height={320}
                              data={weeklyData && weeklyData.length > 0 ? weeklyData : [
                                { name: 'Seg', inscritos: 0 },
                                { name: 'Ter', inscritos: 0 },
                                { name: 'Qua', inscritos: 0 },
                                { name: 'Qui', inscritos: 0 },
                                { name: 'Sex', inscritos: 0 },
                                { name: 'Sáb', inscritos: 0 },
                                { name: 'Dom', inscritos: 0 }
                              ]}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                              <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                              <YAxis stroke="#9CA3AF" fontSize={12} />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: '#1F2937', 
                                  border: '1px solid #10B981',
                                  borderRadius: '8px',
                                  fontSize: '12px'
                                }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="inscritos" 
                                stroke="#10B981" 
                                strokeWidth={3}
                                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                                name="Novos Inscritos"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                  </Card>

                  <Card className="glass-effect">
                    <div className="p-6">
                      <h3 className="text-lg font-orbitron font-bold text-white mb-4 flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2 text-neon-purple" />
                        Performance de Campanhas
                      </h3>
                      {/* Container com dimensões ABSOLUTAS para evitar width(-1) height(-1) */}
                      <div style={{ width: '100%', height: '320px', minWidth: '300px', minHeight: '320px', position: 'relative' }}>
                        {campaignsHook.loading ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-purple"></div>
                            <span className="ml-2 text-gray-400">Carregando campanhas...</span>
                          </div>
                        ) : (
                          <div style={{ width: '100%', height: '320px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            {campaignsHook.campaigns && campaignsHook.campaigns.filter(campaign => campaign.status === 'sent' && campaign.recipient_count > 0).length > 0 ? (
                              <BarChart 
                                width={400}
                                height={300}
                                data={
                                  campaignsHook.campaigns
                                    .filter(campaign => campaign.status === 'sent' && campaign.recipient_count > 0)
                                    .slice(-7)
                                    .map(campaign => ({
                                      name: campaign.subject?.substring(0, 15) + '...' || 'Sem título',
                                      enviados: campaign.recipient_count || 0,
                                      abertos: campaign.opened_count || 0,
                                      cliques: campaign.clicked_count || 0
                                    }))
                                }
                              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                            >
                              <defs>
                                <linearGradient id="enviadosGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.9}/>
                                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.3}/>
                                </linearGradient>
                                <linearGradient id="abertosGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.9}/>
                                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.3}/>
                                </linearGradient>
                                <linearGradient id="cliquesGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.9}/>
                                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.3}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                              <XAxis 
                                dataKey="name" 
                                stroke="#9CA3AF" 
                                fontSize={10} 
                                fontWeight={500}
                                tick={{ fill: '#D1D5DB' }}
                              />
                              <YAxis 
                                stroke="#9CA3AF" 
                                fontSize={12} 
                                fontWeight={500}
                                tick={{ fill: '#D1D5DB' }}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'rgba(17, 24, 39, 0.95)', 
                                  border: '1px solid #6366F1',
                                  borderRadius: '12px',
                                  fontSize: '13px',
                                  fontWeight: '500',
                                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                                  backdropFilter: 'blur(10px)'
                                }}
                                labelStyle={{ color: '#F3F4F6', fontWeight: '600', marginBottom: '8px' }}
                                formatter={(value, name) => [
                                  <span style={{ color: name === 'Enviados' ? '#6366F1' : name === 'Abertos' ? '#10B981' : '#F59E0B' }}>
                                    {value?.toLocaleString() || 0}
                                  </span>, 
                                  name
                                ]}
                                cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                              />
                              <Bar 
                                dataKey="enviados" 
                                fill="url(#enviadosGradient)" 
                                name="Enviados" 
                                radius={[4, 4, 0, 0]}
                                animationDuration={1500}
                                animationEasing="ease-in-out"
                              />
                              <Bar 
                                dataKey="abertos" 
                                fill="url(#abertosGradient)" 
                                name="Abertos" 
                                radius={[4, 4, 0, 0]}
                                animationDuration={1500}
                                animationEasing="ease-in-out"
                              />
                              <Bar 
                                dataKey="cliques" 
                                fill="url(#cliquesGradient)" 
                                name="Cliques" 
                                radius={[4, 4, 0, 0]}
                                animationDuration={1500}
                                animationEasing="ease-in-out"
                              />
                            </BarChart>
                            ) : (
                              <div className="text-center text-gray-400">
                                <div className="mb-4">
                                  <svg className="w-16 h-16 mx-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                </div>
                                <p className="text-lg font-medium">Nenhuma campanha enviada</p>
                                <p className="text-sm">Campanhas aparecerão aqui após serem enviadas</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Engagement Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="glass-effect">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-orbitron font-bold text-white">Taxa de Abertura</h4>
                        <Eye className="w-6 h-6 text-lime-green" />
                      </div>
                      <div className="text-3xl font-orbitron font-bold text-lime-green mb-2">
                        {(() => {
                          const sentCampaigns = campaignsHook.campaigns.filter(c => c.status === 'sent' && c.recipient_count > 0);
                          if (sentCampaigns.length === 0) return 0;
                          
                          const totalOpened = sentCampaigns.reduce((acc, c) => acc + (c.opened_count || 0), 0);
                          const totalSent = sentCampaigns.reduce((acc, c) => acc + (c.recipient_count || 0), 0);
                          
                          return totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
                        })()}%
                      </div>
                      <p className="text-futuristic-gray text-sm">Média das últimas campanhas</p>
                      <div className="mt-4 bg-darker-surface/50 rounded-full h-2">
                        <div 
                          className="bg-lime-green h-2 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${(() => {
                              const sentCampaigns = campaignsHook.campaigns.filter(c => c.status === 'sent' && c.recipient_count > 0);
                              if (sentCampaigns.length === 0) return 0;
                              
                              const totalOpened = sentCampaigns.reduce((acc, c) => acc + (c.opened_count || 0), 0);
                              const totalSent = sentCampaigns.reduce((acc, c) => acc + (c.recipient_count || 0), 0);
                              
                              return Math.min(100, totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0);
                            })()}%` 
                          }}
                        />
                      </div>
                    </div>
                  </Card>

                  <Card className="glass-effect">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-orbitron font-bold text-white">Taxa de Clique</h4>
                        <MousePointer className="w-6 h-6 text-neon-purple" />
                      </div>
                      <div className="text-3xl font-orbitron font-bold text-neon-purple mb-2">
                        {(() => {
                          const sentCampaigns = campaignsHook.campaigns.filter(c => c.status === 'sent' && c.recipient_count > 0);
                          if (sentCampaigns.length === 0) return 0;
                          
                          const totalClicked = sentCampaigns.reduce((acc, c) => acc + (c.clicked_count || 0), 0);
                          const totalSent = sentCampaigns.reduce((acc, c) => acc + (c.recipient_count || 0), 0);
                          
                          return totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0;
                        })()}%
                      </div>
                      <p className="text-futuristic-gray text-sm">Média das últimas campanhas</p>
                      <div className="mt-4 bg-darker-surface/50 rounded-full h-2">
                        <div 
                          className="bg-neon-purple h-2 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${(() => {
                              const sentCampaigns = campaignsHook.campaigns.filter(c => c.status === 'sent' && c.recipient_count > 0);
                              if (sentCampaigns.length === 0) return 0;
                              
                              const totalClicked = sentCampaigns.reduce((acc, c) => acc + (c.clicked_count || 0), 0);
                              const totalSent = sentCampaigns.reduce((acc, c) => acc + (c.recipient_count || 0), 0);
                              
                              return Math.min(100, totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0);
                            })()}%` 
                          }}
                        />
                      </div>
                    </div>
                  </Card>

                  <Card className="glass-effect">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-orbitron font-bold text-white">Taxa de Rejeição</h4>
                        <AlertTriangle className="w-6 h-6 text-yellow-400" />
                      </div>
                      <div className="text-3xl font-orbitron font-bold text-yellow-400 mb-2">
                        {(() => {
                          const sentCampaigns = campaignsHook.campaigns.filter(c => c.status === 'sent' && c.recipient_count > 0);
                          if (sentCampaigns.length === 0) return 0;
                          
                          // Taxa de rejeição calculada como: (enviados - entregues) / enviados * 100
                          // Assumindo que bounced_count existe ou calculando como recipient_count - delivered_count
                          const totalSent = sentCampaigns.reduce((acc, c) => acc + (c.recipient_count || 0), 0);
                          const totalBounced = sentCampaigns.reduce((acc, c) => acc + (c.bounced_count || 0), 0);
                          
                          return totalSent > 0 ? Math.round((totalBounced / totalSent) * 100) : 0;
                        })()}%
                      </div>
                      <p className="text-futuristic-gray text-sm">Média das últimas campanhas</p>
                      <div className="mt-4 bg-darker-surface/50 rounded-full h-2">
                        <div 
                          className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${(() => {
                              const sentCampaigns = campaignsHook.campaigns.filter(c => c.status === 'sent' && c.recipient_count > 0);
                              if (sentCampaigns.length === 0) return 0;
                              
                              const totalSent = sentCampaigns.reduce((acc, c) => acc + (c.recipient_count || 0), 0);
                              const totalBounced = sentCampaigns.reduce((acc, c) => acc + (c.bounced_count || 0), 0);
                              
                              return Math.min(100, totalSent > 0 ? Math.round((totalBounced / totalSent) * 100) : 0);
                            })()}%` 
                          }}
                        />
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card className="glass-effect">
                  <div className="p-6">
                    <h4 className="text-lg font-orbitron font-bold text-white mb-4">Atividade Recente</h4>
                    <div className="space-y-3">
                      {newsletterHook.campaigns.slice(0, 3).map((campaign) => (
                        <div key={campaign.id} className="flex items-center justify-between p-3 bg-darker-surface/30 rounded-lg">
                          <div>
                            <p className="text-white font-medium">{campaign.subject}</p>
                            <p className="text-futuristic-gray text-sm">
                              {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="text-futuristic-gray">
                              {campaign.recipient_count || 0} enviados
                            </span>
                            <span className="text-lime-green">
                              {campaign.opened_count || 0} abertos
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {newsletterTab === 'subscribers' && (
              <div className="space-y-6">
                {/* Subscriber Filters */}
                <Card className="glass-effect">
                  <div className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-futuristic-gray w-4 h-4" />
                          <input
                            type="text"
                            placeholder="Buscar por email..."
                            value={subscriberSearchTerm}
                            onChange={(e) => setSubscriberSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple"
                          />
                        </div>
                      </div>
                      <select
                        value={subscriberStatusFilter}
                        onChange={(e) => setSubscriberStatusFilter(e.target.value as 'all' | 'active' | 'inactive' | 'unsubscribed')}
                        className="px-4 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white focus:outline-none focus:border-neon-purple"
                      >
                        <option value="all">Todos os Status</option>
                        <option value="active">Ativos</option>
                        <option value="inactive">Inativos</option>
                        <option value="unsubscribed">Cancelados</option>
                      </select>
                      <select
                        value={subscriberDateFilter}
                        onChange={(e) => setSubscriberDateFilter(e.target.value as 'all' | 'today' | 'week' | 'month' | 'custom')}
                        className="px-4 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white focus:outline-none focus:border-neon-purple"
                      >
                        <option value="all">Todas as Datas</option>
                        <option value="today">Hoje</option>
                        <option value="week">Esta Semana</option>
                        <option value="month">Este Mês</option>
                      </select>
                      <Button
                        onClick={() => subscribersHook.exportSubscribers()}
                        disabled={subscribersHook.loading}
                        variant="outline"
                        className="flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Exportar CSV</span>
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Subscribers List */}
                <Card className="glass-effect">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-orbitron font-bold text-white">
                        Lista de Inscritos ({subscribersHook.totalCount})
                      </h4>
                      
                      <div className="flex items-center space-x-2">
                        {/* Paginação */}
                        <Button
                          onClick={() => subscribersHook.fetchSubscribers({
                            search: subscriberSearchTerm,
                            status: subscriberStatusFilter !== 'all' ? subscriberStatusFilter : undefined,
                            dateRange: subscriberDateFilter !== 'all' ? subscriberDateFilter : undefined
                          }, Math.max(1, subscribersHook.currentPage - 1))}
                          disabled={subscribersHook.currentPage <= 1 || subscribersHook.loading}
                          variant="outline"
                          size="sm"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        
                        <span className="text-futuristic-gray text-sm">
                          Página {subscribersHook.currentPage} de {Math.ceil(subscribersHook.totalCount / 20)}
                        </span>
                        
                        <Button
                          onClick={() => subscribersHook.fetchSubscribers({
                            search: subscriberSearchTerm,
                            status: subscriberStatusFilter !== 'all' ? subscriberStatusFilter : undefined,
                            dateRange: subscriberDateFilter !== 'all' ? subscriberDateFilter : undefined
                          }, subscribersHook.currentPage + 1)}
                          disabled={subscribersHook.currentPage >= Math.ceil(subscribersHook.totalCount / 20) || subscribersHook.loading}
                          variant="outline"
                          size="sm"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          onClick={() => subscribersHook.fetchSubscribers()}
                          disabled={subscribersHook.loading}
                          variant="outline"
                          size="sm"
                        >
                          <Activity className="w-4 h-4 mr-2" />
                          Atualizar
                        </Button>
                      </div>
                    </div>
                    
                    {subscribersHook.loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-purple mx-auto mb-4"></div>
                        <p className="text-futuristic-gray">Carregando inscritos...</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {subscribersHook.subscribers.length > 0 ? subscribersHook.subscribers.map((subscriber) => (
                          <div key={subscriber.id} className="flex items-center justify-between p-4 bg-darker-surface/30 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium truncate">{subscriber.email}</p>
                              <p className="text-futuristic-gray text-sm">
                                Inscrito em: {new Date(subscriber.subscribed_at || subscriber.created_at).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                subscriber.status === 'active' 
                                  ? 'bg-lime-green/20 text-lime-green' 
                                  : 'bg-red-500/20 text-red-400'
                              }`}>
                                {subscriber.status === 'active' ? 'Ativo' : 'Cancelado'}
                              </span>
                              <div className="flex space-x-2">
                                <Button
                                  onClick={() => subscribersHook.updateSubscriberStatus(subscriber.id, 
                                    subscriber.status === 'active' ? 'unsubscribed' : 'active' 
                                  )}
                                  disabled={subscribersHook.loading}
                                  size="sm"
                                  variant="outline"
                                  className={subscriber.status === 'active' ? 'text-red-400 hover:text-red-300' : 'text-lime-green hover:text-lime-400'}
                                >
                                  {subscriber.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                </Button>
                                <Button
                                  onClick={() => subscribersHook.removeSubscriber(subscriber.id)}
                                  disabled={subscribersHook.loading}
                                  size="sm"
                                  variant="outline"
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div className="text-center py-8">
                            <Mail className="w-16 h-16 text-futuristic-gray mx-auto mb-4" />
                            <p className="text-futuristic-gray">Nenhum inscrito encontrado</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pagination - Removido temporariamente até implementar paginação no hook */}
                  </div>
                </Card>
              </div>
            )}

            {newsletterTab === 'campaigns' && (
              <div className="space-y-6">
                {/* Campaign Actions */}
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-orbitron font-bold text-white">
                    Campanhas de Email
                  </h4>
                  <Button
                    onClick={() => setShowCampaignEditor(true)}
                    className="bg-neon-gradient hover:bg-neon-gradient/80"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Nova Campanha
                  </Button>
                </div>
                
                <CampaignHistory
                  campaigns={campaignsHook.campaigns}
                  loading={campaignsHook.loading}
                  onRefresh={campaignsHook.fetchCampaigns}
                />
              </div>
            )}

            {newsletterTab === 'automations' && (
              <div className="space-y-6">
                <EmailAutomations />
              </div>
            )}

            {newsletterTab === 'templates' && (
              <div className="space-y-6">
                <EmailTemplates />
              </div>
            )}

            {newsletterTab === 'logs' && (
              <div className="space-y-6">
                <NewsletterLogs />
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-orbitron font-bold text-white">
                  Gerenciamento de Usuários
                </h3>
                <p className="text-futuristic-gray text-sm mt-1">
                  Total: {userStats.totalUsers} • Ativos: {userStats.activeUsers} • Novos este mês: {userStats.newUsersThisMonth}
                </p>
              </div>
              <Button
                onClick={refreshUsers}
                disabled={loadingUsers}
                className="bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/30"
              >
                <Activity className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>

            {/* User Filters */}
            <Card className="glass-effect">
              <div className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-futuristic-gray w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Buscar usuários..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple"
                      />
                    </div>
                  </div>
                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white focus:outline-none focus:border-neon-purple"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="active">Ativos</option>
                    <option value="inactive">Inativos</option>
                    <option value="banned">Banidos</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Users List */}
            <Card className="glass-effect">
              <div className="p-6">
                <div className="space-y-4">
                  {paginatedUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-darker-surface/30 rounded-lg">
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{user.name || 'Usuário'}</h4>
                        <p className="text-futuristic-gray text-sm">{user.email}</p>
                        <p className="text-futuristic-gray text-xs">
                          Cadastrado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </p>
                        {user.last_sign_in_at && (
                          <p className="text-futuristic-gray text-xs">
                            Último acesso: {new Date(user.last_sign_in_at).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.status === 'active' ? 'bg-lime-green/20 text-lime-green' :
                          user.status === 'inactive' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {user.status === 'active' ? 'Ativo' : 
                           user.status === 'inactive' ? 'Inativo' : 'Banido'}
                        </span>
                        {user.status !== 'active' && (
                          <Button
                            size="sm"
                            onClick={() => updateUserStatus(user.id, 'active')}
                            className="bg-lime-green/20 text-lime-green hover:bg-lime-green/30"
                            disabled={loadingUsers}
                          >
                            <UserCheck className="w-4 h-4" />
                          </Button>
                        )}
                        {user.status === 'active' && (
                          <Button
                            size="sm"
                            onClick={() => updateUserStatus(user.id, 'inactive')}
                            className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                            disabled={loadingUsers}
                          >
                            <UserX className="w-4 h-4" />
                          </Button>
                        )}
                        {user.status !== 'banned' && (
                          <Button
                            size="sm"
                            onClick={() => updateUserStatus(user.id, 'banned')}
                            className="bg-red-500/20 text-red-400 hover:bg-red-500/30"
                            disabled={loadingUsers}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Loading State */}
                {loadingUsers && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-purple mx-auto mb-4"></div>
                    <p className="text-futuristic-gray">Carregando usuários...</p>
                  </div>
                )}

                {/* Error State */}
                {usersError && (
                  <div className="text-center py-8">
                    <p className="text-red-400 mb-4">{usersError}</p>
                    <Button onClick={refreshUsers} className="bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/30">
                      Tentar Novamente
                    </Button>
                  </div>
                )}

                {/* Empty State */}
                {!loadingUsers && !usersError && paginatedUsers.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-futuristic-gray mx-auto mb-4" />
                    <p className="text-futuristic-gray">Nenhum usuário encontrado</p>
                  </div>
                )}

                {/* Pagination */}
                {totalUserPages > 1 && (
                  <div className="flex items-center justify-center space-x-2 mt-6">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentUserPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentUserPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-white">
                      Página {currentUserPage} de {totalUserPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentUserPage(prev => Math.min(prev + 1, totalUserPages))}
                      disabled={currentUserPage === totalUserPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            {/* Header com busca e filtros */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-orbitron font-bold text-white mb-2">
                  Gerenciamento de Categorias
                </h3>
                <p className="text-futuristic-gray text-sm">
                  Total: {categories.length} categorias • {categories.filter(c => articles.some(a => a.category_id === c.id)).length} com artigos
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                {/* Busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-futuristic-gray w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar categorias..."
                    value={categorySearchTerm}
                    onChange={(e) => setCategorySearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple w-full sm:w-64"
                  />
                </div>

                {/* Filtro */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white focus:outline-none focus:border-neon-purple"
                >
                  <option value="all">Todas</option>
                  <option value="with-articles">Com artigos</option>
                  <option value="without-articles">Sem artigos</option>
                </select>

                <Button
                  onClick={() => setShowNewCategoryModal(true)}
                  className="bg-neon-gradient hover:bg-neon-gradient/80 whitespace-nowrap"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Nova Categoria
                </Button>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="glass-effect">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-futuristic-gray text-sm">Total de Categorias</p>
                      <p className="text-2xl font-bold text-white">{categories.length}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-lime-green" />
                  </div>
                </div>
              </Card>

              <Card className="glass-effect">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-futuristic-gray text-sm">Com Artigos</p>
                      <p className="text-2xl font-bold text-white">
                        {categories.filter(c => articles.some(a => a.category_id === c.id)).length}
                      </p>
                    </div>
                    <FileText className="w-8 h-8 text-neon-purple" />
                  </div>
                </div>
              </Card>

              <Card className="glass-effect">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-futuristic-gray text-sm">Sem Artigos</p>
                      <p className="text-2xl font-bold text-white">
                        {categories.filter(c => !articles.some(a => a.category_id === c.id)).length}
                      </p>
                    </div>
                    <Brain className="w-8 h-8 text-yellow-400" />
                  </div>
                </div>
              </Card>

              <Card className="glass-effect">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-futuristic-gray text-sm">Mais Popular</p>
                      <p className="text-sm font-medium text-white truncate">
                        {categories.length > 0 
                          ? categories.reduce((prev, current) => {
                              const prevCount = articles.filter(a => a.category_id === prev.id).length;
                              const currentCount = articles.filter(a => a.category_id === current.id).length;
                              return currentCount > prevCount ? current : prev;
                            }).name
                          : 'N/A'
                        }
                      </p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-orange-400" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Lista de Categorias */}
            <Card className="glass-effect">
              <div className="p-6">
                {loadingArticles ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-green mx-auto mb-4"></div>
                    <p className="text-futuristic-gray">Carregando categorias...</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categories
                        .filter(category => {
                          const matchesSearch = category.name.toLowerCase().includes(categorySearchTerm.toLowerCase()) ||
                                              category.description?.toLowerCase().includes(categorySearchTerm.toLowerCase()) ||
                                              category.slug.toLowerCase().includes(categorySearchTerm.toLowerCase());
                          
                          const hasArticles = articles.some(a => a.category_id === category.id);
                          const matchesFilter = categoryFilter === 'all' ||
                                              (categoryFilter === 'with-articles' && hasArticles) ||
                                              (categoryFilter === 'without-articles' && !hasArticles);
                          
                          return matchesSearch && matchesFilter;
                        })
                        .map((category) => {
                          const articleCount = articles.filter(a => a.category_id === category.id).length;
                          
                          return (
                            <div key={category.id} className="p-4 bg-darker-surface/30 rounded-lg hover:bg-darker-surface/50 transition-colors border border-neon-purple/10 hover:border-neon-purple/30">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-white font-medium text-lg mb-1 truncate">{category.name}</h4>
                                  <div className="flex items-center space-x-2 mb-2">
                                    <span className="text-xs px-2 py-1 bg-neon-purple/20 text-neon-purple rounded-full">
                                      {category.slug}
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      articleCount > 0 
                                        ? 'bg-lime-green/20 text-lime-green' 
                                        : 'bg-yellow-400/20 text-yellow-400'
                                    }`}>
                                      {articleCount} artigo{articleCount !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="flex space-x-2 flex-shrink-0">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingCategory({
                                      ...category,
                                      description: category.description || ''
                                    })}
                                    className="text-yellow-400 hover:text-yellow-300 p-1 sm:p-2"
                                    title="Editar categoria"
                                  >
                                    <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => confirmDeleteCategory(category)}
                                    className="text-red-400 hover:text-red-300 p-1 sm:p-2"
                                    title="Excluir categoria"
                                  >
                                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </Button>
                                </div>
                              </div>
                              
                              <p className="text-futuristic-gray text-xs sm:text-sm mb-3 line-clamp-2">
                                {category.description || 'Sem descrição'}
                              </p>
                              
                              {articleCount > 0 && (
                                <div className="text-xs text-futuristic-gray">
                                  <span className="font-medium">Artigos recentes:</span>
                                  <div className="mt-1 space-y-1">
                                    {articles
                                      .filter(a => a.category_id === category.id)
                                      .slice(0, 2)
                                      .map(article => (
                                        <div key={article.id} className="truncate">
                                          • {article.title}
                                        </div>
                                      ))
                                    }
                                    {articleCount > 2 && (
                                      <div className="text-neon-purple">
                                        +{articleCount - 2} mais...
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>

                    {categories.filter(category => {
                      const matchesSearch = category.name.toLowerCase().includes(categorySearchTerm.toLowerCase()) ||
                                          category.description?.toLowerCase().includes(categorySearchTerm.toLowerCase()) ||
                                          category.slug.toLowerCase().includes(categorySearchTerm.toLowerCase());
                      
                      const hasArticles = articles.some(a => a.category_id === category.id);
                      const matchesFilter = categoryFilter === 'all' ||
                                          (categoryFilter === 'with-articles' && hasArticles) ||
                                          (categoryFilter === 'without-articles' && !hasArticles);
                      
                      return matchesSearch && matchesFilter;
                    }).length === 0 && (
                      <div className="text-center py-12">
                        <TrendingUp className="w-16 h-16 text-futuristic-gray mx-auto mb-4" />
                        <h4 className="text-white font-medium text-lg mb-2">
                          {categorySearchTerm || categoryFilter !== 'all' 
                            ? 'Nenhuma categoria encontrada' 
                            : 'Nenhuma categoria cadastrada'
                          }
                        </h4>
                        <p className="text-futuristic-gray text-sm mb-4">
                          {categorySearchTerm || categoryFilter !== 'all'
                            ? 'Tente ajustar os filtros de busca'
                            : 'Comece criando sua primeira categoria'
                          }
                        </p>
                        {(!categorySearchTerm && categoryFilter === 'all') && (
                          <Button
                            onClick={() => setShowNewCategoryModal(true)}
                            className="bg-neon-gradient hover:bg-neon-gradient/80"
                          >
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Criar Primeira Categoria
                          </Button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div>
            <FeedbackDashboard />
          </div>
        )}

        {/* SEO Tab */}
        {activeTab === 'seo' && (
          <div>
            <SEODashboard />
          </div>
        )}

        {/* Editor Tab */}
        {activeTab === 'editor' && (
          <div>
            <ArticleEditor 
              initialData={editingArticle}
              onSave={async (articleData) => {
                try {
                  // Encontrar categoria pelo slug
                  const selectedCategory = categories.find(cat => cat.slug === articleData.category);
                  
                  // Preparar dados para o Supabase (incluindo tags)
                  const supabaseArticle = {
                    title: articleData.title,
                    slug: articleData.title.toLowerCase()
                      .replace(/[^a-z0-9\s-]/g, '')
                      .replace(/\s+/g, '-')
                      .replace(/-+/g, '-')
                      .trim(),
                    excerpt: articleData.excerpt,
                    content: articleData.content,
                    image_url: articleData.featuredImage || '',
                    category_id: selectedCategory?.id || categories[0]?.id || '',
                    author_id: user?.id || '',
                    published: Boolean(articleData.published), // Garantir que seja boolean
                    tags: typeof articleData.tags === 'string' ? articleData.tags.split(',').map(t => t.trim()) : articleData.tags || [],
                    // views removido - coluna não existe na tabela
                    // reading_time removido - coluna não existe na tabela
                    // meta_title removido - coluna não existe na tabela
                    // meta_description removido - coluna não existe na tabela
                  };

                  console.log('📝 Dados do artigo para salvar:', supabaseArticle);

                  let success;
                  if (editingArticle) {
                    // Atualizar artigo existente
                    success = await updateArticle(editingArticle.id, supabaseArticle);
                    if (success) {
                      toast.success('Artigo atualizado com sucesso!');
                    }
                  } else {
                    // Criar novo artigo
                    success = await createArticle(supabaseArticle);
                    if (success) {
                      toast.success('Artigo criado com sucesso!');
                    }
                  }
                  
                  if (success) {
                    setEditingArticle(null);
                    setActiveTab('articles');
                    await refreshArticles();
                  } else {
                    toast.error('Erro ao salvar artigo. Tente novamente.');
                  }
                } catch (error) {
                  console.error('Erro ao salvar artigo:', error);
                  toast.error('Erro ao salvar artigo. Tente novamente.');
                }
              }}
              onCancel={() => {
                setEditingArticle(null);
                setActiveTab('articles');
              }}
            />
          </div>
        )}
      </div>

      {/* Campaign Editor */}
      <CampaignEditor
        isOpen={showCampaignEditor}
        onClose={() => setShowCampaignEditor(false)}
        templates={newsletterHook.templates}
        onSendCampaign={newsletterHook.sendCampaign}
        onSendTestEmail={newsletterHook.sendTestEmail}
        onCreateTemplate={newsletterHook.createTemplate}
        loading={newsletterHook.campaignLoading}
        subscribersCount={newsletterHook.stats.totalSubscribers}
      />

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteConfirmModal && categoryToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-darker-surface border border-red-500/20 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mr-4">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-orbitron font-bold text-white">Confirmar Exclusão</h3>
                <p className="text-futuristic-gray text-sm">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-white mb-2">
                Tem certeza que deseja excluir a categoria <strong>"{categoryToDelete.name}"</strong>?
              </p>
              <p className="text-futuristic-gray text-sm">
                Slug: {categoryToDelete.slug}
              </p>
              {articles.filter(a => a.category_id === categoryToDelete.id).length > 0 && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm font-medium">
                    ⚠️ Esta categoria possui {articles.filter(a => a.category_id === categoryToDelete.id).length} artigo(s) vinculado(s)
                  </p>
                  <p className="text-red-400 text-xs mt-1">
                    Não é possível excluir categorias com artigos vinculados
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setCategoryToDelete(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleDeleteCategory(categoryToDelete.id)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                disabled={articles.filter(a => a.category_id === categoryToDelete.id).length > 0}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Categoria */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-darker-surface border border-neon-purple/20 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-orbitron font-bold text-white mb-4">Editar Categoria</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-futuristic-gray text-sm mb-2">Nome *</label>
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple"
                  placeholder="Digite o nome da categoria"
                />
              </div>

              <div>
                <label className="block text-futuristic-gray text-sm mb-2">Descrição</label>
                <textarea
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple h-24 resize-none"
                  placeholder="Digite a descrição da categoria"
                />
              </div>

              <div>
                <label className="block text-futuristic-gray text-sm mb-2">Slug *</label>
                <input
                  type="text"
                  value={editingCategory.slug}
                  onChange={(e) => setEditingCategory(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple"
                  placeholder="slug-da-categoria"
                />
              </div>

              <div className="p-3 bg-neon-purple/10 border border-neon-purple/20 rounded-lg">
                <p className="text-neon-purple text-sm font-medium mb-1">Informações da categoria:</p>
                <p className="text-futuristic-gray text-xs">
                  • {articles.filter(a => a.category_id === editingCategory.id).length} artigo(s) vinculado(s)
                </p>
                <p className="text-futuristic-gray text-xs">
                  • Criada em: {new Date(editingCategory.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                onClick={() => setEditingCategory(null)}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleEditCategory({
                  name: editingCategory.name,
                  description: editingCategory.description || '',
                  slug: editingCategory.slug
                })}
                className="flex-1 bg-neon-gradient hover:bg-neon-gradient/80"
                disabled={!editingCategory.name.trim() || !editingCategory.slug.trim()}
              >
                Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Categoria */}
      {showNewCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-darker-surface border border-neon-purple/20 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-orbitron font-bold text-white mb-4">Nova Categoria</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-futuristic-gray text-sm mb-2">Nome *</label>
                <input
                  type="text"
                  value={newCategoryData.name}
                  onChange={(e) => setNewCategoryData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple"
                  placeholder="Digite o nome da categoria"
                />
              </div>

              <div>
                <label className="block text-futuristic-gray text-sm mb-2">Descrição</label>
                <textarea
                  value={newCategoryData.description}
                  onChange={(e) => setNewCategoryData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple h-24 resize-none"
                  placeholder="Digite a descrição da categoria"
                />
              </div>

              <div>
                <label className="block text-futuristic-gray text-sm mb-2">Slug</label>
                <input
                  type="text"
                  value={newCategoryData.slug}
                  onChange={(e) => setNewCategoryData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple"
                  placeholder="Deixe vazio para gerar automaticamente"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                onClick={() => setShowNewCategoryModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateCategory}
                className="flex-1 bg-neon-gradient hover:bg-neon-gradient/80"
              >
                Criar Categoria
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default Admin;