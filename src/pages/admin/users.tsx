import React, { useMemo, useState } from 'react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { Users as UsersIcon, Search, ChevronLeft, ChevronRight, UserCheck, UserX, AlertTriangle, Calendar, Trash2, Pencil } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { toast } from 'sonner';
import SEOManager from '@/components/SEO/SEOManager';

function getInitials(name?: string, email?: string) {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(' ');
    const initials = (parts[0][0] || '') + (parts[1]?.[0] || '');
    return initials.toUpperCase();
  }
  if (email) {
    const first = email.split('@')[0];
    return (first[0] || '?').toUpperCase();
  }
  return '?';
}

export default function AdminUsers() {
  const { users, stats, loading, error, updateUserStatus, filterUsers, refreshUsers, purgeNonAdminUsers, updateUserNameByEmail } = useUsers();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<null | { action: 'active' | 'inactive' | 'banned'; ids: string[]; message: string }>(null);
  const [purgeConfirm, setPurgeConfirm] = useState(false);

  const handlePurge = async () => {
    if (!purgeConfirm) {
      setPurgeConfirm(true);
      toast.info('Confirme a exclusão clicando novamente');
      return;
    }
    const superAdminEmail = users.find(u => u.role === 'super_admin')?.email || (window.localStorage.getItem('aimindset_user') ? JSON.parse(window.localStorage.getItem('aimindset_user') as string).email : '');
    if (!superAdminEmail) {
      toast.error('Email do super admin não encontrado');
      return;
    }
    const ok = await purgeNonAdminUsers(superAdminEmail);
    if (ok) {
      setPurgeConfirm(false);
    }
  };

  const handleFixSuperAdminName = async () => {
    const email = 'warface01031999@gmail.com';
    const name = 'Mateus Oliveira';
    const ok = await updateUserNameByEmail(email, name);
    if (ok) {
      toast.success('Nome do super admin atualizado para Mateus Oliveira');
    }
  };

  // Helpers de filtro e paginação
  const filteredUsers = useMemo(() => {
    return filterUsers(searchTerm, statusFilter);
  }, [users, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * usersPerPage;
    return filteredUsers.slice(start, start + usersPerPage);
  }, [filteredUsers, currentPage]);

  // Ações de usuário
  const handleStatusChange = async (userId: string, newStatus: 'active' | 'inactive' | 'banned') => {
    await updateUserStatus(userId, newStatus);
  };

  const handleRefresh = async () => {
    await refreshUsers();
    setCurrentPage(1);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const applyBulkAction = async () => {
    if (!confirmAction) return;
    const { action, ids } = confirmAction;
    for (const id of ids) {
      await updateUserStatus(id, action);
    }
    toast.success('Ação em massa aplicada');
    setConfirmAction(null);
    clearSelection();
  };

  return (
    <div className="space-y-8">
      <SEOManager metadata={{
        title: 'Usuários - Admin AIMindset',
        description: 'Gerencie usuários, status e atividade em tempo real.',
        keywords: ['usuários', 'gestão', 'status', 'admin'],
        canonicalUrl: 'https://aimindset.com.br/admin/users',
        type: 'webpage',
        language: 'pt-BR',
        robots: 'noindex, nofollow',
        breadcrumbs: [
          { name: 'Admin', url: 'https://aimindset.com.br/admin', position: 1 },
          { name: 'Usuários', url: 'https://aimindset.com.br/admin/users', position: 2 }
        ]
      }} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-orbitron font-bold text-white flex items-center">
            <UsersIcon className="w-6 h-6 mr-2 text-neon-purple" />
            Usuários
          </h2>
          <p className="text-futuristic-gray text-sm">Gerencie usuários em tempo real.</p>
          <p className="text-futuristic-gray text-xs mt-1">
            Total: {stats.totalUsers} • Ativos: {stats.activeUsers} • Novos este mês: {stats.newUsersThisMonth}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button title="Atualizar lista de usuários" aria-label="Atualizar lista de usuários" onClick={handleRefresh} disabled={loading} className="bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/30 hover:scale-[1.02] transition-transform duration-200 ease-out rounded-full px-4">
            Atualizar
          </Button>
          <Button title="Corrigir nome do super admin" aria-label="Corrigir nome do super admin" onClick={handleFixSuperAdminName} disabled={loading} className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:scale-[1.02] transition-transform duration-200 ease-out rounded-full px-4">
            <Pencil className="w-4 h-4 mr-2" /> Corrigir nome
          </Button>
          <Button title="Remover usuários de teste" aria-label="Remover usuários de teste" onClick={handlePurge} disabled={loading} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:scale-[1.02] transition-transform duration-200 ease-out rounded-full px-4">
            <Trash2 className="w-4 h-4 mr-2" /> Remover usuários de teste
          </Button>
        </div>
      </div>

      {/* Cards de Métricas - idênticos ao estilo do dashboard/newsletter */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total de Usuários */}
        <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neon-purple/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 hover:border-white/20 hover:ring-white/20 transition-all duration-200 ease-out hover:translate-y-[-1px] hover:shadow-[0_8px_26px_rgba(99,102,241,0.22)]">
          <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-neon-purple/20 blur-2xl" aria-hidden="true" />
          <div className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] sm:text-xs uppercase tracking-wide text-futuristic-gray">Total de Usuários</p>
                <p className="text-2xl sm:text-3xl font-orbitron font-bold text-white mt-1">
                  {typeof stats.totalUsers === 'number' ? stats.totalUsers.toLocaleString() : '...'}
                </p>
                <p className="text-[11px] text-neon-purple mt-1">Sistema</p>
              </div>
              <UsersIcon className="w-6 h-6 sm:w-7 sm:h-7 text-neon-purple" />
            </div>
          </div>
        </Card>

        {/* Usuários Ativos */}
        <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-lime-green/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 hover:border-white/20 hover:ring-white/20 transition-all duração-200 ease-out hover:translate-y-[-1px] hover:shadow-[0_8px_26px_rgba(34,197,94,0.22)]">
          <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-lime-green/20 blur-2xl" aria-hidden="true" />
          <div className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] sm:text-xs uppercase tracking-wide text-futuristic-gray">Usuários Ativos</p>
                <p className="text-2xl sm:text-3xl font-orbitron font-bold text-white mt-1">
                  {typeof stats.activeUsers === 'number' ? stats.activeUsers.toLocaleString() : '...'}
                </p>
                <p className="text-[11px] text-lime-green mt-1">Status</p>
              </div>
              <UserCheck className="w-6 h-6 sm:w-7 sm:h-7 text-lime-green" />
            </div>
          </div>
        </Card>

        {/* Usuários Inativos */}
        <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-400/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 hover:border-white/20 hover:ring-white/20 transition-all duration-200 ease-out hover:translate-y-[-1px] hover:shadow-[0_8px_26px_rgba(250,204,21,0.22)]">
          <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-yellow-400/20 blur-2xl" aria-hidden="true" />
          <div className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] sm:text-xs uppercase tracking-wide text-futuristic-gray">Usuários Inativos</p>
                <p className="text-2xl sm:text-3xl font-orbitron font-bold text-white mt-1">
                  {typeof stats.inactiveUsers === 'number' ? stats.inactiveUsers.toLocaleString() : '...'}
                </p>
                <p className="text-[11px] text-yellow-400 mt-1">Status</p>
              </div>
              <UserX className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-400" />
            </div>
          </div>
        </Card>

        {/* Novos este mês */}
        <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-400/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 hover:border-white/20 hover:ring-white/20 transition-all duration-200 ease-out hover:translate-y-[-1px] hover:shadow-[0_8px_26px_rgba(59,130,246,0.22)]">
          <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-blue-400/20 blur-2xl" aria-hidden="true" />
          <div className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] sm:text-xs uppercase tracking-wide text-futuristic-gray">Novos este mês</p>
                <p className="text-2xl sm:text-3xl font-orbitron font-bold text-white mt-1">
                  {typeof stats.newUsersThisMonth === 'number' ? stats.newUsersThisMonth.toLocaleString() : '...'}
                </p>
                <p className="text-[11px] text-blue-400 mt-1">Crescimento</p>
              </div>
              <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="glass-effect p-4 sm:p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-futuristic-gray w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple"
                aria-label="Buscar usuários"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white focus:outline-none focus:border-neon-purple"
            aria-label="Filtrar por status"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
            <option value="banned">Banidos</option>
          </select>
        </div>

        {selectedIds.size > 0 && (
          <div className="mt-4 flex items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
            <span className="text-sm text-white">{selectedIds.size} selecionado(s)</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setConfirmAction({ action: 'active', ids: Array.from(selectedIds), message: 'Confirmar ativação em massa?' })} aria-label="Ativar selecionados" title="Ativar selecionados" className="hover:scale-[1.02] transition-transform duration-200 ease-out">
                <UserCheck className="w-4 h-4 mr-1" /> Ativar
              </Button>
              <Button size="sm" variant="outline" onClick={() => setConfirmAction({ action: 'inactive', ids: Array.from(selectedIds), message: 'Confirmar inativação em massa?' })} aria-label="Inativar selecionados" title="Inativar selecionados" className="hover:scale-[1.02] transition-transform duration-200 ease-out">
                <UserX className="w-4 h-4 mr-1" /> Inativar
              </Button>
              <Button size="sm" variant="outline" onClick={() => setConfirmAction({ action: 'banned', ids: Array.from(selectedIds), message: 'Confirmar banimento em massa?' })} aria-label="Banir selecionados" title="Banir selecionados" className="hover:scale-[1.02] transition-transform duration-200 ease-out">
                <AlertTriangle className="w-4 h-4 mr-1" /> Banir
              </Button>
              <Button size="sm" onClick={clearSelection} aria-label="Limpar seleção" title="Limpar seleção" className="bg-white/10 text-white hover:bg-white/20">Limpar</Button>
            </div>
          </div>
        )}

        {confirmAction && (
          <div className="mt-3 flex items-center justify-between gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
            <span className="text-sm text-white">{confirmAction.message}</span>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={applyBulkAction} className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30">Confirmar</Button>
              <Button size="sm" variant="outline" onClick={() => setConfirmAction(null)}>Cancelar</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Lista de Usuários */}
      <Card className="glass-effect">
        <div className="p-4 sm:p-6">
          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden bg-white/5 border border-white/10 p-4 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-white/10" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/3 bg-white/10 rounded" />
                      <div className="h-3 w-1/4 bg-white/10 rounded" />
                    </div>
                    <div className="h-6 w-20 bg-white/10 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}
          {!loading && paginatedUsers.length === 0 && (
            <div className="rounded-2xl overflow-hidden bg-white/5 border border-white/10 p-6 text-center">
              <p className="text-futuristic-gray text-sm">Nenhum usuário encontrado.</p>
              <div className="mt-3 flex items-center justify-center gap-2">
                {(searchTerm || statusFilter !== 'all') && (
                  <Button variant="outline" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }} aria-label="Limpar filtros" title="Limpar filtros">Limpar filtros</Button>
                )}
                <Button onClick={handleRefresh} aria-label="Atualizar usuários" title="Atualizar usuários" className="bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/30">Atualizar</Button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {paginatedUsers.map((user) => {
              const initials = getInitials(user.name, user.email);
              const isSelected = selectedIds.has(user.id);
              return (
                <div key={user.id} className={`rounded-2xl overflow-hidden bg-gradient-to-br from-white/5 via-transparent to-transparent border border-white/10 ring-1 ring-white/10 hover:border-white/20 hover:ring-white/20 transition-all p-4 ${isSelected ? 'ring-neon-purple/40 border-neon-purple/40' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white font-semibold">{initials}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{user.name || user.email || 'Usuário'}</p>
                      <p className="text-futuristic-gray text-xs truncate">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="rounded-full" onClick={() => toggleSelect(user.id)} aria-label="Selecionar usuário" title="Selecionar usuário">{isSelected ? 'Desmarcar' : 'Selecionar'}</Button>
                      <select
                        value={user.status || 'active'}
                        onChange={(e) => handleStatusChange(user.id, e.target.value as any)}
                        className="px-2 py-1 bg-darker-surface/50 border border-white/10 rounded-full text-white text-xs"
                        aria-label="Alterar status do usuário"
                        title="Alterar status do usuário"
                      >
                        <option value="active">Ativo</option>
                        <option value="inactive">Inativo</option>
                        <option value="banned">Banido</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginação */}
          <div className="mt-4 flex items-center justify-between">
            <Button variant="outline" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} aria-label="Página anterior" title="Página anterior" className="rounded-full">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-futuristic-gray">Página {currentPage} de {totalPages}</span>
            <Button variant="outline" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} aria-label="Próxima página" title="Próxima página" className="rounded-full">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}