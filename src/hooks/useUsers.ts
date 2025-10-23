import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { supabaseAdmin } from '../lib/supabase-admin';
import { toast } from 'sonner';

export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  status: 'active' | 'inactive' | 'banned';
  role: string;
  phone?: string;
  app_metadata?: any;
  user_metadata?: any;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    newUsersThisWeek: 0,
    newUsersThisMonth: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar usuários do Supabase Auth
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar usuários do Supabase Auth (requer service role key)
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

      if (authError) {
        console.error('Erro ao buscar usuários:', authError);
        // Fallback: usar dados de contatos e newsletter como usuários
        await fetchUsersFromTables();
        return;
      }

      // Processar usuários do Auth
      const processedUsers: User[] = authUsers.users.map(user => ({
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.user_metadata?.full_name || 'Usuário',
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        email_confirmed_at: user.email_confirmed_at,
        status: user.email_confirmed_at ? 'active' : 'inactive',
        role: user.app_metadata?.role || 'user',
        phone: user.phone,
        app_metadata: user.app_metadata,
        user_metadata: user.user_metadata
      }));

      setUsers(processedUsers);
      calculateStats(processedUsers);

    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setError('Erro ao carregar usuários');
      // Fallback para dados das tabelas
      await fetchUsersFromTables();
    } finally {
      setLoading(false);
    }
  };

  // Função fallback para buscar usuários das tabelas (contatos, newsletter, etc.)
  const fetchUsersFromTables = async () => {
    try {
      // Buscar de múltiplas fontes
      const [contactsResult, subscribersResult, profilesResult] = await Promise.all([
        supabase.from('contacts').select('*'),
        supabase.from('newsletter_subscribers').select('*'),
        supabase.from('user_profiles').select('*')
      ]);

      const allUsers = new Map<string, User>();

      // Processar contatos
      if (contactsResult.data) {
        contactsResult.data.forEach(contact => {
          if (contact.email && !allUsers.has(contact.email)) {
            allUsers.set(contact.email, {
              id: contact.id || contact.email,
              email: contact.email,
              name: contact.name || 'Usuário',
              created_at: contact.created_at,
              status: 'active',
              role: 'user'
            });
          }
        });
      }

      // Processar assinantes da newsletter
      if (subscribersResult.data) {
        subscribersResult.data.forEach(subscriber => {
          if (subscriber.email) {
            const existing = allUsers.get(subscriber.email);
            if (existing) {
              existing.status = subscriber.status === 'active' ? 'active' : 'inactive';
            } else {
              allUsers.set(subscriber.email, {
                id: subscriber.id || subscriber.email,
                email: subscriber.email,
                name: subscriber.name || 'Assinante',
                created_at: subscriber.created_at,
                status: subscriber.status === 'active' ? 'active' : 'inactive',
                role: 'subscriber'
              });
            }
          }
        });
      }

      // Processar perfis de usuário
      if (profilesResult.data) {
        profilesResult.data.forEach(profile => {
          if (profile.email) {
            const existing = allUsers.get(profile.email);
            if (existing) {
              existing.name = profile.name || existing.name;
            } else {
              allUsers.set(profile.email, {
                id: profile.id || profile.email,
                email: profile.email,
                name: profile.name || 'Usuário',
                created_at: profile.created_at,
                status: 'active',
                role: 'user'
              });
            }
          }
        });
      }

      const usersArray = Array.from(allUsers.values());
      setUsers(usersArray);
      calculateStats(usersArray);

    } catch (error) {
      console.error('Erro ao buscar usuários das tabelas:', error);
      setError('Erro ao carregar dados de usuários');
    }
  };

  // Calcular estatísticas
  const calculateStats = (usersList: User[]) => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const newStats: UserStats = {
      totalUsers: usersList.length,
      activeUsers: usersList.filter(u => u.status === 'active').length,
      inactiveUsers: usersList.filter(u => u.status === 'inactive').length,
      newUsersThisWeek: usersList.filter(u => new Date(u.created_at) >= oneWeekAgo).length,
      newUsersThisMonth: usersList.filter(u => new Date(u.created_at) >= oneMonthAgo).length
    };

    setStats(newStats);
  };

  // Função para atualizar status do usuário
  const updateUserStatus = async (userId: string, newStatus: 'active' | 'inactive' | 'banned') => {
    try {
      // Tentar atualizar no Supabase Auth (se possível)
      if (newStatus === 'banned') {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (error) throw error;
      }

      // Atualizar localmente
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));

      const statusMessages = {
        active: 'Usuário ativado com sucesso!',
        inactive: 'Usuário desativado!',
        banned: 'Usuário banido!'
      };

      toast.success(statusMessages[newStatus]);
      
      // Recalcular estatísticas
      const updatedUsers = users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      );
      calculateStats(updatedUsers);

      return true;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error('Erro ao atualizar usuário');
      return false;
    }
  };

  // Função para buscar usuário por email
  const getUserByEmail = (email: string) => {
    return users.find(user => user.email === email);
  };

  // Função para filtrar usuários
  const filterUsers = (searchTerm: string, statusFilter: string) => {
    return users.filter(user => {
      const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = statusFilter === 'all' || user.status === statusFilter;
      return matchesSearch && matchesFilter;
    });
  };

  // Carregar usuários ao montar o componente
  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    stats,
    loading,
    error,
    fetchUsers,
    updateUserStatus,
    getUserByEmail,
    filterUsers,
    refreshUsers: fetchUsers
  };
};