import React, { useState, useEffect, useRef } from 'react';
import { Activity, Search, Filter, RefreshCw, User, AlertCircle, Info, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import DateFilters, { DateRange } from '../UI/DateFilters';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface AppLog {
  id: string;
  level: string;
  source: string;
  action: string;
  details: any;
  user_id: string | null;
  created_at: string;
}

export const AppLogsTab: React.FC = () => {
  const [logs, setLogs] = useState<AppLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'info' | 'warning' | 'error' | 'success'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'user' | 'system' | 'api' | 'ui'>('all');
  const [selectedLog, setSelectedLog] = useState<AppLog | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const logsPerPage = 50;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLogs = async (page = 1, showToast = false) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('app_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * logsPerPage, page * logsPerPage - 1);

      // Aplicar filtros
      if (levelFilter !== 'all') {
        query = query.eq('level', levelFilter);
      }
      
      if (sourceFilter !== 'all') {
        query = query.eq('source', sourceFilter);
      }

      if (searchTerm) {
        query = query.or(`action.ilike.%${searchTerm}%,source.ilike.%${searchTerm}%,user_id.ilike.%${searchTerm}%`);
      }

      // Aplicar filtro de data
      if (dateRange) {
        query = query.gte('created_at', dateRange.startDate.toISOString())
                    .lte('created_at', dateRange.endDate.toISOString());
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Erro ao buscar logs:', error);
        if (showToast) {
          toast.error('Erro ao carregar logs da aplicação');
        }
        return;
      }

      setLogs(data || []);
      setTotalPages(Math.ceil((count || 0) / logsPerPage));
      setCurrentPage(page);
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      toast.error('Erro ao carregar logs da aplicação');
    } finally {
      setLoading(false);
    }
  };

  // Configurar auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchLogs(currentPage, false);
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
  }, [autoRefresh, currentPage, levelFilter, sourceFilter, searchTerm, dateRange]);

  useEffect(() => {
    fetchLogs(1);
  }, [levelFilter, sourceFilter, searchTerm, dateRange]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-lime-green" />;
      case 'info': 
      default: return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'warning': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'success': return 'text-lime-green bg-lime-green/10 border-lime-green/20';
      case 'info': 
      default: return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'user': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'system': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'api': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
      case 'ui': return 'text-pink-400 bg-pink-400/10 border-pink-400/20';
      default: return 'text-futuristic-gray bg-futuristic-gray/10 border-futuristic-gray/20';
    }
  };

  const formatJsonData = (data: any) => {
    if (!data) return 'N/A';
    return JSON.stringify(data, null, 2);
  };

  return (
    <div className="space-y-6">
      {/* Filtros e Controles */}
      <Card className="glass-effect p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Busca */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-futuristic-gray w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por ação, fonte ou usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple"
              />
            </div>

            {/* Filtro por Nível */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as any)}
              className="px-4 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white focus:outline-none focus:border-neon-purple"
            >
              <option value="all">Todos os Níveis</option>
              <option value="info">Info</option>
              <option value="success">Sucesso</option>
              <option value="warning">Aviso</option>
              <option value="error">Erro</option>
            </select>

            {/* Filtro por Fonte */}
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as any)}
              className="px-4 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white focus:outline-none focus:border-neon-purple"
            >
              <option value="all">Todas as Fontes</option>
              <option value="user">Usuário</option>
              <option value="system">Sistema</option>
              <option value="api">API</option>
              <option value="ui">Interface</option>
            </select>
          </div>

          {/* Controles */}
          <div className="flex gap-2">
            {/* Botão Auto-Refresh */}
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? "primary" : "outline"}
              size="sm"
              className={autoRefresh ? "bg-green-600 hover:bg-green-700" : ""}
            >
              <Activity className="w-4 h-4 mr-2" />
              {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
            </Button>

            {/* Botão Atualizar */}
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

      {/* Filtros de Data */}
      <DateFilters onDateRangeChange={setDateRange} />

      {/* Lista de Logs */}
      <Card className="glass-effect">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-orbitron font-bold text-white flex items-center">
              <Activity className="w-5 h-5 mr-2 text-neon-purple" />
              Logs da Aplicação
            </h3>
            <div className="flex items-center gap-4">
              {autoRefresh && (
                <div className="flex items-center text-green-400 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                  Auto-refresh ativo
                </div>
              )}
              <span className="text-futuristic-gray text-sm">
                {logs.length} registros
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-purple"></div>
              <span className="ml-3 text-futuristic-gray">Carregando logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-futuristic-gray mx-auto mb-4" />
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
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getLevelIcon(log.level)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getLevelColor(log.level)}`}>
                          {log.level.toUpperCase()}
                        </span>
                      </div>
                      
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSourceColor(log.source)}`}>
                        {log.source}
                      </span>
                      
                      <span className="text-white font-medium">
                        {log.action}
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-futuristic-gray">
                      {log.user_id && (
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{log.user_id}</span>
                        </div>
                      )}
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
                  <Activity className="w-6 h-6 mr-2 text-neon-purple" />
                  Detalhes do Log da Aplicação
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
                    <label className="block text-futuristic-gray text-sm mb-1">Nível</label>
                    <div className="flex items-center space-x-2">
                      {getLevelIcon(selectedLog.level)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getLevelColor(selectedLog.level)}`}>
                        {selectedLog.level.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-futuristic-gray text-sm mb-1">Fonte</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSourceColor(selectedLog.source)}`}>
                      {selectedLog.source}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-futuristic-gray text-sm mb-1">Ação</label>
                    <span className="text-white font-medium">{selectedLog.action}</span>
                  </div>
                  
                  <div>
                    <label className="block text-futuristic-gray text-sm mb-1">Usuário</label>
                    <span className="text-white">{selectedLog.user_id || 'Anônimo'}</span>
                  </div>
                  
                  <div>
                    <label className="block text-futuristic-gray text-sm mb-1">Data/Hora</label>
                    <span className="text-white">{new Date(selectedLog.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-futuristic-gray text-sm mb-2">Detalhes</label>
                    <pre className="bg-darker-surface/50 border border-neon-purple/20 rounded-lg p-3 text-xs text-white overflow-x-auto">
                      {formatJsonData(selectedLog.details)}
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