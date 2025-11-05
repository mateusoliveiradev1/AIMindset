import React, { useState, useEffect } from 'react';
import { Shield, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw, Calendar, Database, Activity } from 'lucide-react';

interface BackupStatus {
  system_healthy: boolean;
  last_backup_time: string | null;
  hours_since_backup: number;
  backup_overdue: boolean;
  cron_jobs: any[];
  recent_logs: any[];
  next_backups: {
    primary: string;
    secondary: string;
  };
  statistics: {
    total_backups: number;
    successful_backups: number;
    failed_backups: number;
    success_rate: number;
  };
}

export const BackupMonitoring: React.FC = () => {
  const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [forceChecking, setForceChecking] = useState(false);

  const fetchBackupStatus = async () => {
    try {
      console.log('🔄 Iniciando requisição para backup status...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
      
      const response = await fetch('/api/backup-status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('📡 Resposta recebida:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 Dados recebidos:', data);
      
      if (data.success) {
        setBackupStatus(data.data);
        setLastUpdate(new Date());
        console.log('✅ Status do backup atualizado com sucesso');
      } else {
        console.error('❌ Erro ao buscar status do backup:', data.message);
        // Implementar fallback com dados mock
        setBackupStatus({
          system_healthy: false,
          last_backup_time: null,
          hours_since_backup: 999,
          backup_overdue: true,
          cron_jobs: [],
          recent_logs: [],
          next_backups: { primary: 'N/A', secondary: 'N/A' },
          statistics: { total_backups: 0, successful_backups: 0, failed_backups: 0, success_rate: 0 }
        });
      }
    } catch (error) {
      console.error('💥 Erro na requisição:', error);
      
      // Implementar fallback detalhado
      if (error.name === 'AbortError') {
        console.error('⏰ Timeout na requisição');
      } else if (error.message.includes('Failed to fetch')) {
        console.error('🌐 Erro de conectividade - servidor pode estar offline');
      }
      
      // Dados de fallback
      setBackupStatus({
        system_healthy: false,
        last_backup_time: null,
        hours_since_backup: 999,
        backup_overdue: true,
        cron_jobs: [],
        recent_logs: [{ message: 'Erro de conectividade com servidor de backup', timestamp: new Date().toISOString() }],
        next_backups: { primary: 'Servidor offline', secondary: 'Servidor offline' },
        statistics: { total_backups: 0, successful_backups: 0, failed_backups: 0, success_rate: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  const forceHealthCheck = async () => {
    setForceChecking(true);
    try {
      console.log('🔄 Iniciando verificação forçada de saúde...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos timeout para POST
      
      const response = await fetch('/api/backup-status', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('📡 Resposta da verificação forçada:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 Dados da verificação forçada:', data);
      
      if (data.success) {
        console.log('✅ Verificação forçada concluída com sucesso');
        // Recarregar status após verificação forçada
        await fetchBackupStatus();
      } else {
        console.error('❌ Erro na verificação forçada:', data.message);
      }
    } catch (error) {
      console.error('💥 Erro na verificação forçada:', error);
      
      if (error.name === 'AbortError') {
        console.error('⏰ Timeout na verificação forçada');
      } else if (error.message.includes('Failed to fetch')) {
        console.error('🌐 Erro de conectividade na verificação forçada');
      }
    } finally {
      setForceChecking(false);
    }
  };

  useEffect(() => {
    fetchBackupStatus();
    
    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchBackupStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? dateString : d.toLocaleString('pt-BR');
  };

  const formatTimeSince = (hours: number) => {
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes} min atrás`;
    } else if (hours < 24) {
      return `${hours.toFixed(1)}h atrás`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.round(hours % 24);
      return `${days}d ${remainingHours}h atrás`;
    }
  };

  const getStatusColor = (healthy: boolean) => {
    return healthy ? 'text-green-400' : 'text-red-400';
  };

  const getStatusIcon = (healthy: boolean) => {
    return healthy ? CheckCircle : XCircle;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-6 h-6 animate-spin text-neon-purple" />
          <span className="text-futuristic-gray">Carregando status do backup...</span>
        </div>
      </div>
    );
  }

  if (!backupStatus) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-futuristic-gray">Erro ao carregar status do backup</p>
          <button
            onClick={fetchBackupStatus}
            className="mt-4 px-4 py-2 bg-neon-purple/20 text-neon-purple rounded-lg hover:bg-neon-purple/30 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(backupStatus.system_healthy);

  return (
    <div className="space-y-6">
      {/* Header com Status Geral */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neon-purple/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-neon-purple" />
            <div>
              <h3 className="text-xl font-orbitron font-bold text-white">Sistema de Backup</h3>
              <p className="text-futuristic-gray text-sm">
                Última verificação: {lastUpdate ? formatDate(lastUpdate.toISOString()) : 'Nunca'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={forceHealthCheck}
              disabled={forceChecking}
              className="flex items-center space-x-2 px-4 py-2 bg-neon-purple/20 text-neon-purple rounded-lg hover:bg-neon-purple/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${forceChecking ? 'animate-spin' : ''}`} />
              <span>{forceChecking ? 'Verificando...' : 'Verificar Agora'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status Geral */}
          <div className="bg-dark-surface/50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <StatusIcon className={`w-6 h-6 ${getStatusColor(backupStatus.system_healthy)}`} />
              <div>
                <p className="text-sm text-futuristic-gray">Status do Sistema</p>
                <p className={`font-bold ${getStatusColor(backupStatus.system_healthy)}`}>
                  {backupStatus.system_healthy ? 'Saudável' : 'Com Problemas'}
                </p>
              </div>
            </div>
          </div>

          {/* Último Backup */}
          <div className="bg-dark-surface/50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Clock className="w-6 h-6 text-blue-400" />
              <div>
                <p className="text-sm text-futuristic-gray">Último Backup</p>
                <p className="font-bold text-white text-sm">
                  {backupStatus.last_backup_time 
                    ? formatDate(backupStatus.last_backup_time)
                    : 'Nunca executado'
                  }
                </p>
                <p className="text-xs text-futuristic-gray">
                  {backupStatus.hours_since_backup < 999 
                    ? formatTimeSince(backupStatus.hours_since_backup)
                    : 'Muito tempo'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Taxa de Sucesso */}
          <div className="bg-dark-surface/50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Activity className="w-6 h-6 text-green-400" />
              <div>
                <p className="text-sm text-futuristic-gray">Taxa de Sucesso</p>
                <p className="font-bold text-white">
                  {backupStatus.statistics.success_rate.toFixed(1)}%
                </p>
                <p className="text-xs text-futuristic-gray">
                  {backupStatus.statistics.successful_backups}/{backupStatus.statistics.total_backups} backups
                </p>
              </div>
            </div>
          </div>

          {/* Próximo Backup */}
          <div className="bg-dark-surface/50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Calendar className="w-6 h-6 text-purple-400" />
              <div>
                <p className="text-sm text-futuristic-gray">Próximo Backup</p>
                <p className="font-bold text-white text-sm">
                  {formatDate(backupStatus.next_backups.primary)}
                </p>
                <p className="text-xs text-futuristic-gray">Backup principal</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerta se backup atrasado */}
        {backupStatus.backup_overdue && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <div>
                <p className="font-bold text-red-400">Backup Atrasado!</p>
                <p className="text-sm text-red-300">
                  O último backup foi {formatTimeSince(backupStatus.hours_since_backup)}. 
                  Backups devem ocorrer a cada 24 horas.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cron Jobs Status */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neon-purple/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 p-6">
        <h4 className="text-lg font-orbitron font-bold text-white mb-4 flex items-center">
          <Database className="w-5 h-5 mr-2 text-neon-purple" />
          Cron Jobs Configurados
        </h4>
        
        {backupStatus.cron_jobs.length > 0 ? (
          <div className="space-y-3">
            {backupStatus.cron_jobs.map((job, index) => (
              <div key={index} className="bg-dark-surface/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{job.jobname}</p>
                    <p className="text-sm text-futuristic-gray">
                      Agendamento: {job.schedule} | Comando: {job.command}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-sm text-green-400">Ativo</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-futuristic-gray">Nenhum cron job de backup encontrado</p>
          </div>
        )}
      </div>

      {/* Logs Recentes */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neon-purple/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 p-6">
        <h4 className="text-lg font-orbitron font-bold text-white mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-neon-purple" />
          Logs Recentes de Backup
        </h4>
        
        {backupStatus.recent_logs.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {backupStatus.recent_logs.map((log, index) => {
              const type: string = (log && typeof log.type === 'string') ? log.type : 'backup_unknown';
              const createdAt: string = (log && (log.created_at || log.timestamp)) ? (log.created_at || log.timestamp) : new Date().toISOString();

              const getLogColor = (t: string) => {
                switch (t) {
                  case 'backup_success': return 'text-green-400';
                  case 'backup_error': return 'text-red-400';
                  case 'backup_critical_error': return 'text-red-500';
                  case 'backup_start': return 'text-blue-400';
                  default: return 'text-futuristic-gray';
                }
              };

              const getLogIcon = (t: string) => {
                switch (t) {
                  case 'backup_success': return CheckCircle;
                  case 'backup_error': 
                  case 'backup_critical_error': return XCircle;
                  case 'backup_start': return RefreshCw;
                  default: return Activity;
                }
              };

              const LogIcon = getLogIcon(type);

              return (
                <div key={index} className="bg-dark-surface/30 rounded-lg p-3">
                  <div className="flex items-start space-x-3">
                    <LogIcon className={`w-4 h-4 mt-0.5 ${getLogColor(type)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`font-medium ${getLogColor(type)}`}>
                          {type.replace('backup_', '').replace('_', ' ').toUpperCase()}
                        </p>
                        <span className="text-xs text-futuristic-gray">
                          {formatDate(createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-futuristic-gray mt-1">{(log && log.message) ? log.message : 'Sem mensagem'}</p>
                      {log && log.details && (
                        <pre className="text-xs text-futuristic-gray mt-2 bg-darker-surface/50 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-futuristic-gray mx-auto mb-4" />
            <p className="text-futuristic-gray">Nenhum log de backup encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
};