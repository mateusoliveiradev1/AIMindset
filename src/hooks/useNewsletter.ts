import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, supabaseServiceClient } from '../lib/supabase';
import { toast } from 'sonner';
import { supabaseWithRetry } from '../utils/supabaseRetry';

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
  open_rate?: number;
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
  averageOpenRate: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

// Debounce function
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

// Enhanced retry with exponential backoff and jitter
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff with jitter
      const jitter = Math.random() * 0.3; // 0-30% jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) * (1 + jitter);
      
      console.warn(`Attempt ${attempt} failed, retrying in ${Math.round(delay)}ms...`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

// Supabase initialization checker
const waitForSupabaseReady = async (maxWait: number = 5000): Promise<boolean> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    try {
      // Test connection with a simple query
      const { error } = await supabaseServiceClient
        .from('newsletter_subscribers')
        .select('id')
        .limit(1);
      
      if (!error) {
        return true;
      }
    } catch (e) {
      // Continue waiting
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return false;
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
    averageOpenRate: 0,
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

  // Enhanced request tracking with cache
  const requestsInProgress = useRef(new Set<string>());
  const requestTimeouts = useRef(new Map<string, NodeJS.Timeout>());
  const requestCache = useRef(new Map<string, { data: any; timestamp: number }>());
  const initializationPromise = useRef<Promise<boolean> | null>(null);

  // Cache duration (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  // Enhanced request management with cache
  const createUniqueRequest = (requestId: string): boolean => {
    if (requestsInProgress.current.has(requestId)) {
      return false;
    }
    
    requestsInProgress.current.add(requestId);
    
    // Set timeout to auto-cleanup stuck requests
    const timeout = setTimeout(() => {
      requestsInProgress.current.delete(requestId);
      requestTimeouts.current.delete(requestId);
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

  // Cache management
  const getCachedData = (key: string) => {
    const cached = requestCache.current.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  };

  const setCachedData = (key: string, data: any) => {
    requestCache.current.set(key, {
      data,
      timestamp: Date.now()
    });
  };

  // Ensure Supabase is ready before making requests
  const ensureSupabaseReady = async (): Promise<boolean> => {
    if (!initializationPromise.current) {
      initializationPromise.current = waitForSupabaseReady();
    }
    return await initializationPromise.current;
  };

  // Enhanced fetchSubscribers with all improvements
  const fetchSubscribers = useCallback(async (page = 1, statusFilter: 'all' | 'active' | 'inactive' = 'all', searchTerm = '') => {
    const requestId = `fetchSubscribers_${page}_${statusFilter}_${searchTerm}`;
    const cacheKey = `subscribers_${page}_${statusFilter}_${searchTerm}`;
    
    // Check cache first
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      setSubscribers(cachedData.subscribers);
      setPagination(cachedData.pagination);
      return;
    }
    
    if (!createUniqueRequest(requestId)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Ensure Supabase is ready
      const isReady = await ensureSupabaseReady();
      if (!isReady) {
        throw new Error('Supabase connection not ready');
      }

      // Add small delay to prevent race conditions
      await new Promise(resolve => setTimeout(resolve, 100));

      const fetchWithRetry = async () => {
        let query = supabaseServiceClient
          .from('newsletter_subscribers')
          .select('*', { count: 'exact' });

        if (searchTerm) {
          query = query.ilike('email', `%${searchTerm}%`);
        }

        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }

        const from = (page - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;
        query = query.range(from, to).order('subscribed_at', { ascending: false });

        return query;
      };

      const result = await retryWithBackoff(fetchWithRetry, 3, 1000);

      if (result.error) {
        throw result.error;
      }

      if (result.data) {
        const responseData = {
          subscribers: result.data,
          pagination: {
            currentPage: page,
            totalItems: result.count || 0,
            totalPages: Math.ceil((result.count || 0) / ITEMS_PER_PAGE),
            itemsPerPage: ITEMS_PER_PAGE
          }
        };

        setSubscribers(responseData.subscribers);
        setPagination(responseData.pagination);
        
        // Cache the result
        setCachedData(cacheKey, responseData);
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

  // Enhanced fetchCampaigns with all improvements
  const fetchCampaigns = useCallback(async (page = 1) => {
    const requestId = `fetchCampaigns_${page}`;
    const cacheKey = `campaigns_${page}`;
    
    // Check cache first
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      setCampaigns(cachedData.campaigns);
      setCampaignPagination(cachedData.pagination);
      return;
    }
    
    if (!createUniqueRequest(requestId)) {
      return;
    }

    try {
      setCampaignLoading(true);
      setError(null);

      // Ensure Supabase is ready
      const isReady = await ensureSupabaseReady();
      if (!isReady) {
        throw new Error('Supabase connection not ready');
      }

      // Add small delay to prevent race conditions
      await new Promise(resolve => setTimeout(resolve, 150));

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const result = await retryWithBackoff(
        async () => {
          const response = await supabaseServiceClient
            .from('newsletter_campaigns')
            .select('*', { count: 'exact' })
            .range(from, to)
            .order('created_at', { ascending: false });
          return response;
        },
        3,
        1000
      );

      if (result.error) {
        throw result.error;
      }

      if (result.data) {
        const responseData = {
          campaigns: result.data as NewsletterCampaign[],
          pagination: {
            currentPage: page,
            totalItems: result.count || 0,
            totalPages: Math.ceil((result.count || 0) / ITEMS_PER_PAGE),
            itemsPerPage: ITEMS_PER_PAGE
          }
        };

        setCampaigns(responseData.campaigns);
        setCampaignPagination(responseData.pagination);
        
        // Cache the result
        setCachedData(cacheKey, responseData);
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

  // Enhanced calculateStats with all improvements
  const calculateStats = useCallback(async () => {
    const requestId = 'calculateStats';
    const cacheKey = 'stats';
    
    // Check cache first
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      setStats(cachedData);
      return;
    }
    
    if (!createUniqueRequest(requestId)) {
      return;
    }

    try {
      // Ensure Supabase is ready
      const isReady = await ensureSupabaseReady();
      if (!isReady) {
        throw new Error('Supabase connection not ready');
      }

      // Add delay to prevent race conditions
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

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
        averageOpenRate: 0,
        weeklyGrowth: 0,
        totalNewslettersSent: 0
      };

      // Fetch subscribers with retry
      const subscribersResult = await retryWithBackoff(
        async () => supabaseServiceClient.from('newsletter_subscribers').select('*'),
        3,
        1000
      );
      
      if (subscribersResult.error) {
        throw subscribersResult.error;
      }

      const allSubscribers = subscribersResult.data || [];
      
      // Calculate subscriber stats locally
      stats.totalSubscribers = allSubscribers.length;
      stats.activeSubscribers = allSubscribers.filter(s => s.status === 'active').length;
      stats.inactiveSubscribers = allSubscribers.filter(s => s.status === 'inactive').length;
      
      const todayISO = today.toISOString();
      const weekAgoISO = weekAgo.toISOString();
      const monthAgoISO = monthAgo.toISOString();
      
      stats.newToday = allSubscribers.filter(s => s.subscribed_at >= todayISO).length;
      stats.newSubscribersWeek = allSubscribers.filter(s => s.subscribed_at >= weekAgoISO).length;
      stats.newSubscribersMonth = allSubscribers.filter(s => s.subscribed_at >= monthAgoISO).length;

      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 300));

      // Fetch campaigns with retry
      const campaignsResult = await retryWithBackoff(
        async () => supabaseServiceClient.from('newsletter_campaigns').select('*'),
        3,
        1000
      );
      
      if (campaignsResult.error) {
        throw campaignsResult.error;
      }

      const allCampaigns = campaignsResult.data || [];
      
      // Calculate campaign stats locally
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
        
        const campaignsWithOpenRate = sentCampaigns.filter(c => c.open_rate !== null && c.open_rate !== undefined);
        stats.averageOpenRate = campaignsWithOpenRate.length > 0 
          ? campaignsWithOpenRate.reduce((sum, campaign) => sum + (campaign.open_rate || 0), 0) / campaignsWithOpenRate.length
          : parseFloat(stats.openRate);
      }

      // Calculate growth rates
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
      
      // Cache the result
      setCachedData(cacheKey, stats);
      
    } catch (err: any) {
      console.error(`❌ [${requestId}] Erro ao calcular estatísticas:`, err);
      setError('Erro ao calcular estatísticas');
      toast.error('Erro ao calcular estatísticas');
    } finally {
      completeRequest(requestId);
    }
  }, []);

  // Subscribe function
  const subscribe = useCallback(async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .insert([{ email, status: 'active' }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error('Este email já está inscrito na newsletter');
          return { success: false, error: 'Email já inscrito' };
        }
        if (error.code === '23514') {
          toast.error('Falha ao registrar log da inscrição. Tente novamente mais tarde.');
          return { success: false, error: 'Violação de regra de status em logs' };
        }
        throw error;
      }

      toast.success('Inscrição realizada com sucesso!');
      await fetchSubscribers();
      await calculateStats();
      
      return { success: true, data };
    } catch (err: any) {
      console.error('Erro ao inscrever:', err);
      if (err?.code === '23514') {
        toast.error('Falha ao registrar log da inscrição. Tente novamente mais tarde.');
        return { success: false, error: 'Violação de regra de status em logs' };
      }
      toast.error('Erro ao realizar inscrição');
      return { success: false, error: err.message };
    }
  }, [fetchSubscribers, calculateStats]);

  // Update subscriber status
  const updateSubscriberStatus = useCallback(async (id: string, status: 'active' | 'inactive') => {
    try {
      const { error } = await supabaseServiceClient
        .from('newsletter_subscribers')
        .update({ 
          status,
          unsubscribed_at: status === 'inactive' ? new Date().toISOString() : null
        })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Status atualizado para ${status === 'active' ? 'ativo' : 'inativo'}`);
      await fetchSubscribers();
      await calculateStats();
    } catch (err: any) {
      console.error('Erro ao atualizar status:', err);
      toast.error('Erro ao atualizar status');
    }
  }, [fetchSubscribers, calculateStats]);

  // Delete subscriber
  const deleteSubscriber = useCallback(async (id: string) => {
    try {
      const { error } = await supabaseServiceClient
        .from('newsletter_subscribers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Assinante removido com sucesso');
      await fetchSubscribers();
      await calculateStats();
    } catch (err: any) {
      console.error('Erro ao deletar assinante:', err);
      toast.error('Erro ao deletar assinante');
    }
  }, [fetchSubscribers, calculateStats]);

  // Send campaign
  const sendCampaign = useCallback(async (campaignData: CampaignDraft) => {
    try {
      // Get active subscribers
      const { data: activeSubscribers, error: subscribersError } = await supabaseServiceClient
        .from('newsletter_subscribers')
        .select('email')
        .eq('status', 'active');

      if (subscribersError) throw subscribersError;

      const recipientCount = activeSubscribers?.length || 0;

      // Create campaign record
      const { data: campaign, error: campaignError } = await supabaseServiceClient
        .from('newsletter_campaigns')
        .insert([{
          subject: campaignData.subject,
          content: campaignData.content,
          status: campaignData.send_immediately ? 'sent' : 'scheduled',
          recipient_count: recipientCount,
          sent_at: campaignData.send_immediately ? new Date().toISOString() : null,
          scheduled_at: campaignData.scheduled_at || null,
          template_id: campaignData.template_id || null,
          opened_count: 0,
          clicked_count: 0
        }])
        .select()
        .single();

      if (campaignError) throw campaignError;

      toast.success(campaignData.send_immediately ? 'Campanha enviada com sucesso!' : 'Campanha agendada com sucesso!');
      await fetchCampaigns();
      await calculateStats();
      
      return { success: true, data: campaign };
    } catch (err: any) {
      console.error('Erro ao enviar campanha:', err);
      toast.error('Erro ao enviar campanha');
      return { success: false, error: err.message };
    }
  }, [fetchCampaigns, calculateStats]);

  // Send test email
  const sendTestEmail = useCallback(async (email: string, subject: string, content: string) => {
    try {
      // In a real implementation, this would send an actual email
      // For now, we'll just simulate the action
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Email de teste enviado para ${email}`);
      return { success: true };
    } catch (err: any) {
      console.error('Erro ao enviar email de teste:', err);
      toast.error('Erro ao enviar email de teste');
      return { success: false, error: err.message };
    }
  }, []);

  // Create template
  const createTemplate = useCallback(async (templateData: Omit<CampaignTemplate, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabaseServiceClient
        .from('campaign_templates')
        .insert([{
          ...templateData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Template criado com sucesso!');
      await fetchTemplates();
      
      return { success: true, data };
    } catch (err: any) {
      console.error('Erro ao criar template:', err);
      toast.error('Erro ao criar template');
      return { success: false, error: err.message };
    }
  }, []);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    try {
      const { data, error } = await supabaseServiceClient
        .from('campaign_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTemplates(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar templates:', err);
      toast.error('Erro ao carregar templates');
    }
  }, []);

  // Export subscribers
  const exportSubscribers = useCallback(async () => {
    try {
      const { data, error } = await supabaseServiceClient
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });

      if (error) throw error;

      // Convert to CSV
      const csvContent = [
        ['Email', 'Status', 'Data de Inscrição', 'Data de Cancelamento'].join(','),
        ...(data || []).map(sub => [
          sub.email,
          sub.status,
          new Date(sub.subscribed_at).toLocaleDateString('pt-BR'),
          sub.unsubscribed_at ? new Date(sub.unsubscribed_at).toLocaleDateString('pt-BR') : ''
        ].join(','))
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Lista de assinantes exportada com sucesso!');
    } catch (err: any) {
      console.error('Erro ao exportar assinantes:', err);
      toast.error('Erro ao exportar assinantes');
    }
  }, []);

  // Enhanced initialization with staggered loading
  const initializeData = useCallback(async () => {
    try {
      // Ensure Supabase is ready first
      const isReady = await ensureSupabaseReady();
      if (!isReady) {
        console.warn('Supabase not ready, skipping initialization');
        return;
      }

      // Staggered loading to prevent race conditions
      await fetchSubscribers();
      await new Promise(resolve => setTimeout(resolve, 400));
      
      await fetchCampaigns();
      await new Promise(resolve => setTimeout(resolve, 400));
      
      await calculateStats();
    } catch (error) {
      console.error('❌ [initializeData] Erro na inicialização:', error);
    }
  }, [fetchSubscribers, fetchCampaigns, calculateStats]);

  // Debounced initialization
  const debouncedInitialize = useCallback(
    debounce(initializeData, 500),
    [initializeData]
  );

  useEffect(() => {
    debouncedInitialize();
    
    return () => {
      requestsInProgress.current.clear();
      requestTimeouts.current.forEach(timeout => clearTimeout(timeout));
      requestTimeouts.current.clear();
      requestCache.current.clear();
    };
  }, [debouncedInitialize]);

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
      try {
        // Clear cache before refresh
        requestCache.current.clear();
        
        await fetchSubscribers();
        await new Promise(resolve => setTimeout(resolve, 400));
        await fetchCampaigns();
        await new Promise(resolve => setTimeout(resolve, 400));
        await calculateStats();
      } catch (error) {
        console.error('❌ [useNewsletter] Erro na atualização:', error);
      }
    }
  };
};
