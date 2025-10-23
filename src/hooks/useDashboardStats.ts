import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { supabaseAdmin } from '../lib/supabase-admin';

interface DashboardStats {
  // Estatísticas principais
  totalArticles: number;
  publishedArticles: number;
  totalUsers: number;
  totalSubscribers: number;
  totalComments: number;
  totalFeedback: number;
  totalContacts: number;
  totalCampaigns: number;
  
  // Métricas de crescimento
  weeklyGrowth: number;
  monthlyGrowth: number;
  dailyViews: number;
  
  // Métricas de engajamento
  averageCommentsPerArticle: number;
  positiveFeedbackRate: number;
  subscriberGrowthRate: number;
  
  // Estados
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

interface WeeklyData {
  name: string;
  articles: number;
  subscribers: number;
  comments: number;
  feedback: number;
  contacts: number;
}

interface RecentActivity {
  id: string;
  type: 'article_published' | 'new_subscriber' | 'new_comment' | 'new_feedback' | 'new_contact' | 'campaign_sent';
  message: string;
  time: string;
  data?: any;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalArticles: 0,
    publishedArticles: 0,
    totalUsers: 0,
    totalSubscribers: 0,
    totalComments: 0,
    totalFeedback: 0,
    totalContacts: 0,
    totalCampaigns: 0,
    weeklyGrowth: 0,
    monthlyGrowth: 0,
    dailyViews: 0,
    averageCommentsPerArticle: 0,
    positiveFeedbackRate: 0,
    subscriberGrowthRate: 0,
    loading: true,
    error: null,
    lastUpdate: null
  });

  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  const fetchDashboardStats = useCallback(async () => {
    try {
      // console.log('📊 [DASHBOARD-STATS] Iniciando busca de estatísticas...');
      setStats(prev => ({ ...prev, loading: true, error: null }));

      // Buscar dados de todas as tabelas em paralelo
      const [
        articlesResult,
        subscribersResult,
        commentsResult,
        feedbackResult,
        contactsResult,
        campaignsResult
      ] = await Promise.allSettled([
        supabaseAdmin
          .from('articles')
          .select('id, title, published, created_at, updated_at'),
        
        supabaseAdmin
          .from('newsletter_subscribers')
          .select('id, email, status, created_at'),
        
        supabaseAdmin
          .from('comments')
          .select('id, article_id, created_at'),
        
        supabaseAdmin
          .from('feedback')
          .select('id, article_id, useful, created_at'),
        
        supabaseAdmin
          .from('contacts')
          .select('id, name, email, created_at'),
        
        supabaseAdmin
          .from('newsletter_campaigns')
          .select('id, name, subject, status, recipient_count, created_at')
      ]);

      // Processar resultados
      const articles = articlesResult.status === 'fulfilled' && !articlesResult.value.error 
        ? articlesResult.value.data || [] 
        : [];
      
      const subscribers = subscribersResult.status === 'fulfilled' && !subscribersResult.value.error 
        ? subscribersResult.value.data || [] 
        : [];
      
      const comments = commentsResult.status === 'fulfilled' && !commentsResult.value.error 
        ? commentsResult.value.data || [] 
        : [];
      
      const feedback = feedbackResult.status === 'fulfilled' && !feedbackResult.value.error 
        ? feedbackResult.value.data || [] 
        : [];
      
      const contacts = contactsResult.status === 'fulfilled' && !contactsResult.value.error 
        ? contactsResult.value.data || [] 
        : [];
      
      const campaigns = campaignsResult.status === 'fulfilled' && !campaignsResult.value.error 
        ? campaignsResult.value.data || [] 
        : [];

      console.log('📊 [DASHBOARD-STATS] Dados coletados:', {
        articles: articles.length,
        subscribers: subscribers.length,
        comments: comments.length,
        feedback: feedback.length,
        contacts: contacts.length,
        campaigns: campaigns.length
      });

      // Calcular estatísticas
      const publishedArticles = articles.filter(a => a.published);
      const activeSubscribers = subscribers.filter(s => s.status === 'active');
      const positiveFeedback = feedback.filter(f => f.useful);
      
      // Calcular crescimento semanal
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const newSubscribersThisWeek = subscribers.filter(s => 
        new Date(s.created_at) >= oneWeekAgo
      ).length;
      
      const subscriberGrowthRate = subscribers.length > 0 
        ? (newSubscribersThisWeek / subscribers.length) * 100 
        : 0;

      // Calcular crescimento mensal
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const newSubscribersThisMonth = subscribers.filter(s => 
        new Date(s.created_at) >= oneMonthAgo
      ).length;
      
      const monthlyGrowth = subscribers.length > 0 
        ? (newSubscribersThisMonth / subscribers.length) * 100 
        : 0;

      // Calcular métricas de engajamento
      const averageCommentsPerArticle = publishedArticles.length > 0 
        ? comments.length / publishedArticles.length 
        : 0;
      
      const positiveFeedbackRate = feedback.length > 0 
        ? (positiveFeedback.length / feedback.length) * 100 
        : 0;

      // Gerar dados semanais
      const weeklyChartData = generateWeeklyData(articles, subscribers, comments, feedback, contacts);
      
      // Gerar atividades recentes
      const activities = generateRecentActivities(articles, subscribers, comments, feedback, contacts, campaigns);

      const newStats: DashboardStats = {
        totalArticles: articles.length,
        publishedArticles: publishedArticles.length,
        totalUsers: subscribers.length, // Usando subscribers como proxy para usuários
        totalSubscribers: activeSubscribers.length,
        totalComments: comments.length,
        totalFeedback: feedback.length,
        totalContacts: contacts.length,
        totalCampaigns: campaigns.length,
        weeklyGrowth: Math.round(subscriberGrowthRate * 10) / 10,
        monthlyGrowth: Math.round(monthlyGrowth * 10) / 10,
        dailyViews: Math.floor(Math.random() * 500) + 100, // Simulado por enquanto
        averageCommentsPerArticle: Math.round(averageCommentsPerArticle * 10) / 10,
        positiveFeedbackRate: Math.round(positiveFeedbackRate * 10) / 10,
        subscriberGrowthRate: Math.round(subscriberGrowthRate * 10) / 10,
        loading: false,
        error: null,
        lastUpdate: new Date()
      };

      setStats(newStats);
      setWeeklyData(weeklyChartData);
      setRecentActivities(activities);

      console.log('✅ [DASHBOARD-STATS] Estatísticas calculadas:', newStats);

    } catch (error) {
      console.error('❌ [DASHBOARD-STATS] Erro ao buscar estatísticas:', error);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
    }
  }, []);

  // Gerar dados para gráfico semanal
  const generateWeeklyData = useCallback((
    articles: any[],
    subscribers: any[],
    comments: any[],
    feedback: any[],
    contacts: any[]
  ): WeeklyData[] => {
    const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    return daysOfWeek.map((day, index) => {
      // Filtrar dados por dia da semana
      const dayArticles = articles.filter(item => 
        item.created_at && new Date(item.created_at).getDay() === index
      );
      
      const daySubscribers = subscribers.filter(item => 
        item.created_at && new Date(item.created_at).getDay() === index
      );
      
      const dayComments = comments.filter(item => 
        item.created_at && new Date(item.created_at).getDay() === index
      );
      
      const dayFeedback = feedback.filter(item => 
        item.created_at && new Date(item.created_at).getDay() === index
      );
      
      const dayContacts = contacts.filter(item => 
        item.created_at && new Date(item.created_at).getDay() === index
      );

      return {
        name: day,
        articles: dayArticles.length,
        subscribers: daySubscribers.length,
        comments: dayComments.length,
        feedback: dayFeedback.length,
        contacts: dayContacts.length
      };
    });
  }, []);

  // Gerar atividades recentes
  const generateRecentActivities = useCallback((
    articles: any[],
    subscribers: any[],
    comments: any[],
    feedback: any[],
    contacts: any[],
    campaigns: any[]
  ): RecentActivity[] => {
    const activities: RecentActivity[] = [];

    // Adicionar artigos recentes
    articles
      .filter(a => a.published)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3)
      .forEach(article => {
        activities.push({
          id: `article-${article.id}`,
          type: 'article_published',
          message: `Artigo "${article.title}" foi publicado`,
          time: new Date(article.created_at).toLocaleString('pt-BR'),
          data: article
        });
      });

    // Adicionar novos subscribers
    subscribers
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .forEach(subscriber => {
        activities.push({
          id: `subscriber-${subscriber.id}`,
          type: 'new_subscriber',
          message: `Novo inscrito: ${subscriber.email}`,
          time: new Date(subscriber.created_at).toLocaleString('pt-BR'),
          data: subscriber
        });
      });

    // Adicionar comentários recentes
    comments
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3)
      .forEach(comment => {
        activities.push({
          id: `comment-${comment.id}`,
          type: 'new_comment',
          message: `Novo comentário no artigo`,
          time: new Date(comment.created_at).toLocaleString('pt-BR'),
          data: comment
        });
      });

    // Adicionar contatos recentes
    contacts
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 2)
      .forEach(contact => {
        activities.push({
          id: `contact-${contact.id}`,
          type: 'new_contact',
          message: `Novo contato: ${contact.name}`,
          time: new Date(contact.created_at).toLocaleString('pt-BR'),
          data: contact
        });
      });

    // Ordenar por data mais recente
    return activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10);
  }, []);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    fetchDashboardStats();
    
    const interval = setInterval(fetchDashboardStats, 30000);
    
    return () => clearInterval(interval);
  }, [fetchDashboardStats]);

  // Função para refresh manual
  const refresh = useCallback(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  return {
    stats,
    weeklyData,
    recentActivities,
    refresh,
    isLoading: stats.loading
  };
}