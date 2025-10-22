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
  const sessionTimeoutRef = useRef<NodeJS.Timeout>();

  // Enhanced security checks
  useEffect(() => {
    const performSecurityChecks = () => {
      // Check for suspicious activity
      const rateLimiter = ClientRateLimit.getInstance('admin_access', 10, 300000); // 10 attempts per 5 minutes
      
      if (!rateLimiter.isAllowed()) {
        console.warn('Too many admin access attempts. Access temporarily blocked.');
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
          console.warn('Session expired due to inactivity');
          SecureStorage.removeItem('last_admin_activity');
          setSecurityCheck(false);
          return;
        }
      }

      // Update last activity
      SecureStorage.setItem('last_admin_activity', now.toString());
      setSecurityCheck(true);
    };

    if (isAuthenticated && user) {
      performSecurityChecks();
      
      // Set up session timeout
      const resetTimeout = () => {
        if (sessionTimeoutRef.current) {
          clearTimeout(sessionTimeoutRef.current);
        }
        
        sessionTimeoutRef.current = setTimeout(() => {
          console.warn('Admin session timed out');
          setSecurityCheck(false);
        }, 30 * 60 * 1000); // 30 minutes
      };

      resetTimeout();

      // Reset timeout on user activity
      const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      const resetTimeoutHandler = () => {
        SecureStorage.setItem('last_admin_activity', Date.now().toString());
        resetTimeout();
      };

      activityEvents.forEach(event => {
        document.addEventListener(event, resetTimeoutHandler, true);
      });

      return () => {
        if (sessionTimeoutRef.current) {
          clearTimeout(sessionTimeoutRef.current);
        }
        activityEvents.forEach(event => {
          document.removeEventListener(event, resetTimeoutHandler, true);
        });
      };
    }
  }, [isAuthenticated, user]);

  // Log apenas uma vez para evitar spam no console
  useEffect(() => {
    if (!hasLoggedRef.current) {
      console.log('ProtectedRoute - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);
      hasLoggedRef.current = true;
    }
  }, [isAuthenticated, isLoading]);

  // Reset log flag quando o estado muda
  useEffect(() => {
    hasLoggedRef.current = false;
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary-dark flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-neon-purple/30 border-t-neon-purple rounded-full animate-spin"></div>
          <p className="text-futuristic-gray font-roboto">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Enhanced security checks
  if (!securityCheck) {
    console.warn('Security check failed. Redirecting to login.');
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // Additional role-based security check
  if (user && !['admin', 'super_admin'].includes(user.role)) {
    console.warn('Insufficient privileges for admin access');
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;