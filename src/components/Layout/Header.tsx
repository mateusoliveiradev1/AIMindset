import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Search, User, LogOut, Settings, Brain } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../UI/Button';
import AdvancedSearch from '../AdvancedSearch';
import { useMobileUsability } from '../../hooks/useMobileUsability';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isTouchDevice, addTouchFeedback, addSwipeSupport } = useMobileUsability();

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

  // Adiciona funcionalidades mobile ao header
  useEffect(() => {
    if (!headerRef.current || !isTouchDevice) return;

    // Adiciona suporte a swipe para fechar menu mobile
    const cleanup = addSwipeSupport(headerRef.current, (direction) => {
      if (direction === 'up' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    });

    return cleanup;
  }, [addSwipeSupport, isTouchDevice, isMenuOpen]);

  // Adiciona feedback touch aos botões
  useEffect(() => {
    if (!isTouchDevice) return;

    const buttons = headerRef.current?.querySelectorAll('button, a[role="button"]');
    const cleanupFunctions: (() => void)[] = [];

    buttons?.forEach((button) => {
      const cleanup = addTouchFeedback(button as HTMLElement);
      if (cleanup) cleanupFunctions.push(cleanup);
    });

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [addTouchFeedback, isTouchDevice, isMenuOpen, isSearchOpen]);

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

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header 
      ref={headerRef}
      className="fixed top-0 left-0 right-0 z-50 bg-primary-dark/95 backdrop-blur-md border-b border-neon-purple/20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 group touch-target mobile-link"
          >
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
                className={`font-montserrat font-medium transition-all duration-300 relative group touch-target mobile-link ${
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

          {/* Search & Mobile Menu */}
          <div className="flex items-center space-x-4 interactive-spacing">
            {/* Search - Only show on allowed pages */}
            {shouldShowSearch && (
              <div className="relative">
                {!isSearchOpen ? (
                  <button 
                    onClick={handleSearchToggle}
                    className="p-2 text-futuristic-gray hover:text-lime-green transition-colors duration-300 hover-lift touch-target touch-feedback action-button"
                    aria-label="Abrir busca"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                ) : (
                  <form onSubmit={handleSearchSubmit} className="flex items-center mobile-form">
                    <div className="relative">
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar artigos..."
                        className="w-32 sm:w-40 md:w-48 lg:w-64 px-4 py-2 pl-10 bg-dark-surface/95 backdrop-blur-md border border-neon-purple/30 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-lime-green transition-all duration-300 mobile-form-field prevent-zoom"
                        autoComplete="search"
                        inputMode="search"
                      />
                      <button
                        type="button"
                        onClick={handleAdvancedSearchOpen}
                        className="ml-2 px-3 py-2 text-xs bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/30 rounded-lg transition-colors duration-300 touch-target touch-feedback"
                      >
                        Avançada
                      </button>
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-futuristic-gray" />
                    </div>
                    <button
                      type="button"
                      onClick={handleSearchToggle}
                      className="ml-2 p-2 text-futuristic-gray hover:text-lime-green transition-colors duration-300 touch-target touch-feedback"
                      aria-label="Fechar busca"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </form>
                )}
              </div>
            )}
            
            {/* Mobile menu button */}
            <button
              onClick={handleMenuToggle}
              className="md:hidden p-2 text-futuristic-gray hover:text-lime-green transition-colors duration-300 touch-target touch-feedback action-button mobile-menu-button"
              aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={isMenuOpen}
            >
              <div className={`hamburger-icon ${isMenuOpen ? 'open' : ''}`}>
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div 
            ref={mobileMenuRef}
            className="md:hidden mobile-nav swipe-container"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 bg-dark-surface/95 backdrop-blur-md rounded-lg mt-2 border border-neon-purple/20 interactive-spacing">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md font-montserrat font-medium transition-all duration-300 mobile-nav-item touch-feedback ${
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