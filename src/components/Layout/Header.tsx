import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Search, User, LogOut, Settings, Brain } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../UI/Button';
import AdvancedSearch from '../AdvancedSearch';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'IA & Tecnologia', href: '/categoria/ia-tecnologia' },
    { name: 'Produtividade', href: '/categoria/produtividade' },
    { name: 'Futuro', href: '/categoria/futuro' },
    { name: 'Newsletter', href: '/newsletter' },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Páginas onde o botão de busca não deve aparecer
  const hiddenSearchPages = ['/admin', '/admin-login', '/about', '/contact', '/privacy'];
  const shouldShowSearch = !hiddenSearchPages.some(page => location.pathname.startsWith(page));

  // Focar no input quando a busca é aberta
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Fechar busca com ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setSearchQuery('');
      }
    };

    if (isSearchOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isSearchOpen]);

  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) {
      setSearchQuery('');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsAdvancedSearchOpen(true);
      setIsSearchOpen(false);
    }
  };

  const handleAdvancedSearchOpen = () => {
    setIsAdvancedSearchOpen(true);
    setIsSearchOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary-dark/95 backdrop-blur-md border-b border-neon-purple/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <Brain className="h-8 w-8 text-lime-green group-hover:animate-pulse-neon transition-all duration-300" />
              <div className="absolute inset-0 bg-lime-green/20 rounded-full blur-md group-hover:blur-lg transition-all duration-300"></div>
            </div>
            <span className="font-orbitron font-bold text-xl gradient-text">
              AIMindset
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`font-montserrat font-medium transition-all duration-300 relative group ${
                  isActive(item.href)
                    ? 'text-lime-green'
                    : 'text-futuristic-gray hover:text-lime-green'
                }`}
              >
                {item.name}
                <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-lime-green transition-all duration-300 group-hover:w-full ${
                  isActive(item.href) ? 'w-full' : ''
                }`}></span>
              </Link>
            ))}
          </nav>

          {/* Search and User Actions */}
          <div className="flex items-center space-x-4">
            {/* Search Button */}
            {shouldShowSearch && (
              <button
                onClick={handleSearchToggle}
                className="p-2 text-futuristic-gray hover:text-lime-green transition-colors duration-300"
                aria-label="Buscar"
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            {/* User Menu */}
            {user ? (
              <div className="flex items-center space-x-2">
                {user.role === 'super_admin' && (
                  <Link
                    to="/admin"
                    className="p-2 text-futuristic-gray hover:text-neon-purple transition-colors duration-300"
                    aria-label="Admin"
                  >
                    <Settings className="w-5 h-5" />
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="p-2 text-futuristic-gray hover:text-red-400 transition-colors duration-300"
                  aria-label="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/admin-login"
                className="p-2 text-futuristic-gray hover:text-lime-green transition-colors duration-300"
                aria-label="Login"
              >
                <User className="w-5 h-5" />
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-futuristic-gray hover:text-lime-green transition-colors duration-300"
              aria-label="Menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-dark-surface/95 backdrop-blur-md rounded-lg mt-2 border border-neon-purple/20">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md font-montserrat font-medium transition-all duration-300 ${
                    isActive(item.href)
                      ? 'text-lime-green bg-lime-green/10'
                      : 'text-futuristic-gray hover:text-lime-green hover:bg-lime-green/5'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Search Overlay */}
        {isSearchOpen && (
          <div className="absolute top-full left-0 right-0 bg-dark-bg/95 backdrop-blur-sm border-b border-neon-purple/20 p-4">
            <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-futuristic-gray w-5 h-5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar artigos..."
                  className="w-full pl-10 pr-4 py-3 bg-dark-surface/50 border border-neon-purple/30 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-lime-green focus:ring-1 focus:ring-lime-green transition-colors"
                />
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Advanced Search Modal */}
      <AdvancedSearch
        isOpen={isAdvancedSearchOpen}
        onClose={() => setIsAdvancedSearchOpen(false)}
        initialQuery={searchQuery}
      />
    </header>
  );
};

export default Header;