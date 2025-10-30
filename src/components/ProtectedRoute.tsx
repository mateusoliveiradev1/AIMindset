import React, { useRef, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SecureStorage, ClientRateLimit } from '../utils/securityHeaders';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const hasLoggedRef = useRef(false);
  const [securityCheck, setSecurityCheck] = useState(true);
  const [realTimeAuthCheck, setRealTimeAuthCheck] = useState(true);
  const sessionTimeoutRef = useRef<NodeJS.Timeout>();

  // 🔥 VERIFICAÇÃO DE AUTENTICAÇÃO EM TEMPO REAL - USANDO APENAS AUTHCONTEXT
  useEffect(() => {
    const checkRealTimeAuth = () => {
      try {
        // Usar apenas o estado do AuthContext para evitar múltiplas instâncias do Supabase
        if (isAuthenticated && user) {
          setRealTimeAuthCheck(true);
          console.log('✅ Verificação de autenticação em tempo real passou via AuthContext');
        } else {
          console.warn('🚫 Usuário não autenticado via AuthContext');
          setRealTimeAuthCheck(false);
        }
      } catch (error) {
        console.error('❌ Erro na verificação de autenticação em tempo real:', error);
        setRealTimeAuthCheck(false);
      }
    };

    // 🔥 VERIFICAÇÕES DE SEGURANÇA APRIMORADAS
    const performSecurityChecks = () => {
      try {
        // Check for suspicious activity
        const rateLimiter = ClientRateLimit.getInstance('admin_access', 10, 300000); // 10 attempts per 5 minutes
        
        if (!rateLimiter.isAllowed()) {
          console.warn('🚫 Too many admin access attempts. Access temporarily blocked.');
          setSecurityCheck(false);
          return;
        }

        // Validate session integrity
        const lastActivity = SecureStorage.getItem('last_admin_activity');
        const now = Date.now();
        
        if (lastActivity) {
          const timeSinceLastActivity = now - parseInt(lastActivity);
          const maxInactivity = 30 * 60 * 1000; // 30 minutes
          
          if (timeSinceLastActivity > maxInactivity) {
            console.warn('⏰ Session expired due to inactivity');
            SecureStorage.removeItem('last_admin_activity');
            setSecurityCheck(false);
            return;
          }
        }

        // Update last activity
        SecureStorage.setItem('last_admin_activity', now.toString());
        setSecurityCheck(true);
        console.log('✅ Security checks passed');
      } catch (error) {
        console.error('❌ Error in security checks:', error);
        setSecurityCheck(false);
      }
    };

    if (isAuthenticated && user) {
      checkRealTimeAuth();
      performSecurityChecks();
      
      // Verificar autenticação a cada 30 segundos
      const interval = setInterval(checkRealTimeAuth, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  // 🔥 VERIFICAÇÃO ESPECÍFICA PARA SUPER ADMIN
  const isSuperAdmin = user && user.role === 'super_admin';

  // Log de debug apenas uma vez
  useEffect(() => {
    if (!hasLoggedRef.current && !isLoading) {
      console.log('🔐 ProtectedRoute - Estado atual:', {
        isAuthenticated,
        isLoading,
        userRole: user?.role,
        isSuperAdmin,
        securityCheck,
        userEmail: user?.email
      });
      hasLoggedRef.current = true;
    }
  }, [isAuthenticated, isLoading, user, isSuperAdmin, securityCheck]);

  // 🔥 TIMEOUT DE SESSÃO AUTOMÁTICO
  useEffect(() => {
    if (isAuthenticated && user) {
      // Clear existing timeout
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }

      // Set new timeout for 2 hours
      sessionTimeoutRef.current = setTimeout(() => {
        console.warn('⏰ Session timeout - logging out user');
        // Force logout after 2 hours
        window.location.href = '/admin/login';
      }, 2 * 60 * 60 * 1000); // 2 hours

      return () => {
        if (sessionTimeoutRef.current) {
          clearTimeout(sessionTimeoutRef.current);
        }
      };
    }
  }, [isAuthenticated, user]);

  // 🔥 LOADING STATE
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-surface flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-green mx-auto mb-4"></div>
          <p className="text-futuristic-gray">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // 🔥 VERIFICAÇÃO DE SEGURANÇA FALHADA
  if (!securityCheck) {
    console.warn('🚫 Security check failed - redirecting to home');
    return <Navigate to="/" replace />;
  }

  // 🔥 VERIFICAÇÃO DE AUTENTICAÇÃO EM TEMPO REAL FALHADA
  if (!realTimeAuthCheck) {
    console.warn('🚫 Real-time auth check failed - redirecting to login');
    return <Navigate to="/admin/login" replace />;
  }

  // 🔥 NÃO AUTENTICADO
  if (!isAuthenticated) {
    console.warn('🚫 User not authenticated - redirecting to login');
    return <Navigate to="/admin/login" replace />;
  }

  // 🔥 NÃO É SUPER ADMIN
  if (!isSuperAdmin) {
    console.warn('🚫 User is not super admin - redirecting to home', {
      userRole: user?.role,
      userEmail: user?.email
    });
    return <Navigate to="/" replace />;
  }

  // 🔥 ACESSO AUTORIZADO
  console.log('✅ Access granted to super admin:', user?.email);
  return <>{children}</>;
};

export default ProtectedRoute;