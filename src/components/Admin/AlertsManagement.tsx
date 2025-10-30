import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Bell, 
  Mail, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Send,
  Users,
  TestTube
} from 'lucide-react';

interface AlertSubscriber {
  id: number;
  email: string;
  created_at: string;
}

interface AlertsManagementProps {
  className?: string;
}

export default function AlertsManagement({ className = '' }: AlertsManagementProps) {
  const [subscribers, setSubscribers] = useState<AlertSubscriber[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testingAlert, setTestingAlert] = useState(false);

  // Carregar assinantes
  const loadSubscribers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_alert_subscribers');
      
      if (error) {
        console.error('Erro ao carregar assinantes:', error);
        setMessage({ type: 'error', text: 'Erro ao carregar lista de assinantes' });
        return;
      }

      setSubscribers(data || []);
    } catch (error) {
      console.error('Erro ao carregar assinantes:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar lista de assinantes' });
    }
  };

  // Adicionar assinante
  const addSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail.trim()) {
      setMessage({ type: 'error', text: 'Por favor, insira um e-mail válido' });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('manage_alert_subscription', {
        p_email: newEmail.trim(),
        p_action: 'add'
      });

      if (error) {
        console.error('Erro ao adicionar assinante:', error);
        setMessage({ type: 'error', text: 'Erro ao adicionar assinante' });
        return;
      }

      if (data?.success) {
        setMessage({ type: 'success', text: data.message });
        setNewEmail('');
        await loadSubscribers();
      } else {
        setMessage({ type: 'error', text: data?.message || 'Erro ao adicionar assinante' });
      }
    } catch (error) {
      console.error('Erro ao adicionar assinante:', error);
      setMessage({ type: 'error', text: 'Erro ao adicionar assinante' });
    } finally {
      setIsLoading(false);
    }
  };

  // Remover assinante
  const removeSubscriber = async (email: string) => {
    if (!confirm(`Tem certeza que deseja remover ${email} da lista de alertas?`)) {
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('manage_alert_subscription', {
        p_email: email,
        p_action: 'remove'
      });

      if (error) {
        console.error('Erro ao remover assinante:', error);
        setMessage({ type: 'error', text: 'Erro ao remover assinante' });
        return;
      }

      if (data?.success) {
        setMessage({ type: 'success', text: data.message });
        await loadSubscribers();
      } else {
        setMessage({ type: 'error', text: data?.message || 'Erro ao remover assinante' });
      }
    } catch (error) {
      console.error('Erro ao remover assinante:', error);
      setMessage({ type: 'error', text: 'Erro ao remover assinante' });
    } finally {
      setIsLoading(false);
    }
  };

  // Testar sistema de alertas
  const testAlertSystem = async (alertType: 'app_error' | 'security') => {
    console.log('🚀 [ALERT-TEST] Iniciando teste de alerta...', { alertType });
    setTestingAlert(true);
    
    try {
      console.log('🔍 [ALERT-TEST] Iniciando teste de alerta:', { alertType });
      
      const testMessage = alertType === 'app_error' 
        ? 'Teste de erro de aplicação - Sistema de alertas funcionando'
        : 'Teste de alerta de segurança - Sistema de alertas funcionando';

      console.log('📝 [ALERT-TEST] Mensagem de teste:', testMessage);
      console.log('🔗 [ALERT-TEST] Cliente Supabase:', supabase);
      console.log('🔗 [ALERT-TEST] Supabase disponível?', !!supabase);
      console.log('🔗 [ALERT-TEST] Função RPC disponível?', typeof supabase?.rpc);

      // Verificar se o cliente Supabase está funcionando
      if (!supabase) {
        throw new Error('Cliente Supabase não está disponível');
      }

      if (typeof supabase.rpc !== 'function') {
        throw new Error('Função RPC não está disponível no cliente Supabase');
      }

      // Tentar primeiro a função normal, depois a simplificada
      console.log('🚀 [ALERT-TEST] Chamando test_alert_system...');
      let { data, error } = await supabase.rpc('test_alert_system', {
        alert_type: alertType,
        test_message: testMessage
      });

      console.log('📊 [ALERT-TEST] Resultado test_alert_system:', { data, error });

      // Se der erro, tentar a função simplificada
      if (error) {
        console.warn('⚠️ [ALERT-TEST] Função test_alert_system falhou, tentando versão simplificada:', error);
        console.log('🔄 [ALERT-TEST] Chamando test_alert_system_simple...');
        
        const result = await supabase.rpc('test_alert_system_simple', {
          alert_type: alertType,
          test_message: testMessage + ' (versão simplificada)'
        });
        
        console.log('📊 [ALERT-TEST] Resultado test_alert_system_simple:', result);
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('❌ [ALERT-TEST] Erro final ao testar sistema de alertas:', {
          error,
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint,
          errorCode: error.code
        });
        setMessage({ type: 'error', text: `Erro ao testar sistema de alertas: ${error.message}` });
        return;
      }

      console.log('✅ [ALERT-TEST] Dados retornados:', data);

      if (data?.success) {
        console.log('🎉 [ALERT-TEST] Teste executado com sucesso!');
        setMessage({ 
          type: 'success', 
          text: `Teste de alerta enviado com sucesso! Verifique os logs e e-mails dos assinantes.` 
        });
      } else {
        console.warn('⚠️ [ALERT-TEST] Teste executado mas sem sucesso:', data);
        setMessage({ 
          type: 'error', 
          text: `Teste executado mas com problemas. Dados: ${JSON.stringify(data)}` 
        });
      }
    } catch (err) {
      console.error('💥 [ALERT-TEST] Erro inesperado no teste de alertas:', err);
      console.error('💥 [ALERT-TEST] Stack trace:', err instanceof Error ? err.stack : 'N/A');
      setMessage({ 
        type: 'error', 
        text: `Erro inesperado: ${err instanceof Error ? err.message : 'Erro desconhecido'}` 
      });
    } finally {
      setTestingAlert(false);
      console.log('🏁 [ALERT-TEST] Teste de alerta finalizado');
    }
  };

  // Carregar dados ao montar o componente
  useEffect(() => {
    loadSubscribers();
  }, []);

  // Limpar mensagem após 5 segundos
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Bell className="w-6 h-6 text-neon-purple" />
        <h2 className="text-2xl font-bold text-white">Gerenciamento de Alertas</h2>
      </div>

      {/* Mensagem de status */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 border ${
          message.type === 'success' 
            ? 'bg-green-900/20 text-green-400 border-green-500/30' 
            : 'bg-red-900/20 text-red-400 border-red-500/30'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Adicionar novo assinante */}
      <div className="bg-darker-surface/50 border border-neon-purple/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-neon-purple" />
          Adicionar Assinante
        </h3>
        
        <form onSubmit={addSubscriber} className="flex gap-3">
          <div className="flex-1">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Digite o e-mail do administrador"
              className="w-full px-4 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !newEmail.trim()}
            className="px-6 py-2 bg-neon-purple text-white rounded-lg hover:bg-neon-purple/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-300"
          >
            <Mail className="w-4 h-4" />
            {isLoading ? 'Adicionando...' : 'Adicionar'}
          </button>
        </form>
      </div>

      {/* Lista de assinantes */}
      <div className="bg-darker-surface/50 border border-neon-purple/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-neon-purple" />
          Assinantes de Alertas ({subscribers.length})
        </h3>

        {subscribers.length === 0 ? (
          <div className="text-center py-8 text-futuristic-gray">
            <Mail className="w-12 h-12 mx-auto mb-3 text-futuristic-gray/50" />
            <p>Nenhum assinante cadastrado</p>
            <p className="text-sm">Adicione e-mails para receber alertas automáticos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {subscribers.map((subscriber) => (
              <div
                key={subscriber.id}
                className="flex items-center justify-between p-3 bg-darker-surface/30 border border-neon-purple/10 rounded-lg hover:border-neon-purple/30 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-futuristic-gray" />
                  <div>
                    <p className="font-medium text-white">{subscriber.email}</p>
                    <p className="text-sm text-futuristic-gray">
                      Adicionado em {new Date(subscriber.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeSubscriber(subscriber.email)}
                  disabled={isLoading}
                  className="p-2 text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg disabled:opacity-50 transition-all duration-300"
                  title="Remover assinante"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Testar sistema de alertas */}
      <div className="bg-darker-surface/50 border border-neon-purple/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TestTube className="w-5 h-5 text-neon-purple" />
          Testar Sistema de Alertas
        </h3>
        
        <p className="text-futuristic-gray mb-4">
          Envie alertas de teste para verificar se o sistema está funcionando corretamente.
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => testAlertSystem('app_error')}
            disabled={testingAlert}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2 transition-all duration-300"
          >
            <AlertTriangle className="w-4 h-4" />
            {testingAlert ? 'Enviando...' : 'Teste Erro App'}
          </button>
          
          <button
            onClick={() => testAlertSystem('security')}
            disabled={testingAlert}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 transition-all duration-300"
          >
            <Send className="w-4 h-4" />
            {testingAlert ? 'Enviando...' : 'Teste Segurança'}
          </button>
        </div>

        <div className="mt-4 p-3 bg-neon-purple/10 border border-neon-purple/20 rounded-lg">
          <p className="text-sm text-neon-purple">
            <strong>Nota:</strong> Os alertas de teste serão registrados nos logs do sistema e 
            enviados para todos os assinantes cadastrados.
          </p>
        </div>
      </div>

      {/* Informações sobre o sistema */}
      <div className="bg-darker-surface/30 border border-neon-purple/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-3">Como funciona o Sistema de Alertas</h3>
        <div className="space-y-2 text-sm text-futuristic-gray">
          <p>• <strong className="text-neon-purple">Alertas Automáticos:</strong> Enviados quando erros críticos são detectados</p>
          <p>• <strong className="text-neon-purple">Tipos de Alerta:</strong> Erros de aplicação, falhas de segurança, problemas de banco de dados</p>
          <p>• <strong className="text-neon-purple">Entrega:</strong> E-mails são enviados automaticamente para todos os assinantes</p>
          <p>• <strong className="text-neon-purple">Logs:</strong> Todos os alertas são registrados na aba "Logs &amp; Monitoramento"</p>
        </div>
      </div>
    </div>
  );
}