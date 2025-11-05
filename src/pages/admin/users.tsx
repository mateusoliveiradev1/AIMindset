import React, { useMemo, useState } from 'react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { Users as UsersIcon, Search, ChevronLeft, ChevronRight, UserCheck, UserX, AlertTriangle } from 'lucide-react';
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
        <Button onClick={handleRefresh} disabled={loading} className="bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/30">
          Atualizar
        </Button>
      </div>

      {/* Filtros */}
      <Card className="glass-effect">
        <div className="p-4">
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
              <div key={user.id} className="flex items-center justify-between p-4 bg-darker-surface/30 rounded-lg border border-neon-purple/10">
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium truncate">{user.name || 'Usuário'}</h4>
                  <p className="text-futuristic-gray text-sm truncate">{user.email}</p>
                  <p className="text-futuristic-gray text-xs">Cadastrado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}</p>
                  {user.last_sign_in_at && (
                    <p className="text-futuristic-gray text-xs">Último acesso: {new Date(user.last_sign_in_at).toLocaleString('pt-BR')}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${user.status === 'active' ? 'bg-lime-green/20 text-lime-green' : user.status === 'inactive' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                    {user.status === 'active' ? 'Ativo' : user.status === 'inactive' ? 'Inativo' : 'Banido'}
                  </span>
                  {user.status !== 'active' && (
                    <Button size="sm" onClick={() => handleStatusChange(user.id, 'active')} className="bg-lime-green/20 text-lime-green hover:bg-lime-green/30">
                      <UserCheck className="w-4 h-4" />
                    </Button>
                  )}
                  {user.status === 'active' && (
                    <Button size="sm" onClick={() => handleStatusChange(user.id, 'inactive')} className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30">
                      <UserX className="w-4 h-4" />
                    </Button>
                  )}
                  {user.status !== 'banned' && (
                    <Button size="sm" onClick={() => handleStatusChange(user.id, 'banned')} className="bg-red-500/20 text-red-400 hover:bg-red-500/30">
                      <AlertTriangle className="w-4 h-4" />
                    </Button>
                  )}
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