import React, { useState, useEffect } from 'react';
import { Activity, AlertCircle, CheckCircle, Clock, Database } from 'lucide-react';
import { requestQueue } from '../utils/requestQueue';

interface RequestStats {
  queueLength: number;
  activeRequests: number;
  cacheSize: number;
  processing: boolean;
}

export const RequestMonitor: React.FC = () => {
  const [stats, setStats] = useState<RequestStats>({
    queueLength: 0,
    activeRequests: 0,
    cacheSize: 0,
    processing: false
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      const currentStats = requestQueue.getStats();
      setStats(currentStats);
    };

    // Atualizar stats a cada segundo
    const interval = setInterval(updateStats, 1000);
    updateStats(); // Primeira atualização imediata

    return () => clearInterval(interval);
  }, []);

  // Mostrar monitor apenas se houver atividade
  useEffect(() => {
    const hasActivity = stats.queueLength > 0 || stats.activeRequests > 0 || stats.processing;
    setIsVisible(hasActivity);
  }, [stats]);

  if (!isVisible) return null;

  const getStatusColor = () => {
    if (stats.activeRequests > 5) return 'text-red-400 bg-red-500/20 border-red-500/30';
    if (stats.activeRequests > 2) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    return 'text-green-400 bg-green-500/20 border-green-500/30';
  };

  const getStatusIcon = () => {
    if (stats.activeRequests > 5) return <AlertCircle className="h-4 w-4" />;
    if (stats.processing) return <Clock className="h-4 w-4 animate-spin" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`rounded-lg border p-3 backdrop-blur-sm ${getStatusColor()}`}>
        <div className="flex items-center space-x-2 mb-2">
          {getStatusIcon()}
          <span className="text-sm font-medium">Sistema de Requisições</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>Fila: {stats.queueLength}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Activity className="h-3 w-3" />
            <span>Ativas: {stats.activeRequests}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Database className="h-3 w-3" />
            <span>Cache: {stats.cacheSize}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${stats.processing ? 'bg-current animate-pulse' : 'bg-gray-500'}`} />
            <span>{stats.processing ? 'Processando' : 'Idle'}</span>
          </div>
        </div>

        {stats.activeRequests > 3 && (
          <div className="mt-2 text-xs opacity-75">
            ⚠️ Muitas requisições simultâneas
          </div>
        )}
      </div>
    </div>
  );
};