import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Brain, Settings, LogOut, Bell, Menu, X, ChevronDown, Activity, FileText, Mail, Users, Search, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface AdminHeaderProps {
  onMenuToggle?: () => void;
  sidebarOpen?: boolean;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuToggle, sidebarOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  // Navegação rápida do admin
  const quickActions = [
    { name: 'Dashboard', href: '/admin', icon: Activity },
    { name: 'Artigos', href: '/admin/articles', icon: FileText },
    { name: 'Newsletter', href: '/admin/newsletter', icon: Mail },
    { name: 'Usuários', href: '/admin/users', icon: Users },
    { name: 'SEO', href: '/admin/seo', icon: Search },
    { name: 'Logs', href: '/admin/logs', icon: Shield },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Buscar notificações não lidas
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_notifications')
          .select('*')
          .eq('read', false)
          .order('created_at', { ascending: false })
          .limit(5);

        if (!error && data) {
          setNotifications(data);
          setHasUnreadNotifications(data.length > 0);
        }
      } catch (error) {
        console.error('Erro ao buscar notificações:', error);
      }
    };

    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary-dark/90 via-dark-surface/90 to-darker-surface/90 backdrop-blur-xl border-b border-gradient-to-r from-neon-purple/30 via-lime-green/30 to-neon-purple/30 shadow-2xl">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[1fr,auto,1fr] items-center h-16 gap-x-6 md:gap-x-8">
          {/* Logo e Menu Toggle */}
          <div className="flex items-center space-x-3 sm:space-x-4 justify-self-start">
            {/* Removido: botão de menu hambúrguer no header para evitar duplicidade em telas pequenas */}
            <Link to="/admin" className="flex items-center space-x-2 sm:space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-neon-purple to-lime-green rounded-full blur-md opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-white relative z-10 group-hover:animate-pulse-neon transition-all duration-300" />
              </div>
              <div className="flex flex-col hidden sm:flex">
                <span className="font-orbitron font-bold text-lg sm:text-xl bg-gradient-to-r from-neon-purple via-white to-lime-green bg-clip-text text-transparent">
                  AIMindset
                </span>
                <span className="text-xs text-futuristic-gray font-montserrat">
                  Admin Panel
                </span>
              </div>
              <div className="flex flex-col sm:hidden">
                <span className="font-orbitron font-bold text-lg bg-gradient-to-r from-neon-purple via-white to-lime-green bg-clip-text text-transparent">
                  AIMindset
                </span>
              </div>
            </Link>
          </div>

          {/* Navegação Rápida */}
          <nav className="hidden md:flex items-center justify-center gap-4 md:gap-6 justify-self-center">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.name}
                  to={action.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 group relative overflow-hidden ${
                    isActive(action.href)
                      ? 'bg-gradient-to-r from-neon-purple/20 to-lime-green/20 text-white border border-neon-purple/30 shadow-lg shadow-neon-purple/20'
                      : 'text-futuristic-gray hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r from-neon-purple/0 to-lime-green/0 group-hover:from-neon-purple/10 group-hover:to-lime-green/10 transition-all duration-300`}></div>
                  <Icon className={`w-4 h-4 relative z-10 ${isActive(action.href) ? 'text-lime-green' : 'group-hover:text-lime-green'}`} />
                  <span className="text-xs lg:text-sm font-medium relative z-10">{action.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Ações do Usuário */}
          <div className="flex items-center space-x-3 md:space-x-4 justify-self-end pl-2 md:pl-4">
            {/* Notificações */}
            <div className="relative">
              <button className="p-3 sm:p-2 text-futuristic-gray hover:text-lime-green transition-all duration-300 hover:bg-lime-green/10 rounded-lg relative min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0">
                <Bell className="w-5 h-5" />
                {hasUnreadNotifications && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse"></div>
                )}
                {/* Removido indicador de notificação para evitar bolinhas visuais */}
              </button>
            </div>

            {/* Menu do Usuário */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 sm:space-x-3 p-2 rounded-lg hover:bg-white/5 transition-all duration-300 group min-h-[44px]"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-neon-purple to-lime-green rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  {user?.email ? getInitials(user.email) : 'AD'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-white group-hover:text-lime-green transition-colors">
                    {user?.email?.split('@')[0] || 'Admin'}
                  </div>
                  <div className="text-xs text-futuristic-gray">
                    {user?.role === 'super_admin' ? 'Super Admin' : 'Administrador'}
                  </div>
                </div>
                <ChevronDown className={`hidden sm:block w-4 h-4 text-futuristic-gray transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-gradient-to-br from-darker-surface to-dark-surface border border-white/10 rounded-xl shadow-2xl backdrop-blur-md z-50">
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-neon-purple to-lime-green rounded-full flex items-center justify-center text-white font-bold">
                        {user?.email ? getInitials(user.email) : 'AD'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white truncate">
                          {user?.email || 'Administrador'}
                        </div>
                        <div className="text-xs text-futuristic-gray">
                          {user?.role === 'super_admin' ? 'Super Admin' : 'Administrador'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-2">
                    <Link
                      to="/admin"
                      className="flex items-center space-x-3 w-full px-3 py-2 text-left text-sm text-futuristic-gray hover:text-white hover:bg-white/5 rounded-lg transition-all duration-300"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Configurações</span>
                    </Link>
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 w-full px-3 py-2 text-left text-sm text-futuristic-gray hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-300 mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sair</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;