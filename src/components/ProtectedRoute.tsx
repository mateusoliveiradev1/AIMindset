import React, { useRef, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const hasLoggedRef = useRef(false);

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

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;