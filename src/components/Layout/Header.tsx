import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Search, User, LogOut, Settings, Brain } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../UI/Button';
import AdvancedSearch from '../AdvancedSearch';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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
      navigate(`/artigos?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
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
    <header className="sticky top-0 z-50 bg-dark-bg/95 backdrop-blur-sm border-b border-neon-purple/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <Brain className="w-8 h-8 text-lime-green group-hover:text-neon-purple transition-colors duration-300" />
              <div className="absolute inset-0 bg-lime-green/20 rounded-full blur-md group-hover:bg-neon-purple/20 transition-colors duration-300"></div>
            </div>
            <span className="text-xl font-orbitron font-bold text-white group-hover:text-lime-green transition-colors duration-300">
              AI Mindset
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors duration-300 ${
                isActive('/') ? 'text-lime-green' : 'text-futuristic-gray hover:text-white'
              }`}
            >
              Home
            </Link>
            <Link
              to="/artigos"
              className={`text-sm font-medium transition-colors duration-300 ${
                isActive('/artigos') ? 'text-lime-green' : 'text-futuristic-gray hover:text-white'
              }`}
            >
              Artigos
            </Link>
            <Link
              to="/sobre"
              className={`text-sm font-medium transition-colors duration-300 ${
                isActive('/sobre') ? 'text-lime-green' : 'text-futuristic-gray hover:text-white'
              }`}
            >
              Sobre
            </Link>
            <Link
              to="/contato"
              className={`text-sm font-medium transition-colors duration-300 ${
                isActive('/contato') ? 'text-lime-green' : 'text-futuristic-gray hover:text-white'
              }`}
            >
              Contato
            </Link>
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

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-neon-purple/20">
            <nav className="flex flex-col space-y-4">
              <Link
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className={`text-sm font-medium transition-colors duration-300 ${
                  isActive('/') ? 'text-lime-green' : 'text-futuristic-gray hover:text-white'
                }`}
              >
                Home
              </Link>
              <Link
                to="/artigos"
                onClick={() => setIsMenuOpen(false)}
                className={`text-sm font-medium transition-colors duration-300 ${
                  isActive('/artigos') ? 'text-lime-green' : 'text-futuristic-gray hover:text-white'
                }`}
              >
                Artigos
              </Link>
              <Link
                to="/sobre"
                onClick={() => setIsMenuOpen(false)}
                className={`text-sm font-medium transition-colors duration-300 ${
                  isActive('/sobre') ? 'text-lime-green' : 'text-futuristic-gray hover:text-white'
                }`}
              >
                Sobre
              </Link>
              <Link
                to="/contato"
                onClick={() => setIsMenuOpen(false)}
                className={`text-sm font-medium transition-colors duration-300 ${
                  isActive('/contato') ? 'text-lime-green' : 'text-futuristic-gray hover:text-white'
                }`}
              >
                Contato
              </Link>
            </nav>
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
    </header>
  );
};

export default Header;