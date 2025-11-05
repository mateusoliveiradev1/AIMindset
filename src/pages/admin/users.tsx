import React, { useMemo, useState } from 'react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { Users as UsersIcon, Search, ChevronLeft, ChevronRight, UserCheck, UserX, AlertTriangle, Calendar } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { toast } from 'sonner';

export default function AdminUsers() {
  const { users, stats, loading, error, updateUserStatus, filterUsers, refreshUsers } = useUsers();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  const filteredUsers = useMemo(() => filterUsers(searchTerm, statusFilter), [searchTerm, statusFilter, filterUsers]);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

  const handleStatusChange = async (id: string, status: 'active' | 'inactive' | 'banned') => {
    const ok = await updateUserStatus(id, status);
    if (!ok) toast.error('Não foi possível atualizar o usuário');
  };

  const handleRefresh = async () => {
    await refreshUsers();
    toast.success('Usuários atualizados');
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
        <Button title="Atualizar lista de usuários" onClick={handleRefresh} disabled={loading} className="bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/30 hover:scale-[1.02] transition-transform rounded-full px-4">
          Atualizar
        </Button>
      </div>

      {/* Cards de Métricas - idênticos ao estilo do dashboard/newsletter */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total de Usuários */}
        <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neon-purple/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 hover:border-white/20 hover:ring-white/20 transition-all hover:translate-y-[-1px] hover:shadow-[0_8px_30px_rgba(99,102,241,0.25)]">
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
        <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-lime-green/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 hover:border-white/20 hover:ring-white/20 transition-all hover:translate-y-[-1px] hover:shadow-[0_8px_30px_rgba(34,197,94,0.25)]">
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
        <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-400/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 hover:border-white/20 hover:ring-white/20 transition-all hover:translate-y-[-1px] hover:shadow-[0_8px_30px_rgba(250,204,21,0.25)]">
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
        <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-400/10 via-white/5 to-transparent backdrop-blur-sm border border-white/10 ring-1 ring-white/10 hover:border-white/20 hover:ring-white/20 transition-all hover:translate-y-[-1px] hover:shadow-[0_8px_30px_rgba(59,130,246,0.25)]">
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
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-darker-surface/50 border border-neon-purple/20 rounded-lg text-white focus:outline-none focus:border-neon-purple"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
            <option value="banned">Banidos</option>
          </select>
        </div>
      </Card>

      {/* Lista de Usuários */}
      <Card className="glass-effect">
        <div className="p-4 sm:p-6">
          {loading && (
            <div className="text-futuristic-gray text-sm">Carregando usuários...</div>
          )}
          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}
          {!loading && paginatedUsers.length === 0 && (
            <div className="text-futuristic-gray text-sm">Nenhum usuário encontrado.</div>
          )}

          <div className="space-y-4">
            {paginatedUsers.map((user) => (
              <div
                key={user.id}
                className="group rounded-2xl overflow-hidden bg-gradient-to-br from-white/5 via-transparent to-transparent border border-white/10 ring-1 ring-white/10 hover:border-white/20 hover:ring-white/20 transition-all hover:translate-y-[-1px] hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)] p-4 sm:p-5"
              >
                <div className="flex items-center justify-between gap-4">
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

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] uppercase tracking-wide border ${
                        user.status === 'active'
                          ? 'bg-lime-green/15 text-lime-green border-lime-green/30'
                          : user.status === 'inactive'
                          ? 'bg-yellow-500/15 text-yellow-400 border-yellow-400/30'
                          : 'bg-red-500/15 text-red-400 border-red-400/30'
                      }`}
                    >
                      {user.status === 'active' ? 'Ativo' : user.status === 'inactive' ? 'Inativo' : 'Banido'}
                    </span>

                    {user.status !== 'active' && (
                      <Button
                        title="Ativar usuário"
                        size="sm"
                        onClick={() => handleStatusChange(user.id, 'active')}
                        className="rounded-full bg-lime-green/20 text-lime-green hover:bg-lime-green/30 transition-all hover:scale-105"
                      >
                        <UserCheck className="w-4 h-4" />
                      </Button>
                    )}
                    {user.status === 'active' && (
                      <Button
                        title="Inativar usuário"
                        size="sm"
                        onClick={() => handleStatusChange(user.id, 'inactive')}
                        className="rounded-full bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-all hover:scale-105"
                      >
                        <UserX className="w-4 h-4" />
                      </Button>
                    )}
                    {user.status !== 'banned' && (
                      <Button
                        title="Banir usuário"
                        size="sm"
                        onClick={() => handleStatusChange(user.id, 'banned')}
                        className="rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all hover:scale-105"
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-6">
              <Button size="sm" variant="outline" onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-white">Página {currentPage} de {totalPages}</span>
              <Button size="sm" variant="outline" onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}