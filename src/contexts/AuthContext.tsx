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
      // console.log('🔍 INICIALIZAÇÃO - USER DO LOCALSTORAGE:', userData?.email || 'NENHUM');
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
      // console.log('🔍 INICIALIZAÇÃO - SUPABASE USER DO LOCALSTORAGE:', supabaseUserData?.email || 'NENHUM');
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
    // console.log('🔍 INICIALIZAÇÃO - TEM DADOS SALVOS:', !!hasStoredData);
    // console.log('🔍 INICIALIZAÇÃO - ISLOADING SERÁ:', !hasStoredData);
    return !hasStoredData; // Se tem dados salvos, não precisa loading
  });
  
  const mounted = useRef(true);

  // 🧹 FUNÇÃO PARA LIMPAR LOCALSTORAGE QUANDO CHEIO
  const clearLocalStorageIfNeeded = () => {
    try {
      // Tentar salvar um item pequeno para testar se há espaço
      const testKey = 'test_quota';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
    } catch (error) {
      console.warn('🧹 localStorage cheio, limpando dados antigos...');
      
      // Limpar dados que não são essenciais
      const keysToKeep = [USER_STORAGE_KEY, SUPABASE_USER_STORAGE_KEY];
      const allKeys = Object.keys(localStorage);
      
      for (const key of allKeys) {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      }
      
      console.log('✅ localStorage limpo, mantendo apenas dados essenciais');
    }
  };

  // 🔥 FUNÇÃO PARA SALVAR USER NO LOCALSTORAGE COM TRATAMENTO DE QUOTA
  const saveUserToStorage = (userData: User | null) => {
    try {
      if (userData) {
        clearLocalStorageIfNeeded();
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
      setUser(userData);
    } catch (error) {
      console.error('💥 ERRO AO SALVAR USER:', error);
      // Em caso de erro, ainda atualiza o estado
      setUser(userData);
    }
  };

  // 🔥 FUNÇÃO PARA SALVAR SUPABASE USER NO LOCALSTORAGE COM TRATAMENTO DE QUOTA
  const saveSupabaseUserToStorage = (supabaseUserData: SupabaseUser | null) => {
    try {
      if (supabaseUserData) {
        clearLocalStorageIfNeeded();
        localStorage.setItem(SUPABASE_USER_STORAGE_KEY, JSON.stringify(supabaseUserData));
      } else {
        localStorage.removeItem(SUPABASE_USER_STORAGE_KEY);
      }
      setSupabaseUser(supabaseUserData);
    } catch (error) {
      console.error('💥 ERRO AO SALVAR SUPABASE USER:', error);
      // Em caso de erro, ainda atualiza o estado
      setSupabaseUser(supabaseUserData);
    }
  };

  // Função simplificada para verificar admin COM TIMEOUT DE SEGURANÇA E BYPASS RLS
  const checkAdminUser = async (email: string): Promise<User | null> => {
    return new Promise(async (resolve) => {
      // Timeout de segurança de 5 segundos
      const timeoutId = setTimeout(() => {
        console.log('⏰ TIMEOUT checkAdminUser - Assumindo não-admin');
        resolve(null);
      }, 5000);

      try {
        // 🔥 USAR SERVICE ROLE PARA BYPASS RLS
        const { supabaseServiceClient } = await import('../lib/supabase-admin');
        
        const { data: adminUser, error } = await supabaseServiceClient
          .from('admin_users')
          .select('*')
          .eq('email', email)
          .maybeSingle();

        // Limpar timeout se a query completou
        clearTimeout(timeoutId);

        if (error) {
          console.log('❌ ERRO NA QUERY:', error.message);
          resolve(null);
          return;
        }

        if (!adminUser) {
          resolve(null);
          return;
        }
        
        const userResult = {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name || 'Admin',
          role: adminUser.role
        };
        
        resolve(userResult);
        
      } catch (error) {
        // Limpar timeout em caso de erro
        clearTimeout(timeoutId);
        console.error('💥 ERRO GERAL checkAdminUser:', error);
        console.log('🔄 Retornando null devido ao erro geral');
        resolve(null);
      }
    });
  };

  // 🔥 INICIALIZAÇÃO ÚNICA E CONTROLADA
  useEffect(() => {
    let isMounted = true;
    let initializationComplete = false;

    const initAuth = async () => {
      // Evitar múltiplas inicializações
      if (initializationComplete) {
        console.log('⚠️ INICIALIZAÇÃO JÁ COMPLETA - IGNORANDO...');
        return;
      }

      try {
        console.log('🚀 INICIALIZANDO AUTH...');
        
        // Verificar se já temos dados salvos
        const savedUser = localStorage.getItem(USER_STORAGE_KEY);
        const savedSupabaseUser = localStorage.getItem(SUPABASE_USER_STORAGE_KEY);
        
        if (savedUser && savedSupabaseUser) {
          console.log('💾 DADOS ENCONTRADOS NO LOCALSTORAGE - RESTAURANDO...');
          const userData = JSON.parse(savedUser);
          const supabaseUserData = JSON.parse(savedSupabaseUser);
          
          if (isMounted && !initializationComplete) {
            setUser(userData);
            setSupabaseUser(supabaseUserData);
            setIsLoading(false);
            initializationComplete = true;
            console.log('✅ ESTADO RESTAURADO DO LOCALSTORAGE:', userData.email);
            return;
          }
        }
        
        // Se não temos dados salvos, verificar sessão do Supabase
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (!isMounted || initializationComplete) return;

          // 🔥 TRATAMENTO DE REFRESH TOKEN INVÁLIDO
          if (error) {
            console.log('⚠️ ERRO NA SESSÃO (REFRESH TOKEN INVÁLIDO):', error.message);
            // Limpa dados inválidos
            saveUserToStorage(null);
            saveSupabaseUserToStorage(null);
            if (isMounted && !initializationComplete) {
              setIsLoading(false);
              initializationComplete = true;
            }
            return;
          }

          if (session?.user) {
            console.log('📡 SESSÃO SUPABASE ENCONTRADA:', session.user.email);
            saveSupabaseUserToStorage(session.user);
            
            // Verificar se é admin
            const adminUser = await checkAdminUser(session.user.email!);
            if (adminUser && isMounted && !initializationComplete) {
              saveUserToStorage(adminUser);
              setUser(adminUser);
              setSupabaseUser(session.user);
            }
          }
        } catch (sessionError) {
          console.log('⚠️ ERRO AO OBTER SESSÃO:', sessionError);
          // Limpa dados potencialmente corrompidos
          saveUserToStorage(null);
          saveSupabaseUserToStorage(null);
        }
        
        if (isMounted && !initializationComplete) {
          setIsLoading(false);
          initializationComplete = true;
        }
      } catch (error) {
        console.error('💥 ERRO NA INICIALIZAÇÃO:', error);
        // Em caso de erro, limpa tudo para evitar estado inconsistente
        saveUserToStorage(null);
        saveSupabaseUserToStorage(null);
        if (isMounted && !initializationComplete) {
          setIsLoading(false);
          initializationComplete = true;
        }
      }
    };

    // Timeout de segurança para evitar travamento
    const safetyTimeout = setTimeout(() => {
      if (isMounted && !initializationComplete) {
        console.log('⏰ TIMEOUT DE SEGURANÇA - FORÇANDO FIM DO LOADING');
        setIsLoading(false);
        initializationComplete = true;
      }
    }, 3000); // 3 segundos máximo

    initAuth();

    // Listener para mudanças de auth com tratamento de erros e debounce
    let authChangeTimeout: NodeJS.Timeout;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted || !initializationComplete) return;
        
        // Debounce para evitar múltiplas execuções rápidas
        clearTimeout(authChangeTimeout);
        authChangeTimeout = setTimeout(async () => {
          console.log('🔄 AUTH STATE CHANGE:', event, session?.user?.email);
          
          // Ignorar eventos iniciais para evitar loops
          if (event === 'INITIAL_SESSION') {
            console.log('⚠️ IGNORANDO INITIAL_SESSION - JÁ INICIALIZADO');
            return;
          }
          
          // 🔥 TRATAMENTO ESPECIAL PARA TOKEN_REFRESHED COM ERRO
          if (event === 'TOKEN_REFRESHED' && !session) {
            console.log('⚠️ TOKEN REFRESH FALHOU - LIMPANDO DADOS...');
            saveSupabaseUserToStorage(null);
            saveUserToStorage(null);
            return;
          }
          
          if (session?.user) {
            saveSupabaseUserToStorage(session.user);
            setSupabaseUser(session.user);
            
            // Verificar admin apenas se necessário
            try {
              const adminUser = await checkAdminUser(session.user.email!);
              if (adminUser && isMounted) {
                saveUserToStorage(adminUser);
                setUser(adminUser);
              }
            } catch (adminError) {
              console.log('⚠️ ERRO AO VERIFICAR ADMIN:', adminError);
              // Em caso de erro na verificação de admin, mantém apenas o supabaseUser
            }
          } else if (event === 'SIGNED_OUT') {
            console.log('🚪 LOGOUT DETECTADO - LIMPANDO STORAGE...');
            saveSupabaseUserToStorage(null);
            saveUserToStorage(null);
            setUser(null);
            setSupabaseUser(null);
          }
        }, 100); // Debounce de 100ms
      }
    );

    return () => {
      isMounted = false;
      initializationComplete = true;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []); // 🔥 DEPENDÊNCIAS VAZIAS PARA EVITAR LOOPS

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // 🧹 LIMPEZA FORÇADA DO LOCALSTORAGE ANTES DO LOGIN
      console.log('🧹 LIMPANDO LOCALSTORAGE FORÇADAMENTE...');
      try {
        // Limpar todos os dados não essenciais
        const keysToKeep = ['aimindset.auth.token', 'aimindset.auth.user', 'aimindset.supabase.user'];
        const allKeys = Object.keys(localStorage);
        
        for (const key of allKeys) {
          if (!keysToKeep.includes(key)) {
            localStorage.removeItem(key);
          }
        }
        
        // Se ainda estiver cheio, limpar TUDO
        try {
          localStorage.setItem('test-quota', 'test');
          localStorage.removeItem('test-quota');
        } catch {
          console.log('🚨 LOCALSTORAGE AINDA CHEIO - LIMPANDO TUDO!');
          localStorage.clear();
        }
      } catch (cleanError) {
        console.warn('⚠️ Erro na limpeza do localStorage:', cleanError);
        // Tentar limpar tudo como último recurso
        try {
          localStorage.clear();
        } catch {
          console.error('💥 Não foi possível limpar localStorage');
        }
      }
      
      // 🔧 INTERCEPTAR ERRO DO SUPABASE COM FALLBACK
      let authResult;
      try {
        authResult = await supabase.auth.signInWithPassword({
          email,
          password
        });
      } catch (quotaError) {
        if (quotaError.message?.includes('QuotaExceededError') || quotaError.message?.includes('quota')) {
          console.log('🚨 QUOTA EXCEEDED - TENTANDO FALLBACK...');
          
          // Limpar tudo e tentar novamente
          localStorage.clear();
          
          // Tentar novamente após limpeza
          authResult = await supabase.auth.signInWithPassword({
            email,
            password
          });
        } else {
          throw quotaError;
        }
      }
      
      const { data, error } = authResult;

      console.log('📡 RESPOSTA SUPABASE:', { data: !!data.user, error: !!error });

      if (error) {
        // ❌ APENAS LOG DE ERRO REAL - SEM THROW DESNECESSÁRIO
        console.error('❌ ERRO SUPABASE:', error.message);
        setIsLoading(false);
        return false; // 🔥 RETORNA FALSE EM VEZ DE THROW
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
          console.log('❌ NÃO É ADMIN - LIMPANDO DADOS LOCAIS...');
          // NÃO FAZER LOGOUT NO SUPABASE - APENAS LIMPAR DADOS LOCAIS
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
      // 🔥 APENAS LOG DE ERRO CRÍTICO - SEM RE-THROW
      console.error('💥 ERRO CRÍTICO NO LOGIN:', error);
      setIsLoading(false);
      return false; // 🔥 RETORNA FALSE EM VEZ DE THROW
    }
  };

  const logout = async () => {
    console.log('🚪 INICIANDO LOGOUT ROBUSTO...');
    
    // Função para limpeza local garantida
    const performLocalCleanup = () => {
      console.log('🧹 Executando limpeza local...');
      
      // Limpa estado local imediatamente
      setUser(null);
      setSupabaseUser(null);
      
      // Limpa TODOS os dados de autenticação do storage
      try {
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(SUPABASE_USER_STORAGE_KEY);
        sessionStorage.clear();
      } catch (storageError) {
        console.warn('⚠️ Erro ao limpar storage:', storageError);
        // Tenta limpeza completa como fallback
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (fallbackError) {
          console.error('💥 Erro crítico na limpeza de storage:', fallbackError);
        }
      }
      
      // Limpa cookies relacionados ao Supabase
      try {
        document.cookie.split(";").forEach((c) => {
          const eqPos = c.indexOf("=");
          const name = eqPos > -1 ? c.substr(0, eqPos) : c;
          const trimmedName = name.trim();
          if (trimmedName.includes('supabase') || trimmedName.startsWith('sb-')) {
            document.cookie = `${trimmedName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
            document.cookie = `${trimmedName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          }
        });
      } catch (cookieError) {
        console.warn('⚠️ Erro ao limpar cookies:', cookieError);
      }
      
      console.log('✅ Limpeza local concluída');
    };

    try {
      // Tentar logout no Supabase com timeout robusto
      console.log('🔄 Tentando logout no Supabase...');
      
      const logoutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout de logout')), 3000)
      );
      
      try {
        await Promise.race([logoutPromise, timeoutPromise]);
        console.log('✅ Logout do Supabase bem-sucedido');
      } catch (supabaseError) {
        console.warn('⚠️ Erro/timeout no logout do Supabase:', supabaseError);
        // Continua com limpeza local mesmo se Supabase falhar
      }
      
    } catch (error) {
      console.error('💥 Erro geral no processo de logout:', error);
    } finally {
      // SEMPRE executa limpeza local, independente do resultado do Supabase
      performLocalCleanup();
      
      console.log('🏁 Logout finalizado - redirecionando...');
      
      // Pequeno delay para garantir que a limpeza foi processada
      setTimeout(() => {
        window.location.replace('/');
      }, 100);
    }
  };

  const isAuthenticated = !!user && !!supabaseUser;
  
  // 🔥 LOG DE DEBUG PARA MONITORAR ESTADO - DESABILITADO
  // useEffect(() => {
  //   console.log('🔍 ESTADO AUTH ATUAL:', {
  //     user: !!user,
  //     supabaseUser: !!supabaseUser,
  //     isAuthenticated,
  //     userEmail: user?.email,
  //     isLoading
  //   });
  // }, [user, supabaseUser, isAuthenticated, isLoading]);

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