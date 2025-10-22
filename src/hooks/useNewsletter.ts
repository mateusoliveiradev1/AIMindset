import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { NewsletterSubscriber, NewsletterLog } from '../lib/supabase';

export interface UseNewsletterReturn {
  subscribers: NewsletterSubscriber[];
  logs: NewsletterLog[];
  loading: boolean;
  error: string | null;
  subscribe: (email: string) => Promise<boolean>;
  unsubscribe: (email: string) => Promise<boolean>;
  getSubscribers: (status?: 'active' | 'inactive') => Promise<NewsletterSubscriber[]>;
  sendNewsletter: (subject: string, content: string) => Promise<boolean>;
  getNewsletterLogs: () => Promise<NewsletterLog[]>;
  exportSubscribers: () => Promise<string>;
  refreshData: () => Promise<void>;
}

export const useNewsletter = (): UseNewsletterReturn => {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [logs, setLogs] = useState<NewsletterLog[]>([]);
  const [loading, setLoading] = useState(false); // Changed to false initially
  const [error, setError] = useState<string | null>(null);

  const fetchSubscribers = useCallback(async () => {
    try {
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching subscribers:', fetchError);
        // Don't throw error, just log it and continue
        setError('Failed to fetch subscribers');
        return;
      }

      setSubscribers(data || []);
    } catch (err) {
      console.error('Error fetching subscribers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch subscribers');
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('newsletter_logs')
        .select('*')
        .order('sent_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching newsletter logs:', fetchError);
        // Don't throw error, just log it and continue
        return;
      }

      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching newsletter logs:', err);
    }
  }, []);

  // Only fetch data when explicitly called, not on mount
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchSubscribers(), fetchLogs()]);
    } finally {
      setLoading(false);
    }
  }, [fetchSubscribers, fetchLogs]);

  const subscribe = async (email: string): Promise<boolean> => {
    try {
      setError(null);
      
      // Check if email already exists
      const { data: existing } = await supabase
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
          const { error: updateError } = await supabase
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
        const { error: insertError } = await supabase
          .from('newsletter_subscribers')
          .insert([{
            email,
            status: 'active',
            subscribed_at: new Date().toISOString()
          }]);

        if (insertError) {
          throw insertError;
        }
      }

      // Refresh subscribers list
      await fetchSubscribers();
      return true;
    } catch (err) {
      console.error('Error subscribing:', err);
      setError(err instanceof Error ? err.message : 'Failed to subscribe');
      return false;
    }
  };

  const unsubscribe = async (email: string): Promise<boolean> => {
    try {
      setError(null);
      
      const { error: updateError } = await supabase
        .from('newsletter_subscribers')
        .update({ 
          status: 'inactive',
          unsubscribed_at: new Date().toISOString()
        })
        .eq('email', email);

      if (updateError) {
        throw updateError;
      }

      // Refresh subscribers list
      await fetchSubscribers();
      return true;
    } catch (err) {
      console.error('Error unsubscribing:', err);
      setError(err instanceof Error ? err.message : 'Failed to unsubscribe');
      return false;
    }
  };

  const getSubscribers = async (status?: 'active' | 'inactive'): Promise<NewsletterSubscriber[]> => {
    try {
      let query = supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    } catch (err) {
      console.error('Error getting subscribers:', err);
      return [];
    }
  };

  const sendNewsletter = async (subject: string, content: string): Promise<boolean> => {
    try {
      setError(null);
      
      // Get active subscribers
      const activeSubscribers = await getSubscribers('active');
      
      if (activeSubscribers.length === 0) {
        setError('Nenhum inscrito ativo encontrado');
        return false;
      }

      // Log the newsletter send
      const { error: logError } = await supabase
        .from('newsletter_logs')
        .insert([{
          subject,
          content,
          recipients_count: activeSubscribers.length,
          sent_at: new Date().toISOString(),
          status: 'sent'
        }]);

      if (logError) {
        throw logError;
      }

      // Refresh logs
      await fetchLogs();
      return true;
    } catch (err) {
      console.error('Error sending newsletter:', err);
      setError(err instanceof Error ? err.message : 'Failed to send newsletter');
      return false;
    }
  };

  const getNewsletterLogs = async (): Promise<NewsletterLog[]> => {
    try {
      const { data, error } = await supabase
        .from('newsletter_logs')
        .select('*')
        .order('sent_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (err) {
      console.error('Error getting newsletter logs:', err);
      return [];
    }
  };

  const exportSubscribers = async (): Promise<string> => {
    try {
      const activeSubscribers = await getSubscribers('active');
      
      const csvContent = [
        'Email,Status,Subscribed At',
        ...activeSubscribers.map(sub => 
          `${sub.email},${sub.status},${sub.subscribed_at}`
        )
      ].join('\n');

      return csvContent;
    } catch (err) {
      console.error('Error exporting subscribers:', err);
      return '';
    }
  };

  return {
    subscribers,
    logs,
    loading,
    error,
    subscribe,
    unsubscribe,
    getSubscribers,
    sendNewsletter,
    getNewsletterLogs,
    exportSubscribers,
    refreshData
  };
};