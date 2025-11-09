import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import { useToast } from '../hooks/useToast';
import { useSEO } from '../hooks/useSEO';
import SEOManager from '../components/SEO/SEOManager';
import { sanitizeEmail, validators, RateLimiter, CSRFProtection, secureCleanup } from '../utils/security';
import { logAuth, logError } from '../lib/logging';
import { supabase } from '../lib/supabase';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rateLimitError, setRateLimitError] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // Hook para SEO
  const { getMetadata } = useSEO({
    pageType: 'admin',
    breadcrumbs: [
      { name: 'Home', url: '/', position: 1 },
      { name: 'Admin Login', url: '/admin/login', position: 2 }
    ]
  });

  // REMOVIDO COMPLETAMENTE O useEffect PROBLEMÁTICO QUE CAUSAVA LOOP INFINITO

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRateLimitError('');

    // Verificar rate limiting para tentativas de login
    if (!RateLimiter.canPerformAction('admin_login', 5, 900000)) { // 5 tentativas por 15 minutos
      const remainingTime = Math.ceil(RateLimiter.getRemainingTime('admin_login', 900000) / 1000 / 60);
      setRateLimitError(`Muitas tentativas de login. Tente novamente em ${remainingTime} minutos.`);
      return;
    }

    // Validar campos
    if (!validators.required(email) || !validators.required(password)) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    if (!validators.email(email)) {
      setError('Email inválido');
      return;
    }

    // Sanitizar email
    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail) {
      setError('Email inválido');
      return;
    }

    try {
      console.log('🚀 INICIANDO LOGIN COM:', sanitizedEmail);
      
      // Log da tentativa de login
      await logAuth('admin_login_attempt', undefined, true, {
        email: sanitizedEmail,
        user_agent: navigator.userAgent
      });
      
      const success = await login(sanitizedEmail, password);
      
      if (success) {
        console.log('✅ LOGIN REALIZADO COM SUCESSO!');
        showToast('success', 'Login realizado com sucesso!');
        
        // Log de sucesso
        await logAuth('admin_login_success', undefined, true, {
          email: sanitizedEmail
        });

        // 🔒 Persistir sessão explicitamente para garantir JWT disponível
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const session = sessionData?.session || null;
          if (session) {
            const json = JSON.stringify(session);
            localStorage.setItem('aimindset.auth.token', json);
            // Também persistir na chave aimindset_session para fallback do RPC
            try {
              localStorage.setItem('aimindset_session', json);
            } catch (e) {
              try {
                sessionStorage.setItem('aimindset_session', json);
              } catch {}
            }
            console.log('🔑 [AdminLogin] Sessão salva manualmente no localStorage.');
          } else {
            console.warn('⚠️ [AdminLogin] Nenhuma sessão retornada após login.');
          }
        } catch (sessErr) {
          console.warn('⚠️ [AdminLogin] Falha ao obter sessão para persistência:', sessErr);
        }
        
        // Limpar dados sensíveis do formulário
        secureCleanup.clearFormData(e.target as HTMLFormElement);
        
        // Redirecionamento imediato e forçado
        console.log('🔄 REDIRECIONANDO PARA /admin...');
        window.location.href = '/admin';
        
      } else {
        console.log('❌ LOGIN FALHOU - CREDENCIAIS INVÁLIDAS');
        setError('Credenciais inválidas ou usuário não é administrador');
        showToast('error', 'Credenciais inválidas');
        
        // Log de falha
        await logAuth('admin_login_failure', undefined, false, {
          email: sanitizedEmail,
          reason: 'invalid_credentials'
        });
        
        // Limpar senha em caso de erro
        setPassword('');
      }
    } catch (error: any) {
      // Este catch não deveria ser executado mais, mas mantemos para segurança
      console.error('💥 ERRO INESPERADO NO LOGIN:', error);
      setError('Erro interno do sistema. Tente novamente.');
      showToast('error', 'Erro interno do sistema');
      
      // Log de erro
      await logError(error, 'AdminLogin', 'admin_login_error', {
        email: sanitizedEmail
      });
      
      // Limpar senha em caso de erro
      setPassword('');
    }
  };

  return (
    <>
      <SEOManager metadata={getMetadata()} />
      <div className="min-h-screen bg-gradient-to-br from-primary-dark via-dark-surface to-darker-surface flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-darker-surface/90 backdrop-blur-sm border border-neon-purple/20">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-neon-gradient rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-orbitron font-bold gradient-text">
              Admin Portal
            </h1>
            <p className="text-futuristic-gray text-sm">
              Acesse o painel administrativo
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {rateLimitError && (
              <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-500 text-sm font-medium text-center">
                  {rateLimitError}
                </p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-500 text-sm font-medium text-center">
                  {error}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-surface/50 border border-neon-purple/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-purple focus:border-transparent transition-all duration-200 text-white placeholder-futuristic-gray"
                  placeholder="admin@exemplo.com"
                  maxLength={255}
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-surface/50 border border-neon-purple/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-purple focus:border-transparent transition-all duration-200 text-white placeholder-futuristic-gray"
                  placeholder="••••••••"
                  maxLength={128}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <div className="bg-primary-dark/50 p-4 rounded-lg border border-lime-green/20">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-lime-green mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div>
                  <p className="text-sm text-white font-medium mb-1">
                    Acesso Seguro
                  </p>
                  <p className="text-xs text-futuristic-gray">
                    Suas credenciais são protegidas com criptografia de ponta e rate limiting.
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-neon-gradient hover:bg-neon-gradient-hover text-white font-orbitron font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verificando...</span>
                </div>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center pt-4">
            <p className="text-xs text-futuristic-gray">
              © 2024 AIMindset. Acesso restrito a administradores.
            </p>
          </div>
        </div>
      </Card>
    </div>
    </>
  );
};

export default AdminLogin;