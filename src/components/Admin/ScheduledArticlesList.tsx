import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { rpcWithAuth } from '@/lib/supabaseRpc';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../UI/Card';
import Button from '../UI/Button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, User, X, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ScheduledArticle {
  id: string;
  title: string;
  scheduled_for: string;
  scheduling_status: 'scheduled' | 'published' | 'cancelled' | 'draft';
  scheduled_by: string;
  scheduling_reason: string;
  author: {
    id: string;
    email: string;
  };
  created_at: string;
}

export const ScheduledArticlesList: React.FC = () => {
  const { user } = useAuth();
  const [scheduledArticles, setScheduledArticles] = useState<ScheduledArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'published' | 'cancelled'>('scheduled');

  useEffect(() => {
    if (user) {
      loadScheduledArticles();
    }
  }, [user, filter]);

  const loadScheduledArticles = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('articles')
        .select(`
          id,
          title,
          scheduled_for,
          scheduling_status,
          scheduled_by,
          scheduling_reason,
          created_at,
          author:author_id(id, email)
        `)
        .not('scheduling_status', 'eq', 'draft')
        .order('scheduled_for', { ascending: true });

      if (filter !== 'all') {
        query = query.eq('scheduling_status', filter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao carregar artigos agendados:', error);
        toast.error('Erro ao carregar artigos agendados');
        return;
      }

      setScheduledArticles(data || []);
    } catch (error) {
      console.error('Erro ao carregar artigos agendados:', error);
      toast.error('Erro ao carregar artigos agendados');
    } finally {
      setLoading(false);
    }
  };

  const cancelScheduling = async (articleId: string) => {
    try {
      const result = await rpcWithAuth<{ success: boolean; message?: string }>('cancel_scheduled_article', {
        article_id: articleId,
        reason: 'Cancelado pelo administrador'
      });

      if (!result?.success) {
        console.error('Erro ao cancelar agendamento:', result?.message);
        toast.error(result?.message || 'Erro ao cancelar agendamento');
        return;
      }

      toast.success(result?.message || 'Agendamento cancelado com sucesso');
      loadScheduledArticles();
    } catch (error: any) {
      console.error('Erro ao cancelar agendamento:', error);
      toast.error(error?.message || 'Erro ao cancelar agendamento');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="w-4 h-4" />;
      case 'published':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <X className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Agendado';
      case 'published':
        return 'Publicado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Rascunho';
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-montserrat font-semibold text-white mb-4">
          Artigos Agendados
        </h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-600 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-montserrat font-semibold text-white">
          Artigos Agendados
        </h3>
        <div className="flex space-x-2">
          {(['all', 'scheduled', 'published', 'cancelled'] as const).map((status) => (
                    <Button
                      key={status}
                      variant={filter === status ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setFilter(status)}
                    >
                      {status === 'all' ? 'Todos' : getStatusLabel(status)}
                    </Button>
                  ))}
        </div>
      </div>

      {scheduledArticles.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-futuristic-gray mx-auto mb-4" />
          <p className="text-futuristic-gray">
            Nenhum artigo agendado encontrado
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {scheduledArticles.map((article) => (
            <div
              key={article.id}
              className="border border-neon-purple/20 rounded-lg p-4 bg-darker-surface/50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-white font-medium mb-2">
                    {article.title}
                  </h4>
                  
                  <div className="flex items-center space-x-4 text-sm text-futuristic-gray mb-2">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span
                        title={`${format(new Date(article.scheduled_for), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`}
                      >
                        {format(new Date(article.scheduled_for), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{article.author?.email}</span>
                    </div>
                  </div>

                  {article.scheduling_reason && (
                    <p className="text-xs text-futuristic-gray mb-2">
                      <strong>Motivo:</strong> {article.scheduling_reason}
                    </p>
                  )}

                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(article.scheduling_status)}`}>
                      {getStatusIcon(article.scheduling_status)}
                      <span>{getStatusLabel(article.scheduling_status)}</span>
                    </span>
                    {article.scheduling_status === 'scheduled' && (
                      <span className="text-[11px] text-futuristic-gray" aria-label="Tempo restante">
                        {/* Apenas texto adicional, sem alterar visual do painel */}
                        publica em {(() => {
                          const target = new Date(article.scheduled_for).getTime();
                          const now = Date.now();
                          const diff = target - now;
                          if (diff <= 0) return '0min';
                          const min = Math.floor(diff / 60000);
                          if (min < 60) return `${min}min`;
                          const h = Math.floor(min / 60);
                          if (h < 24) return `${h}h`;
                          const d = Math.floor(h / 24);
                          return `${d}d`;
                        })()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {article.scheduling_status === 'scheduled' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cancelScheduling(article.id)}
                      className="text-red-400 hover:text-red-300 border-red-400/30 hover:border-red-400/50"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};