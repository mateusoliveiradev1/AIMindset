import React, { useState, useEffect, useRef } from 'react';
import { Activity, Search, Filter, RefreshCw, User, AlertCircle, Info, CheckCircle, XCircle, Clock, Eye, Download, FileText } from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import DateFilters, { DateRange } from '../UI/DateFilters';
import { LogExporter } from '../../utils/exportUtils';
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

  // Funções de exportação
  const fetchAllLogsForExport = async () => {
    let query = supabase
      .from('app_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10000); // Limite de segurança

    // Aplicar filtros de data
    if (dateRange.startDate && dateRange.endDate) {
      query = query
        .gte('created_at', dateRange.startDate.toISOString())
        .lte('created_at', dateRange.endDate.toISOString());
    }

    // Aplicar filtro de nível
    if (levelFilter !== 'all') {
      query = query.eq('level', levelFilter);
    }

    // Aplicar filtro de origem
    if (sourceFilter !== 'all') {
      query = query.eq('source', sourceFilter);
    }

    // Aplicar filtro de busca
    if (searchTerm) {
      query = query.or(`message.ilike.%${searchTerm}%,user_id.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };

  const exportToCSV = async () => {
    try {
      const logs = await fetchAllLogsForExport();
      
      await LogExporter.exportLogs({
        data: logs,
        format: 'csv',
        filename: 'app-logs',
        headers: LogExporter.APP_LOG_HEADERS
      });
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast.error('Erro ao exportar logs para CSV');
    }
  };

  const exportToJSON = async () => {
    try {
      const logs = await fetchAllLogsForExport();
      
      await LogExporter.exportLogs({
        data: logs,
        format: 'json',
        filename: 'app-logs'
      });
    } catch (error) {
      console.error('Erro ao exportar JSON:', error);
      toast.error('Erro ao exportar logs para JSON');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filtros e Controles */}
      <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neon-purple/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 flex-1">
            {/* Busca */}
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-futuristic-gray w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por ação, fonte ou usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple text-sm"
              />
            </div>

            {/* Filtro por Nível */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as any)}
              className="w-full sm:w-auto px-3 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white focus:outline-none focus:border-neon-purple text-sm"
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
              className="w-full sm:w-auto px-3 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white focus:outline-none focus:border-neon-purple text-sm"
            >
              <option value="all">Todas as Fontes</option>
              <option value="user">Usuário</option>
              <option value="system">Sistema</option>
              <option value="api">API</option>
              <option value="ui">Interface</option>
            </select>
          </div>

          {/* Controles */}
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
            {/* Botão Auto-Refresh */}
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? "primary" : "outline"}
              size="sm"
              className={`w-full sm:w-auto ${autoRefresh ? "bg-green-600 hover:bg-green-700" : ""}`}
            >
              <Activity className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}</span>
            </Button>

            {/* Botão Atualizar */}
            <Button
              onClick={() => fetchLogs(currentPage, true)}
              disabled={loading}
              className="w-full sm:w-auto bg-neon-gradient hover:bg-neon-gradient/80 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 flex-shrink-0"></div>
              ) : (
                <RefreshCw className="w-4 h-4 mr-2 flex-shrink-0" />
              )}
              <span className="truncate">Atualizar</span>
            </Button>
            
            {/* Botões de Exportação */}
            <div className="flex gap-2 sm:contents">
              <Button
                onClick={exportToCSV}
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none border-green-500/30 text-green-400 hover:bg-green-500/10"
              >
                <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">CSV</span>
              </Button>
              <Button
                onClick={exportToJSON}
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
              >
                <Download className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">JSON</span>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Filtros de Data */}
      <DateFilters onDateRangeChange={setDateRange} />

      {/* Lista de Logs */}
      <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-400/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-orbitron font-bold text-white flex items-center">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-neon-purple flex-shrink-0" />
              <span className="truncate">Logs da Aplicação</span>
            </h3>
            <div className="flex items-center gap-2 sm:gap-4">
              {autoRefresh && (
                <div className="flex items-center text-green-400 text-xs sm:text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                  <span className="hidden sm:inline">Auto-refresh ativo</span>
                </div>
              )}
              <span className="text-futuristic-gray text-xs sm:text-sm">
                {logs.length} registros
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-neon-purple"></div>
              <span className="ml-3 text-futuristic-gray text-sm">Carregando logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Activity className="w-8 h-8 sm:w-12 sm:h-12 text-futuristic-gray mx-auto mb-4" />
              <p className="text-futuristic-gray text-sm">Nenhum log encontrado</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 sm:p-4 bg-darker-surface/30 border border-neon-purple/10 rounded-lg hover:border-neon-purple/30 transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getLevelIcon(log.level)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getLevelColor(log.level)}`}>
                          {log.level.toUpperCase()}
                        </span>
                      </div>
                      
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSourceColor(log.source)} flex-shrink-0`}>
                        {log.source}
                      </span>
                      
                      <span className="text-white font-medium flex-1 truncate text-sm sm:text-base">
                        {log.action}
                      </span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 text-xs sm:text-sm text-futuristic-gray">
                      {log.user_id && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">{log.user_id}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                      </div>
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-neon-purple flex-shrink-0" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-neon-purple/10">
              <span className="text-futuristic-gray text-xs sm:text-sm">
                Página {currentPage} de {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  onClick={() => fetchLogs(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  Anterior
                </Button>
                <Button
                  onClick={() => fetchLogs(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none text-xs sm:text-sm"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-400/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh]">
            <div className="p-4 sm:p-6 border-b border-white/10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg sm:text-xl font-orbitron font-bold text-white flex items-center">
                  <Activity className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-blue-400 flex-shrink-0 animate-pulse" />
                  <span className="truncate">Detalhes do Log da Aplicação</span>
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getLevelColor(selectedLog.level)}`}>{selectedLog.level.toUpperCase()}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSourceColor(selectedLog.source)}`}>{selectedLog.source}</span>
                  <Button
                    onClick={() => setSelectedLog(null)}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-futuristic-gray text-xs sm:text-sm mb-1">Ação</label>
                    <span className="text-white font-medium text-sm sm:text-base break-words">{selectedLog.action}</span>
                  </div>
                  
                  <div>
                    <label className="block text-futuristic-gray text-xs sm:text-sm mb-1">Usuário</label>
                    <span className="text-white text-sm sm:text-base break-words">{selectedLog.user_id || 'Anônimo'}</span>
                  </div>
                  
                  <div>
                    <label className="block text-futuristic-gray text-xs sm:text-sm mb-1">Data/Hora</label>
                    <span className="text-white text-sm sm:text-base break-words">{new Date(selectedLog.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {selectedLog.details ? (
                    <div>
                      <label className="block text-futuristic-gray text-xs sm:text-sm mb-2">Detalhes</label>
                      <pre className="bg-darker-surface/50 border border-neon-purple/20 rounded-lg p-3 text-xs text-white overflow-x-auto break-words">
                        {formatJsonData(selectedLog.details)}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-dark-surface/40 rounded-lg border border-white/10">
                      <Info className="w-6 h-6 text-futuristic-gray mx-auto mb-2 animate-pulse" />
                      <p className="text-futuristic-gray text-sm">Sem detalhes adicionais</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};