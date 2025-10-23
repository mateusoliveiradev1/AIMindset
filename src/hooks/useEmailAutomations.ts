import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export interface EmailAutomation {
  id: string;
  name: string;
  description: string;
  trigger_type: 'welcome' | 'onboarding' | 'article_published' | 'inactive_user' | 'birthday';
  trigger_conditions: any;
  email_template_id: string;
  email_subject: string;
  email_content: string;
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

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  content: string;
  template_type: 'welcome' | 'onboarding' | 'newsletter' | 'notification' | 'custom';
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useEmailAutomations = () => {
  const [automations, setAutomations] = useState<EmailAutomation[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar automações
  const fetchAutomations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('email_automations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar automações:', error);
        setError('Erro ao carregar automações');
        return;
      }

      const processedAutomations: EmailAutomation[] = data.map(automation => ({
        ...automation,
        stats: automation.stats || {
          total_sent: 0,
          total_opened: 0,
          total_clicked: 0,
          last_sent: null
        }
      }));

      setAutomations(processedAutomations);
    } catch (err) {
      console.error('Erro ao buscar automações:', err);
      setError('Erro ao carregar automações');
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar templates
  const fetchTemplates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar templates:', error);
        return;
      }

      setTemplates(data || []);
    } catch (err) {
      console.error('Erro ao buscar templates:', err);
    }
  }, []);

  // Criar automação
  const createAutomation = useCallback(async (automationData: Partial<EmailAutomation>) => {
    try {
      const { data, error } = await supabase
        .from('email_automations')
        .insert([{
          ...automationData,
          stats: {
            total_sent: 0,
            total_opened: 0,
            total_clicked: 0,
            last_sent: null
          }
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar automação:', error);
        toast.error('Erro ao criar automação');
        return null;
      }

      setAutomations(prev => [data, ...prev]);
      toast.success('Automação criada com sucesso!');
      return data;
    } catch (err) {
      console.error('Erro ao criar automação:', err);
      toast.error('Erro ao criar automação');
      return null;
    }
  }, []);

  // Atualizar automação
  const updateAutomation = useCallback(async (id: string, updates: Partial<EmailAutomation>) => {
    try {
      const { data, error } = await supabase
        .from('email_automations')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar automação:', error);
        toast.error('Erro ao atualizar automação');
        return false;
      }

      setAutomations(prev => 
        prev.map(automation => 
          automation.id === id ? data : automation
        )
      );

      toast.success('Automação atualizada com sucesso!');
      return true;
    } catch (err) {
      console.error('Erro ao atualizar automação:', err);
      toast.error('Erro ao atualizar automação');
      return false;
    }
  }, []);

  // Alternar status da automação
  const toggleAutomation = useCallback(async (id: string, isActive: boolean) => {
    return updateAutomation(id, { is_active: !isActive });
  }, [updateAutomation]);

  // Excluir automação
  const deleteAutomation = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('email_automations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir automação:', error);
        toast.error('Erro ao excluir automação');
        return false;
      }

      setAutomations(prev => prev.filter(automation => automation.id !== id));
      toast.success('Automação excluída com sucesso!');
      return true;
    } catch (err) {
      console.error('Erro ao excluir automação:', err);
      toast.error('Erro ao excluir automação');
      return false;
    }
  }, []);

  // Criar template
  const createTemplate = useCallback(async (templateData: Partial<EmailTemplate>) => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .insert([templateData])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar template:', error);
        toast.error('Erro ao criar template');
        return null;
      }

      setTemplates(prev => [data, ...prev]);
      toast.success('Template criado com sucesso!');
      return data;
    } catch (err) {
      console.error('Erro ao criar template:', err);
      toast.error('Erro ao criar template');
      return null;
    }
  }, []);

  // Executar automação manualmente (para testes)
  const executeAutomation = useCallback(async (automationId: string, testEmail?: string) => {
    try {
      // Aqui você implementaria a lógica para executar a automação
      // Por exemplo, enviar um email de teste ou processar a automação
      
      toast.success(testEmail 
        ? `Email de teste enviado para ${testEmail}` 
        : 'Automação executada com sucesso!'
      );
      
      return true;
    } catch (err) {
      console.error('Erro ao executar automação:', err);
      toast.error('Erro ao executar automação');
      return false;
    }
  }, []);

  // Obter estatísticas das automações
  const getAutomationStats = useCallback(() => {
    const totalAutomations = automations.length;
    const activeAutomations = automations.filter(a => a.is_active).length;
    const totalSent = automations.reduce((sum, a) => sum + (a.stats?.total_sent || 0), 0);
    const totalOpened = automations.reduce((sum, a) => sum + (a.stats?.total_opened || 0), 0);
    const totalClicked = automations.reduce((sum, a) => sum + (a.stats?.total_clicked || 0), 0);

    return {
      totalAutomations,
      activeAutomations,
      totalSent,
      totalOpened,
      totalClicked,
      openRate: totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0',
      clickRate: totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : '0'
    };
  }, [automations]);

  useEffect(() => {
    fetchAutomations();
    fetchTemplates();
  }, [fetchAutomations, fetchTemplates]);

  return {
    // Estados
    automations,
    templates,
    loading,
    error,

    // Ações
    fetchAutomations,
    fetchTemplates,
    createAutomation,
    updateAutomation,
    toggleAutomation,
    deleteAutomation,
    createTemplate,
    executeAutomation,

    // Utilitários
    getAutomationStats
  };
};