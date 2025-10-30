import React, { useState } from 'react';
import Button from './UI/Button';
import Card from './UI/Card';
import { TestTube, Activity, AlertTriangle, Database, User, Mail, ShoppingCart, FileText } from 'lucide-react';
import { logEvent, logAuth, logError, logSystem } from '../lib/logging';
import { toast } from "sonner";

const TestLogging: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleTestAppLog = async (type: 'event' | 'auth' | 'error') => {
    setIsLoading(true);
    try {
      const timestamp = new Date().toISOString();
      
      switch (type) {
        case 'event':
          await logEvent('info', 'TestLogging', 'test_action', {
            test_data: 'Sample test data',
            timestamp,
            component: 'TestLogging'
          });
          toast.success('Log de evento criado com sucesso!');
          break;
          
        case 'auth':
          await logAuth('test_login', 'test-user-123', true, {
            email: 'test@example.com',
            role: 'admin',
            timestamp
          });
          toast.success('Log de autenticação criado com sucesso!');
          break;
          
        case 'error':
          await logError('Test error message', 'TestLogging', 'test_error_action', {
            error_type: 'test_error',
            timestamp,
            stack: 'Test stack trace'
          });
          toast.success('Log de erro criado com sucesso!');
          break;
      }
    } catch (error) {
      console.error('Erro ao criar log:', error);
      toast.error('Erro ao criar log');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestSystemLog = async (type: 'info' | 'warning' | 'error') => {
    setIsLoading(true);
    try {
      const timestamp = new Date().toISOString();
      
      switch (type) {
        case 'info':
          await logSystem('general', 'Test system info log', {
            test_data: 'Sample system info',
            timestamp,
            component: 'TestLogging'
          });
          toast.success('Log de sistema (info) criado com sucesso!');
          break;
          
        case 'warning':
          await logSystem('general', 'Test system warning log', {
            test_data: 'Sample system warning',
            timestamp,
            component: 'TestLogging'
          });
          toast.success('Log de sistema (warning) criado com sucesso!');
          break;
          
        case 'error':
          await logSystem('general', 'Test system error log', {
            test_data: 'Sample system error',
            timestamp,
            component: 'TestLogging'
          });
          toast.success('Log de sistema (error) criado com sucesso!');
          break;
      }
    } catch (error) {
      console.error('Erro ao criar log do sistema:', error);
      toast.error('Erro ao criar log do sistema');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkTest = async () => {
    setIsLoading(true);
    try {
      const timestamp = new Date().toISOString();
      
      // Criar múltiplos logs de diferentes tipos
      const promises = [
        // App Logs
        logEvent('info', 'TestLogging', 'user_registration', { user_id: 'bulk-test-1', email: 'user1@test.com', timestamp }),
        logEvent('info', 'TestLogging', 'article_published', { article_id: 'article-123', title: 'Test Article', timestamp }),
        logEvent('info', 'TestLogging', 'newsletter_sent', { campaign_id: 'campaign-456', recipients: 150, timestamp }),
        logAuth('login_success', 'bulk-test-2', true, { email: 'admin@test.com', role: 'admin', timestamp }),
        logAuth('logout', 'bulk-test-2', true, { email: 'admin@test.com', role: 'admin', timestamp }),
        logError('Database connection failed', 'DatabaseService', 'connection_error', { error_code: 'DB_001', timestamp }),
        
        // System Logs
        logSystem('general', 'Sistema iniciado com sucesso', { version: '1.0.0', timestamp }),
        logSystem('performance', 'Uso de memória alto detectado', { memory_usage: 85, timestamp }),
        logSystem('api', 'Falha na conexão com serviço externo', { service: 'email-api', timestamp }),
        logSystem('backup', 'Backup automático concluído', { backup_size: '2.5GB', timestamp })
      ];
      
      await Promise.all(promises);
      toast.success('Logs em massa criados com sucesso! (10 logs)');
    } catch (error) {
      console.error('Erro ao criar logs em massa:', error);
      toast.error('Erro ao criar logs em massa');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-orbitron font-bold text-white flex items-center">
            <TestTube className="w-8 h-8 mr-3 text-neon-purple" />
            Test Logging
          </h2>
          <p className="text-futuristic-gray text-sm mt-1">
            Teste a inserção de logs para verificar o funcionamento do sistema
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* App Logs Tests */}
        <Card className="glass-effect">
          <div className="p-6">
            <h3 className="text-xl font-orbitron font-bold text-white mb-4 flex items-center">
              <Activity className="w-6 h-6 mr-2 text-neon-purple" />
              App Logs
            </h3>
            <p className="text-futuristic-gray text-sm mb-6">
              Teste os logs de eventos da aplicação (tabela app_logs)
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={() => handleTestAppLog('event')}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <User className="w-4 h-4 mr-2" />
                Testar Log de Evento
              </Button>
              
              <Button
                onClick={() => handleTestAppLog('auth')}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <User className="w-4 h-4 mr-2" />
                Testar Log de Autenticação
              </Button>
              
              <Button
                onClick={() => handleTestAppLog('error')}
                disabled={isLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Testar Log de Erro
              </Button>
            </div>
          </div>
        </Card>

        {/* System Logs Tests */}
        <Card className="glass-effect">
          <div className="p-6">
            <h3 className="text-xl font-orbitron font-bold text-white mb-4 flex items-center">
              <Database className="w-6 h-6 mr-2 text-neon-purple" />
              System Logs
            </h3>
            <p className="text-futuristic-gray text-sm mb-6">
              Teste os logs do sistema (tabela system_logs)
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={() => handleTestSystemLog('info')}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <FileText className="w-4 h-4 mr-2" />
                Testar Log Info
              </Button>
              
              <Button
                onClick={() => handleTestSystemLog('warning')}
                disabled={isLoading}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Testar Log Warning
              </Button>
              
              <Button
                onClick={() => handleTestSystemLog('error')}
                disabled={isLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Testar Log Error
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Bulk Test */}
      <Card className="glass-effect">
        <div className="p-6">
          <h3 className="text-xl font-orbitron font-bold text-white mb-4 flex items-center">
            <TestTube className="w-6 h-6 mr-2 text-neon-purple" />
            Teste em Massa
          </h3>
          <p className="text-futuristic-gray text-sm mb-6">
            Crie múltiplos logs de diferentes tipos para testar o sistema completo
          </p>
          
          <Button
            onClick={handleBulkTest}
            disabled={isLoading}
            className="w-full bg-neon-gradient hover:bg-neon-gradient/80 text-white"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Criando logs...
              </>
            ) : (
              <>
                <TestTube className="w-4 h-4 mr-2" />
                Criar 10 Logs de Teste
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Instructions */}
      <Card className="glass-effect">
        <div className="p-6">
          <h3 className="text-xl font-orbitron font-bold text-white mb-4">
            Instruções
          </h3>
          <div className="text-futuristic-gray text-sm space-y-2">
            <p>• Use os botões acima para testar a inserção de logs</p>
            <p>• Após criar logs, verifique as abas "App Logs" e "System Logs"</p>
            <p>• Os logs devem aparecer automaticamente devido ao auto-refresh</p>
            <p>• Use o "Teste em Massa" para criar vários logs de uma vez</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TestLogging;