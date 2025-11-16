import React from 'react';
import { Calendar, MessageSquare, Award, TrendingUp } from 'lucide-react';
import { Card } from '../UI/Card';

interface ProfileStatsProps {
  joinDate?: string;
  commentCount?: number;
  role?: 'super_admin' | 'admin' | 'user' | string;
  className?: string;
}

const ProfileStats: React.FC<ProfileStatsProps> = ({ 
  joinDate, 
  commentCount = 0, 
  role,
  className 
}) => {
  const formatJoinDate = (dateStr?: string) => {
    if (!dateStr) return 'Recente';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    } catch {
      return 'Recente';
    }
  };

  const stats = [
    {
      icon: Calendar,
      label: 'Membro desde',
      value: formatJoinDate(joinDate),
      color: 'text-lime-green'
    },
    {
      icon: MessageSquare,
      label: 'Comentários',
      value: commentCount.toString(),
      color: 'text-neon-purple'
    },
    {
      icon: Award,
      label: 'Função',
      value: role === 'super_admin' || role === 'admin' ? 'Administrador' : 'Membro',
      color: role === 'super_admin' || role === 'admin' ? 'text-yellow-400' : 'text-futuristic-gray'
    }
  ];

  return (
    <Card variant="glass" className={className}>
      <div className="grid grid-cols-3 gap-4 p-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="text-center group">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-dark-surface/50 border border-neon-purple/20 mb-2 group-hover:border-lime-green/40 transition-colors duration-300`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="text-xs text-futuristic-gray mb-1">{stat.label}</div>
              <div className="text-sm font-semibold text-white">{stat.value}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default ProfileStats;