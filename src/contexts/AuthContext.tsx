import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 🔥 CHAVES PARA PERSISTÊNCIA
const USER_STORAGE_KEY = 'aimindset_user';
const SUPABASE_USER_STORAGE_KEY = 'aimindset_supabase_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // 🚀 RECUPERAR ESTADO DO LOCALSTORAGE NA INICIALIZAÇÃO
    try {
      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      const userData = savedUser ? JSON.parse(savedUser) : null;
      console.log('🔍 INICIALIZAÇÃO - USER DO LOCALSTORAGE:', userData?.email || 'NENHUM');
      return userData;
    } catch {
      console.log('❌ ERRO AO RECUPERAR USER DO LOCALSTORAGE');
      return null;
    }
  });
  
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(() => {
    // 🚀 RECUPERAR ESTADO DO LOCALSTORAGE NA INICIALIZAÇÃO
    try {
      const savedSupabaseUser = localStorage.getItem(SUPABASE_USER_STORAGE_KEY);
      const supabaseUserData = savedSupabaseUser ? JSON.parse(savedSupabaseUser) : null;
      console.log('🔍 INICIALIZAÇÃO - SUPABASE USER DO LOCALSTORAGE:', supabaseUserData?.email || 'NENHUM');
      return supabaseUserData;
    } catch {
      console.log('❌ ERRO AO RECUPERAR SUPABASE USER DO LOCALSTORAGE');
      return null;
    }
  });
  
  const [isLoading, setIsLoading] = useState(() => {
    // 🔥 CRÍTICO: Só definir loading como true se NÃO temos dados no localStorage
    const savedUser = localStorage.getItem(USER_STORAGE_KEY);
    const savedSupabaseUser = localStorage.getItem(SUPABASE_USER_STORAGE_KEY);
    const hasStoredData = savedUser && savedSupabaseUser;
    console.log('🔍 INICIALIZAÇÃO - TEM DADOS SALVOS:', !!hasStoredData);
    console.log('🔍 INICIALIZAÇÃO - ISLOADING SERÁ:', !hasStoredData);
    return !hasStoredData; // Se tem dados salvos, não precisa loading
  });
  
  const mounted = useRef(true);

  // 🔥 FUNÇÃO PARA SALVAR USER NO LOCALSTORAGE
  const saveUserToStorage = (userData: User | null) => {
    console.log('💾 SALVANDO USER NO LOCALSTORAGE:', userData?.email);
    if (userData) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
    setUser(userData);
  };

  // 🔥 FUNÇÃO PARA SALVAR SUPABASE USER NO LOCALSTORAGE
  const saveSupabaseUserToStorage = (supabaseUserData: SupabaseUser | null) => {
    console.log('💾 SALVANDO SUPABASE USER NO LOCALSTORAGE:', supabaseUserData?.email);
    if (supabaseUserData) {
      localStorage.setItem(SUPABASE_USER_STORAGE_KEY, JSON.stringify(supabaseUserData));
    } else {
      localStorage.removeItem(SUPABASE_USER_STORAGE_KEY);
    }
    setSupabaseUser(supabaseUserData);
  };

  // Função simplificada para verificar admin
  const checkAdminUser = async (email: string): Promise<User | null> => {
    try {
      console.log('🔍 BUSCANDO ADMIN NO DB:', email);
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .single();

      console.log('📊 RESULTADO QUERY:', { adminUser: !!adminUser, error: error?.message });

      if (error) {
        console.log('❌ ERRO NA QUERY:', error.message);
        return null;
      }

      if (!adminUser) {
        console.log('❌ ADMIN NÃO ENCONTRADO');
        return null;
      }

      console.log('✅ ADMIN ENCONTRADO:', adminUser.email, adminUser.role);
      return {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name || 'Admin',
        role: adminUser.role
      };
    } catch (error) {
      console.error('💥 ERRO GERAL checkAdminUser:', error);
      return null;
    }
  };

  // 🔥 INICIALIZAÇÃO COM VERIFICAÇÃO DE PERSISTÊNCIA
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        console.log('🚀 INICIALIZANDO AUTH...');
        
        // Verificar se já temos dados salvos
        const savedUser = localStorage.getItem(USER_STORAGE_KEY);
        const savedSupabaseUser = localStorage.getItem(SUPABASE_USER_STORAGE_KEY);
        
        if (savedUser && savedSupabaseUser) {
          console.log('💾 DADOS ENCONTRADOS NO LOCALSTORAGE - RESTAURANDO...');
          const userData = JSON.parse(savedUser);
          const supabaseUserData = JSON.parse(savedSupabaseUser);
          
          if (isMounted) {
            setUser(userData);
            setSupabaseUser(supabaseUserData);
            setIsLoading(false);
            console.log('✅ ESTADO RESTAURADO DO LOCALSTORAGE:', userData.email);
            return;
          }
        }
        
        // Se não temos dados salvos, verificar sessão do Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (session?.user) {
          console.log('📡 SESSÃO SUPABASE ENCONTRADA:', session.user.email);
          saveSupabaseUserToStorage(session.user);
          
          // Verificar se é admin
          const adminUser = await checkAdminUser(session.user.email!);
          if (adminUser && isMounted) {
            saveUserToStorage(adminUser);
          }
        }
        
        if (isMounted) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('💥 ERRO NA INICIALIZAÇÃO:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Listener para mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('🔄 AUTH STATE CHANGE:', event, session?.user?.email);
        
        if (session?.user) {
          saveSupabaseUserToStorage(session.user);
          
          // Verificar admin apenas se não temos user salvo
          if (!user) {
            const adminUser = await checkAdminUser(session.user.email!);
            if (adminUser && isMounted) {
              saveUserToStorage(adminUser);
            }
          }
        } else {
          console.log('🚪 LOGOUT DETECTADO - LIMPANDO STORAGE...');
          saveSupabaseUserToStorage(null);
          saveUserToStorage(null);
        }
        
        if (isMounted) {
          setIsLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🚀 INICIANDO LOGIN:', email);
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log('📡 RESPOSTA SUPABASE:', { data: !!data.user, error: !!error });

      if (error) {
        console.error('❌ ERRO SUPABASE:', error.message);
        setIsLoading(false);
        throw error;
      }

      if (data.user) {
        console.log('✅ USUÁRIO LOGADO:', data.user.email);
        saveSupabaseUserToStorage(data.user);
        
        // Verificar admin imediatamente
        console.log('🔍 VERIFICANDO ADMIN...');
        const adminUser = await checkAdminUser(data.user.email!);
        console.log('👤 RESULTADO ADMIN:', !!adminUser);
        
        if (adminUser) {
          console.log('✅ ADMIN CONFIRMADO, SALVANDO NO STORAGE...');
          saveUserToStorage(adminUser);
          setIsLoading(false);
          console.log('🎯 LOGIN COMPLETO - ESTADO PERSISTIDO - RETORNANDO TRUE');
          return true;
        } else {
          console.log('❌ NÃO É ADMIN - FAZENDO LOGOUT...');
          await supabase.auth.signOut();
          saveSupabaseUserToStorage(null);
          saveUserToStorage(null);
          setIsLoading(false);
          return false;
        }
      }

      console.log('❌ NENHUM USUÁRIO RETORNADO');
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('💥 ERRO GERAL NO LOGIN:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 FAZENDO LOGOUT...');
      await supabase.auth.signOut();
      saveUserToStorage(null);
      saveSupabaseUserToStorage(null);
      console.log('✅ LOGOUT COMPLETO - STORAGE LIMPO');
    } catch (error) {
      console.error('💥 ERRO NO LOGOUT:', error);
    }
  };

  const isAuthenticated = !!user && !!supabaseUser;
  
  // 🔥 LOG DE DEBUG PARA MONITORAR ESTADO
  useEffect(() => {
    console.log('🔍 ESTADO AUTH ATUAL:', {
      user: !!user,
      supabaseUser: !!supabaseUser,
      isAuthenticated,
      userEmail: user?.email,
      isLoading
    });
  }, [user, supabaseUser, isAuthenticated, isLoading]);

  const value = {
    user,
    supabaseUser,
    isAuthenticated,
    isAdmin: !!user,
    login,
    logout,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};