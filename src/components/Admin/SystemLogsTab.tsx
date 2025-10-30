import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Search, Filter, RefreshCw, Server, Shield, Zap, Clock, Eye, TrendingUp, Activity } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface SystemLog {
  id: string;
  type: string;
  message: string;
  context: any;
  created_at: string;
}

interface SystemStats {
  totalLogs: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  last24Hours: number;
}

export const SystemLogsTab: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'error' | 'warning' | 'info' | 'security' | 'performance'>('all');
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const logsPerPage = 50;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_system_logs_stats');
      
      if (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return;
      }

      setStats(data || {
        totalLogs: 0,
        errorCount: 0,
        warningCount: 0,
        infoCount: 0,
        last24Hours: 0
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  const fetchLogs = async (page = 1, showToast = false) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('system_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * logsPerPage, page * logsPerPage - 1);

      // Aplicar filtros
      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      if (searchTerm) {
        query = query.or(`message.ilike.%${searchTerm}%,type.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Erro ao buscar logs:', error);
        if (showToast) {
          toast.error('Erro ao carregar logs do sistema');
        }
        return;
      }

      setLogs(data || []);
      setTotalPages(Math.ceil((count || 0) / logsPerPage));
      setCurrentPage(page);
      
      if (showToast) {
        toast.success('Logs atualizados com sucesso');
      }
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      if (showToast) {
        toast.error('Erro ao carregar logs do sistema');
      }
    } finally {
      setLoading(false);
    }
  };

  // Configurar auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchLogs(currentPage, false);
        fetchStats();
      }, 5000); // Atualizar a cada 5 segundos
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, currentPage, typeFilter, searchTerm]);

  useEffect(() => {
    fetchStats();
    fetchLogs(1);
  }, [typeFilter, searchTerm]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'security': return <Shield className="w-4 h-4 text-purple-400" />;
      case 'performance': return <TrendingUp className="w-4 h-4 text-blue-400" />;
      case 'info': 
      default: return <Server className="w-4 h-4 text-lime-green" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'warning': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'security': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'performance': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'info': 
      default: return 'text-lime-green bg-lime-green/10 border-lime-green/20';
    }
  };

  const formatJsonData = (data: any) => {
    if (!data) return 'N/A';
    return JSON.stringify(data, null, 2);
  };

  const testSystemLog = async () => {
    try {
      // Testar função logSystem
      if (typeof window !== 'undefined' && (window as any).logSystem) {
        await (window as any).logSystem('info', 'Teste do sistema de logs executado pelo administrador', {
          timestamp: new Date().toISOString(),
          source: 'admin_panel',
          test: true
        });
        toast.success('Log de teste criado com sucesso!');
        setTimeout(() => fetchLogs(1), 1000); // Recarregar após 1 segundo
      } else {
        toast.error('Função logSystem não está disponível');
      }
    } catch (error) {
      console.error('Erro ao criar log de teste:', error);
      toast.error('Erro ao criar log de teste');
    }
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="glass-effect p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-futuristic-gray text-xs">Total de Logs</p>
                <p className="text-xl font-orbitron font-bold text-white">
                  {stats.totalLogs.toLocaleString()}
                </p>
              </div>
              <Server className="w-6 h-6 text-neon-purple" />
            </div>
          </Card>

          <Card className="glass-effect p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-futuristic-gray text-xs">Erros</p>
                <p className="text-xl font-orbitron font-bold text-red-400">
                  {stats.errorCount.toLocaleString()}
                </p>
              </div>
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
          </Card>

          <Card className="glass-effect p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-futuristic-gray text-xs">Avisos</p>
                <p className="text-xl font-orbitron font-bold text-yellow-400">
                  {stats.warningCount.toLocaleString()}
                </p>
              </div>
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            </div>
          </Card>

          <Card className="glass-effect p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-futuristic-gray text-xs">Info</p>
                <p className="text-xl font-orbitron font-bold text-lime-green">
                  {stats.infoCount.toLocaleString()}
                </p>
              </div>
              <Server className="w-6 h-6 text-lime-green" />
            </div>
          </Card>

          <Card className="glass-effect p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-futuristic-gray text-xs">Últimas 24h</p>
                <p className="text-xl font-orbitron font-bold text-blue-400">
                  {stats.last24Hours.toLocaleString()}
                </p>
              </div>
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
          </Card>
        </div>
      )}

      {/* Filtros e Controles */}
      <Card className="glass-effect p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Busca */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-futuristic-gray w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por mensagem ou tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple"
              />
            </div>

            {/* Filtro por Tipo */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-4 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white focus:outline-none focus:border-neon-purple"
            >
              <option value="all">Todos os Tipos</option>
              <option value="info">Info</option>
              <option value="warning">Aviso</option>
              <option value="error">Erro</option>
              <option value="security">Segurança</option>
              <option value="performance">Performance</option>
            </select>
          </div>

          {/* Botões de Ação */}
          <div className="flex space-x-2">
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              className={autoRefresh ? "bg-green-600 hover:bg-green-700" : ""}
            >
              <Activity className="w-4 h-4 mr-2" />
              {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
            </Button>
            <Button
              onClick={testSystemLog}
              variant="outline"
              size="sm"
            >
              <Zap className="w-4 h-4 mr-2" />
              Testar Log
            </Button>
            <Button
              onClick={() => fetchLogs(currentPage, true)}
              disabled={loading}
              className="bg-neon-gradient hover:bg-neon-gradient/80 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Atualizar
            </Button>
          </div>
        </div>
      </Card>

      {/* Lista de Logs */}
      <Card className="glass-effect">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-orbitron font-bold text-white flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-neon-purple" />
              Logs do Sistema
              {autoRefresh && (
                <div className="ml-3 flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="ml-1 text-xs text-green-400">Auto-atualizando</span>
                </div>
              )}
            </h3>
            <span className="text-futuristic-gray text-sm">
              {logs.length} registros
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-purple"></div>
              <span className="ml-3 text-futuristic-gray">Carregando logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-futuristic-gray mx-auto mb-4" />
              <p className="text-futuristic-gray">Nenhum log encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 bg-darker-surface/30 border border-neon-purple/10 rounded-lg hover:border-neon-purple/30 transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(log.type)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(log.type)}`}>
                          {log.type.toUpperCase()}
                        </span>
                      </div>
                      
                      <span className="text-white font-medium flex-1 truncate">
                        {log.message}
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-futuristic-gray">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                      </div>
                      <Eye className="w-4 h-4 text-neon-purple" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-neon-purple/10">
              <span className="text-futuristic-gray text-sm">
                Página {currentPage} de {totalPages}
              </span>
              <div className="flex space-x-2">
                <Button
                  onClick={() => fetchLogs(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  variant="outline"
                  size="sm"
                >
                  Anterior
                </Button>
                <Button
                  onClick={() => fetchLogs(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  variant="outline"
                  size="sm"
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Modal de Detalhes do Log */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-darker-surface border border-neon-purple/20 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-neon-purple/10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-orbitron font-bold text-white flex items-center">
                  <AlertTriangle className="w-6 h-6 mr-2 text-neon-purple" />
                  Detalhes do Log do Sistema
                </h3>
                <Button
                  onClick={() => setSelectedLog(null)}
                  variant="outline"
                  size="sm"
                >
                  Fechar
                </Button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-futuristic-gray text-sm mb-1">Tipo</label>
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(selectedLog.type)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(selectedLog.type)}`}>
                        {selectedLog.type.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-futuristic-gray text-sm mb-1">Mensagem</label>
                    <p className="text-white">{selectedLog.message}</p>
                  </div>
                  
                  <div>
                    <label className="block text-futuristic-gray text-sm mb-1">Data/Hora</label>
                    <span className="text-white">{new Date(selectedLog.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-futuristic-gray text-sm mb-2">Contexto</label>
                    <pre className="bg-darker-surface/50 border border-neon-purple/20 rounded-lg p-3 text-xs text-white overflow-x-auto">
                      {formatJsonData(selectedLog.context)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};