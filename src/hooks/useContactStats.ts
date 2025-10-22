import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ContactStats {
  totalContacts: number;
  averageResponseTime: string;
  satisfactionRate: number;
  systemStatus: 'online' | 'maintenance' | 'offline';
  messagesThisWeek: number;
  messagesThisMonth: number;
  loading: boolean;
  error: string | null;
}

export const useContactStats = () => {
  const [stats, setStats] = useState<ContactStats>({
    totalContacts: 0,
    averageResponseTime: '< 24h',
    satisfactionRate: 0,
    systemStatus: 'online',
    messagesThisWeek: 0,
    messagesThisMonth: 0,
    loading: true,
    error: null
  });

  const fetchContactStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));

      // Buscar total de contatos
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('id, created_at, status');

      if (contactsError) {
        throw contactsError;
      }

      const totalContacts = contacts?.length || 0;

      // Calcular mensagens desta semana
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const messagesThisWeek = contacts?.filter(contact => 
        new Date(contact.created_at) >= oneWeekAgo
      ).length || 0;

      // Calcular mensagens deste mês
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const messagesThisMonth = contacts?.filter(contact => 
        new Date(contact.created_at) >= oneMonthAgo
      ).length || 0;

      // Calcular taxa de satisfação baseada em contatos respondidos
      const repliedContacts = contacts?.filter(contact => 
        contact.status === 'replied'
      ).length || 0;
      
      const satisfactionRate = totalContacts > 0 
        ? Math.round((repliedContacts / totalContacts) * 100)
        : 98; // Valor padrão se não houver dados

      // Determinar tempo médio de resposta baseado no volume
      let averageResponseTime = '< 24h';
      if (messagesThisWeek > 20) {
        averageResponseTime = '< 48h';
      } else if (messagesThisWeek > 10) {
        averageResponseTime = '< 24h';
      } else {
        averageResponseTime = '< 12h';
      }

      // Status do sistema (sempre online para este projeto)
      const systemStatus: 'online' | 'maintenance' | 'offline' = 'online';

      setStats({
        totalContacts,
        averageResponseTime,
        satisfactionRate,
        systemStatus,
        messagesThisWeek,
        messagesThisMonth,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('Error fetching contact stats:', error);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar estatísticas'
      }));
    }
  };

  useEffect(() => {
    fetchContactStats();

    // Atualizar estatísticas a cada 2 minutos
    const interval = setInterval(fetchContactStats, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return { ...stats, refetch: fetchContactStats };
};