import React, { useState, useEffect } from 'react';
import { useBackup } from '../../hooks/useBackup';
import Card from '../UI/Card';
import Button from '../UI/Button';
import { toast } from 'sonner';
import { 
  Shield, 
  Download, 
  Upload, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Database,
  Activity,
  Calendar,
  FileText,
  MessageSquare,
  Star
} from 'lucide-react';

/**
 * Componente BackupTab - Interface de Backup e Restauração
 * Integrado ao painel administrativo do AIMindset
 */
export const BackupTab: React.FC = () => {
  console.log('🔧 [BackupTab] Componente renderizado!');
  
  const {
    loading,
    logs,
    error,
    createBackup,
    restoreBackup,
    fetchLogs,
    getLastBackup,
    getLastRestore,
    hasBackupAvailable,
    getBackupStats,
    clearError
  } = useBackup();

  console.log('🔧 [BackupTab] Estado do hook:', { 
    loading, 
    logsCount: logs.length, 
    error, 
    hasBackupAvailable: hasBackupAvailable() 
  });

  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreConfirmation, setRestoreConfirmation] = useState('');

  // Carregar logs ao montar o componente
  useEffect(() => {
    console.log('🔧 [BackupTab] useEffect - Chamando fetchLogs()');
    fetchLogs();
  }, [fetchLogs]);

  // Limpar erro quando componente desmonta
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleCreateBackup = async () => {
    try {
      const result = await createBackup();
      
      if (result.success) {
        toast.success(`Backup criado com sucesso! ${result.records_affected} registros salvos.`);
      } else {
        toast.error(result.message || 'Erro ao criar backup');
      }
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      toast.error('Erro inesperado ao criar backup');
    }
  };

  const handleRestoreBackup = async () => {
    if (restoreConfirmation !== 'RESTAURAR') {
      toast.error('Digite "RESTAURAR" para confirmar a operação');
      return;
    }

    try {
      const result = await restoreBackup();
      
      if (result.success) {
        toast.success(`Dados restaurados com sucesso! ${result.records_affected} registros restaurados.`);
        setShowRestoreModal(false);
        setRestoreConfirmation('');
      } else {
        toast.error(result.message || 'Erro ao restaurar backup');
      }
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      toast.error('Erro inesperado ao restaurar backup');
    }
  };

  const lastBackup = getLastBackup();
  const lastRestore = getLastRestore();
  const backupAvailable = hasBackupAvailable();
  const stats = getBackupStats();

  const formatDate = (date: Date | null) => {
    if (!date) return 'Nunca';
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-4 h-4 text-lime-green" />
    ) : (
      <XCircle className="w-4 h-4 text-red-400" />
    );
  };

  const getActionTypeIcon = (actionType: string) => {
    return actionType === 'backup' ? (
      <Download className="w-4 h-4 text-neon-purple" />
    ) : (
      <Upload className="w-4 h-4 text-blue-400" />
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-orbitron font-bold text-white flex items-center">
            <Shield className="w-8 h-8 mr-3 text-neon-purple" />
            Backup &amp; Segurança
          </h2>
          <p className="text-futuristic-gray text-sm">
            Gerencie backups e restauração de dados do sistema
          </p>
        </div>
        <Button
          onClick={() => fetchLogs()}
          disabled={loading}
          className="bg-dark-surface hover:bg-dark-surface/80 border border-neon-purple/30"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Activity className="w-4 h-4 mr-2" />
          )}
          Atualizar
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="glass-effect border-red-500/30">
          <div className="p-4 flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-400 font-medium">Erro</p>
              <p className="text-futuristic-gray text-sm">{error}</p>
            </div>
            <Button
              onClick={clearError}
              size="sm"
              variant="ghost"
              className="text-red-400 hover:text-red-300"
            >
              ×
            </Button>
          </div>
        </Card>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="glass-effect hover-lift transition-all duration-300">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-futuristic-gray text-xs sm:text-sm">Último Backup</p>
                <p className="text-sm sm:text-base font-orbitron font-bold text-white">
                  {formatDate(lastBackup)}
                </p>
                <p className="text-xs text-lime-green">
                  {backupAvailable ? 'Disponível' : 'Nenhum backup'}
                </p>
              </div>
              <Database className="w-6 h-6 sm:w-8 sm:h-8 text-neon-purple" />
            </div>
          </div>
        </Card>

        <Card className="glass-effect hover-lift transition-all duration-300">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-futuristic-gray text-xs sm:text-sm">Última Restauração</p>
                <p className="text-sm sm:text-base font-orbitron font-bold text-white">
                  {formatDate(lastRestore)}
                </p>
                <p className="text-xs text-blue-400">
                  Histórico
                </p>
              </div>
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="glass-effect hover-lift transition-all duration-300">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-futuristic-gray text-xs sm:text-sm">Total de Backups</p>
                <p className="text-xl sm:text-2xl font-orbitron font-bold text-white">
                  {stats.totalBackups}
                </p>
                <p className="text-xs text-lime-green">
                  {stats.successfulBackups} bem-sucedidos
                </p>
              </div>
              <Download className="w-6 h-6 sm:w-8 sm:h-8 text-lime-green" />
            </div>
          </div>
        </Card>

        <Card className="glass-effect hover-lift transition-all duration-300">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-futuristic-gray text-xs sm:text-sm">Taxa de Sucesso</p>
                <p className="text-xl sm:text-2xl font-orbitron font-bold text-white">
                  {stats.successRate.toFixed(1)}%
                </p>
                <p className="text-xs text-yellow-400">
                  Confiabilidade
                </p>
              </div>
              <Star className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Card className="glass-effect">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Download className="w-6 h-6 text-neon-purple" />
              <h3 className="text-lg font-orbitron font-bold text-white">
                Criar Backup
              </h3>
            </div>
            <p className="text-futuristic-gray text-sm mb-6">
              Crie um backup completo de todos os dados do sistema (artigos, comentários e feedbacks).
            </p>
            <Button
              onClick={handleCreateBackup}
              disabled={loading}
              className="w-full bg-neon-gradient hover:bg-neon-gradient/80 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Criando Backup...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Fazer Backup Agora
                </>
              )}
            </Button>
          </div>
        </Card>

        <Card className="glass-effect">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Upload className="w-6 h-6 text-blue-400" />
              <h3 className="text-lg font-orbitron font-bold text-white">
                Restaurar Backup
              </h3>
            </div>
            <p className="text-futuristic-gray text-sm mb-6">
              Restaure os dados do último backup disponível. Esta ação substituirá os dados atuais.
            </p>
            <Button
              onClick={() => setShowRestoreModal(true)}
              disabled={loading || !backupAvailable}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              {backupAvailable ? 'Restaurar Backup' : 'Nenhum Backup Disponível'}
            </Button>
          </div>
        </Card>
      </div>

      {/* Backup History */}
      <Card className="glass-effect">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-orbitron font-bold text-white flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-neon-purple" />
              Histórico de Operações
            </h3>
            <span className="text-futuristic-gray text-sm">
              {logs.length} operações registradas
            </span>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-8">
              <Database className="w-12 h-12 text-futuristic-gray mx-auto mb-4" />
              <p className="text-futuristic-gray">Nenhuma operação de backup registrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 bg-dark-surface/30 rounded-lg border border-futuristic-gray/10"
                >
                  <div className="flex items-center space-x-3">
                    {getActionTypeIcon(log.action_type)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-medium capitalize">
                          {log.action_type === 'backup' ? 'Backup' : 'Restauração'}
                        </span>
                        {getStatusIcon(log.success)}
                      </div>
                      <p className="text-futuristic-gray text-sm">
                        {log.records_affected} registros • {formatDate(new Date(log.created_at))}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-futuristic-gray text-xs">
                      {log.details}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Restore Confirmation Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="glass-effect max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
                <h3 className="text-lg font-orbitron font-bold text-white">
                  Confirmar Restauração
                </h3>
              </div>
              
              <div className="space-y-4">
                <p className="text-futuristic-gray text-sm">
                  Esta ação irá <strong className="text-red-400">substituir todos os dados atuais</strong> pelos dados do último backup.
                </p>
                
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                  <p className="text-red-400 text-sm font-medium mb-2">
                    ⚠️ ATENÇÃO: Esta operação não pode ser desfeita!
                  </p>
                  <ul className="text-red-300 text-xs space-y-1">
                    <li>• Todos os artigos atuais serão substituídos</li>
                    <li>• Todos os comentários atuais serão substituídos</li>
                    <li>• Todos os feedbacks atuais serão substituídos</li>
                  </ul>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Digite "RESTAURAR" para confirmar:
                  </label>
                  <input
                    type="text"
                    value={restoreConfirmation}
                    onChange={(e) => setRestoreConfirmation(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-surface border border-futuristic-gray/30 rounded-md text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple"
                    placeholder="Digite RESTAURAR"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <Button
                  onClick={() => {
                    setShowRestoreModal(false);
                    setRestoreConfirmation('');
                  }}
                  variant="ghost"
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleRestoreBackup}
                  disabled={loading || restoreConfirmation !== 'RESTAURAR'}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Restaurando...
                    </>
                  ) : (
                    'Confirmar Restauração'
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};