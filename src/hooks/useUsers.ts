import { useState, useEffect } from 'react';
import { supabase, supabaseServiceClient } from '../lib/supabase';
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

  // Função para calcular estatísticas
  const calculateStats = (data: User[]) => {
    const total = data.length;
    const active = data.filter(u => u.status === 'active').length;
    const inactive = data.filter(u => u.status === 'inactive').length;

    // Novos usuários por intervalo (simplificado)
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const newUsersThisWeek = data.filter(u => new Date(u.created_at) >= startOfWeek).length;
    const newUsersThisMonth = data.filter(u => new Date(u.created_at) >= startOfMonth).length;

    setStats({
      totalUsers: total,
      activeUsers: active,
      inactiveUsers: inactive,
      newUsersThisWeek,
      newUsersThisMonth
    });
  };

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
        supabaseServiceClient.from('contacts').select('*'),
        supabaseServiceClient.from('newsletter_subscribers').select('*'),
        supabaseServiceClient.from('user_profiles').select('*')
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

  // Função para remover todos usuários não-super_admin
  const purgeNonAdminUsers = async (superAdminEmail: string) => {
    try {
      setLoading(true);
      setError(null);

      // Garantir lista atualizada do Auth
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      if (authError) throw authError;

      // Encontrar super admin
      const superAdmin = authUsers.users.find(u => (u.email || '').toLowerCase() === superAdminEmail.toLowerCase());
      if (!superAdmin) {
        toast.error('Super admin não encontrado no Auth');
        setLoading(false);
        return false;
      }

      // Remover todos que não sejam o super admin
      const targets = authUsers.users.filter(u => (u.email || '').toLowerCase() !== superAdminEmail.toLowerCase());
      for (const u of targets) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(u.id);
        } catch (e) {
          console.warn('Falha ao excluir usuário', u.email, e);
        }
      }

      // Opcional: limpar registros associados em tabelas auxiliares (profiles, contacts, subscribers)
      await supabaseAdmin.from('user_profiles').delete().neq('email', superAdminEmail);
      await supabaseAdmin.from('contacts').delete().neq('email', superAdminEmail);
      await supabaseAdmin.from('newsletter_subscribers').delete().neq('email', superAdminEmail);

      // Atualizar estado local
      const remaining: User[] = [{
        id: superAdmin.id,
        email: superAdmin.email || superAdminEmail,
        name: superAdmin.user_metadata?.name || superAdmin.user_metadata?.full_name || 'Super Admin',
        created_at: superAdmin.created_at,
        last_sign_in_at: superAdmin.last_sign_in_at,
        email_confirmed_at: superAdmin.email_confirmed_at,
        status: 'active',
        role: 'super_admin',
        phone: superAdmin.phone,
        app_metadata: superAdmin.app_metadata,
        user_metadata: superAdmin.user_metadata
      }];

      setUsers(remaining);
      calculateStats(remaining);
      toast.success('Usuários de teste removidos. Mantido apenas o super admin.');
      return true;
    } catch (error) {
      console.error('Erro ao limpar usuários não-admin:', error);
      toast.error('Erro ao remover usuários de teste');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar o nome do usuário pelo email
  const updateUserNameByEmail = async (email: string, name: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      if (authError) throw authError;

      const user = authUsers.users.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
      if (!user) {
        toast.error('Usuário não encontrado no Auth');
        return false;
      }

      const newUserMetadata = { ...(user.user_metadata || {}), name, full_name: name };

      // Atualizar metadados no Auth
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, { user_metadata: newUserMetadata });
      if (updateErr) throw updateErr;

      // Atualizar/garantir nome em user_profiles
      const { data: profileData, error: profileErr } = await supabaseAdmin
        .from('user_profiles')
        .update({ name })
        .eq('email', email);

      if (profileErr) {
        // Se não existir, faz upsert
        await supabaseAdmin.from('user_profiles').upsert({ email, name });
      } else if (!profileData || profileData.length === 0) {
        await supabaseAdmin.from('user_profiles').upsert({ email, name });
      }

      // Atualizar estado local e estatísticas
      const nextUsers = users.map(u => u.email.toLowerCase() === email.toLowerCase() ? { ...u, name } : u);
      setUsers(nextUsers);
      calculateStats(nextUsers);

      toast.success(`Nome atualizado para ${name}`);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar nome:', error);
      toast.error('Erro ao atualizar nome');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    users,
    stats,
    loading,
    error,
    fetchUsers,
    updateUserStatus,
    getUserByEmail,
    filterUsers,
    refreshUsers: fetchUsers,
    purgeNonAdminUsers,
    updateUserNameByEmail
  };
};