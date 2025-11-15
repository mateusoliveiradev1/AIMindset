import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { useAuth } from '../contexts/AuthContext';

/**
 * Página de callback para autenticação OAuth (Google, GitHub, etc.)
 * Captura o código de autenticação da URL e completa o login
 */
const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth(); // Pegar o usuário do contexto
  const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = React.useState('Processando autenticação...');

  // Monitorar mudanças no usuário do contexto
  useEffect(() => {
    if (user && status === 'success') {
      console.log('👤 Usuário do contexto atualizado:', user);
      console.log('📧 Email:', user.email);
      console.log('🔑 Role:', user.role);
      
      // Se for admin, pode redirecionar para admin (mas ProtectedRoute vai proteger)
      if (user.email === 'warface01031999@gmail.com') {
        console.log('👑 Admin detectado! Você pode acessar /admin');
      }
    }
  }, [user, status]);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('📡 AuthCallback: Processando callback...');
        console.log('📍 URL atual:', window.location.href);
        console.log('🔍 Hash/Search:', location.hash, location.search);

        // Verificar se há erro na URL
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        if (error) {
          console.error('❌ Erro no callback:', error, errorDescription);
          setStatus('error');
          setMessage(`Erro de autenticação: ${errorDescription || error}`);
          return;
        }

        // Verificar se há código de autorização na URL
        const code = urlParams.get('code');
        if (!code) {
          console.log('🔍 Buscando sessão existente...');
          // Se não há código, verificar se já há uma sessão ativa
          const { data, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('❌ Erro ao obter sessão:', sessionError);
            setStatus('error');
            setMessage('Erro ao verificar sessão. Tente novamente.');
            return;
          }

          if (data?.session) {
            console.log('✅ Sessão existente encontrada!');
            console.log('👤 Usuário:', data.session.user?.email);
            
            setStatus('success');
            setMessage('Login realizado com sucesso! Redirecionando...');
            
            setTimeout(() => {
              console.log('🎯 Redirecionando para página inicial...');
              navigate('/');
            }, 1500);
          } else {
            console.warn('⚠️ Nenhuma sessão encontrada');
            setStatus('error');
            setMessage('Não foi possível completar o login. Por favor, tente novamente.');
          }
          return;
        }

        console.log('🔑 Código de autorização encontrado:', code);
        
        // O Supabase já processou o código automaticamente
        // Aguardar um momento para o processamento e verificar a sessão
        setTimeout(async () => {
          console.log('⏳ Aguardando processamento do código...');
          const { data, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('❌ Erro ao obter sessão após código:', sessionError);
            setStatus('error');
            setMessage('Erro ao completar login. Tente novamente.');
            return;
          }

          if (data?.session) {
            console.log('✅ Login completado com sucesso!');
            console.log('👤 Usuário:', data.session.user?.email);
            console.log('📝 Nome:', data.session.user?.user_metadata?.full_name);
            
            // Salvar sessão no localStorage para persistência
            try {
              localStorage.setItem('aimindset_session', JSON.stringify(data.session));
              console.log('💾 Sessão salva no localStorage');
            } catch (e) {
              console.warn('⚠️ Não foi possível salvar sessão no localStorage:', e);
            }
            
            // Login bem-sucedido - redirecionar para home
            console.log('✅ Login realizado com sucesso!');
            setStatus('success');
            setMessage('Login realizado com sucesso! Redirecionando...');
            
            setTimeout(() => {
              console.log('🎯 Redirecionando para página inicial...');
              navigate('/');
            }, 1500);
          } else {
            console.warn('⚠️ Sessão não estabelecida após código');
            setStatus('error');
            setMessage('Não foi possível completar o login. Por favor, tente novamente.');
          }
        }, 1000);
        
      } catch (error) {
        console.error('💥 Erro crítico no callback:', error);
        setStatus('error');
        setMessage('Erro ao processar autenticação. Por favor, tente novamente.');
      }
    };

    // Processar callback imediatamente
    handleAuthCallback();
  }, [navigate, location]);

  const handleRetry = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-dark-surface flex items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-green mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-white mb-2">Processando Login</h2>
            <p className="text-futuristic-gray">{message}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-lime-green rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-dark-bg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Sucesso!</h2>
            <p className="text-futuristic-gray">{message}</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Erro de Autenticação</h2>
            <p className="text-futuristic-gray mb-4">{message}</p>
            <Button onClick={handleRetry} variant="secondary" className="w-full">
              Voltar para Home
            </Button>
          </>
        )}
      </Card>
    </div>
  );
};

export default AuthCallback;