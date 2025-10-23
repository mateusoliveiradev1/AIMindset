import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, supabaseServiceClient } from '../lib/supabase';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 10;

export interface NewsletterSubscriber {
  id: string;
  email: string;
  status: 'active' | 'inactive';
  subscribed_at: string;
  unsubscribed_at?: string;
}

export interface NewsletterCampaign {
  id: string;
  subject: string;
  content: string;
  sent_at: string;
  recipient_count: number; // Corrigido: era sent_count
  opened_count: number;
  clicked_count: number;
  status: 'draft' | 'sent' | 'scheduled';
  created_at?: string;
  scheduled_at?: string;
  template_id?: string;
}

export interface CampaignTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  preview_text?: string;
  created_at: string;
}

export interface CampaignDraft {
  subject: string;
  content: string;
  preview_text?: string;
  template_id?: string;
  scheduled_at?: string;
  send_immediately: boolean;
}

export interface NewsletterStats {
  totalSubscribers: number;
  activeSubscribers: number;
  inactiveSubscribers: number;
  newToday: number;
  newSubscribersWeek: number;
  newSubscribersMonth: number;
  growthRate: number;
  totalCampaigns: number;
  campaignsThisMonth: number;
  openRate: string;
  clickRate: string;
  weeklyGrowth: number;
  totalNewslettersSent: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

// Utility function for debouncing
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Utility function for retry with exponential backoff
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error.message === 'Request cancelled' || error.code === 'PGRST116') {
        throw error;
      }
      
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`🔄 Tentativa ${attempt + 1} falhou, tentando novamente em ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

export const useNewsletter = () => {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [stats, setStats] = useState<NewsletterStats>({
    totalSubscribers: 0,
    activeSubscribers: 0,
    inactiveSubscribers: 0,
    newToday: 0,
    newSubscribersWeek: 0,
    newSubscribersMonth: 0,
    growthRate: 0,
    totalCampaigns: 0,
    campaignsThisMonth: 0,
    openRate: '0.0',
    clickRate: '0.0',
    weeklyGrowth: 0,
    totalNewslettersSent: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  
  const [campaignPagination, setCampaignPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  // Request tracking to prevent simultaneous calls
  const requestsInProgress = useRef(new Set<string>());
  const requestTimeouts = useRef(new Map<string, NodeJS.Timeout>());

  // Enhanced request management
  const createUniqueRequest = (requestId: string): boolean => {
    if (requestsInProgress.current.has(requestId)) {
      console.log(`🚫 [${requestId}] Requisição já em andamento, ignorando...`);
      return false;
    }
    
    requestsInProgress.current.add(requestId);
    
    // Set timeout to auto-cleanup stuck requests
    const timeout = setTimeout(() => {
      requestsInProgress.current.delete(requestId);
      requestTimeouts.current.delete(requestId);
      console.log(`⏰ [${requestId}] Request timeout - cleaned up`);
    }, 30000); // 30 seconds timeout
    
    requestTimeouts.current.set(requestId, timeout);
    return true;
  };

  const completeRequest = (requestId: string) => {
    requestsInProgress.current.delete(requestId);
    const timeout = requestTimeouts.current.get(requestId);
    if (timeout) {
      clearTimeout(timeout);
      requestTimeouts.current.delete(requestId);
    }
  };

  // Enhanced fetchSubscribers with better error handling
  const fetchSubscribers = useCallback(async (page = 1, searchTerm = '', statusFilter = 'all') => {
    const requestId = `fetchSubscribers_${page}_${searchTerm}_${statusFilter}`;
    
    if (!createUniqueRequest(requestId)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log(`🚀 [${requestId}] Iniciando busca de assinantes`);

      // Always use service client for admin operations
      const client = supabaseServiceClient;
      
      let query = client.from('newsletter_subscribers').select('*', { count: 'exact' });

      // Apply search filter
      if (searchTerm) {
        query = query.or(`email.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`);
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Apply pagination
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to).order('subscribed_at', { ascending: false });

      const result = await query;

      if (result.error) {
        throw result.error;
      }

      if (result.data) {
        setSubscribers(result.data);
        setPagination({
          currentPage: page,
          totalItems: result.count || 0,
          totalPages: Math.ceil((result.count || 0) / ITEMS_PER_PAGE),
          itemsPerPage: ITEMS_PER_PAGE
        });
        console.log(`✅ [${requestId}] Assinantes carregados com sucesso:`, result.data.length);
      }
    } catch (err: any) {
      console.error(`❌ [${requestId}] Erro:`, err);
      setError('Erro ao carregar assinantes');
      toast.error('Erro ao carregar assinantes');
    } finally {
      setLoading(false);
      completeRequest(requestId);
    }
  }, []);

  // Enhanced fetchCampaigns with better error handling
  const fetchCampaigns = useCallback(async (page = 1) => {
    const requestId = `fetchCampaigns_${page}`;
    
    if (!createUniqueRequest(requestId)) {
      return;
    }

    try {
      setCampaignLoading(true);
      setError(null);
      console.log(`🚀 [${requestId}] Iniciando busca de campanhas`);

      // Always use service client for admin operations
      const client = supabaseServiceClient;
      
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const result = await client
        .from('newsletter_campaigns')
        .select('*', { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false });

      if (result.error) {
        throw result.error;
      }

      if (result.data) {
        setCampaigns(result.data);
        setCampaignPagination({
          currentPage: page,
          totalItems: result.count || 0,
          totalPages: Math.ceil((result.count || 0) / ITEMS_PER_PAGE),
          itemsPerPage: ITEMS_PER_PAGE
        });
        console.log(`✅ [${requestId}] Campanhas carregadas com sucesso:`, result.data.length);
      }
    } catch (err: any) {
      console.error(`❌ [${requestId}] Erro:`, err);
      setError('Erro ao carregar campanhas');
      toast.error('Erro ao carregar campanhas');
    } finally {
      setCampaignLoading(false);
      completeRequest(requestId);
    }
  }, []);

  // Enhanced calculateStats with sequential execution to prevent ERR_ABORTED
  const calculateStats = useCallback(async () => {
    const requestId = 'calculateStats';
    
    if (!createUniqueRequest(requestId)) {
      return;
    }

    try {
      console.log(`🚀 [${requestId}] Iniciando cálculo de estatísticas`);
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const client = supabaseServiceClient;
      const stats: NewsletterStats = {
        totalSubscribers: 0,
        activeSubscribers: 0,
        inactiveSubscribers: 0,
        newToday: 0,
        newSubscribersWeek: 0,
        newSubscribersMonth: 0,
        growthRate: 0,
        totalCampaigns: 0,
        campaignsThisMonth: 0,
        openRate: '0.0',
        clickRate: '0.0',
        weeklyGrowth: 0,
        totalNewslettersSent: 0
      };

      // SOLUÇÃO DEFINITIVA: Usar apenas uma consulta para obter todos os dados necessários
      console.log('📊 Obtendo todos os dados de assinantes de uma vez...');
      const subscribersResult = await client.from('newsletter_subscribers').select('*');
      
      if (subscribersResult.error) {
        console.error('Erro ao buscar assinantes:', subscribersResult.error);
        throw subscribersResult.error;
      }

      const allSubscribers = subscribersResult.data || [];
      
      // Calcular estatísticas localmente para evitar múltiplas consultas
      stats.totalSubscribers = allSubscribers.length;
      stats.activeSubscribers = allSubscribers.filter(s => s.status === 'active').length;
      stats.inactiveSubscribers = allSubscribers.filter(s => s.status === 'inactive').length;
      
      const todayISO = today.toISOString();
      const weekAgoISO = weekAgo.toISOString();
      const monthAgoISO = monthAgo.toISOString();
      
      stats.newToday = allSubscribers.filter(s => s.subscribed_at >= todayISO).length;
      stats.newSubscribersWeek = allSubscribers.filter(s => s.subscribed_at >= weekAgoISO).length;
      stats.newSubscribersMonth = allSubscribers.filter(s => s.subscribed_at >= monthAgoISO).length;

      await new Promise(resolve => setTimeout(resolve, 200));

      console.log('📊 Obtendo todos os dados de campanhas de uma vez...');
      const campaignsResult = await client.from('newsletter_campaigns').select('*');
      
      if (campaignsResult.error) {
        console.error('Erro ao buscar campanhas:', campaignsResult.error);
        throw campaignsResult.error;
      }

      const allCampaigns = campaignsResult.data || [];
      
      // Calcular estatísticas de campanhas localmente
      stats.totalCampaigns = allCampaigns.length;
      stats.campaignsThisMonth = allCampaigns.filter(c => c.created_at && c.created_at >= thisMonth.toISOString()).length;
      
      const sentCampaigns = allCampaigns.filter(c => c.status === 'sent');
      stats.totalNewslettersSent = sentCampaigns.reduce((sum, campaign) => sum + (campaign.recipient_count || 0), 0);
      
      if (sentCampaigns.length > 0) {
        const totalSent = sentCampaigns.reduce((sum, campaign) => sum + (campaign.recipient_count || 0), 0);
        const totalOpened = sentCampaigns.reduce((sum, campaign) => sum + (campaign.opened_count || 0), 0);
        const totalClicked = sentCampaigns.reduce((sum, campaign) => sum + (campaign.clicked_count || 0), 0);
        
        stats.openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0.0';
        stats.clickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : '0.0';
      }

      // Calcular crescimento mensal
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      
      const lastMonthSubscribers = allSubscribers.filter(s => 
        s.subscribed_at >= lastMonthStart.toISOString() && 
        s.subscribed_at < lastMonthEnd.toISOString()
      ).length;
      
      stats.growthRate = lastMonthSubscribers > 0 ? 
        ((stats.newSubscribersMonth - lastMonthSubscribers) / lastMonthSubscribers * 100) : 0;

      stats.weeklyGrowth = stats.totalSubscribers > 0 ? 
        (stats.newSubscribersWeek / stats.totalSubscribers * 100) : 0;

      setStats(stats);
      console.log(`✅ [${requestId}] Estatísticas calculadas com sucesso:`, stats);
      
    } catch (err: any) {
      console.error(`❌ [${requestId}] Erro ao calcular estatísticas:`, err);
      setError('Erro ao calcular estatísticas');
      toast.error('Erro ao calcular estatísticas');
    } finally {
      completeRequest(requestId);
    }
  }, []);

  // Subscribe user to newsletter
  const subscribe = async (email: string, name?: string): Promise<boolean> => {
    try {
      setError(null);
      
      // Always use service client for admin operations
      const client = supabaseServiceClient;
      
      // Check if email already exists
      const { data: existing } = await client
        .from('newsletter_subscribers')
        .select('id, status')
        .eq('email', email)
        .single();

      if (existing) {
        if (existing.status === 'active') {
          setError('Este email já está inscrito na newsletter');
          return false;
        } else {
          // Reactivate subscription
          const { error: updateError } = await client
            .from('newsletter_subscribers')
            .update({ 
              status: 'active', 
              subscribed_at: new Date().toISOString(),
              unsubscribed_at: null 
            })
            .eq('id', existing.id);

          if (updateError) {
            throw updateError;
          }
        }
      } else {
        // Create new subscription
        const subscriptionData = {
          email,
          status: 'active' as const,
          subscribed_at: new Date().toISOString()
        };

        const { error: insertError } = await client
          .from('newsletter_subscribers')
          .insert([subscriptionData]);

        if (insertError) {
          throw insertError;
        }
      }

      toast.success('Inscrição realizada com sucesso!');
      await calculateStats();
      return true;

    } catch (err: any) {
      console.error('Erro ao inscrever:', err);
      const errorMessage = err.message || 'Erro ao realizar inscrição';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  };

  // Update subscriber status
  const updateSubscriberStatus = async (id: string, status: 'active' | 'inactive'): Promise<boolean> => {
    try {
      const updateData: any = { status };
      
      if (status === 'inactive') {
        updateData.unsubscribed_at = new Date().toISOString();
      } else {
        updateData.unsubscribed_at = null;
        updateData.subscribed_at = new Date().toISOString();
      }

      // Always use service client for admin operations
      const { error } = await supabaseServiceClient
        .from('newsletter_subscribers')
        .update(updateData)
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast.success(`Status atualizado para ${status === 'active' ? 'ativo' : 'inativo'}`);
      await fetchSubscribers(pagination.currentPage, pagination.itemsPerPage);
      await calculateStats();
      return true;

    } catch (err: any) {
      console.error('Erro ao atualizar status:', err);
      toast.error('Erro ao atualizar status do inscrito');
      return false;
    }
  };

  // Delete subscriber
  const deleteSubscriber = async (id: string): Promise<boolean> => {
    try {
      // Always use service client for admin operations
      const { error } = await supabaseServiceClient
        .from('newsletter_subscribers')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast.success('Inscrito removido com sucesso');
      await fetchSubscribers(pagination.currentPage, pagination.itemsPerPage);
      await calculateStats();
      return true;

    } catch (err: any) {
      console.error('Erro ao remover inscrito:', err);
      toast.error('Erro ao remover inscrito');
      return false;
    }
  };

  // Fetch campaign templates
  const fetchTemplates = useCallback(async () => {
    try {
      // Always use service client for admin operations
      const { data, error } = await supabaseServiceClient
        .from('newsletter_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setTemplates(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar templates:', err);
      setError(err.message || 'Erro ao buscar templates');
    }
  }, []);

  // Create campaign template
  const createTemplate = async (template: Omit<CampaignTemplate, 'id' | 'created_at'>): Promise<boolean> => {
    try {
      setCampaignLoading(true);
      setError(null);

      // Always use service client for admin operations
      const { error } = await supabaseServiceClient
        .from('newsletter_templates')
        .insert({
          ...template,
          created_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      toast.success('Template criado com sucesso!');
      await fetchTemplates();
      return true;

    } catch (err: any) {
      console.error('Erro ao criar template:', err);
      setError(err.message || 'Erro ao criar template');
      toast.error('Erro ao criar template');
      return false;
    } finally {
      setCampaignLoading(false);
    }
  };

  // Send campaign to all active subscribers
  const sendCampaign = async (campaignData: CampaignDraft): Promise<boolean> => {
    try {
      setCampaignLoading(true);
      setError(null);

      // Always use service client for admin operations
      const client = supabaseServiceClient;

      // Get all active subscribers
      const { data: activeSubscribers, error: subscribersError } = await client
        .from('newsletter_subscribers')
        .select('email, id')
        .eq('status', 'active');

      if (subscribersError) {
        throw subscribersError;
      }

      if (!activeSubscribers || activeSubscribers.length === 0) {
        toast.error('Nenhum inscrito ativo encontrado');
        return false;
      }

      // Create campaign record
      const campaignId = crypto.randomUUID();
      const now = new Date().toISOString();
      
      const { error: campaignError } = await client
        .from('newsletter_campaigns')
        .insert({
          id: campaignId,
          subject: campaignData.subject,
          content: campaignData.content,
          sent_count: activeSubscribers.length,
          opened_count: 0,
          clicked_count: 0,
          status: campaignData.send_immediately ? 'sent' : 'scheduled',
          sent_at: campaignData.send_immediately ? now : campaignData.scheduled_at,
          created_at: now,
          template_id: campaignData.template_id
        });

      if (campaignError) {
        throw campaignError;
      }

      // Log the campaign
      const { error: logError } = await client
        .from('newsletter_logs')
        .insert({
          campaign_id: campaignId,
          subject: campaignData.subject,
          content: campaignData.content,
          sent_at: campaignData.send_immediately ? now : campaignData.scheduled_at,
          sent_count: activeSubscribers.length,
          opened_count: 0,
          clicked_count: 0,
          status: campaignData.send_immediately ? 'sent' : 'scheduled'
        });

      if (logError) {
        throw logError;
      }

      // Here you would integrate with your email service (Resend, SendGrid, etc.)
      // For now, we'll just simulate the sending
      if (campaignData.send_immediately) {
        console.log(`Enviando campanha "${campaignData.subject}" para ${activeSubscribers.length} inscritos`);
        toast.success(`Campanha enviada para ${activeSubscribers.length} inscritos!`);
      } else {
        console.log(`Campanha "${campaignData.subject}" agendada para ${campaignData.scheduled_at}`);
        toast.success('Campanha agendada com sucesso!');
      }
      
      // Refresh campaigns and stats
      await fetchCampaigns();
      await calculateStats();
      
      return true;

    } catch (err: any) {
      console.error('Erro ao enviar campanha:', err);
      setError(err.message || 'Erro ao enviar campanha');
      toast.error('Erro ao enviar campanha');
      return false;
    } finally {
      setCampaignLoading(false);
    }
  };

  // Send test email
  const sendTestEmail = async (email: string, subject: string, content: string): Promise<boolean> => {
    try {
      setCampaignLoading(true);
      setError(null);

      // Here you would integrate with your email service to send a test email
      console.log(`Enviando email de teste para ${email} com assunto "${subject}"`);
      
      toast.success(`Email de teste enviado para ${email}!`);
      return true;

    } catch (err: any) {
      console.error('Erro ao enviar email de teste:', err);
      setError(err.message || 'Erro ao enviar email de teste');
      toast.error('Erro ao enviar email de teste');
      return false;
    } finally {
      setCampaignLoading(false);
    }
  };

  // Export subscribers to CSV
  const exportSubscribers = async (): Promise<boolean> => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        toast.error('Nenhum inscrito para exportar');
        return false;
      }

      // Create CSV content
      const headers = ['Email', 'Status', 'Data de Inscrição', 'Data de Cancelamento'];
      const csvContent = [
        headers.join(','),
        ...data.map(subscriber => [
          subscriber.email,
          subscriber.status === 'active' ? 'Ativo' : 'Inativo',
          new Date(subscriber.subscribed_at).toLocaleDateString('pt-BR'),
          subscriber.unsubscribed_at ? new Date(subscriber.unsubscribed_at).toLocaleDateString('pt-BR') : ''
        ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Lista de inscritos exportada com sucesso!');
      return true;

    } catch (err: any) {
      console.error('Erro ao exportar inscritos:', err);
      toast.error('Erro ao exportar lista de inscritos');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      console.log('🚀 [useNewsletter] Inicializando dados da newsletter...');
      
      try {
        // Initialize data sequentially to prevent conflicts
        await fetchSubscribers();
        await new Promise(resolve => setTimeout(resolve, 300));
        
        await fetchCampaigns();
        await new Promise(resolve => setTimeout(resolve, 300));
        
        await fetchTemplates();
        await new Promise(resolve => setTimeout(resolve, 300));
        
        await calculateStats();
        
        console.log('✅ [useNewsletter] Inicialização completa');
      } catch (error) {
        console.error('❌ [useNewsletter] Erro na inicialização:', error);
      }
    };

    initializeData();
  }, []); // Remove dependencies to prevent infinite loops

  // Cleanup function
  useEffect(() => {
    return () => {
      requestsInProgress.current.clear();
    };
  }, []);

  return {
    // Data
    subscribers,
    campaigns,
    templates,
    stats,
    pagination,
    campaignPagination,
    
    // State
    loading,
    campaignLoading,
    error,
    
    // Actions
    subscribe,
    fetchSubscribers,
    updateSubscriberStatus,
    deleteSubscriber,
    sendCampaign,
    sendTestEmail,
    createTemplate,
    fetchTemplates,
    fetchCampaigns,
    exportSubscribers,
    calculateStats,
    
    // Utilities
    refreshData: async () => {
      console.log('🔄 [useNewsletter] Atualizando dados...');
      try {
        await fetchSubscribers();
        await new Promise(resolve => setTimeout(resolve, 300));
        await fetchCampaigns();
        await new Promise(resolve => setTimeout(resolve, 300));
        await calculateStats();
        console.log('✅ [useNewsletter] Dados atualizados');
      } catch (error) {
        console.error('❌ [useNewsletter] Erro na atualização:', error);
      }
    }
  };
};