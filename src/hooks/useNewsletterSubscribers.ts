import { useState, useEffect, useCallback, useRef } from 'react';
import { supabaseServiceClient, supabase } from '../lib/supabase';
import { toast } from 'sonner';

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  status: 'active' | 'inactive' | 'unsubscribed';
  subscribed_at: string;
  unsubscribed_at?: string;
  source: 'website' | 'manual' | 'import' | 'api';
  tags?: string[];
  metadata?: any;
  last_email_opened_at?: string;
  last_email_clicked_at?: string;
  total_emails_opened: number;
  total_emails_clicked: number;
  created_at: string;
  updated_at: string;
}

export interface SubscriberFilters {
  search?: string;
  status?: 'all' | 'active' | 'inactive' | 'unsubscribed';
  source?: 'all' | 'website' | 'manual' | 'import' | 'api';
  dateRange?: 'all' | 'today' | 'week' | 'month' | 'custom';
  customDateStart?: string;
  customDateEnd?: string;
  tags?: string[];
}

export interface SubscriberStats {
  total: number;
  active: number;
  inactive: number;
  unsubscribed: number;
  newToday: number;
  newThisWeek: number;
  newThisMonth: number;
  growthRate: number;
  engagementRate: number;
}

export const useNewsletterSubscribers = () => {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Buscar inscritos com filtros e paginação - Enhanced to prevent ERR_ABORTED
  const fetchSubscribers = useCallback(async (
    filters: SubscriberFilters = {},
    page: number = 1
  ) => {
    const requestId = `fetchSubscribers-${JSON.stringify(filters)}-${page}`;
    
    if (!createUniqueRequest(requestId)) {
      return;
    }

    try {
      console.log(`🚀 [${requestId}] Iniciando busca de inscritos`);
      setLoading(true);
      setError(null);

      let query = supabaseServiceClient
        .from('newsletter_subscribers')
        .select('*', { count: 'exact' });

      // Aplicar filtros
      if (filters.search) {
        query = query.or(`email.ilike.%${filters.search}%,name.ilike.%${filters.search}%`);
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.source && filters.source !== 'all') {
        query = query.eq('source', filters.source);
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
                query = query.lte('subscribed_at', filters.customDateEnd);
              }
            }
            break;
          default:
            startDate = new Date(0);
        }

        if (startDate) {
          query = query.gte('subscribed_at', startDate.toISOString());
        }
      }

      // Paginação
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      // Ordenação
      query = query.order('subscribed_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        console.error(`❌ [${requestId}] Erro ao buscar inscritos:`, error);
        setError('Erro ao carregar inscritos');
        toast.error('Erro ao carregar inscritos');
        return;
      }

      setSubscribers(data || []);
      setTotalCount(count || 0);
      setCurrentPage(page);
      console.log(`✅ [${requestId}] Inscritos carregados com sucesso: ${data?.length || 0} registros`);
    } catch (err: any) {
      console.error(`❌ [${requestId}] Erro ao buscar inscritos:`, err);
      setError('Erro ao carregar inscritos');
      toast.error('Erro ao carregar inscritos');
    } finally {
      setLoading(false);
      completeRequest(requestId);
    }
  }, [pageSize]);

  // Obter estatísticas dos inscritos
  const getSubscriberStats = useCallback(async (): Promise<SubscriberStats> => {
    try {
      const { data: allSubscribers, error } = await supabaseServiceClient
        .from('newsletter_subscribers')
        .select('status, subscribed_at, total_emails_opened, total_emails_clicked');

      if (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return {
          total: 0,
          active: 0,
          inactive: 0,
          unsubscribed: 0,
          newToday: 0,
          newThisWeek: 0,
          newThisMonth: 0,
          growthRate: 0,
          engagementRate: 0
        };
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const total = allSubscribers.length;
      const active = allSubscribers.filter(s => s.status === 'active').length;
      const inactive = allSubscribers.filter(s => s.status === 'inactive').length;
      const unsubscribed = allSubscribers.filter(s => s.status === 'unsubscribed').length;

      const newToday = allSubscribers.filter(s => 
        new Date(s.subscribed_at) >= today
      ).length;

      const newThisWeek = allSubscribers.filter(s => 
        new Date(s.subscribed_at) >= weekAgo
      ).length;

      const newThisMonth = allSubscribers.filter(s => 
        new Date(s.subscribed_at) >= monthAgo
      ).length;

      const newLastMonth = allSubscribers.filter(s => {
        const date = new Date(s.subscribed_at);
        return date >= lastMonth && date <= lastMonthEnd;
      }).length;

      const growthRate = newLastMonth > 0 
        ? ((newThisMonth - newLastMonth) / newLastMonth) * 100 
        : newThisMonth > 0 ? 100 : 0;

      const totalEngaged = allSubscribers.filter(s => 
        s.total_emails_opened > 0 || s.total_emails_clicked > 0
      ).length;

      const engagementRate = total > 0 ? (totalEngaged / total) * 100 : 0;

      return {
        total,
        active,
        inactive,
        unsubscribed,
        newToday,
        newThisWeek,
        newThisMonth,
        growthRate: Math.round(growthRate * 100) / 100,
        engagementRate: Math.round(engagementRate * 100) / 100
      };
    } catch (err) {
      console.error('Erro ao calcular estatísticas:', err);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        unsubscribed: 0,
        newToday: 0,
        newThisWeek: 0,
        newThisMonth: 0,
        growthRate: 0,
        engagementRate: 0
      };
    }
  }, []);

  // Adicionar novo inscrito
  const addSubscriber = useCallback(async (
    email: string, 
    name?: string, 
    source: string = 'manual'
  ) => {
    try {
      // Verificar se já existe
      const { data: existing } = await supabaseServiceClient
        .from('newsletter_subscribers')
        .select('id, status')
        .eq('email', email)
        .single();

      if (existing) {
        if (existing.status === 'unsubscribed') {
          // Reativar inscrito
          const { error } = await supabaseServiceClient
            .from('newsletter_subscribers')
            .update({
              status: 'active',
              subscribed_at: new Date().toISOString(),
              unsubscribed_at: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);

          if (error) {
            toast.error('Erro ao reativar inscrito');
            return false;
          }

          toast.success('Inscrito reativado com sucesso!');
          return true;
        } else {
          toast.error('Este email já está inscrito');
          return false;
        }
      }

      // Criar novo inscrito
      const { error } = await supabaseServiceClient
        .from('newsletter_subscribers')
        .insert([{
          email,
          name,
          status: 'active',
          source,
          subscribed_at: new Date().toISOString(),
          total_emails_opened: 0,
          total_emails_clicked: 0
        }]);

      if (error) {
        console.error('Erro ao adicionar inscrito:', error);
        toast.error('Erro ao adicionar inscrito');
        return false;
      }

      toast.success('Inscrito adicionado com sucesso!');
      return true;
    } catch (err) {
      console.error('Erro ao adicionar inscrito:', err);
      toast.error('Erro ao adicionar inscrito');
      return false;
    }
  }, []);

  // Atualizar status do inscrito
  const updateSubscriberStatus = useCallback(async (
    id: string, 
    status: 'active' | 'inactive' | 'unsubscribed'
  ) => {
    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'unsubscribed') {
        updates.unsubscribed_at = new Date().toISOString();
      } else if (status === 'active') {
        updates.unsubscribed_at = null;
      }

      const { error } = await supabaseServiceClient
        .from('newsletter_subscribers')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar status:', error);
        toast.error('Erro ao atualizar status');
        return false;
      }

      setSubscribers(prev => 
        prev.map(sub => 
          sub.id === id 
            ? { ...sub, status, updated_at: updates.updated_at, unsubscribed_at: updates.unsubscribed_at }
            : sub
        )
      );

      toast.success('Status atualizado com sucesso!');
      return true;
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      toast.error('Erro ao atualizar status');
      return false;
    }
  }, []);

  // Remover inscrito
  const removeSubscriber = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao remover inscrito:', error);
        toast.error('Erro ao remover inscrito');
        return false;
      }

      setSubscribers(prev => prev.filter(sub => sub.id !== id));
      setTotalCount(prev => prev - 1);
      toast.success('Inscrito removido com sucesso!');
      return true;
    } catch (err) {
      console.error('Erro ao remover inscrito:', err);
      toast.error('Erro ao remover inscrito');
      return false;
    }
  }, []);

  // Exportar inscritos para CSV
  const exportSubscribers = useCallback(async (filters: SubscriberFilters = {}) => {
    try {
      let query = supabase
        .from('newsletter_subscribers')
        .select('*');

      // Aplicar os mesmos filtros da busca
      if (filters.search) {
        query = query.or(`email.ilike.%${filters.search}%,name.ilike.%${filters.search}%`);
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.source && filters.source !== 'all') {
        query = query.eq('source', filters.source);
      }

      const { data, error } = await query.order('subscribed_at', { ascending: false });

      if (error) {
        toast.error('Erro ao exportar dados');
        return;
      }

      // Converter para CSV
      const csvHeaders = ['Email', 'Nome', 'Status', 'Data de Inscrição', 'Origem', 'Emails Abertos', 'Emails Clicados'];
      const csvRows = data.map(sub => [
        sub.email,
        sub.name || '',
        sub.status,
        new Date(sub.subscribed_at).toLocaleDateString('pt-BR'),
        sub.source,
        sub.total_emails_opened,
        sub.total_emails_clicked
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      // Download do arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Dados exportados com sucesso!');
    } catch (err) {
      console.error('Erro ao exportar:', err);
      toast.error('Erro ao exportar dados');
    }
  }, []);

  // Importar inscritos de CSV
  const importSubscribers = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
      
      const emailIndex = headers.findIndex(h => h.includes('email'));
      const nameIndex = headers.findIndex(h => h.includes('nome') || h.includes('name'));
      
      if (emailIndex === -1) {
        toast.error('Arquivo deve conter uma coluna de email');
        return false;
      }

      const subscribersToImport = [];
      let successCount = 0;
      let errorCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const columns = line.split(',').map(c => c.replace(/"/g, '').trim());
        const email = columns[emailIndex];
        const name = nameIndex >= 0 ? columns[nameIndex] : undefined;

        if (email && email.includes('@')) {
          subscribersToImport.push({
            email,
            name,
            status: 'active',
            source: 'import',
            subscribed_at: new Date().toISOString(),
            total_emails_opened: 0,
            total_emails_clicked: 0
          });
        }
      }

      // Inserir em lotes
      const batchSize = 100;
      for (let i = 0; i < subscribersToImport.length; i += batchSize) {
        const batch = subscribersToImport.slice(i, i + batchSize);
        
        const { error } = await supabaseServiceClient
          .from('newsletter_subscribers')
          .upsert(batch, { 
            onConflict: 'email',
            ignoreDuplicates: true 
          });

        if (error) {
          console.error('Erro no lote:', error);
          errorCount += batch.length;
        } else {
          successCount += batch.length;
        }
      }

      toast.success(`Importação concluída: ${successCount} inscritos adicionados`);
      if (errorCount > 0) {
        toast.warning(`${errorCount} registros com erro`);
      }

      return true;
    } catch (err) {
      console.error('Erro ao importar:', err);
      toast.error('Erro ao importar arquivo');
      return false;
    }
  }, []);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  return {
    // Estados
    subscribers,
    loading,
    error,
    totalCount,
    currentPage,
    pageSize,

    // Ações
    fetchSubscribers,
    getSubscriberStats,
    addSubscriber,
    updateSubscriberStatus,
    removeSubscriber,
    exportSubscribers,
    importSubscribers,

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