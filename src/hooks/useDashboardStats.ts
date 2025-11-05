import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useRealTimeSync } from './useRealTimeSync';

interface DashboardStats {
  totalArticles: number;
  publishedArticles: number;
  totalUsers: number;
  totalSubscribers: number;
  totalComments: number;
  totalFeedback: number;
  totalContacts: number;
  totalCampaigns: number;
  weeklyGrowth: number;
  monthlyGrowth: number;
  dailyViews: number;
  averageCommentsPerArticle: number;
  positiveFeedbackRate: number;
  subscriberGrowthRate: number;
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

  const { invalidateAllCaches } = useRealTimeSync({
    onFeedbackChange: () => {
      fetchDashboardStats();
    },
    onCommentChange: () => {
      fetchDashboardStats();
    },
    enableGlobalSync: true
  });

  const fetchDashboardStats = useCallback(async () => {
    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));

      const [
        articlesResult,
        subscribersResult,
        commentsResult,
        feedbackResult,
        contactsResult,
        campaignsResult
      ] = await Promise.allSettled([
        supabase
          .from('articles')
          .select('id, title, published, created_at, updated_at'),
        supabase
          .from('newsletter_subscribers')
          .select('id, email, status, subscribed_at'),
        supabase
          .from('comments')
          .select('id, article_id, created_at'),
        supabase
          .from('feedbacks')
          .select('id, article_id, type, created_at'),
        supabase
          .from('contacts')
          .select('id, name, email, created_at'),
        supabase
          .from('newsletter_campaigns')
          .select('id, name, subject, status, total_subscribers, created_at')
      ]);

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

      const publishedArticles = articles.filter(a => a.published);
      const activeSubscribers = subscribers.filter((s: any) => s.status === 'active');
      const positiveFeedback = feedback.filter((f: any) => f.type === 'positive');

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const getSubscribedDate = (s: any) => s?.subscribed_at;
      const newSubscribersThisWeek = subscribers.filter((s: any) => {
        const d = getSubscribedDate(s);
        return d && new Date(d) >= oneWeekAgo;
      }).length;
      const subscriberGrowthRate = subscribers.length > 0 
        ? (newSubscribersThisWeek / subscribers.length) * 100 
        : 0;

      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const newSubscribersThisMonth = subscribers.filter((s: any) => {
        const d = getSubscribedDate(s);
        return d && new Date(d) >= oneMonthAgo;
      }).length;
      const monthlyGrowth = subscribers.length > 0 
        ? (newSubscribersThisMonth / subscribers.length) * 100 
        : 0;

      const averageCommentsPerArticle = publishedArticles.length > 0 
        ? comments.length / publishedArticles.length 
        : 0;
      const positiveFeedbackRate = feedback.length > 0 
        ? (positiveFeedback.length / feedback.length) * 100 
        : 0;

      const weeklyChartData = generateWeeklyData(articles, subscribers, comments, feedback, contacts);
      const activities = generateRecentActivities(articles, subscribers, comments, feedback, contacts, campaigns);

      const newStats: DashboardStats = {
        totalArticles: articles.length,
        publishedArticles: publishedArticles.length,
        totalUsers: subscribers.length,
        totalSubscribers: activeSubscribers.length,
        totalComments: comments.length,
        totalFeedback: feedback.length,
        totalContacts: contacts.length,
        totalCampaigns: campaigns.length,
        weeklyGrowth: Math.round(subscriberGrowthRate * 10) / 10,
        monthlyGrowth: Math.round(monthlyGrowth * 10) / 10,
        dailyViews: Math.floor(Math.random() * 500) + 100,
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
    } catch (error: any) {
      setStats(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
    }
  }, []);

  const generateWeeklyData = useCallback((
    articles: any[],
    subscribers: any[],
    comments: any[],
    feedback: any[],
    contacts: any[]
  ): WeeklyData[] => {
    const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return daysOfWeek.map((day, index) => {
      const dayArticles = articles.filter((item: any) => 
        item.created_at && new Date(item.created_at).getDay() === index
      );
      const daySubscribers = subscribers.filter((item: any) => {
        const d = item.subscribed_at || item.created_at;
        return d && new Date(d).getDay() === index;
      });
      const dayComments = comments.filter((item: any) => 
        item.created_at && new Date(item.created_at).getDay() === index
      );
      const dayFeedback = feedback.filter((item: any) => 
        item.created_at && new Date(item.created_at).getDay() === index
      );
      const dayContacts = contacts.filter((item: any) => 
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

  const generateRecentActivities = useCallback((
    articles: any[],
    subscribers: any[],
    comments: any[],
    feedback: any[],
    contacts: any[],
    campaigns: any[]
  ): RecentActivity[] => {
    const activities: RecentActivity[] = [];
    articles
      .filter((a: any) => a.published)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3)
      .forEach((article: any) => {
        activities.push({
          id: `article-${article.id}`,
          type: 'article_published',
          message: `Artigo "${article.title}" foi publicado`,
          time: new Date(article.created_at).toLocaleString('pt-BR'),
          data: article
        });
      });
    subscribers
      .sort((a: any, b: any) => {
        const da = a.subscribed_at;
        const db = b.subscribed_at;
        return new Date(db).getTime() - new Date(da).getTime();
      })
      .slice(0, 5)
      .forEach((subscriber: any) => {
        const t = subscriber.subscribed_at;
        activities.push({
          id: `subscriber-${subscriber.id}`,
          type: 'new_subscriber',
          message: `Novo inscrito: ${subscriber.email}`,
          time: t ? new Date(t).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR'),
          data: subscriber
        });
      });
    comments
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3)
      .forEach((comment: any) => {
        activities.push({
          id: `comment-${comment.id}`,
          type: 'new_comment',
          message: `Novo comentário no artigo`,
          time: new Date(comment.created_at).toLocaleString('pt-BR'),
          data: comment
        });
      });
    contacts
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 2)
      .forEach((contact: any) => {
        activities.push({
          id: `contact-${contact.id}`,
          type: 'new_contact',
          message: `Novo contato: ${contact.name}`,
          time: new Date(contact.created_at).toLocaleString('pt-BR'),
          data: contact
        });
      });
    return activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10);
  }, []);

  useEffect(() => {
    fetchDashboardStats();
    const interval = setInterval(fetchDashboardStats, 30000);
    const handleCacheInvalidation = () => {
      fetchDashboardStats();
    };
    const handleFeedbackMetricsUpdate = (event: CustomEvent) => {
      fetchDashboardStats();
    };
    window.addEventListener('realtime-cache-invalidate', handleCacheInvalidation);
    window.addEventListener('feedback-metrics-updated', handleFeedbackMetricsUpdate as EventListener);
    return () => {
      clearInterval(interval);
      window.removeEventListener('realtime-cache-invalidate', handleCacheInvalidation);
      window.removeEventListener('feedback-metrics-updated', handleFeedbackMetricsUpdate as EventListener);
    };
  }, [fetchDashboardStats]);

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