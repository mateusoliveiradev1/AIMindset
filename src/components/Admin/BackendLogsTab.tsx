import React, { useState, useEffect, useRef } from 'react';
import { Server, Search, Filter, RefreshCw, AlertCircle, Info, CheckCircle, XCircle, Clock, Eye, Download, FileText, Database, User } from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import DateFilters, { DateRange } from '../UI/DateFilters';
import { LogExporter } from '../../utils/exportUtils';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface BackendLog {
  id: string;
  table_name: string;
  action: string;
  record_id: string;
  old_data: any;
  new_data: any;
  performed_by: string;
  created_at: string;
}

export const BackendLogsTab: React.FC = () => {
  const [logs, setLogs] = useState<BackendLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<'all' | 'INSERT' | 'UPDATE' | 'DELETE'>('all');
  const [tableFilter, setTableFilter] = useState<'all' | 'articles' | 'comments' | 'feedbacks' | 'users'>('all');
  const [selectedLog, setSelectedLog] = useState<BackendLog | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const logsPerPage = 20;

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('backend_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * logsPerPage, page * logsPerPage - 1);

      // Aplicar filtros
      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }
      
      if (tableFilter !== 'all') {
        query = query.eq('table_name', tableFilter);
      }

      if (searchTerm) {
        query = query.or(`record_id.ilike.%${searchTerm}%,performed_by.ilike.%${searchTerm}%`);
      }

      // Aplicar filtro de data
      if (dateRange) {
        query = query.gte('created_at', dateRange.startDate.toISOString())
                    .lte('created_at', dateRange.endDate.toISOString());
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Erro ao buscar logs:', error);
        toast.error('Erro ao carregar logs do backend');
        return;
      }

      setLogs(data || []);
      setTotalPages(Math.ceil((count || 0) / logsPerPage));
      setCurrentPage(page);
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      toast.error('Erro ao carregar logs do backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [actionFilter, tableFilter, searchTerm, dateRange]);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT': return 'text-lime-green bg-lime-green/10 border-lime-green/20';
      case 'UPDATE': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'DELETE': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-futuristic-gray bg-futuristic-gray/10 border-futuristic-gray/20';
    }
  };

  const getTableIcon = (tableName: string) => {
    switch (tableName) {
      case 'articles': return <FileText className="w-4 h-4" />;
      case 'users': return <User className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  const formatJsonData = (data: any) => {
    if (!data) return 'N/A';
    return JSON.stringify(data, null, 2);
  };

  // Funções de exportação
  const fetchAllLogsForExport = async () => {
    let query = supabase
      .from('backend_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10000); // Limite de segurança

    // Aplicar filtros de data
    if (dateRange.startDate && dateRange.endDate) {
      query = query
        .gte('created_at', dateRange.startDate.toISOString())
        .lte('created_at', dateRange.endDate.toISOString());
    }

    // Aplicar filtro de ação
    if (actionFilter !== 'all') {
      query = query.eq('action', actionFilter);
    }

    // Aplicar filtro de tabela
    if (tableFilter !== 'all') {
      query = query.eq('table_name', tableFilter);
    }

    // Aplicar filtro de busca
    if (searchTerm) {
      query = query.or(`record_id.ilike.%${searchTerm}%,user_id.ilike.%${searchTerm}%`);
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
        filename: 'backend-logs',
        headers: LogExporter.BACKEND_LOG_HEADERS
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
        filename: 'backend-logs'
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
                placeholder="Buscar por ID ou usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple text-sm"
              />
            </div>

            {/* Filtro por Ação */}
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value as any)}
              className="w-full sm:w-auto px-3 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white focus:outline-none focus:border-neon-purple text-sm"
            >
              <option value="all">Todas as Ações</option>
              <option value="INSERT">Inserções</option>
              <option value="UPDATE">Atualizações</option>
              <option value="DELETE">Exclusões</option>
            </select>

            {/* Filtro por Tabela */}
            <select
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value as any)}
              className="w-full sm:w-auto px-3 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white focus:outline-none focus:border-neon-purple text-sm"
            >
              <option value="all">Todas as Tabelas</option>
              <option value="articles">Artigos</option>
              <option value="comments">Comentários</option>
              <option value="feedbacks">Feedbacks</option>
              <option value="users">Usuários</option>
            </select>
          </div>

          {/* Controles */}
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
            {/* Botão Atualizar */}
            <Button
              onClick={() => fetchLogs(currentPage)}
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
            <div className="flex gap-2 flex-1 sm:flex-none">
              <Button
                onClick={exportToCSV}
                disabled={loading}
                className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
              >
                <Download className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate hidden sm:inline">CSV</span>
              </Button>
              
              <Button
                onClick={exportToJSON}
                disabled={loading}
                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate hidden sm:inline">JSON</span>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Filtros de Data */}
      <DateFilters onDateRangeChange={setDateRange} />

      {/* Lista de Logs */}
      <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-400/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-orbitron font-bold text-white flex items-center">
              <Database className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-neon-purple flex-shrink-0" />
              <span className="truncate">Logs do Backend</span>
            </h3>
            <span className="text-futuristic-gray text-xs sm:text-sm">
              {logs.length} registros
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-neon-purple"></div>
              <span className="ml-3 text-futuristic-gray text-sm">Carregando logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Database className="w-8 h-8 sm:w-12 sm:h-12 text-futuristic-gray mx-auto mb-4" />
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
                        {getTableIcon(log.table_name)}
                        <span className="text-white font-medium text-sm sm:text-base">{log.table_name}</span>
                      </div>
                      
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getActionColor(log.action)} flex-shrink-0`}>
                        {log.action}
                      </span>
                      
                      <span className="text-futuristic-gray text-xs sm:text-sm flex-1 truncate">
                        ID: {log.record_id}
                      </span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 text-xs sm:text-sm text-futuristic-gray">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{log.performed_by || 'Sistema'}</span>
                      </div>
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
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-400/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh]">
            <div className="p-4 sm:p-6 border-b border-white/10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg sm:text-xl font-orbitron font-bold text-white flex items-center">
                  <Database className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-lime-green flex-shrink-0 animate-pulse" />
                  <span className="truncate">Detalhes do Log</span>
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getActionColor(selectedLog.action)}`}>{selectedLog.action}</span>
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
                    <label className="block text-futuristic-gray text-xs sm:text-sm mb-1">Tabela</label>
                    <div className="flex items-center gap-2">
                      {getTableIcon(selectedLog.table_name)}
                      <span className="text-white font-medium text-sm sm:text-base break-words">{selectedLog.table_name}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-futuristic-gray text-xs sm:text-sm mb-1">ID do Registro</label>
                    <span className="text-white text-sm sm:text-base break-words">{selectedLog.record_id}</span>
                  </div>
                  
                  <div>
                    <label className="block text-futuristic-gray text-xs sm:text-sm mb-1">Executado por</label>
                    <span className="text-white text-sm sm:text-base break-words">{selectedLog.performed_by || 'Sistema'}</span>
                  </div>
                  
                  <div>
                    <label className="block text-futuristic-gray text-xs sm:text-sm mb-1">Data/Hora</label>
                    <span className="text-white text-sm sm:text-base break-words">{new Date(selectedLog.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {selectedLog.old_data ? (
                    <div>
                      <label className="block text-futuristic-gray text-xs sm:text-sm mb-2">Dados Anteriores</label>
                      <pre className="bg-darker-surface/50 border border-red-400/20 rounded-lg p-3 text-xs text-red-300 overflow-x-auto break-words">
                        {formatJsonData(selectedLog.old_data)}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-dark-surface/40 rounded-lg border border-white/10">
                      <AlertCircle className="w-6 h-6 text-futuristic-gray mx-auto mb-2 animate-pulse" />
                      <p className="text-futuristic-gray text-sm">Sem dados anteriores</p>
                    </div>
                  )}
                  
                  {selectedLog.new_data ? (
                    <div>
                      <label className="block text-futuristic-gray text-xs sm:text-sm mb-2">Dados Novos</label>
                      <pre className="bg-darker-surface/50 border border-lime-green/20 rounded-lg p-3 text-xs text-lime-green overflow-x-auto break-words">
                        {formatJsonData(selectedLog.new_data)}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-dark-surface/40 rounded-lg border border-white/10">
                      <Info className="w-6 h-6 text-futuristic-gray mx-auto mb-2 animate-pulse" />
                      <p className="text-futuristic-gray text-sm">Sem dados novos</p>
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