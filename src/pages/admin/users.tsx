import React, { useMemo, useState } from 'react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { Users as UsersIcon, Search, ChevronLeft, ChevronRight, UserCheck, UserX, AlertTriangle, Calendar } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { toast } from 'sonner';

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
  const { users, stats, loading, error, updateUserStatus, filterUsers, refreshUsers } = useUsers();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<null | { action: 'active' | 'inactive' | 'banned'; ids: string[]; message: string }>(null);

  const filteredUsers = useMemo(() => filterUsers(searchTerm, statusFilter), [searchTerm, statusFilter, filterUsers]);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

  const handleStatusChange = async (id: string, status: 'active' | 'inactive' | 'banned') => {
    setConfirmAction({ action: status, ids: [id], message: `Confirmar ${status === 'active' ? 'ativação' : status === 'inactive' ? 'inativação' : 'banimento'} do usuário selecionado?` });
  };

  const handleRefresh = async () => {
    await refreshUsers();
    toast.success('Usuários atualizados');
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllPage = () => {
    const pageIds = paginatedUsers.map((u) => u.id);
    setSelectedIds((prev) => {
      const allSelected = pageIds.every((id) => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        pageIds.forEach((id) => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const performAction = async () => {
    if (!confirmAction) return;
    const { action, ids } = confirmAction;
    const results = await Promise.all(ids.map(async (id) => updateUserStatus(id, action)));
    const successCount = results.filter(Boolean).length;
    if (successCount === ids.length) {
      toast.success(`${action === 'active' ? 'Ativação' : action === 'inactive' ? 'Inativação' : 'Banimento'} concluído para ${successCount} usuário(s).`);
    } else {
      toast.error(`Falha em ${ids.length - successCount} usuário(s).`);
    }
    setConfirmAction(null);
    clearSelection();
    await refreshUsers();
  };

  return (
    <div className="space-y-8">
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
        <Button title="Atualizar lista de usuários" aria-label="Atualizar lista de usuários" onClick={handleRefresh} disabled={loading} className="bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/30 hover:scale-[1.02] transition-transform duration-200 ease-out rounded-full px-4">
          Atualizar
        </Button>
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
        <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-lime-green/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 hover:border-white/20 hover:ring-white/20 transition-all duration-200 ease-out hover:translate-y-[-1px] hover:shadow-[0_8px_26px_rgba(34,197,94,0.22)]">
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
              const allPageSelected = paginatedUsers.every((u) => selectedIds.has(u.id));
              return (
                <div
                  key={user.id}
                  className="group rounded-2xl overflow-hidden bg-gradient-to-br from-white/5 via-transparent to-transparent border border-white/10 ring-1 ring-white/10 hover:border-white/20 hover:ring-white/20 transition-all duration-200 ease-out hover:translate-y-[-1px] hover:shadow-[0_8px_22px_rgba(99,102,241,0.12)] p-4 sm:p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(user.id)}
                        aria-label={`Selecionar ${user.name || user.email}`}
                        className="accent-neon-purple/70 w-4 h-4 rounded"
                      />
                      <div className="relative">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full grid place-items-center font-orbitron text-white text-sm bg-gradient-to-br from-neon-purple/30 via-blue-500/20 to-transparent border border-white/10">
                          {initials}
                        </div>
                        {user.status === 'banned' && (
                          <span className="absolute -bottom-1 -right-1 text-red-400 bg-red-500/20 border border-red-400/30 rounded-full p-1">
                            <AlertTriangle className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium truncate">{user.name || 'Usuário'}</h4>
                        <p className="text-futuristic-gray text-sm truncate">{user.email}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-futuristic-gray">
                          <span>Cadastrado: {new Date(user.created_at).toLocaleDateString('pt-BR')}</span>
                          {user.last_sign_in_at && (
                            <span>Último acesso: {new Date(user.last_sign_in_at).toLocaleString('pt-BR')}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] uppercase tracking-wide border flex items-center gap-1 ${
                          user.status === 'active'
                            ? 'bg-lime-green/15 text-lime-green border-lime-green/30'
                            : user.status === 'inactive'
                            ? 'bg-yellow-500/15 text-yellow-400 border-yellow-400/30'
                            : 'bg-red-500/15 text-red-400 border-red-400/30'
                        }`}
                        aria-label={`Status: ${user.status}`}
                      >
                        {user.status === 'active' ? (
                          <UserCheck className="w-3.5 h-3.5" />
                        ) : user.status === 'inactive' ? (
                          <UserX className="w-3.5 h-3.5" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        )}
                        {user.status === 'active' ? 'Ativo' : user.status === 'inactive' ? 'Inativo' : 'Banido'}
                      </span>

                      {user.status !== 'active' && (
                        <Button
                          title="Ativar usuário"
                          aria-label="Ativar usuário"
                          size="sm"
                          onClick={() => handleStatusChange(user.id, 'active')}
                          className="rounded-full bg-lime-green/20 text-lime-green hover:bg-lime-green/30 transition-all duration-200 ease-out hover:scale-105"
                        >
                          <UserCheck className="w-4 h-4" />
                        </Button>
                      )}
                      {user.status === 'active' && (
                        <Button
                          title="Inativar usuário"
                          aria-label="Inativar usuário"
                          size="sm"
                          onClick={() => handleStatusChange(user.id, 'inactive')}
                          className="rounded-full bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-all duration-200 ease-out hover:scale-105"
                        >
                          <UserX className="w-4 h-4" />
                        </Button>
                      )}
                      {user.status !== 'banned' && (
                        <Button
                          title="Banir usuário"
                          aria-label="Banir usuário"
                          size="sm"
                          onClick={() => handleStatusChange(user.id, 'banned')}
                          className="rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all duration-200 ease-out hover:scale-105"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Seleção da página */}
            {paginatedUsers.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-futuristic-gray">
                <input type="checkbox" checked={paginatedUsers.every((u) => selectedIds.has(u.id))} onChange={selectAllPage} aria-label="Selecionar todos da página" className="accent-neon-purple/70 w-4 h-4 rounded" />
                <span>Selecionar todos da página</span>
              </div>
            )}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-6">
              <Button size="sm" variant="outline" onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} aria-label="Página anterior" title="Página anterior">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-white">Página {currentPage} de {totalPages}</span>
              <Button size="sm" variant="outline" onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} aria-label="Próxima página" title="Próxima página">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Modal de confirmação */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm">
          <Card className="max-w-md w-[92%] rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-transparent to-transparent p-6">
            <h3 className="text-white font-orbitron text-lg">Confirmação</h3>
            <p className="text-futuristic-gray mt-2">{confirmAction.message}</p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmAction(null)} aria-label="Cancelar" title="Cancelar">Cancelar</Button>
              <Button onClick={performAction} aria-label="Confirmar" title="Confirmar" className="bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/30">Confirmar</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}