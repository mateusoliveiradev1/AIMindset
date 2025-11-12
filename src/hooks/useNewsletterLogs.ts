import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ensureValidLogStatus } from '../utils/newsletterLogs';
import { toast } from 'sonner';

export interface NewsletterLog {
  id: string;
  campaign_id?: string;
  subscriber_id?: string;
  automation_id?: string;
  template_id?: string;
  event_type: 'campaign_sent' | 'campaign_opened' | 'campaign_clicked' | 'campaign_bounced' | 'campaign_unsubscribed' |
             'automation_sent' | 'automation_opened' | 'automation_clicked' | 'automation_bounced' |
             'subscriber_added' | 'subscriber_removed' | 'subscriber_updated' |
             'template_created' | 'template_updated' | 'template_deleted' |
             'system_error' | 'api_call';
  event_data: Record<string, any>;
  user_agent?: string;
  ip_address?: string;
  user_id?: string;
  status: 'success' | 'error' | 'pending' | 'failed';
  error_message?: string;
  created_at: string;
  processed_at?: string;
  
  // Dados relacionados (joins)
  campaign?: {
    id: string;
    name: string;
    subject: string;
  };
  subscriber?: {
    id: string;
    email: string;
    name?: string;
  };
  automation?: {
    id: string;
    name: string;
    trigger_type: string;
  };
  template?: {
    id: string;
    name: string;
    template_type: string;
  };
}

export interface LogFilters {
  event_type?: string;
  status?: string;
  campaign_id?: string;
  subscriber_id?: string;
  automation_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface LogStats {
  total_events: number;
  success_rate: number;
  error_rate: number;
  events_by_type: Record<string, number>;
  events_by_status: Record<string, number>;
  recent_errors: NewsletterLog[];
}

export const useNewsletterLogs = () => {
  const [logs, setLogs] = useState<NewsletterLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [stats, setStats] = useState<LogStats | null>(null);

  // Buscar logs com filtros e paginação
  const fetchLogs = async (filters: LogFilters = {}, page = 1) => {
    setLoading(true);
    try {
      let query = supabase
        .from('newsletter_logs')
        .select(`
          *,
          campaign:newsletter_campaigns(id, name, subject),
          subscriber:newsletter_subscribers(id, email, name),
          automation:email_automations(id, name, trigger_type),
          template:email_templates(id, name, template_type)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters.event_type && filters.event_type !== 'all') {
        query = query.eq('event_type', filters.event_type);
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.campaign_id) {
        query = query.eq('campaign_id', filters.campaign_id);
      }

      if (filters.subscriber_id) {
        query = query.eq('subscriber_id', filters.subscriber_id);
      }

      if (filters.automation_id) {
        query = query.eq('automation_id', filters.automation_id);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      if (filters.search) {
        query = query.or(`
          event_data->>email.ilike.%${filters.search}%,
          error_message.ilike.%${filters.search}%,
          campaign.name.ilike.%${filters.search}%,
          subscriber.email.ilike.%${filters.search}%
        `);
      }

      // Paginação
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setLogs(data || []);
      setTotalCount(count || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      toast.error('Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  };

  // Buscar estatísticas dos logs
  const fetchStats = async (filters: LogFilters = {}) => {
    try {
      let query = supabase
        .from('newsletter_logs')
        .select('event_type, status, created_at, error_message');

      // Aplicar mesmos filtros das estatísticas
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const total_events = data.length;
        const success_count = data.filter(log => log.status === 'success').length;
        const error_count = data.filter(log => log.status === 'error').length;

        const events_by_type = data.reduce((acc, log) => {
          acc[log.event_type] = (acc[log.event_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const events_by_status = data.reduce((acc, log) => {
          acc[log.status] = (acc[log.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Buscar erros recentes
        const { data: recentErrors } = await supabase
          .from('newsletter_logs')
          .select(`
            *,
            campaign:newsletter_campaigns(id, name, subject),
            subscriber:newsletter_subscribers(id, email, name)
          `)
          .eq('status', 'error')
          .order('created_at', { ascending: false })
          .limit(10);

        setStats({
          total_events,
          success_rate: total_events > 0 ? (success_count / total_events) * 100 : 0,
          error_rate: total_events > 0 ? (error_count / total_events) * 100 : 0,
          events_by_type,
          events_by_status,
          recent_errors: recentErrors || []
        });
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      toast.error('Erro ao carregar estatísticas');
    }
  };

  // Criar log de evento
  const createLog = async (logData: Omit<NewsletterLog, 'id' | 'created_at' | 'processed_at'>) => {
    try {
      const validatedStatus = ensureValidLogStatus(logData.status as string);
      const { data, error } = await supabase
        .from('newsletter_logs')
        .insert([{
          ...logData,
          status: validatedStatus,
          user_id: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Erro ao criar log:', error);
      throw error;
    }
  };

  // Marcar log como processado
  const markAsProcessed = async (logId: string) => {
    try {
      const { error } = await supabase
        .from('newsletter_logs')
        .update({ 
          processed_at: new Date().toISOString(),
          status: 'success'
        })
        .eq('id', logId);

      if (error) throw error;

      // Atualizar lista local
      setLogs(prev => prev.map(log => 
        log.id === logId 
          ? { ...log, processed_at: new Date().toISOString(), status: 'success' as const }
          : log
      ));
    } catch (error) {
      console.error('Erro ao marcar log como processado:', error);
      toast.error('Erro ao atualizar log');
    }
  };

  // Limpar logs antigos
  const cleanupOldLogs = async (daysToKeep = 180) => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { error } = await supabase
        .from('newsletter_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .not('event_type', 'in', '(campaign_sent,automation_sent)'); // Manter logs importantes

      if (error) throw error;

      toast.success('Logs antigos removidos com sucesso');
      fetchLogs(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao limpar logs:', error);
      toast.error('Erro ao limpar logs antigos');
    }
  };

  // Exportar logs para CSV
  const exportLogs = async (filters: LogFilters = {}) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('newsletter_logs')
        .select(`
          *,
          campaign:newsletter_campaigns(name, subject),
          subscriber:newsletter_subscribers(email, name),
          automation:email_automations(name, trigger_type),
          template:email_templates(name, template_type)
        `);

      // Aplicar filtros (mesmo código da fetchLogs)
      if (filters.event_type && filters.event_type !== 'all') {
        query = query.eq('event_type', filters.event_type);
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // ... outros filtros

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const csvContent = [
          // Cabeçalho
          'Data,Tipo de Evento,Status,Campanha,Inscrito,Automação,Template,Erro',
          // Dados
          ...data.map(log => [
            new Date(log.created_at).toLocaleString('pt-BR'),
            log.event_type,
            log.status,
            log.campaign?.name || '',
            log.subscriber?.email || '',
            log.automation?.name || '',
            log.template?.name || '',
            log.error_message || ''
          ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `newsletter_logs_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success('Logs exportados com sucesso');
      } else {
        toast.info('Nenhum log encontrado para exportar');
      }
    } catch (error) {
      console.error('Erro ao exportar logs:', error);
      toast.error('Erro ao exportar logs');
    } finally {
      setLoading(false);
    }
  };

  return {
    logs,
    loading,
    totalCount,
    currentPage,
    pageSize,
    stats,
    fetchLogs,
    fetchStats,
    createLog,
    markAsProcessed,
    cleanupOldLogs,
    exportLogs,
    setCurrentPage
  };
};
