import { useState, useEffect, useCallback } from 'react';
import { supabaseServiceClient, supabase } from '../lib/supabase';
import { toast } from 'sonner';

export interface NewsletterCampaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  template_id?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  scheduled_at?: string;
  sent_at?: string;
  recipient_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  unsubscribed_count: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
  unsubscribe_rate: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
  metadata?: any;
}

export interface CampaignFilters {
  search?: string;
  status?: 'all' | 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  dateRange?: 'all' | 'today' | 'week' | 'month' | 'custom';
  customDateStart?: string;
  customDateEnd?: string;
  tags?: string[];
}

export interface CampaignStats {
  total: number;
  draft: number;
  scheduled: number;
  sent: number;
  totalRecipients: number;
  totalOpened: number;
  totalClicked: number;
  averageOpenRate: number;
  averageClickRate: number;
  sentToday: number;
  sentThisWeek: number;
  sentThisMonth: number;
}

export const useNewsletterCampaigns = () => {
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Buscar campanhas com filtros e paginação
  const fetchCampaigns = useCallback(async (
    filters: CampaignFilters = {},
    page: number = 1
  ) => {
    const requestId = `fetchCampaigns-${JSON.stringify(filters)}-${page}`;
    
    if (!createUniqueRequest(requestId)) {
      return;
    }

    try {
      console.log(`🔄 [${requestId}] Iniciando busca de campanhas...`);
      setLoading(true);
      setError(null);

      let query = supabaseServiceClient
        .from('newsletter_campaigns')
        .select('*', { count: 'exact' });

      // Aplicar filtros
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`);
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Filtros de data
      if (filters.dateRange && filters.dateRange !== 'all') {
        const now = new Date();
        let startDate: Date;

        switch (filters.dateRange) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'custom':
            if (filters.customDateStart) {
              startDate = new Date(filters.customDateStart);
              if (filters.customDateEnd) {
                query = query.lte('created_at', filters.customDateEnd);
              }
            }
            break;
          default:
            startDate = new Date(0);
        }

        if (startDate) {
          query = query.gte('created_at', startDate.toISOString());
        }
      }

      // Paginação
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      // Ordenação
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        console.error(`❌ [${requestId}] Erro ao buscar campanhas:`, error);
        setError('Erro ao carregar campanhas');
        toast.error('Erro ao carregar campanhas');
        return;
      }

      console.log(`✅ [${requestId}] Campanhas carregadas:`, data?.length || 0);
      setCampaigns(data || []);
      setTotalCount(count || 0);
      setCurrentPage(page);
    } catch (err) {
      console.error(`❌ [${requestId}] Erro ao buscar campanhas:`, err);
      setError('Erro ao carregar campanhas');
      toast.error('Erro ao carregar campanhas');
    } finally {
      setLoading(false);
      completeRequest(requestId);
    }
  }, [pageSize]);

  // Obter estatísticas das campanhas
  const getCampaignStats = useCallback(async (): Promise<CampaignStats> => {
    const requestId = `getCampaignStats-${Date.now()}`;
    
    if (!createUniqueRequest(requestId)) {
      return {
        total: 0,
        draft: 0,
        scheduled: 0,
        sent: 0,
        totalRecipients: 0,
        totalOpened: 0,
        totalClicked: 0,
        averageOpenRate: 0,
        averageClickRate: 0,
        sentToday: 0,
        sentThisWeek: 0,
        sentThisMonth: 0
      };
    }

    try {
      console.log(`🔄 [${requestId}] Iniciando busca de estatísticas de campanhas...`);
      
      const { data: allCampaigns, error } = await supabaseServiceClient
        .from('newsletter_campaigns')
        .select('status, created_at, sent_at, recipient_count, opened_count, clicked_count, open_rate, click_rate');

      if (error) {
        console.error(`❌ [${requestId}] Erro ao buscar estatísticas:`, error);
        toast.error('Erro ao carregar estatísticas das campanhas');
        return {
          total: 0,
          draft: 0,
          scheduled: 0,
          sent: 0,
          totalRecipients: 0,
          totalOpened: 0,
          totalClicked: 0,
          averageOpenRate: 0,
          averageClickRate: 0,
          sentToday: 0,
          sentThisWeek: 0,
          sentThisMonth: 0
        };
      }

      console.log(`✅ [${requestId}] Estatísticas carregadas:`, allCampaigns?.length || 0, 'campanhas');

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);

      const total = allCampaigns.length;
      const draft = allCampaigns.filter(c => c.status === 'draft').length;
      const scheduled = allCampaigns.filter(c => c.status === 'scheduled').length;
      const sent = allCampaigns.filter(c => c.status === 'sent').length;

      const totalRecipients = allCampaigns.reduce((sum, c) => sum + (c.recipient_count || 0), 0);
      const totalOpened = allCampaigns.reduce((sum, c) => sum + (c.opened_count || 0), 0);
      const totalClicked = allCampaigns.reduce((sum, c) => sum + (c.clicked_count || 0), 0);

      const sentCampaigns = allCampaigns.filter(c => c.status === 'sent');
      const averageOpenRate = sentCampaigns.length > 0 
        ? sentCampaigns.reduce((sum, c) => sum + (c.open_rate || 0), 0) / sentCampaigns.length
        : 0;

      const averageClickRate = sentCampaigns.length > 0 
        ? sentCampaigns.reduce((sum, c) => sum + (c.click_rate || 0), 0) / sentCampaigns.length
        : 0;

      const sentToday = allCampaigns.filter(c => 
        c.sent_at && new Date(c.sent_at) >= today
      ).length;

      const sentThisWeek = allCampaigns.filter(c => 
        c.sent_at && new Date(c.sent_at) >= weekAgo
      ).length;

      const sentThisMonth = allCampaigns.filter(c => 
        c.sent_at && new Date(c.sent_at) >= monthAgo
      ).length;

      return {
        total,
        draft,
        scheduled,
        sent,
        totalRecipients,
        totalOpened,
        totalClicked,
        averageOpenRate: Math.round(averageOpenRate * 100) / 100,
        averageClickRate: Math.round(averageClickRate * 100) / 100,
        sentToday,
        sentThisWeek,
        sentThisMonth
      };
    } catch (err) {
      console.error(`❌ [${requestId}] Erro ao calcular estatísticas:`, err);
      toast.error('Erro ao calcular estatísticas das campanhas');
      return {
        total: 0,
        draft: 0,
        scheduled: 0,
        sent: 0,
        totalRecipients: 0,
        totalOpened: 0,
        totalClicked: 0,
        averageOpenRate: 0,
        averageClickRate: 0,
        sentToday: 0,
        sentThisWeek: 0,
        sentThisMonth: 0
      };
    } finally {
      completeRequest(requestId);
    }
  }, []);

  // Criar nova campanha
  const createCampaign = useCallback(async (campaignData: Partial<NewsletterCampaign>) => {
    try {
      const { data, error } = await supabase
        .from('newsletter_campaigns')
        .insert([{
          ...campaignData,
          status: 'draft',
          recipient_count: 0,
          delivered_count: 0,
          opened_count: 0,
          clicked_count: 0,
          bounced_count: 0,
          unsubscribed_count: 0,
          open_rate: 0,
          click_rate: 0,
          bounce_rate: 0,
          unsubscribe_rate: 0,
          created_by: 'admin' // TODO: pegar do contexto de autenticação
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar campanha:', error);
        toast.error('Erro ao criar campanha');
        return null;
      }

      setCampaigns(prev => [data, ...prev]);
      toast.success('Campanha criada com sucesso!');
      return data;
    } catch (err) {
      console.error('Erro ao criar campanha:', err);
      toast.error('Erro ao criar campanha');
      return null;
    }
  }, []);

  // Atualizar campanha
  const updateCampaign = useCallback(async (id: string, updates: Partial<NewsletterCampaign>) => {
    try {
      const { data, error } = await supabase
        .from('newsletter_campaigns')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar campanha:', error);
        toast.error('Erro ao atualizar campanha');
        return false;
      }

      setCampaigns(prev => 
        prev.map(campaign => 
          campaign.id === id ? data : campaign
        )
      );

      toast.success('Campanha atualizada com sucesso!');
      return true;
    } catch (err) {
      console.error('Erro ao atualizar campanha:', err);
      toast.error('Erro ao atualizar campanha');
      return false;
    }
  }, []);

  // Agendar campanha
  const scheduleCampaign = useCallback(async (id: string, scheduledAt: string) => {
    try {
      // Primeiro, contar quantos inscritos ativos temos
      const { count: recipientCount } = await supabase
        .from('newsletter_subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { data, error } = await supabase
        .from('newsletter_campaigns')
        .update({
          status: 'scheduled',
          scheduled_at: scheduledAt,
          recipient_count: recipientCount || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao agendar campanha:', error);
        toast.error('Erro ao agendar campanha');
        return false;
      }

      setCampaigns(prev => 
        prev.map(campaign => 
          campaign.id === id ? data : campaign
        )
      );

      toast.success('Campanha agendada com sucesso!');
      return true;
    } catch (err) {
      console.error('Erro ao agendar campanha:', err);
      toast.error('Erro ao agendar campanha');
      return false;
    }
  }, []);

  // Enviar campanha imediatamente
  const sendCampaign = useCallback(async (id: string) => {
    try {
      // Primeiro, contar quantos inscritos ativos temos
      const { count: recipientCount } = await supabase
        .from('newsletter_subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Atualizar status para "sending"
      await supabase
        .from('newsletter_campaigns')
        .update({
          status: 'sending',
          recipient_count: recipientCount || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      // Simular envio (aqui você integraria com um serviço de email real)
      setTimeout(async () => {
        // Simular métricas de entrega
        const deliveredCount = Math.floor((recipientCount || 0) * 0.95); // 95% de entrega
        const openedCount = Math.floor(deliveredCount * 0.25); // 25% de abertura
        const clickedCount = Math.floor(openedCount * 0.1); // 10% de clique
        const bouncedCount = (recipientCount || 0) - deliveredCount;

        const { data, error } = await supabase
          .from('newsletter_campaigns')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            delivered_count: deliveredCount,
            opened_count: openedCount,
            clicked_count: clickedCount,
            bounced_count: bouncedCount,
            open_rate: deliveredCount > 0 ? (openedCount / deliveredCount) * 100 : 0,
            click_rate: deliveredCount > 0 ? (clickedCount / deliveredCount) * 100 : 0,
            bounce_rate: (recipientCount || 0) > 0 ? (bouncedCount / (recipientCount || 1)) * 100 : 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();

        if (!error) {
          setCampaigns(prev => 
            prev.map(campaign => 
              campaign.id === id ? data : campaign
            )
          );
          toast.success('Campanha enviada com sucesso!');
        }
      }, 3000); // Simular 3 segundos de envio

      toast.info('Campanha sendo enviada...');
      return true;
    } catch (err) {
      console.error('Erro ao enviar campanha:', err);
      toast.error('Erro ao enviar campanha');
      return false;
    }
  }, []);

  // Cancelar campanha
  const cancelCampaign = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('newsletter_campaigns')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao cancelar campanha:', error);
        toast.error('Erro ao cancelar campanha');
        return false;
      }

      setCampaigns(prev => 
        prev.map(campaign => 
          campaign.id === id ? data : campaign
        )
      );

      toast.success('Campanha cancelada com sucesso!');
      return true;
    } catch (err) {
      console.error('Erro ao cancelar campanha:', err);
      toast.error('Erro ao cancelar campanha');
      return false;
    }
  }, []);

  // Duplicar campanha
  const duplicateCampaign = useCallback(async (id: string) => {
    try {
      const { data: originalCampaign, error: fetchError } = await supabase
        .from('newsletter_campaigns')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !originalCampaign) {
        toast.error('Erro ao buscar campanha original');
        return null;
      }

      const { data, error } = await supabase
        .from('newsletter_campaigns')
        .insert([{
          name: `${originalCampaign.name} (Cópia)`,
          subject: originalCampaign.subject,
          content: originalCampaign.content,
          template_id: originalCampaign.template_id,
          status: 'draft',
          tags: originalCampaign.tags,
          metadata: originalCampaign.metadata,
          recipient_count: 0,
          delivered_count: 0,
          opened_count: 0,
          clicked_count: 0,
          bounced_count: 0,
          unsubscribed_count: 0,
          open_rate: 0,
          click_rate: 0,
          bounce_rate: 0,
          unsubscribe_rate: 0,
          created_by: 'admin'
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao duplicar campanha:', error);
        toast.error('Erro ao duplicar campanha');
        return null;
      }

      setCampaigns(prev => [data, ...prev]);
      toast.success('Campanha duplicada com sucesso!');
      return data;
    } catch (err) {
      console.error('Erro ao duplicar campanha:', err);
      toast.error('Erro ao duplicar campanha');
      return null;
    }
  }, []);

  // Excluir campanha
  const deleteCampaign = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('newsletter_campaigns')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir campanha:', error);
        toast.error('Erro ao excluir campanha');
        return false;
      }

      setCampaigns(prev => prev.filter(campaign => campaign.id !== id));
      setTotalCount(prev => prev - 1);
      toast.success('Campanha excluída com sucesso!');
      return true;
    } catch (err) {
      console.error('Erro ao excluir campanha:', err);
      toast.error('Erro ao excluir campanha');
      return false;
    }
  }, []);

  // Enviar email de teste
  const sendTestEmail = useCallback(async (campaignId: string, testEmail: string) => {
    try {
      // Aqui você implementaria o envio real do email de teste
      // Por enquanto, apenas simular
      
      toast.success(`Email de teste enviado para ${testEmail}`);
      return true;
    } catch (err) {
      console.error('Erro ao enviar email de teste:', err);
      toast.error('Erro ao enviar email de teste');
      return false;
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return {
    // Estados
    campaigns,
    loading,
    error,
    totalCount,
    currentPage,
    pageSize,

    // Ações
    fetchCampaigns,
    getCampaignStats,
    createCampaign,
    updateCampaign,
    scheduleCampaign,
    sendCampaign,
    cancelCampaign,
    duplicateCampaign,
    deleteCampaign,
    sendTestEmail,

    // Utilitários
    setCurrentPage
  };
};

// Request management system to prevent ERR_ABORTED
const requestsInProgress = new Set<string>();
const requestTimeouts = new Map<string, NodeJS.Timeout>();

const createUniqueRequest = (requestId: string): boolean => {
  if (requestsInProgress.has(requestId)) {
    console.log(`🚫 [${requestId}] Requisição já em andamento, ignorando...`);
    return false;
  }
  
  requestsInProgress.add(requestId);
  
  // Auto-cleanup after 30 seconds to prevent stuck requests
  const timeout = setTimeout(() => {
    requestsInProgress.delete(requestId);
    requestTimeouts.delete(requestId);
    console.log(`⏰ [${requestId}] Requisição removida por timeout`);
  }, 30000);
  
  requestTimeouts.set(requestId, timeout);
  return true;
};

const completeRequest = (requestId: string) => {
  requestsInProgress.delete(requestId);
  const timeout = requestTimeouts.get(requestId);
  if (timeout) {
    clearTimeout(timeout);
    requestTimeouts.delete(requestId);
  }
};