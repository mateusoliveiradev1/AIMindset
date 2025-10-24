import React, { useState, useEffect } from 'react';
import Button from '../UI/Button';
import { useNewsletterLogs, LogFilters } from '../../hooks/useNewsletterLogs';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Download, 
  Filter, 
  RefreshCw, 
  Search,
  Trash2,
  Eye,
  Calendar,
  Mail,
  User,
  Zap,
  FileText,
  TrendingUp,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

const NewsletterLogs: React.FC = () => {
  const {
    logs,
    loading,
    totalCount,
    currentPage,
    pageSize,
    stats,
    fetchLogs,
    fetchStats,
    markAsProcessed,
    cleanupOldLogs,
    exportLogs,
    setCurrentPage
  } = useNewsletterLogs();

  const [filters, setFilters] = useState<LogFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [showLogDetails, setShowLogDetails] = useState(false);

  useEffect(() => {
    fetchLogs(filters, currentPage);
    fetchStats(filters);
  }, [currentPage]);

  const handleFilterChange = (key: keyof LogFilters, value: string) => {
    const newFilters = { ...filters, [key]: value === 'all' ? undefined : value };
    setFilters(newFilters);
    setCurrentPage(1);
    fetchLogs(newFilters, 1);
    fetchStats(newFilters);
  };

  const handleSearch = (searchTerm: string) => {
    const newFilters = { ...filters, search: searchTerm || undefined };
    setFilters(newFilters);
    setCurrentPage(1);
    fetchLogs(newFilters, 1);
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'campaign_sent':
      case 'automation_sent':
        return <Mail className="w-4 h-4" />;
      case 'campaign_opened':
      case 'automation_opened':
        return <Eye className="w-4 h-4" />;
      case 'campaign_clicked':
      case 'automation_clicked':
        return <TrendingUp className="w-4 h-4" />;
      case 'subscriber_added':
        return <User className="w-4 h-4" />;
      case 'template_created':
      case 'template_updated':
        return <FileText className="w-4 h-4" />;
      case 'system_error':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getEventTypeLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      'campaign_sent': 'Campanha Enviada',
      'campaign_opened': 'Campanha Aberta',
      'campaign_clicked': 'Campanha Clicada',
      'campaign_bounced': 'Campanha Rejeitada',
      'campaign_unsubscribed': 'Descadastro via Campanha',
      'automation_sent': 'Automação Enviada',
      'automation_opened': 'Automação Aberta',
      'automation_clicked': 'Automação Clicada',
      'automation_bounced': 'Automação Rejeitada',
      'subscriber_added': 'Inscrito Adicionado',
      'subscriber_removed': 'Inscrito Removido',
      'subscriber_updated': 'Inscrito Atualizado',
      'template_created': 'Template Criado',
      'template_updated': 'Template Atualizado',
      'template_deleted': 'Template Excluído',
      'system_error': 'Erro do Sistema',
      'api_call': 'Chamada API'
    };
    return labels[eventType] || eventType;
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {/* Header com Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-darker-surface/50 p-4 rounded-lg border border-futuristic-gray/20">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-lime-green" />
              <span className="text-sm text-futuristic-gray">Total de Eventos</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.total_events.toLocaleString()}</div>
          </div>

          <div className="bg-darker-surface/50 p-4 rounded-lg border border-futuristic-gray/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-sm text-futuristic-gray">Taxa de Sucesso</span>
            </div>
            <div className="text-2xl font-bold text-green-400">{stats.success_rate.toFixed(1)}%</div>
          </div>

          <div className="bg-darker-surface/50 p-4 rounded-lg border border-futuristic-gray/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-sm text-futuristic-gray">Taxa de Erro</span>
            </div>
            <div className="text-2xl font-bold text-red-400">{stats.error_rate.toFixed(1)}%</div>
          </div>

          <div className="bg-darker-surface/50 p-4 rounded-lg border border-futuristic-gray/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-futuristic-gray">Erros Recentes</span>
            </div>
            <div className="text-2xl font-bold text-yellow-400">{stats.recent_errors.length}</div>
          </div>
        </div>
      )}

      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-white">Logs da Newsletter</h2>
          <Button
            onClick={() => fetchLogs(filters, currentPage)}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            size="sm"
          >
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
          
          <Button
            onClick={() => exportLogs(filters)}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <Download className="w-4 h-4" />
            Exportar
          </Button>

          <Button
            onClick={() => {
              if (confirm('Deseja limpar logs antigos (mais de 6 meses)?')) {
                cleanupOldLogs();
              }
            }}
            variant="outline"
            size="sm"
            className="text-red-400 border-red-400/30 hover:bg-red-400/10"
          >
            <Trash2 className="w-4 h-4" />
            Limpar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-darker-surface/30 p-4 rounded-lg border border-futuristic-gray/20 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Busca */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-futuristic-gray" />
                <input
                  type="text"
                  placeholder="Email, erro, campanha..."
                  className="w-full pl-10 pr-4 py-2 bg-dark-gray/50 border border-futuristic-gray/30 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-lime-green"
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Tipo de Evento */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Tipo de Evento
              </label>
              <select
                value={filters.event_type || 'all'}
                onChange={(e) => handleFilterChange('event_type', e.target.value)}
                className="w-full px-3 py-2 bg-dark-gray/50 border border-futuristic-gray/30 rounded-lg text-white focus:outline-none focus:border-lime-green"
              >
                <option value="all">Todos</option>
                <option value="campaign_sent">Campanha Enviada</option>
                <option value="campaign_opened">Campanha Aberta</option>
                <option value="campaign_clicked">Campanha Clicada</option>
                <option value="automation_sent">Automação Enviada</option>
                <option value="subscriber_added">Inscrito Adicionado</option>
                <option value="system_error">Erro do Sistema</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Status
              </label>
              <select
                value={filters.status || 'all'}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 bg-dark-gray/50 border border-futuristic-gray/30 rounded-lg text-white focus:outline-none focus:border-lime-green"
              >
                <option value="all">Todos</option>
                <option value="success">Sucesso</option>
                <option value="error">Erro</option>
                <option value="pending">Pendente</option>
                <option value="failed">Falhou</option>
              </select>
            </div>

            {/* Data */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Período
              </label>
              <select
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'today') {
                    const today = new Date().toISOString().split('T')[0];
                    handleFilterChange('date_from', today);
                    handleFilterChange('date_to', today);
                  } else if (value === 'week') {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    handleFilterChange('date_from', weekAgo.toISOString().split('T')[0]);
                    handleFilterChange('date_to', new Date().toISOString().split('T')[0]);
                  } else if (value === 'month') {
                    const monthAgo = new Date();
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    handleFilterChange('date_from', monthAgo.toISOString().split('T')[0]);
                    handleFilterChange('date_to', new Date().toISOString().split('T')[0]);
                  } else {
                    handleFilterChange('date_from', '');
                    handleFilterChange('date_to', '');
                  }
                }}
                className="w-full px-3 py-2 bg-dark-gray/50 border border-futuristic-gray/30 rounded-lg text-white focus:outline-none focus:border-lime-green"
              >
                <option value="all">Todos</option>
                <option value="today">Hoje</option>
                <option value="week">Última Semana</option>
                <option value="month">Último Mês</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Logs */}
      <div className="bg-darker-surface/30 rounded-lg border border-futuristic-gray/20 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-lime-green" />
            <span className="ml-2 text-futuristic-gray">Carregando logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-futuristic-gray mx-auto mb-4" />
            <p className="text-futuristic-gray">Nenhum log encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-darker-surface/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-futuristic-gray uppercase tracking-wider">
                    Data/Hora
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-futuristic-gray uppercase tracking-wider">
                    Evento
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-futuristic-gray uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-futuristic-gray uppercase tracking-wider">
                    Detalhes
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-futuristic-gray uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-futuristic-gray/10">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-darker-surface/20">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getEventTypeIcon(log.event_type)}
                        <span className="text-sm text-white">
                          {getEventTypeLabel(log.event_type)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <span className={`text-sm capitalize ${
                          log.status === 'success' ? 'text-green-400' :
                          log.status === 'error' || log.status === 'failed' ? 'text-red-400' :
                          log.status === 'pending' ? 'text-yellow-400' : 'text-gray-400'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-futuristic-gray">
                        {log.campaign?.name && (
                          <div>Campanha: {log.campaign.name}</div>
                        )}
                        {log.subscriber?.email && (
                          <div>Email: {log.subscriber.email}</div>
                        )}
                        {log.automation?.name && (
                          <div>Automação: {log.automation.name}</div>
                        )}
                        {log.error_message && (
                          <div className="text-red-400 truncate max-w-xs">
                            Erro: {log.error_message}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => {
                            setSelectedLog(log);
                            setShowLogDetails(true);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        {log.status === 'pending' && (
                          <Button
                            onClick={() => markAsProcessed(log.id)}
                            variant="outline"
                            size="sm"
                            className="text-green-400 border-green-400/30 hover:bg-green-400/10"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-futuristic-gray">
            Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, totalCount)} de {totalCount} logs
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || loading}
              variant="outline"
              size="sm"
            >
              Anterior
            </Button>
            
            <span className="text-sm text-white px-3 py-1 bg-darker-surface/50 rounded">
              {currentPage} de {totalPages}
            </span>
            
            <Button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || loading}
              variant="outline"
              size="sm"
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Log */}
      {showLogDetails && selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-darker-surface rounded-lg border border-futuristic-gray/30 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Detalhes do Log</h3>
                <Button
                  onClick={() => setShowLogDetails(false)}
                  variant="outline"
                  size="sm"
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-futuristic-gray mb-1">
                      ID
                    </label>
                    <div className="text-white font-mono text-sm">{selectedLog.id}</div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-futuristic-gray mb-1">
                      Data/Hora
                    </label>
                    <div className="text-white">{new Date(selectedLog.created_at).toLocaleString('pt-BR')}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-futuristic-gray mb-1">
                      Tipo de Evento
                    </label>
                    <div className="flex items-center gap-2 text-white">
                      {getEventTypeIcon(selectedLog.event_type)}
                      {getEventTypeLabel(selectedLog.event_type)}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-futuristic-gray mb-1">
                      Status
                    </label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedLog.status)}
                      <span className={`capitalize ${
                        selectedLog.status === 'success' ? 'text-green-400' :
                        selectedLog.status === 'error' || selectedLog.status === 'failed' ? 'text-red-400' :
                        selectedLog.status === 'pending' ? 'text-yellow-400' : 'text-gray-400'
                      }`}>
                        {selectedLog.status}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedLog.error_message && (
                  <div>
                    <label className="block text-sm font-medium text-futuristic-gray mb-1">
                      Mensagem de Erro
                    </label>
                    <div className="text-red-400 bg-red-400/10 p-3 rounded border border-red-400/20">
                      {selectedLog.error_message}
                    </div>
                  </div>
                )}

                {Object.keys(selectedLog.event_data || {}).length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-futuristic-gray mb-1">
                      Dados do Evento
                    </label>
                    <pre className="text-white bg-dark-gray/50 p-3 rounded border border-futuristic-gray/30 text-sm overflow-x-auto">
                      {JSON.stringify(selectedLog.event_data, null, 2)}
                    </pre>
                  </div>
                )}

                {(selectedLog.campaign || selectedLog.subscriber || selectedLog.automation || selectedLog.template) && (
                  <div>
                    <label className="block text-sm font-medium text-futuristic-gray mb-1">
                      Relacionamentos
                    </label>
                    <div className="space-y-2">
                      {selectedLog.campaign && (
                        <div className="text-white">
                          <strong>Campanha:</strong> {selectedLog.campaign.name} ({selectedLog.campaign.subject})
                        </div>
                      )}
                      {selectedLog.subscriber && (
                        <div className="text-white">
                          <strong>Inscrito:</strong> {selectedLog.subscriber.email}
                          {selectedLog.subscriber.name && ` (${selectedLog.subscriber.name})`}
                        </div>
                      )}
                      {selectedLog.automation && (
                        <div className="text-white">
                          <strong>Automação:</strong> {selectedLog.automation.name} ({selectedLog.automation.trigger_type})
                        </div>
                      )}
                      {selectedLog.template && (
                        <div className="text-white">
                          <strong>Template:</strong> {selectedLog.template.name} ({selectedLog.template.template_type})
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsletterLogs;