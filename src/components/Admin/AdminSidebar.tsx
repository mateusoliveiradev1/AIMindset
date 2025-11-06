import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  FileText, 
  PlusCircle, 
  Mail, 
  Users, 
  TrendingUp, 
  MessageSquare, 
  Search, 
  Shield, 
  Database,
  Activity,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Settings,
  Bell,
  LogOut,
  Brain
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Bloquear scroll do fundo quando sidebar mobile estiver aberta
  useEffect(() => {
    const htmlEl = document.documentElement;
    if (isMobile && mobileOpen) {
      htmlEl.style.overflow = 'hidden';
      htmlEl.style.height = '100%';
      htmlEl.style.overscrollBehavior = 'contain';
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100%';
      document.body.style.overscrollBehavior = 'contain';
    } else {
      htmlEl.style.overflow = '';
      htmlEl.style.height = '';
      htmlEl.style.overscrollBehavior = '';
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.body.style.overscrollBehavior = '';
    }
    return () => {
      htmlEl.style.overflow = '';
      htmlEl.style.height = '';
      htmlEl.style.overscrollBehavior = '';
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.body.style.overscrollBehavior = '';
    };
  }, [isMobile, mobileOpen]);
  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/admin', 
      icon: BarChart3,
      gradient: 'from-neon-purple to-neon-purple-light'
    },
    { 
      name: 'Artigos', 
      href: '/admin/articles', 
      icon: FileText,
      gradient: 'from-lime-green to-lime-green-light'
    },
    { 
      name: 'Novo Artigo', 
      href: '/admin/editor', 
      icon: PlusCircle,
      gradient: 'from-neon-pink to-neon-pink-light'
    },
    { 
      name: 'Newsletter', 
      href: '/admin/newsletter', 
      icon: Mail,
      gradient: 'from-neon-blue to-neon-blue-light'
    },
    { 
      name: 'Usuários', 
      href: '/admin/users', 
      icon: Users,
      gradient: 'from-neon-orange to-neon-orange-light'
    },
    { 
      name: 'Categorias', 
      href: '/admin/categories', 
      icon: TrendingUp,
      gradient: 'from-neon-cyan to-neon-cyan-light'
    },
    { 
      name: 'Feedback', 
      href: '/admin/feedback', 
      icon: MessageSquare,
      gradient: 'from-neon-yellow to-neon-yellow-light'
    },
    { 
      name: 'SEO', 
      href: '/admin/seo', 
      icon: Search,
      gradient: 'from-neon-indigo to-neon-indigo-light'
    },
    { 
      name: 'Performance', 
      href: '/admin/performance', 
      icon: Activity,
      gradient: 'from-lime-green to-lime-green-light'
    },
    { 
      name: 'Logs', 
      href: '/admin/logs', 
      icon: Activity,
      gradient: 'from-neon-red to-neon-red-light'
    },
    { 
      name: 'Backup', 
      href: '/admin/backup', 
      icon: Database,
      gradient: 'from-neon-emerald to-neon-emerald-light'
    },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const handleMobileToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Renderizar item de navegação
  const NavItem = ({ item, isCollapsed }: { item: typeof navigation[0], isCollapsed: boolean }) => {
    const active = isActive(item.href);
    
    return (
      <Link
        to={item.href}
        className={`
          relative group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300
          ${active 
            ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg shadow-${item.gradient.split(' ')[0].split('-')[1]}/25` 
            : 'text-futuristic-gray hover:text-white hover:bg-white/5'
          }
          ${isCollapsed ? 'justify-center' : 'justify-start'}
          border border-transparent hover:border-white/20
          transform hover:scale-[1.02] hover:translate-x-1
        `}
        onClick={() => isMobile && setMobileOpen(false)}
      >
        {/* Indicador lateral ativo */}
        {active && (
          <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b ${item.gradient} rounded-r-full transition-all duration-300`} />
        )}
        
        {/* Ícone */}
        <item.icon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'} transition-all duration-300 ${active ? 'text-white' : ''}`} />
        
        {/* Texto */}
        {!isCollapsed && (
          <span className="transition-all duration-300 truncate">
            {item.name}
          </span>
        )}
        
        {/* Tooltip para modo colapsado */}
        {isCollapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-dark-surface text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            {item.name}
          </div>
        )}
      </Link>
    );
  };

  // Sidebar para desktop
  const DesktopSidebar = () => (
    <div className={`
      fixed left-0 top-16 h-[calc(100vh-4rem)] z-40 transition-all duration-300 ease-in-out
      ${collapsed ? 'w-16' : 'w-64'}
      bg-gradient-to-b from-primary-dark/90 via-dark-surface/90 to-darker-surface/90
      backdrop-blur-xl border-r border-white/10
      shadow-2xl shadow-black/30
      ${isMobile && !mobileOpen ? '-translate-x-full' : ''}
    `}>
      {/* Botão de colapso - escondido em mobile */}
      {!isMobile && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-6 w-6 h-6 bg-gradient-to-r from-neon-purple to-neon-pink rounded-full flex items-center justify-center text-white hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-neon-purple/50 z-10"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      )}

      {/* Botão de fechar - visível apenas em mobile quando aberto */}
      {isMobile && mobileOpen && (
        <button
          onClick={handleMobileToggle}
          className="absolute -right-3 top-6 w-6 h-6 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center text-white hover:scale-110 transition-all duration-300 shadow-lg z-10"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      {/* Conteúdo da sidebar */}
      <div className="h-full flex flex-col">
        {/* Navegação */}
        <nav className="flex-1 px-3 py-6 space-y-2">
          {navigation.map((item) => (
            <NavItem key={item.name} item={item} isCollapsed={collapsed} />
          ))}
        </nav>

        {/* Rodapé com informações do usuário */}
        {!collapsed && (
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-gradient-to-r from-neon-purple to-neon-pink rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {user?.email?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">
                  {user?.email || 'Admin'}
                </p>
                <p className="text-futuristic-gray text-xs">
                  {user?.role || 'super_admin'}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-3 py-2 text-xs text-futuristic-gray hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-300 border border-white/10 hover:border-white/20"
            >
              <LogOut className="w-3 h-3 mr-2" />
              Sair
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Sidebar para mobile - Full screen overlay
  const MobileSidebar = () => (
    <div className={`fixed inset-0 z-40 transition-all duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleMobileToggle} />
      <div className="relative w-full h-full bg-gradient-to-b from-primary-dark/95 via-dark-surface/95 to-darker-surface/95 backdrop-blur-xl">
        {/* Header da sidebar mobile */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-neon-purple to-lime-green rounded-full flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white font-orbitron font-bold text-lg">AIMindset</h2>
              <p className="text-futuristic-gray text-sm">Admin Panel</p>
            </div>
          </div>
          <button
            onClick={handleMobileToggle}
            aria-label="Fechar menu"
            className="p-3 text-futuristic-gray hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
          >
            <X className="w-7 h-7" />
          </button>
        </div>

        {/* Conteúdo da navegação */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center space-x-4 px-4 py-4 text-base font-medium rounded-xl transition-all duration-300
                ${isActive(item.href) 
                  ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg` 
                  : 'text-futuristic-gray hover:text-white hover:bg-white/5'
                }
                border border-transparent hover:border-white/20
              `}
              onClick={() => setMobileOpen(false)}
            >
              <item.icon className="w-6 h-6" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Footer com informações do usuário */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-neon-purple to-lime-green rounded-full flex items-center justify-center text-white font-bold">
              {user?.email ? getInitials(user.email) : 'AD'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {user?.email?.split('@')[0] || 'Admin'}
              </p>
              <p className="text-futuristic-gray text-xs">
                {user?.role === 'super_admin' ? 'Super Admin' : 'Administrador'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-300"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Overlay para mobile */}
      {isMobile && mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={handleMobileToggle}
        />
      )}
      {isMobile ? <MobileSidebar /> : <DesktopSidebar />}
      
      {/* Botão mobile menu */}
      {isMobile && (
        <button
          onClick={handleMobileToggle}
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={mobileOpen}
          className={`fixed bottom-6 right-6 ${mobileOpen ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-neon-purple to-neon-pink'} w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl shadow-neon-purple/50 hover:scale-110 transition-all duration-300 z-50`}
        >
          {mobileOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>
      )}

      {/* Removido botão fixo superior para evitar duplicidade */}
+      {/* Removido botão fixo superior para evitar duplicidade */}
    </>
  );
};

export default AdminSidebar;