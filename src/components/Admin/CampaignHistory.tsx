import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { 
  Mail, 
  Eye, 
  MousePointer, 
  Calendar, 
  Users, 
  TrendingUp,
  Filter,
  Search,
  ChevronDown,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { NewsletterCampaign } from '../../hooks/useNewsletterCampaigns';

interface CampaignHistoryProps {
  campaigns: NewsletterCampaign[];
  loading: boolean;
  onRefresh: () => void;
}

export const CampaignHistory: React.FC<CampaignHistoryProps> = ({
  campaigns,
  loading,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filtrar e ordenar campanhas
  const filteredCampaigns = campaigns
    .filter(campaign => {
      const matchesSearch = campaign.subject.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aValue = a[sortBy as keyof NewsletterCampaign];
      const bValue = b[sortBy as keyof NewsletterCampaign];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'scheduled':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'draft':
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
      case 'sending':
        return <Clock className="w-4 h-4 text-blue-400 animate-pulse" />;
      default:
        return <AlertCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent':
        return 'Enviada';
      case 'scheduled':
        return 'Agendada';
      case 'draft':
        return 'Rascunho';
      case 'sending':
        return 'Enviando';
      default:
        return 'Erro';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateOpenRate = (opened: number, sent: number) => {
    if (sent === 0) return '0%';
    return `${((opened / sent) * 100).toFixed(1)}%`;
  };

  const calculateClickRate = (clicked: number, sent: number) => {
    if (sent === 0) return '0%';
    return `${((clicked / sent) * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Filtros e Busca */}
      <Card className="glass-effect">
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              {/* Busca */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-futuristic-gray w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por assunto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple"
                />
              </div>

              {/* Filtro por Status */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-darker-surface/50 border border-neon-purple/20 rounded-lg px-4 py-2 pr-8 text-white focus:outline-none focus:border-neon-purple"
                >
                  <option value="all">Todos os Status</option>
                  <option value="sent">Enviadas</option>
                  <option value="scheduled">Agendadas</option>
                  <option value="draft">Rascunhos</option>
                  <option value="sending">Enviando</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-futuristic-gray w-4 h-4 pointer-events-none" />
              </div>

              {/* Ordenação */}
              <div className="relative">
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order as 'asc' | 'desc');
                  }}
                  className="appearance-none bg-darker-surface/50 border border-neon-purple/20 rounded-lg px-4 py-2 pr-8 text-white focus:outline-none focus:border-neon-purple"
                >
                  <option value="created_at-desc">Mais Recentes</option>
                  <option value="created_at-asc">Mais Antigas</option>
                  <option value="subject-asc">Assunto A-Z</option>
                  <option value="subject-desc">Assunto Z-A</option>
                  <option value="recipient_count-desc">Mais Enviadas</option>
                  <option value="opened_count-desc">Mais Abertas</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-futuristic-gray w-4 h-4 pointer-events-none" />
              </div>
            </div>

            <Button
              onClick={onRefresh}
              variant="outline"
              disabled={loading}
              className="whitespace-nowrap"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
      </Card>

      {/* Lista de Campanhas */}
      <div className="space-y-4">
        {loading ? (
          <Card className="glass-effect">
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-purple mx-auto mb-4"></div>
              <p className="text-futuristic-gray">Carregando campanhas...</p>
            </div>
          </Card>
        ) : filteredCampaigns.length === 0 ? (
          <Card className="glass-effect">
            <div className="p-8 text-center">
              <Mail className="w-16 h-16 text-futuristic-gray mx-auto mb-4" />
              <h3 className="text-xl font-orbitron font-bold text-white mb-2">
                Nenhuma campanha encontrada
              </h3>
              <p className="text-futuristic-gray">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Crie sua primeira campanha para começar'
                }
              </p>
            </div>
          </Card>
        ) : (
          filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} className="glass-effect hover:border-neon-purple/40 transition-colors">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Informações da Campanha */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(campaign.status)}
                      <h3 className="text-lg font-orbitron font-bold text-white">
                        {campaign.subject}
                      </h3>
                      <span className="px-2 py-1 bg-neon-purple/20 text-neon-purple text-xs rounded-full">
                        {getStatusText(campaign.status)}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-futuristic-gray">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {campaign.scheduled_at 
                            ? `Agendada para ${formatDate(campaign.scheduled_at)}`
                            : `Criada em ${formatDate(campaign.created_at)}`
                          }
                        </span>
                      </div>
                      
                      {campaign.template_id && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          <span>Template #{campaign.template_id}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Métricas */}
                  {campaign.status === 'sent' && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Users className="w-4 h-4 text-blue-400" />
                          <span className="text-xs text-futuristic-gray">Enviados</span>
                        </div>
                        <p className="text-lg font-bold text-white">
                          {campaign.recipient_count?.toLocaleString() || '0'}
                        </p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Eye className="w-4 h-4 text-green-400" />
                          <span className="text-xs text-futuristic-gray">Abertos</span>
                        </div>
                        <p className="text-lg font-bold text-white">
                          {campaign.opened_count?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-green-400">
                          {calculateOpenRate(campaign.opened_count || 0, campaign.recipient_count || 0)}
                        </p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <MousePointer className="w-4 h-4 text-yellow-400" />
                          <span className="text-xs text-futuristic-gray">Cliques</span>
                        </div>
                        <p className="text-lg font-bold text-white">
                          {campaign.clicked_count?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-yellow-400">
                          {calculateClickRate(campaign.clicked_count || 0, campaign.recipient_count || 0)}
                        </p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <TrendingUp className="w-4 h-4 text-purple-400" />
                          <span className="text-xs text-futuristic-gray">CTR</span>
                        </div>
                        <p className="text-lg font-bold text-white">
                          {campaign.opened_count && campaign.opened_count > 0
                            ? `${(((campaign.clicked_count || 0) / campaign.opened_count) * 100).toFixed(1)}%`
                            : '0%'
                          }
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Status para campanhas não enviadas */}
                  {campaign.status !== 'sent' && (
                    <div className="text-center lg:text-right">
                      <p className="text-sm text-futuristic-gray mb-1">
                        {campaign.status === 'scheduled' && campaign.scheduled_at
                          ? 'Será enviada em:'
                          : 'Status:'
                        }
                      </p>
                      <p className="text-white font-medium">
                        {campaign.status === 'scheduled' && campaign.scheduled_at
                          ? formatDate(campaign.scheduled_at)
                          : getStatusText(campaign.status)
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Resumo das Métricas */}
      {filteredCampaigns.length > 0 && (
        <Card className="glass-effect">
          <div className="p-6">
            <h4 className="text-lg font-orbitron font-bold text-white mb-4">
              Resumo das Campanhas
            </h4>
            
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">
                  {filteredCampaigns.length}
                </p>
                <p className="text-sm text-futuristic-gray">Total</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">
                  {filteredCampaigns.filter(c => c.status === 'sent').length}
                </p>
                <p className="text-sm text-futuristic-gray">Enviadas</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">
                  {filteredCampaigns.filter(c => c.status === 'scheduled').length}
                </p>
                <p className="text-sm text-futuristic-gray">Agendadas</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">
                  {filteredCampaigns
                    .filter(c => c.status === 'sent')
                    .reduce((sum, c) => sum + (c.recipient_count || 0), 0)
                    .toLocaleString()
                  }
                </p>
                <p className="text-sm text-futuristic-gray">Emails Enviados</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-400">
                  {filteredCampaigns.length > 0
                    ? `${(
                        (filteredCampaigns
                          .filter(c => c.status === 'sent')
                          .reduce((sum, c) => sum + (c.opened_count || 0), 0) /
                        Math.max(1, filteredCampaigns
                          .filter(c => c.status === 'sent')
                          .reduce((sum, c) => sum + (c.recipient_count || 0), 0))) * 100
                      ).toFixed(1)}%`
                    : '0%'
                  }
                </p>
                <p className="text-sm text-futuristic-gray">Taxa de Abertura Média</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};