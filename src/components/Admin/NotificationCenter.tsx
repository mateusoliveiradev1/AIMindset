import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { 
  Bell, 
  Mail, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  X,
  Settings,
  Filter,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

interface Notification {
  id: string;
  type: 'campaign_sent' | 'new_subscriber' | 'automation_triggered' | 'system_alert' | 'performance_alert';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
  priority: 'low' | 'medium' | 'high';
}

interface NotificationCenterProps {
  onClose?: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');

  useEffect(() => {
    fetchNotifications();
    
    // Setup real-time subscription for new notifications
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'newsletter_campaigns' },
        (payload) => {
          if (payload.new.status === 'sent') {
            addNotification({
              type: 'campaign_sent',
              title: 'Campanha Enviada',
              message: `A campanha "${payload.new.name}" foi enviada para ${payload.new.recipient_count} inscritos`,
              data: payload.new,
              priority: 'medium'
            });
          }
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'newsletter_subscribers' },
        (payload) => {
          addNotification({
            type: 'new_subscriber',
            title: 'Novo Inscrito',
            message: `${payload.new.name || payload.new.email} se inscreveu na newsletter`,
            data: payload.new,
            priority: 'low'
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Simulate notifications from recent activity
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'campaign_sent',
          title: 'Campanha Enviada com Sucesso',
          message: 'A campanha "Newsletter Semanal" foi enviada para 155 inscritos',
          data: { campaign_id: 'camp_1', recipient_count: 155 },
          read: false,
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          priority: 'medium'
        },
        {
          id: '2',
          type: 'new_subscriber',
          title: 'Novos Inscritos',
          message: '3 novos inscritos se juntaram à newsletter hoje',
          data: { count: 3 },
          read: false,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          priority: 'low'
        },
        {
          id: '3',
          type: 'automation_triggered',
          title: 'Automação Executada',
          message: 'Email de boas-vindas enviado para 2 novos inscritos',
          data: { automation_id: 'auto_1', count: 2 },
          read: true,
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          priority: 'low'
        },
        {
          id: '4',
          type: 'performance_alert',
          title: 'Taxa de Abertura Baixa',
          message: 'A última campanha teve taxa de abertura de apenas 15%',
          data: { campaign_id: 'camp_2', open_rate: 15 },
          read: false,
          created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          priority: 'high'
        },
        {
          id: '5',
          type: 'system_alert',
          title: 'Sistema Atualizado',
          message: 'O sistema de newsletter foi atualizado com novas funcionalidades',
          data: { version: '2.1.0' },
          read: true,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          priority: 'medium'
        }
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      toast.error('Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  };

  const addNotification = (notificationData: Omit<Notification, 'id' | 'read' | 'created_at'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: Math.random().toString(36).substr(2, 9),
      read: false,
      created_at: new Date().toISOString()
    };

    setNotifications(prev => [newNotification, ...prev]);
    
    // Show toast for high priority notifications
    if (notificationData.priority === 'high') {
      toast.error(notificationData.title, {
        description: notificationData.message
      });
    } else if (notificationData.priority === 'medium') {
      toast.info(notificationData.title, {
        description: notificationData.message
      });
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    toast.success('Todas as notificações foram marcadas como lidas');
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    toast.success('Notificação removida');
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    toast.success('Todas as notificações foram removidas');
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'campaign_sent':
        return <Mail className="w-5 h-5 text-lime-green" />;
      case 'new_subscriber':
        return <Users className="w-5 h-5 text-blue-400" />;
      case 'automation_triggered':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'performance_alert':
        return <TrendingUp className="w-5 h-5 text-yellow-400" />;
      case 'system_alert':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Bell className="w-5 h-5 text-futuristic-gray" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-futuristic-gray';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'high':
        return notification.priority === 'high';
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Card className="glass-effect w-full max-w-md">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Bell className="w-6 h-6 text-neon-purple" />
            <h3 className="text-lg font-orbitron font-bold text-white">
              Notificações
            </h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-futuristic-gray hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex space-x-2 mb-4">
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="text-xs"
          >
            Todas
          </Button>
          <Button
            variant={filter === 'unread' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
            className="text-xs"
          >
            Não Lidas
          </Button>
          <Button
            variant={filter === 'high' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('high')}
            className="text-xs"
          >
            Urgentes
          </Button>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="text-xs flex-1"
          >
            <Eye className="w-3 h-3 mr-1" />
            Marcar Todas
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllNotifications}
            disabled={notifications.length === 0}
            className="text-xs flex-1"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Limpar Todas
          </Button>
        </div>

        {/* Notifications List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-neon-purple/30 border-t-neon-purple rounded-full animate-spin"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-futuristic-gray/50 mx-auto mb-3" />
              <p className="text-futuristic-gray text-sm">
                {filter === 'all' ? 'Nenhuma notificação' : 
                 filter === 'unread' ? 'Nenhuma notificação não lida' :
                 'Nenhuma notificação urgente'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border-l-4 ${getPriorityColor(notification.priority)} ${
                  notification.read 
                    ? 'bg-darker-surface/30 opacity-75' 
                    : 'bg-darker-surface/50'
                } hover:bg-darker-surface/70 transition-colors cursor-pointer`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-medium ${
                        notification.read ? 'text-futuristic-gray' : 'text-white'
                      }`}>
                        {notification.title}
                      </h4>
                      <p className="text-xs text-futuristic-gray mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Clock className="w-3 h-3 text-futuristic-gray" />
                        <span className="text-xs text-futuristic-gray">
                          {new Date(notification.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    {!notification.read && (
                      <div className="w-2 h-2 bg-neon-purple rounded-full"></div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="text-futuristic-gray hover:text-red-400 p-1"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="mt-4 pt-4 border-t border-darker-surface/50">
            <p className="text-xs text-futuristic-gray text-center">
              {notifications.length} notificação{notifications.length !== 1 ? 'ões' : ''} • 
              {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default NotificationCenter;
export { NotificationCenter };