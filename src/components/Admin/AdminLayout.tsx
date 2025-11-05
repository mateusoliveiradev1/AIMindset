import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  FileText, 
  PlusCircle, 
  Mail, 
  Users, 
  TrendingUp, 
  MessageSquare, 
  Search, 
  Monitor, 
  Shield,
  Activity,
  LogOut,
  Home
} from 'lucide-react';
import { Button } from '@/components/UI/Button';
import { Card } from '@/components/UI/Card';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path: string;
}

const sidebarItems: SidebarItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/admin' },
  { id: 'articles', label: 'Artigos', icon: FileText, path: '/admin/articles' },
  { id: 'editor', label: 'Novo Artigo', icon: PlusCircle, path: '/admin/editor' },
  { id: 'newsletter', label: 'Newsletter', icon: Mail, path: '/admin/newsletter' },
  { id: 'users', label: 'Usuários', icon: Users, path: '/admin/users' },
  { id: 'categories', label: 'Categorias', icon: TrendingUp, path: '/admin/categories' },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare, path: '/admin/feedback' },
  { id: 'seo', label: 'SEO', icon: Search, path: '/admin/seo' },
  { id: 'logs', label: 'Logs & Monitoramento', icon: Monitor, path: '/admin/logs' },
  { id: 'backup', label: 'Backup', icon: Shield, path: '/admin/backup' },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar aba ativa baseada na URL
  useEffect(() => {
    const path = location.pathname;
    const currentItem = sidebarItems.find(item => item.path === path);
    setActiveTab(currentItem?.id || 'dashboard');
  }, [location]);

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleNavigation = useCallback((path: string) => {
    navigate(path);
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [navigate, isMobile]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('isAdmin');
    window.location.href = '/login';
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-darker-bg via-dark-bg to-darker-bg">
      {/* Header com navegação por abas - Visual idêntico ao original */}
      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h2 className="text-2xl sm:text-3xl font-orbitron font-bold gradient-text mb-1 sm:mb-2">
            Painel Administrativo
          </h2>
          <p className="text-futuristic-gray text-sm sm:text-base">
            Gerencie o conteúdo do seu blog AIMindset
          </p>
        </div>

        {/* Navigation Tabs - Mesmo visual do Admin.tsx original */}
        <div className="flex space-x-1 mb-4 sm:mb-6 lg:mb-8 bg-darker-surface/50 p-1 rounded-lg backdrop-blur-sm overflow-x-auto scrollbar-hide">
          {sidebarItems.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleNavigation(tab.path)}
                className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 rounded-md font-montserrat font-medium transition-all duration-300 whitespace-nowrap min-w-0 ${
                  activeTab === tab.id
                    ? 'bg-neon-gradient text-white shadow-lg'
                    : 'text-futuristic-gray hover:text-white hover:bg-dark-surface/50'
                }`}
              >
                <Icon className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                <span className="text-xs sm:text-sm lg:text-base truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Botões de ação rápida - Mesmo visual do original */}
        <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 lg:mb-8">
          <Button
            onClick={handleGoHome}
            variant="outline"
            className="bg-dark-surface/50 border-neon-purple/30 text-futuristic-gray hover:text-white hover:bg-dark-surface/70 px-3 sm:px-4 py-2 text-xs sm:text-sm"
          >
            <Home className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Home
          </Button>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="bg-dark-surface/50 border-red-500/30 text-futuristic-gray hover:text-white hover:bg-red-500/20 px-3 sm:px-4 py-2 text-xs sm:text-sm"
          >
            <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Sair
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="admin-content">
        <div className="container mx-auto px-4 pb-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}