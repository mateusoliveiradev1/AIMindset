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
                placeholder="Buscar por ID ou usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple"
              />
            </div>

            {/* Filtro por Ação */}
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value as any)}
              className="px-4 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white focus:outline-none focus:border-neon-purple"
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
              className="px-4 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white focus:outline-none focus:border-neon-purple"
            >
              <option value="all">Todas as Tabelas</option>
              <option value="articles">Artigos</option>
              <option value="comments">Comentários</option>
              <option value="feedbacks">Feedbacks</option>
              <option value="users">Usuários</option>
            </select>
          </div>

          {/* Botão Atualizar */}
          <Button
            onClick={() => fetchLogs(currentPage)}
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
          
          {/* Botões de Exportação */}
          <Button
            onClick={exportToCSV}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          
          <Button
            onClick={exportToJSON}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <FileText className="w-4 h-4 mr-2" />
            JSON
          </Button>
        </div>
      </Card>

      {/* Filtros de Data */}
      <DateFilters onDateRangeChange={setDateRange} />

      {/* Lista de Logs */}
      <Card className="glass-effect">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-orbitron font-bold text-white flex items-center">
              <Database className="w-5 h-5 mr-2 text-neon-purple" />
              Logs do Backend
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
              <Database className="w-12 h-12 text-futuristic-gray mx-auto mb-4" />
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
                        {getTableIcon(log.table_name)}
                        <span className="text-white font-medium">{log.table_name}</span>
                      </div>
                      
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                      
                      <span className="text-futuristic-gray text-sm">
                        ID: {log.record_id}
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-futuristic-gray">
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>{log.performed_by || 'Sistema'}</span>
                      </div>
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
                  <Database className="w-6 h-6 mr-2 text-neon-purple" />
                  Detalhes do Log
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
                    <label className="block text-futuristic-gray text-sm mb-1">Tabela</label>
                    <div className="flex items-center space-x-2">
                      {getTableIcon(selectedLog.table_name)}
                      <span className="text-white font-medium">{selectedLog.table_name}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-futuristic-gray text-sm mb-1">Ação</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getActionColor(selectedLog.action)}`}>
                      {selectedLog.action}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-futuristic-gray text-sm mb-1">ID do Registro</label>
                    <span className="text-white">{selectedLog.record_id}</span>
                  </div>
                  
                  <div>
                    <label className="block text-futuristic-gray text-sm mb-1">Executado por</label>
                    <span className="text-white">{selectedLog.performed_by || 'Sistema'}</span>
                  </div>
                  
                  <div>
                    <label className="block text-futuristic-gray text-sm mb-1">Data/Hora</label>
                    <span className="text-white">{new Date(selectedLog.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedLog.old_data && (
                    <div>
                      <label className="block text-futuristic-gray text-sm mb-2">Dados Anteriores</label>
                      <pre className="bg-darker-surface/50 border border-red-400/20 rounded-lg p-3 text-xs text-red-300 overflow-x-auto">
                        {formatJsonData(selectedLog.old_data)}
                      </pre>
                    </div>
                  )}
                  
                  {selectedLog.new_data && (
                    <div>
                      <label className="block text-futuristic-gray text-sm mb-2">Dados Novos</label>
                      <pre className="bg-darker-surface/50 border border-lime-green/20 rounded-lg p-3 text-xs text-lime-green overflow-x-auto">
                        {formatJsonData(selectedLog.new_data)}
                      </pre>
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