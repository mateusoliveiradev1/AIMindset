import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle, RefreshCw, Bell, BellOff, Filter } from 'lucide-react';
import { performanceAlertService, PerformanceAlert } from '@/services/PerformanceAlertService';
import { Button } from '@/components/UI/Button';
import { Card } from '@/components/UI/Card';

interface PerformanceAlertsProps {
  className?: string;
}

export const PerformanceAlerts: React.FC<PerformanceAlertsProps> = ({ className = '' }) => {
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unacknowledged' | 'critical' | 'warning' | 'info'>('unacknowledged');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const allAlerts = await performanceAlertService.getUnacknowledgedAlerts(50);
      setAlerts(allAlerts);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const success = await performanceAlertService.acknowledgeAlert(alertId);
      if (success) {
        setAlerts(alerts.filter(alert => alert.id !== alertId));
      }
    } catch (error) {
      console.error('Erro ao reconhecer alerta:', error);
    }
  };

  const acknowledgeAll = async () => {
    try {
      const promises = alerts.map(alert => 
        alert.id ? performanceAlertService.acknowledgeAlert(alert.id) : Promise.resolve(false)
      );
      await Promise.all(promises);
      setAlerts([]);
    } catch (error) {
      console.error('Erro ao reconhecer todos os alertas:', error);
    }
  };

  const getFilteredAlerts = () => {
    if (filter === 'all') return alerts;
    if (filter === 'unacknowledged') return alerts.filter(alert => !alert.acknowledged);
    return alerts.filter(alert => alert.severity === filter);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      default: return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'performance_degradation': return 'Degradação de Performance';
      case 'threshold_exceeded': return 'Limite Excedido';
      case 'cache_miss_spike': return 'Pico de Cache Miss';
      case 'query_slowdown': return 'Query Lenta';
      case 'memory_leak': return 'Vazamento de Memória';
      default: return type;
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchAlerts, 30000); // Atualizar a cada 30 segundos
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const filteredAlerts = getFilteredAlerts();

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Alertas de Performance</h2>
          <p className="text-gray-600 mt-1">
            Monitore e gerencie alertas automáticos de performance
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              autoRefresh 
                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            {autoRefresh ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            <span>{autoRefresh ? 'Auto ON' : 'Auto OFF'}</span>
          </button>
          <button
            onClick={fetchAlerts}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
            </div>
            <Bell className="w-8 h-8 text-gray-400" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Críticos</p>
              <p className="text-2xl font-bold text-red-600">{alerts.filter(a => a.severity === 'critical').length}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avisos</p>
              <p className="text-2xl font-bold text-yellow-600">{alerts.filter(a => a.severity === 'warning').length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Info</p>
              <p className="text-2xl font-bold text-blue-600">{alerts.filter(a => a.severity === 'info').length}</p>
            </div>
            <Info className="w-8 h-8 text-blue-400" />
          </div>
        </Card>
      </div>

      {/* Filtros e Ações */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="unacknowledged">Não Reconhecidos</option>
            <option value="all">Todos</option>
            <option value="critical">Críticos</option>
            <option value="warning">Avisos</option>
            <option value="info">Info</option>
          </select>
        </div>
        
        {filteredAlerts.length > 0 && (
          <Button
            onClick={acknowledgeAll}
            variant="outline"
            className="text-sm"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Reconhecer Todos
          </Button>
        )}
      </div>

      {/* Lista de Alertas */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <Card className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'unacknowledged' ? 'Nenhum alerta pendente' : 'Nenhum alerta encontrado'}
            </h3>
            <p className="text-gray-600">
              {filter === 'unacknowledged' 
                ? 'Ótimo! Não há alertas de performance pendentes no momento.'
                : 'Nenhum alerta corresponde ao filtro selecionado.'
              }
            </p>
          </Card>
        ) : (
          filteredAlerts.map((alert) => (
            <Card key={alert.id} className={`p-4 border-l-4 ${getSeverityColor(alert.severity)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-600">
                        {getTypeLabel(alert.type)}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        alert.severity === 'critical' 
                          ? 'bg-red-100 text-red-800'
                          : alert.severity === 'warning'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {alert.severity.toUpperCase()}
                      </span>
                    </div>
                    
                    <p className="text-gray-900 mb-2">{alert.message}</p>
                    
                    {alert.context && (
                      <div className="bg-white rounded-lg p-3 text-sm text-gray-600 space-y-1">
                        {Object.entries(alert.context).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="font-medium capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <span className="font-mono">
                              {typeof value === 'number' ? value.toFixed(2) : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {alert.created_at && (
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(alert.created_at).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
                
                <Button
                  onClick={() => alert.id && acknowledgeAlert(alert.id)}
                  variant="ghost"
                  size="sm"
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <CheckCircle className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Rodapé com última atualização */}
      <div className="text-center text-sm text-gray-500">
        Última atualização: {lastUpdate.toLocaleString('pt-BR')}
      </div>
    </div>
  );
};

export default PerformanceAlerts;