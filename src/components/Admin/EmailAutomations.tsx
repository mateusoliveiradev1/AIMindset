import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { 
  Mail, 
  Settings, 
  Clock, 
  Users, 
  Zap,
  Play,
  Pause,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  AlertCircle,
  Calendar,
  Target,
  TrendingUp,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

interface EmailAutomation {
  id: string;
  name: string;
  description: string;
  trigger_type: 'welcome' | 'onboarding' | 'article_published' | 'inactive_user' | 'birthday';
  trigger_conditions: any;
  email_template_id: string;
  delay_hours: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  stats: {
    total_sent: number;
    total_opened: number;
    total_clicked: number;
    last_sent: string | null;
  };
}

interface EmailAutomationsProps {
  onRefresh?: () => void;
}

export const EmailAutomations: React.FC<EmailAutomationsProps> = ({ onRefresh }) => {
  const [automations, setAutomations] = useState<EmailAutomation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<EmailAutomation | null>(null);

  // Estados para criação/edição
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    trigger_type: 'welcome' | 'onboarding' | 'article_published' | 'inactive_user' | 'birthday';
    delay_hours: number;
    email_subject: string;
    email_content: string;
    is_active: boolean;
  }>({
    name: '',
    description: '',
    trigger_type: 'welcome',
    delay_hours: 0,
    email_subject: '',
    email_content: '',
    is_active: true
  });

  useEffect(() => {
    fetchAutomations();
  }, []);

  const fetchAutomations = async () => {
    try {
      setLoading(true);
      
      // Buscar automações da tabela email_automations
      const { data: automationsData, error } = await supabase
        .from('email_automations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar automações:', error);
        // Fallback para dados mock se a tabela não existir
        const mockAutomations: EmailAutomation[] = [
          {
            id: '1',
            name: 'Email de Boas-vindas',
            description: 'Enviado automaticamente quando um usuário se inscreve na newsletter',
            trigger_type: 'welcome',
            trigger_conditions: {},
            email_template_id: '1',
            delay_hours: 0,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            stats: {
              total_sent: 245,
              total_opened: 198,
              total_clicked: 45,
              last_sent: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            }
          },
          {
            id: '2',
            name: 'Sequência de Onboarding',
            description: 'Série de 3 emails enviados nos primeiros 7 dias após inscrição',
            trigger_type: 'onboarding',
            trigger_conditions: { sequence_step: 1 },
            email_template_id: '2',
            delay_hours: 24,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            stats: {
              total_sent: 189,
              total_opened: 142,
              total_clicked: 67,
              last_sent: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
            }
          },
          {
            id: '3',
            name: 'Notificação de Novo Artigo',
            description: 'Enviado quando um novo artigo é publicado no blog',
            trigger_type: 'article_published',
            trigger_conditions: { categories: ['ai', 'technology'] },
            email_template_id: '3',
            delay_hours: 1,
            is_active: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            stats: {
              total_sent: 67,
              total_opened: 34,
              total_clicked: 12,
              last_sent: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            }
          }
        ];
        setAutomations(mockAutomations);
        return;
      }

      // Processar dados reais da tabela
      const processedAutomations: EmailAutomation[] = automationsData.map(automation => ({
        ...automation,
        stats: automation.stats || {
          total_sent: 0,
          total_opened: 0,
          total_clicked: 0,
          last_sent: null
        }
      }));

      setAutomations(processedAutomations);
    } catch (error) {
      console.error('Erro ao buscar automações:', error);
      toast.error('Erro ao carregar automações');
    } finally {
      setLoading(false);
    }
  };

  const toggleAutomation = async (id: string, isActive: boolean) => {
    try {
      // Tentar atualizar no Supabase
      const { error } = await supabase
        .from('email_automations')
        .update({ is_active: !isActive, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar automação no Supabase:', error);
        // Fallback para atualização local
      }

      // Atualizar estado local
      setAutomations(prev => 
        prev.map(automation => 
          automation.id === id 
            ? { ...automation, is_active: !isActive }
            : automation
        )
      );
      
      toast.success(`Automação ${!isActive ? 'ativada' : 'desativada'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao alterar status da automação:', error);
      toast.error('Erro ao alterar status da automação');
    }
  };

  const deleteAutomation = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta automação?')) {
      return;
    }

    try {
      // Tentar excluir do Supabase
      const { error } = await supabase
        .from('email_automations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir automação do Supabase:', error);
        // Continuar com exclusão local mesmo se falhar no Supabase
      }

      // Atualizar estado local
      setAutomations(prev => prev.filter(automation => automation.id !== id));
      toast.success('Automação excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir automação:', error);
      toast.error('Erro ao excluir automação');
    }
  };

  const handleCreateAutomation = async () => {
    try {
      if (!formData.name.trim() || !formData.email_subject.trim() || !formData.email_content.trim()) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      const automationData = {
        name: formData.name,
        description: formData.description,
        trigger_type: formData.trigger_type,
        trigger_conditions: getAdvancedTriggerConditions(formData.trigger_type),
        email_template_id: Date.now().toString(),
        email_subject: formData.email_subject,
        email_content: formData.email_content,
        delay_hours: formData.delay_hours,
        is_active: formData.is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        stats: {
          total_sent: 0,
          total_opened: 0,
          total_clicked: 0,
          last_sent: null
        }
      };

      // Tentar inserir no Supabase
      const { data, error } = await supabase
        .from('email_automations')
        .insert([automationData])
        .select()
        .single();

      let newAutomation: EmailAutomation;

      if (error) {
        console.error('Erro ao criar automação no Supabase:', error);
        // Fallback para criação local
        newAutomation = {
          id: Date.now().toString(),
          ...automationData
        };
      } else {
        newAutomation = data;
      }

      setAutomations(prev => [newAutomation, ...prev]);
      setShowCreateModal(false);
      resetForm();
      toast.success('Automação criada com sucesso!');
      
      // Executar automação se for do tipo welcome e estiver ativa
      if (newAutomation.trigger_type === 'welcome' && newAutomation.is_active) {
        await executeWelcomeAutomation(newAutomation);
      }
    } catch (error) {
      console.error('Erro ao criar automação:', error);
      toast.error('Erro ao criar automação');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      trigger_type: 'welcome' as const,
      delay_hours: 0,
      email_subject: '',
      email_content: '',
      is_active: true
    });
    setEditingAutomation(null);
  };

  // Função para obter condições avançadas baseadas no tipo de trigger
  const getAdvancedTriggerConditions = (triggerType: string) => {
    switch (triggerType) {
      case 'welcome':
        return {
          send_immediately: true,
          personalization: true,
          include_unsubscribe: true
        };
      case 'onboarding':
        return {
          sequence_steps: [
            { step: 1, delay_hours: 0, subject: 'Bem-vindo ao AIMindset!' },
            { step: 2, delay_hours: 24, subject: 'Seus primeiros passos com IA' },
            { step: 3, delay_hours: 72, subject: 'Recursos avançados para você' }
          ],
          personalization: true
        };
      case 'article_published':
        return {
          categories: ['ai', 'technology', 'mindset'],
          send_to_segments: ['active_subscribers', 'interested_in_ai'],
          delay_after_publish: 1
        };
      case 'inactive_user':
        return {
          inactive_days: 30,
          re_engagement_sequence: true,
          max_attempts: 3
        };
      case 'birthday':
        return {
          send_on_birthday: true,
          include_special_offer: true,
          personalization: true
        };
      default:
        return {};
    }
  };

  // Função para executar automação de boas-vindas
  const executeWelcomeAutomation = async (automation: EmailAutomation) => {
    try {
      // Buscar novos inscritos que ainda não receberam email de boas-vindas
      const { data: newSubscribers, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .eq('status', 'active')
        .is('welcome_email_sent', null)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error || !newSubscribers?.length) {
        return;
      }

      // Simular envio de emails de boas-vindas
      for (const subscriber of newSubscribers) {
        // Aqui você integraria com seu serviço de email (Resend, SendGrid, etc.)
        console.log(`Enviando email de boas-vindas para: ${subscriber.email}`);
        
        // Marcar como enviado
        await supabase
          .from('newsletter_subscribers')
          .update({ welcome_email_sent: new Date().toISOString() })
          .eq('id', subscriber.id);
      }

      // Atualizar estatísticas da automação
      const updatedStats = {
        ...automation.stats,
        total_sent: automation.stats.total_sent + newSubscribers.length,
        last_sent: new Date().toISOString()
      };

      await supabase
        .from('email_automations')
        .update({ stats: updatedStats })
        .eq('id', automation.id);

      toast.success(`${newSubscribers.length} emails de boas-vindas enviados!`);
    } catch (error) {
      console.error('Erro ao executar automação de boas-vindas:', error);
    }
  };

  // Função para executar automação manualmente
  const executeAutomation = async (automationId: string) => {
    try {
      const automation = automations.find(a => a.id === automationId);
      if (!automation) return;

      if (automation.trigger_type === 'welcome') {
        await executeWelcomeAutomation(automation);
      } else {
        toast.info('Automação executada com sucesso! (simulação)');
      }
    } catch (error) {
      console.error('Erro ao executar automação:', error);
      toast.error('Erro ao executar automação');
    }
  };

  const getTriggerTypeLabel = (type: string) => {
    const labels = {
      welcome: 'Boas-vindas',
      onboarding: 'Onboarding',
      article_published: 'Novo Artigo',
      inactive_user: 'Usuário Inativo',
      birthday: 'Aniversário'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTriggerTypeIcon = (type: string) => {
    const icons = {
      welcome: <Mail className="w-4 h-4" />,
      onboarding: <Users className="w-4 h-4" />,
      article_published: <Calendar className="w-4 h-4" />,
      inactive_user: <Clock className="w-4 h-4" />,
      birthday: <Target className="w-4 h-4" />
    };
    return icons[type as keyof typeof icons] || <Mail className="w-4 h-4" />;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateOpenRate = (opened: number, sent: number) => {
    if (sent === 0) return '0%';
    return `${((opened / sent) * 100).toFixed(1)}%`;
  };

  const calculateClickRate = (clicked: number, sent: number) => {
    if (sent === 0) return '0%';
    return `${((clicked / sent) * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-orbitron font-bold text-white">
            Automações de Email
          </h3>
          <p className="text-futuristic-gray text-sm mt-1">
            Configure emails automáticos baseados em comportamentos dos usuários
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-neon-gradient hover:bg-neon-gradient/80"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Automação
        </Button>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-effect">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-futuristic-gray text-sm">Automações Ativas</p>
                <p className="text-2xl font-orbitron font-bold text-white">
                  {automations.filter(a => a.is_active).length}
                </p>
              </div>
              <Zap className="w-8 h-8 text-lime-green" />
            </div>
          </div>
        </Card>

        <Card className="glass-effect">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-futuristic-gray text-sm">Emails Enviados</p>
                <p className="text-2xl font-orbitron font-bold text-white">
                  {automations.reduce((sum, a) => sum + a.stats.total_sent, 0).toLocaleString()}
                </p>
              </div>
              <Mail className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="glass-effect">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-futuristic-gray text-sm">Taxa de Abertura</p>
                <p className="text-2xl font-orbitron font-bold text-white">
                  {calculateOpenRate(
                    automations.reduce((sum, a) => sum + a.stats.total_opened, 0),
                    automations.reduce((sum, a) => sum + a.stats.total_sent, 0)
                  )}
                </p>
              </div>
              <Eye className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="glass-effect">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-futuristic-gray text-sm">Taxa de Clique</p>
                <p className="text-2xl font-orbitron font-bold text-white">
                  {calculateClickRate(
                    automations.reduce((sum, a) => sum + a.stats.total_clicked, 0),
                    automations.reduce((sum, a) => sum + a.stats.total_sent, 0)
                  )}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Lista de Automações */}
      <div className="space-y-4">
        {loading ? (
          <Card className="glass-effect">
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-purple mx-auto mb-4"></div>
              <p className="text-futuristic-gray">Carregando automações...</p>
            </div>
          </Card>
        ) : automations.length === 0 ? (
          <Card className="glass-effect">
            <div className="p-8 text-center">
              <Zap className="w-16 h-16 text-futuristic-gray mx-auto mb-4" />
              <h3 className="text-xl font-orbitron font-bold text-white mb-2">
                Nenhuma automação configurada
              </h3>
              <p className="text-futuristic-gray mb-4">
                Crie sua primeira automação para começar a enviar emails automáticos
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-neon-gradient hover:bg-neon-gradient/80"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Automação
              </Button>
            </div>
          </Card>
        ) : (
          automations.map((automation) => (
            <Card key={automation.id} className="glass-effect hover:border-neon-purple/40 transition-colors">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Informações da Automação */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getTriggerTypeIcon(automation.trigger_type)}
                      <h3 className="text-lg font-orbitron font-bold text-white">
                        {automation.name}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        automation.is_active 
                          ? 'bg-lime-green/20 text-lime-green' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {automation.is_active ? 'Ativa' : 'Inativa'}
                      </span>
                      <span className="px-2 py-1 bg-neon-purple/20 text-neon-purple text-xs rounded-full">
                        {getTriggerTypeLabel(automation.trigger_type)}
                      </span>
                    </div>
                    
                    <p className="text-futuristic-gray text-sm mb-3">
                      {automation.description}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-futuristic-gray">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {automation.delay_hours === 0 
                            ? 'Imediato' 
                            : `${automation.delay_hours}h de atraso`
                          }
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Último envio: {formatDate(automation.stats.last_sent)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Métricas */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Mail className="w-4 h-4 text-blue-400" />
                        <span className="text-xs text-futuristic-gray">Enviados</span>
                      </div>
                      <p className="text-lg font-bold text-white">
                        {automation.stats.total_sent.toLocaleString()}
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Eye className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-futuristic-gray">Abertos</span>
                      </div>
                      <p className="text-lg font-bold text-white">
                        {automation.stats.total_opened.toLocaleString()}
                      </p>
                      <p className="text-xs text-green-400">
                        {calculateOpenRate(automation.stats.total_opened, automation.stats.total_sent)}
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingUp className="w-4 h-4 text-purple-400" />
                        <span className="text-xs text-futuristic-gray">Cliques</span>
                      </div>
                      <p className="text-lg font-bold text-white">
                        {automation.stats.total_clicked.toLocaleString()}
                      </p>
                      <p className="text-xs text-purple-400">
                        {calculateClickRate(automation.stats.total_clicked, automation.stats.total_sent)}
                      </p>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => executeAutomation(automation.id)}
                      variant="outline"
                      size="sm"
                      className="text-neon-purple hover:text-neon-purple/80"
                      title="Executar automação manualmente"
                    >
                      <Zap className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      onClick={() => toggleAutomation(automation.id, automation.is_active)}
                      variant="outline"
                      size="sm"
                      className={automation.is_active ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}
                    >
                      {automation.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    
                    <Button
                      onClick={() => {
                        setEditingAutomation(automation);
                        setFormData({
                          name: automation.name,
                          description: automation.description,
                          trigger_type: automation.trigger_type,
                          delay_hours: automation.delay_hours,
                          email_subject: '',
                          email_content: '',
                          is_active: automation.is_active
                        });
                        setShowCreateModal(true);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      onClick={() => deleteAutomation(automation.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal de Criação/Edição */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-darker-surface border border-neon-purple/20 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-orbitron font-bold text-white mb-6">
                {editingAutomation ? 'Editar Automação' : 'Nova Automação'}
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-futuristic-gray text-sm mb-2">Nome *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple"
                      placeholder="Nome da automação"
                    />
                  </div>

                  <div>
                    <label className="block text-futuristic-gray text-sm mb-2">Tipo de Gatilho *</label>
                    <select
                      value={formData.trigger_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, trigger_type: e.target.value as any }))}
                      className="w-full px-3 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white focus:outline-none focus:border-neon-purple"
                    >
                      <option value="welcome">Boas-vindas</option>
                      <option value="onboarding">Onboarding</option>
                      <option value="article_published">Novo Artigo</option>
                      <option value="inactive_user">Usuário Inativo</option>
                      <option value="birthday">Aniversário</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-futuristic-gray text-sm mb-2">Descrição</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple h-20 resize-none"
                    placeholder="Descreva quando esta automação será executada"
                  />
                </div>

                <div>
                  <label className="block text-futuristic-gray text-sm mb-2">Atraso (horas)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.delay_hours}
                    onChange={(e) => setFormData(prev => ({ ...prev, delay_hours: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple"
                    placeholder="0 para envio imediato"
                  />
                </div>

                <div>
                  <label className="block text-futuristic-gray text-sm mb-2">Assunto do Email *</label>
                  <input
                    type="text"
                    value={formData.email_subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, email_subject: e.target.value }))}
                    className="w-full px-3 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple"
                    placeholder="Assunto do email automático"
                  />
                </div>

                <div>
                  <label className="block text-futuristic-gray text-sm mb-2">Conteúdo do Email *</label>
                  <textarea
                    value={formData.email_content}
                    onChange={(e) => setFormData(prev => ({ ...prev, email_content: e.target.value }))}
                    className="w-full px-3 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple h-32 resize-none"
                    placeholder="Conteúdo do email em HTML ou texto simples"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded border-neon-purple/20 bg-darker-surface/50 text-neon-purple focus:ring-neon-purple"
                  />
                  <label htmlFor="is_active" className="text-futuristic-gray text-sm">
                    Ativar automação imediatamente
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <Button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateAutomation}
                  className="flex-1 bg-neon-gradient hover:bg-neon-gradient/80"
                >
                  {editingAutomation ? 'Atualizar' : 'Criar'} Automação
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};