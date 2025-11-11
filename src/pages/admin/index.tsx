import { useEffect, useMemo, useState } from 'react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { 
  Activity, 
  FileText, 
  Users, 
  Mail, 
  MessageSquare, 
  Zap, 
  Send,
  Edit3,
  Eye,
  TrendingUp,
  ThumbsUp
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useArticles } from '@/hooks/useArticles';
import { useDebounce } from '@/hooks/useDebounce';
import UnifiedPerformanceDashboard from '@/components/Admin/UnifiedPerformanceDashboard';


// Skeletons
const ChartSkeleton = () => (
  <div className="w-full h-[320px] rounded-xl border border-white/10 ring-1 ring-white/10 p-4 animate-pulse">
    <div className="grid grid-cols-7 gap-2 h-full items-end">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="bg-white/10 rounded" style={{ height: `${20 + i * 8}%` }} />
      ))}
    </div>
  </div>
);

const ArticleCardSkeleton = () => (
  <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-white/5 via-transparent to-transparent border border-white/10 ring-1 ring-white/10 animate-pulse">
    <div className="relative h-28 sm:h-32 bg-darker-surface/40" />
    <div className="p-4 space-y-2">
      <div className="h-4 bg-white/10 rounded w-3/4" />
      <div className="h-3 bg-white/10 rounded w-1/2" />
      <div className="flex items-center gap-4">
        <div className="h-3 w-12 bg-white/10 rounded" />
        <div className="h-3 w-12 bg-white/10 rounded" />
        <div className="h-3 w-12 bg-white/10 rounded" />
      </div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const {
    stats: dashboardStats,
    weeklyData,
    recentActivities,
    refresh: refreshStats,
    isLoading: loadingDashboard
  } = useDashboardStats();
  const { articles, loading: loadingArticles } = useArticles();

  const recentArticles = useMemo(() => {
    return (articles || [])
      .slice()
      .sort((a: any, b: any) => {
        const aDate = new Date(a.updated_at || a.created_at || 0).getTime();
        const bDate = new Date(b.updated_at || b.created_at || 0).getTime();
        return bDate - aDate;
      })
      .slice(0, 5);
  }, [articles]);

  const handleEditArticle = (article: any) => {
    const id = article?.id;
    const slug = article?.slug;
    if (slug) {
      navigate(`/admin/editor?slug=${slug}`);
    } else if (id) {
      navigate(`/admin/editor?id=${id}`);
    }
  };

  const handleViewArticle = (article: any) => {
    if (!article?.slug) return;
    const url = `${window.location.origin}/artigo/${article.slug}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Filtros para Últimas Atividades (UI refinada sem scroll)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const filterLabels: Record<string, string> = {
    all: 'Todos',
    articles: 'Artigos',
    users: 'Usuários',
    comments: 'Comentários',
    newsletter: 'Newsletter',
    system: 'Sistema'
  };
  const filterOptions: Array<{ key: string; label: string; Icon: any }> = [
    { key: 'all', label: filterLabels.all, Icon: Activity },
    { key: 'articles', label: filterLabels.articles, Icon: FileText },
    { key: 'users', label: filterLabels.users, Icon: Users },
    { key: 'comments', label: filterLabels.comments, Icon: MessageSquare },
    { key: 'newsletter', label: filterLabels.newsletter, Icon: Send },
    { key: 'system', label: filterLabels.system, Icon: Zap }
  ];
  const filterStyles: Record<string, { active: string; icon: string }> = {
    all: { active: 'text-neon-purple border-neon-purple/50 bg-neon-purple/10 ring-1 ring-neon-purple/30 shadow-sm', icon: 'text-neon-purple' },
    articles: { active: 'text-neon-purple border-neon-purple/50 bg-neon-purple/10 ring-1 ring-neon-purple/30 shadow-sm', icon: 'text-neon-purple' },
    users: { active: 'text-lime-green border-lime-green/40 bg-lime-green/10 ring-1 ring-lime-green/20 shadow-sm', icon: 'text-lime-green' },
    comments: { active: 'text-blue-400 border-blue-400/40 bg-blue-400/10 ring-1 ring-blue-400/20 shadow-sm', icon: 'text-blue-400' },
    newsletter: { active: 'text-yellow-400 border-yellow-400/40 bg-yellow-400/10 ring-1 ring-yellow-400/20 shadow-sm', icon: 'text-yellow-400' },
    system: { active: 'text-orange-400 border-orange-400/40 bg-orange-400/10 ring-1 ring-orange-400/20 shadow-sm', icon: 'text-orange-400' }
  };

  // Estados e helpers para busca, pin e leitura
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedTerm = useDebounce(searchTerm, 200);
  const [pinnedKeys, setPinnedKeys] = useState<string[]>([]);
  const [readKeys, setReadKeys] = useState<string[]>([]);

  const activityKey = (a: any) => a?.id || `${a?.type}-${a?.time}`;

  const getActivityDate = (a: any) => {
    const raw: string | undefined = a?.data?.created_at || a?.time;
    const d = raw ? new Date(raw) : new Date();
    if (isNaN(d.getTime()) && typeof raw === 'string') {
      const parsed = new Date(Date.parse(raw));
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }
    return d;
  };

  const getDayLabel = (a: any) => {
    const d = getActivityDate(a);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const actDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.floor((today.getTime() - actDay.getTime()) / 86400000);
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays <= 7) return 'Esta semana';
    return 'Esta semana';
  };

  const togglePin = (a: any) => {
    const key = activityKey(a);
    setPinnedKeys(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [key, ...prev]));
  };

  const toggleRead = (a: any) => {
    const key = activityKey(a);
    setReadKeys(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));
  };

  const exportCSV = () => {
    const rows = (filteredActivities || []).map((a: any) => ({
      id: a.id,
      type: a.type,
      message: a.message,
      time: a.time
    }));
    const header = 'id,type,message,time';
    const body = rows
      .map(r => `${escapeCsv(r.id)},${escapeCsv(r.type)},${escapeCsv(r.message)},${escapeCsv(r.time)}`)
      .join('\n');
    const blob = new Blob([header + '\n' + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `atividades_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  function escapeCsv(value: any) {
    if (value == null) return '';
    const str = String(value).replace(/"/g, '""');
    if (/[",\n]/.test(str)) return `"${str}"`;
    return str;
  }

  const mapActivityTypeToFilter = (type: string | undefined): string => {
    switch (type) {
      case 'article_published':
        return 'articles';
      case 'new_comment':
        return 'comments';
      case 'campaign_sent':
        return 'newsletter';
      case 'new_subscriber':
        return 'users';
      case 'new_contact':
      case 'new_feedback':
      default:
        return 'system';
    }
  };

  // Contagem por tipo para badges nos chips
  const activityCounts = useMemo(() => {
    const base = recentActivities || [];
    const counts: Record<string, number> = {
      all: base.length,
      articles: 0,
      users: 0,
      comments: 0,
      newsletter: 0,
      system: 0
    };
    base.forEach((a: any) => {
      const key = mapActivityTypeToFilter(a?.type);
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [recentActivities]);

  const toggleFilter = (filter: string) => {
    if (filter === 'all') {
      setSelectedFilters([]);
      return;
    }
    setSelectedFilters((prev) => (
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    ));
  };
  const clearFilters = () => setSelectedFilters([]);
  const filteredActivities = useMemo(() => {
    let base = recentActivities || [];
    if (selectedFilters.length > 0) {
      base = base.filter((a: any) => selectedFilters.includes(mapActivityTypeToFilter(a?.type)));
    }
    if (debouncedTerm.trim()) {
      const term = debouncedTerm.toLowerCase();
      base = base.filter((a: any) => (
        (a.message || '').toLowerCase().includes(term) ||
        (a.type || '').toLowerCase().includes(term)
      ));
    }
    return base
      .slice()
      .sort((a: any, b: any) => {
        const aPinned = pinnedKeys.includes(activityKey(a)) ? 1 : 0;
        const bPinned = pinnedKeys.includes(activityKey(b)) ? 1 : 0;
        if (aPinned !== bPinned) return bPinned - aPinned;
        const da = getActivityDate(a).getTime();
        const db = getActivityDate(b).getTime();
        return db - da;
      });
  }, [recentActivities, selectedFilters, debouncedTerm, pinnedKeys]);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Dashboard - Admin AIMindset';
    return () => { document.title = 'AIMindset'; };
  }, []);

  // Métricas derivadas para publicação
  const draftsCount = Math.max(0, (dashboardStats?.totalArticles || 0) - (dashboardStats?.publishedArticles || 0));
  const publicationRate = (dashboardStats?.totalArticles || 0) > 0 
    ? ((dashboardStats?.publishedArticles || 0) / (dashboardStats?.totalArticles || 0)) * 100 
    : 0;

  // Helper: tempo relativo desde publicação/atualização
  const timeAgo = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `há ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `há ${hours}h`;
    const days = Math.floor(hours / 24);
    return `há ${days}d`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-orbitron font-bold text-white">Dashboard</h2>
          <p className="text-futuristic-gray text-sm">
            Última atualização: {dashboardStats?.lastUpdate ? new Date(dashboardStats.lastUpdate).toLocaleString('pt-BR') : 'Carregando...'}
          </p>
        </div>
        <Button
          onClick={refreshStats}
          disabled={loadingDashboard}
          className="bg-neon-gradient hover:bg-neon-gradient/80 disabled:opacity-50 rounded-full"
        >
          {loadingDashboard ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Activity className="w-4 h-4 mr-2" />
          )}
          Atualizar
        </Button>
      </div>

      {/* Dashboard de Performance Unificado */}
      <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neon-purple/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10">
        <div className="p-4 sm:p-6">
          <UnifiedPerformanceDashboard />
        </div>
      </Card>

      {/* Loading */}
      {loadingDashboard && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-purple"></div>
          <span className="ml-3 text-futuristic-gray">Carregando dados em tempo real...</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6">
        {/* Total de Artigos */}
        <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neon-purple/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 hover:border-white/20 hover:ring-white/20 transition-all hover:translate-y-[-1px] hover:shadow-[0_8px_30px_rgba(99,102,241,0.25)]">
          <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-neon-purple/20 blur-2xl" aria-hidden="true" />
          <div className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] sm:text-xs uppercase tracking-wide text-futuristic-gray">Total de Artigos</p>
                <p className="text-2xl sm:text-3xl font-orbitron font-bold text-white mt-1">
                  {loadingDashboard ? '...' : dashboardStats?.totalArticles?.toLocaleString() || '0'}
                </p>
                <p className="text-[11px] text-futuristic-gray mt-1">Contagem geral</p>
              </div>
              <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-neon-purple" />
            </div>
          </div>
        </Card>

        {/* Artigos Publicados */}
        <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-lime-green/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 hover:border-white/20 hover:ring-white/20 transition-all hover:translate-y-[-1px] hover:shadow-[0_8px_30px_rgba(34,197,94,0.25)]">
          <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-lime-green/20 blur-2xl" aria-hidden="true" />
          <div className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] sm:text-xs uppercase tracking-wide text-futuristic-gray">Artigos Publicados</p>
                <p className="text-2xl sm:text-3xl font-orbitron font-bold text-white mt-1">
                  {loadingDashboard ? '...' : (dashboardStats?.publishedArticles || 0).toLocaleString()}
                </p>
                <p className="text-[11px] text-lime-green mt-1">Em produção</p>
              </div>
              <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-lime-green" />
            </div>
          </div>
        </Card>

        {/* Rascunhos */}
        <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-400/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 hover:border-white/20 hover:ring-white/20 transition-all hover:translate-y-[-1px] hover:shadow-[0_8px_30px_rgba(234,179,8,0.25)]">
          <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-yellow-400/20 blur-2xl" aria-hidden="true" />
          <div className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] sm:text-xs uppercase tracking-wide text-futuristic-gray">Rascunhos</p>
                <p className="text-2xl sm:text-3xl font-orbitron font-bold text-white mt-1">
                  {loadingDashboard ? '...' : (Math.max(0, (dashboardStats?.totalArticles || 0) - (dashboardStats?.publishedArticles || 0))).toLocaleString()}
                </p>
                <p className="text-[11px] text-yellow-400 mt-1">Aguardando publicação</p>
              </div>
              <Edit3 className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-400" />
            </div>
          </div>
        </Card>

        {/* Taxa de Publicação */}
        <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neon-purple/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 hover:border-white/20 hover:ring-white/20 transition-all hover:translate-y-[-1px] hover:shadow-[0_8px_30px_rgba(99,102,241,0.25)]">
          <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-neon-purple/20 blur-2xl" aria-hidden="true" />
          <div className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] sm:text-xs uppercase tracking-wide text-futuristic-gray">Taxa de Publicação</p>
                <p className="text-2xl sm:text-3xl font-orbitron font-bold text-white mt-1">
                  {(((dashboardStats?.publishedArticles || 0) / Math.max(1, (dashboardStats?.totalArticles || 0))) * 100).toFixed(1)}%
                </p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-white/10">
                  <div className="h-1.5 rounded-full bg-neon-purple" style={{ width: `${Math.min(100, Math.max(0, ((dashboardStats?.publishedArticles || 0) / Math.max(1, (dashboardStats?.totalArticles || 0))) * 100))}%` }} />
                </div>
                <p className="text-[11px] text-futuristic-gray mt-1">{dashboardStats?.publishedArticles || 0} publicados • {Math.max(0, (dashboardStats?.totalArticles || 0) - (dashboardStats?.publishedArticles || 0))} rascunhos</p>
              </div>
              <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-neon-purple ml-3 flex-shrink-0" />
            </div>
          </div>
        </Card>

        {/* Crescimento Semanal */}
        <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-lime-green/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 hover:border-white/20 hover:ring-white/20 transition-all hover:translate-y-[-1px] hover:shadow-[0_8px_30px_rgba(34,197,94,0.25)]">
          <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-lime-green/20 blur-2xl" aria-hidden="true" />
          <div className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] sm:text-xs uppercase tracking-wide text-futuristic-gray">Crescimento Semanal</p>
                <p className="text-2xl sm:text-3xl font-orbitron font-bold text-white mt-1">
                  +{(dashboardStats?.weeklyGrowth || 0).toFixed(1)}%
                </p>
                <p className="text-[11px] text-lime-green mt-1">Inscritos na semana</p>
              </div>
              <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-lime-green" />
            </div>
          </div>
        </Card>

        {/* Inscritos Ativos */}
        <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-400/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 hover:border-white/20 hover:ring-white/20 transition-all hover:translate-y-[-1px] hover:shadow-[0_8px_30px_rgba(59,130,246,0.25)]">
          <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-blue-400/20 blur-2xl" aria-hidden="true" />
          <div className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] sm:text-xs uppercase tracking-wide text-futuristic-gray">Inscritos Ativos</p>
                <p className="text-2xl sm:text-3xl font-orbitron font-bold text-white mt-1">
                  {loadingDashboard ? '...' : (dashboardStats?.totalSubscribers || 0).toLocaleString()}
                </p>
                <p className="text-[11px] text-blue-400 mt-1">Newsletter</p>
              </div>
              <Mail className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Gráfico */}
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="glass-effect">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 gap-2">
              <h3 className="text-base sm:text-lg font-orbitron font-bold text-white">Atividade por Dia</h3>
              {loadingDashboard && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
            </div>
            <div style={{ width: '100%', height: '320px', minWidth: '300px', minHeight: '320px', position: 'relative' }}>
              {loadingDashboard ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-purple"></div>
                  <span className="ml-2 text-futuristic-gray">Carregando gráfico...</span>
                </div>
              ) : (
                <ResponsiveContainer width={300} height={320} minWidth={300} minHeight={320}>
                  <BarChart
                    width={300}
                    height={320}
                    data={weeklyData && weeklyData.length > 0 ? weeklyData : [
                      { name: 'Dom', articles: 0, subscribers: 0, comments: 0, feedback: 0, contacts: 0 },
                      { name: 'Seg', articles: 0, subscribers: 0, comments: 0, feedback: 0, contacts: 0 },
                      { name: 'Ter', articles: 0, subscribers: 0, comments: 0, feedback: 0, contacts: 0 },
                      { name: 'Qua', articles: 0, subscribers: 0, comments: 0, feedback: 0, contacts: 0 },
                      { name: 'Qui', articles: 0, subscribers: 0, comments: 0, feedback: 0, contacts: 0 },
                      { name: 'Sex', articles: 0, subscribers: 0, comments: 0, feedback: 0, contacts: 0 },
                      { name: 'Sáb', articles: 0, subscribers: 0, comments: 0, feedback: 0, contacts: 0 }
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #6366F1',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="articles" fill="#6366F1" name="Artigos" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="subscribers" fill="#22C55E" name="Inscritos" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="comments" fill="#3B82F6" name="Comentários" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="feedback" fill="#F59E0B" name="Feedback" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="contacts" fill="#14B8A6" name="Contatos" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </Card>

        {/* Últimas Atividades com filtros refinados sem scroll */}
        <Card className="glass-effect">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 gap-2">
              <h3 className="text-base sm:text-lg font-orbitron font-bold text-white">Últimas Atividades</h3>
              {loadingDashboard && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neon-purple"></div>
              )}
            </div>
            {/* Ferramentas: busca e exportação */}
            <div className="flex items-center justify-between mb-3 gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar atividades..."
                aria-label="Buscar atividades"
                className="flex-1 min-w-0 rounded-full bg-darker-surface/50 border border-white/10 text-sm px-3 py-1.5 text-white placeholder-futuristic-gray focus:outline-none focus:ring-1 focus:ring-neon-purple/40"
              />
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="rounded-full text-futuristic-gray border-white/20 hover:border-white/30 hover:bg-white/5" onClick={exportCSV} aria-label="Exportar atividades para CSV">
                  Exportar CSV
                </Button>
                {selectedFilters.length > 0 && (
                  <Button size="sm" variant="ghost" className="text-neon-purple hover:text-neon-purple/80 rounded-full" onClick={clearFilters}>
                    Limpar filtros
                  </Button>
                )}
              </div>
            </div>
            {/* Filtros: sem scroll lateral, wrap em todas as larguras */}
            <div className="mb-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 w-full gap-1.5 sm:gap-2">
                {filterOptions.map(({ key, label, Icon }) => {
                  const active = key === 'all' ? selectedFilters.length === 0 : selectedFilters.includes(key);
                  const activeClass = active ? filterStyles[key].active : 'text-futuristic-gray border-darker-surface/60 bg-darker-surface/30 hover:bg-darker-surface/50';
                  const iconClass = active ? filterStyles[key].icon : 'text-futuristic-gray';
                  return (
                    <Button
                      key={key}
                      size="sm"
                      variant="outline"
                      aria-pressed={active}
                      className={`rounded-full h-6 sm:h-7 text-[10px] sm:text-[11px] px-2 sm:px-2.5 transition-all hover:scale-[1.005] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-purple/30 ${activeClass} w-full justify-center`}
                      onClick={() => toggleFilter(key)}
                      title={label}
                    >
                      <Icon className={`w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 opacity-90 ${iconClass}`} />
                      <span>{label}</span>
                      {activityCounts[key] > 0 && (
                        <span className={`ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[8.5px] border ${active ? 'bg-white/10 text-white border-white/20' : 'bg-darker-surface/60 text-futuristic-gray border-darker-surface/40'}`}>
                          {activityCounts[key]}
                        </span>
                      )}
                    </Button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-futuristic-gray">{selectedFilters.length} filtro(s)</span>
                {selectedFilters.length > 0 && (
                  <Button size="sm" variant="ghost" className="text-neon-purple hover:text-neon-purple/80" onClick={clearFilters}>
                    Limpar
                  </Button>
                )}
              </div>
            </div>

            {/* Timeline vertical por dia */}
            <div className="space-y-6 max-h-80 sm:max-h-96 overflow-y-auto custom-scrollbar">
              {loadingDashboard ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-purple"></div>
                  <span className="ml-2 text-futuristic-gray">Carregando atividades...</span>
                </div>
              ) : filteredActivities && filteredActivities.length > 0 ? (
                ['Hoje', 'Ontem', 'Esta semana'].map((label) => {
                  const items = filteredActivities.filter((a: any) => getDayLabel(a) === label).slice(0, 20);
                  if (items.length === 0) return null;
                  return (
                    <div key={label}>
                      <h4 className="text-xs font-semibold text-white/80 mb-2">{label}</h4>
                      <div className="relative pl-6">
                        <div className="absolute left-2 top-0 bottom-0 w-px bg-white/10" />
                        {items.map((activity: any, index: number) => {
                          const key = activityKey(activity);
                          const filterKey = mapActivityTypeToFilter(activity?.type);
                          const colorClass = (filterStyles[filterKey]?.icon || 'text-neon-purple').replace('text-', 'bg-');
                          const isPinned = pinnedKeys.includes(key);
                          const isRead = readKeys.includes(key);
                          return (
                            <div key={key + index} className={`relative group flex items-start space-x-3 p-3 sm:p-4 bg-gradient-to-r from-darker-surface/20 to-darker-surface/40 rounded-xl transition-all duration-300 border border-transparent hover:border-neon-purple/20 ring-1 ring-transparent hover:ring-neon-purple/20 ${isRead ? 'opacity-60' : ''}`}>
                              <span className={`absolute left-1 top-4 w-2 h-2 rounded-full ring-2 ring-white/20 ${colorClass}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium leading-tight line-clamp-2 sm:line-clamp-3">{activity.message}</p>
                                <div className="mt-1 flex items-center gap-2 text-xs text-futuristic-gray">
                                  <span title={activity.time}>{activity.time}</span>
                                  {isPinned && <span className="text-neon-purple">• fixado</span>}
                                  {!isRead && <span className="px-1.5 py-0.5 rounded-full bg-neon-purple/20 text-neon-purple text-[10px]">novo</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-auto">
                                <Button size="sm" variant="ghost" className="text-neon-purple hover:text-neon-purple/80" onClick={() => togglePin(activity)}>
                                  {isPinned ? 'Desfixar' : 'Fixar'}
                                </Button>
                                <Button size="sm" variant="ghost" className="text-futuristic-gray hover:text-white/80 rounded-full" onClick={() => toggleRead(activity)}>
                                  {isRead ? 'Não lido' : 'Lido'}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center py-6">
                  <span className="text-futuristic-gray text-sm">Nenhuma atividade recente</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Conteúdo Recente - responsivo e polido */}
      <Card className="glass-effect">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h3 className="text-base sm:text-lg font-orbitron font-bold text-white">Conteúdo Recente</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/articles')}
              className="text-neon-purple border-neon-purple/30 hover:bg-neon-purple/10 rounded-full"
            >
              Ver todos
            </Button>
          </div>

          {loadingArticles ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <ArticleCardSkeleton key={i} />
              ))}
            </div>
          ) : recentArticles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentArticles.map((article: any) => {
                const categoryName = typeof article.category === 'object' ? (article.category?.name || '') : (typeof article.category === 'string' ? article.category : '');
                const authorName = article.author || 'Autor';
                const publishedBadge = article.published ? (
                  <span className="px-2 py-1 rounded-full bg-lime-green/20 text-lime-green text-[11px] border border-lime-green/30">Publicado</span>
                ) : (
                  <span className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-[11px] border border-yellow-400/30">Rascunho</span>
                );
                const views = (typeof article.views === 'number' ? article.views : (typeof (article as any).total_views === 'number' ? (article as any).total_views : 0));
                const comments = article.comments_count ?? 0;
                const likes = article.likes_count ?? 0;
                return (
                  <div key={article.id} className="group rounded-2xl overflow-hidden bg-gradient-to-br from-white/5 via-transparent to-transparent border border-white/10 ring-1 ring-white/10 hover:border-white/20 hover:ring-white/20 transition-all hover:translate-y-[-1px] hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)]">
                    {/* Header com imagem */}
                    <div className="relative h-28 sm:h-32 bg-darker-surface/40">
                      {article.image_url ? (
                        <img src={article.image_url} alt={article.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/20 via-darker-surface/40 to-transparent" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="absolute top-2 left-2 flex items-center gap-2">
                        {publishedBadge}
                        {categoryName && (
                          <span className="px-2 py-1 rounded-full bg-white/10 text-white text-[11px] border border-white/20">{categoryName}</span>
                        )}
                      </div>
                      {/* Preview ao hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm bg-black/30 p-3 flex items-end">
                        <p className="text-white/90 text-xs line-clamp-3">{(article.excerpt || article.content || '').slice(0, 160)}{(article.excerpt || article.content || '').length > 160 ? '...' : ''}</p>
                      </div>
                    </div>
                
                    {/* Corpo */}
                    <div className="p-4">
                      <h4 className="text-white font-semibold text-base mb-1 line-clamp-2">{article.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-futuristic-gray mb-2">
                        <span>{authorName}</span>
                        <span>•</span>
                        <span>{timeAgo(article.updated_at || article.created_at)}</span>
                      </div>
                
                      {/* Métricas */}
                      <div className="flex items-center gap-4 text-xs">
                        <span className="inline-flex items-center gap-1 text-white/80"><Eye className="w-3.5 h-3.5 text-white/70" /> {views}</span>
                        <span className="inline-flex items-center gap-1 text-blue-400"><MessageSquare className="w-3.5 h-3.5" /> {comments}</span>
                        <span className="inline-flex items-center gap-1 text-pink-400"><ThumbsUp className="w-3.5 h-3.5" /> {likes}</span>
                      </div>
                
                      {/* Ações rápidas */}
                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-blue-400 hover:text-blue-300 rounded-full"
                          onClick={() => handleViewArticle(article)}
                          title="Ver artigo"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="ml-1 hidden sm:inline">Ver</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-yellow-400 hover:text-yellow-300 rounded-full"
                          onClick={() => handleEditArticle(article)}
                          title="Editar artigo"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span className="ml-1 hidden sm:inline">Editar</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center py-6">
              <span className="text-futuristic-gray text-sm">Nenhum artigo recente</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}