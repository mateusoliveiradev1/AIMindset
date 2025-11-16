import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { logAuth, logError } from '../lib/logging';

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
  updateUserName: (newName: string) => Promise<boolean>;
  updateUserAvatar: (avatarUrl: string) => Promise<boolean>;
  removeUserAvatar: () => Promise<boolean>;
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
const SESSION_STORAGE_KEY = 'aimindset.auth.token';

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

  // 🔥 FUNÇÃO PARA SALVAR SESSÃO (JWT) NO STORAGE COM FALLBACK
  const saveSessionToStorage = (session: Session | null) => {
    try {
      if (session) {
        clearLocalStorageIfNeeded();
        const json = JSON.stringify(session);
        try {
          localStorage.setItem(SESSION_STORAGE_KEY, json);
          // Também persistir na chave padronizada aimindset_session para RPC fallback
          localStorage.setItem('aimindset_session', json);
        } catch (e) {
          console.warn('⚠️ Falha ao salvar sessão no localStorage, usando sessionStorage:', e);
          try {
            sessionStorage.setItem(SESSION_STORAGE_KEY, json);
            sessionStorage.setItem('aimindset_session', json);
          } catch (e2) {
            console.error('💥 Falha ao salvar sessão no sessionStorage também:', e2);
          }
        }
        console.log('🔒 Sessão persistida com sucesso (JWT presente).');
      } else {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        // Remover também aimindset_session
        localStorage.removeItem('aimindset_session');
        sessionStorage.removeItem('aimindset_session');
      }
    } catch (error) {
      console.error('💥 ERRO AO SALVAR SESSÃO:', error);
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
            // Persistir sessão (inclui access_token)
            saveSessionToStorage(session);
            saveSupabaseUserToStorage(session.user);
            await applyProfileNameOverride(session.user);
            
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
            // Persistir sessão sempre que houver
            try {
              if (session) {
                saveSessionToStorage(session);
              }
            } catch (persistErr) {
              console.warn('⚠️ Falha ao persistir sessão em onAuthStateChange:', persistErr);
            }
            saveSupabaseUserToStorage(session.user);
            setSupabaseUser(session.user);
            await applyProfileNameOverride(session.user);
            
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
        // Limpar todos os dados não essenciais, preservando chaves críticas do Supabase
        const keysToKeep = ['aimindset.auth.token', 'aimindset.auth.user', 'aimindset.supabase.user', 'aimindset_session'];
        const allKeys = Object.keys(localStorage);
        
        for (const key of allKeys) {
          // Preservar chaves dinâmicas do Supabase (sb-<ref>-auth-token)
          const isSupabaseDynamicAuthKey = key.startsWith('sb-') && key.includes('auth-token');
          if (isSupabaseDynamicAuthKey) continue;
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
        // Tentar limpeza completa como último recurso
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
        // Capturar sessão atual e persistir para garantir JWT disponível
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session) {
            saveSessionToStorage(sessionData.session);
          } else {
            console.warn('⚠️ Nenhuma sessão retornada imediatamente após login');
          }
        } catch (sessErr) {
          console.warn('⚠️ Falha ao obter sessão pós-login:', sessErr);
        }
        saveSupabaseUserToStorage(data.user);
        
        // Verificar admin imediatamente
        console.log('🔍 VERIFICANDO ADMIN...');
        const adminUser = await checkAdminUser(data.user.email!);
        console.log('👤 RESULTADO ADMIN:', !!adminUser);
        
        if (adminUser) {
          console.log('✅ ADMIN CONFIRMADO, SALVANDO NO STORAGE...');
          saveUserToStorage(adminUser);
          
          // Log de sucesso do login
          await logAuth('login_success', adminUser.id, true, {
            email: adminUser.email,
            role: adminUser.role
          });
          
          setIsLoading(false);
          console.log('🎯 LOGIN COMPLETO - ESTADO PERSISTIDO - RETORNANDO TRUE');
          return true;
        } else {
          console.log('⚠️ USUÁRIO AUTENTICADO, MAS NÃO ADMIN - MANTENDO SESSÃO');
          
          // Manter sessão do Supabase para considerar autenticado
          saveSupabaseUserToStorage(data.user);
          // Persistir sessão mesmo para não-admin
          try {
            const { data: sessionDataNonAdmin } = await supabase.auth.getSession();
            if (sessionDataNonAdmin?.session) {
              saveSessionToStorage(sessionDataNonAdmin.session);
            }
          } catch {}
          // Não há usuário admin; mantém isAdmin como falso
          saveUserToStorage(null);

          // Log informativo de login sem privilégios de admin
          await logAuth('login_success_non_admin', data.user.id, true, {
            email: data.user.email,
            role: 'user'
          });
          
          setIsLoading(false);
          // Login bem-sucedido como usuário autenticado (não-admin)
          return true;
        }
      }

      console.log('❌ NENHUM USUÁRIO RETORNADO');
      setIsLoading(false);
      return false;
    } catch (error) {
      // 🔥 APENAS LOG DE ERRO CRÍTICO - SEM RE-THROW
      console.error('💥 ERRO CRÍTICO NO LOGIN:', error);
      
      // Log de erro no login
      await logError(error, 'AuthContext', 'login_error', {
        email,
        context: 'AuthContext.login'
      });
      
      setIsLoading(false);
      return false; // 🔥 RETORNA FALSE EM VEZ DE THROW
    }
  };

  const logout = async () => {
    console.log('🚪 INICIANDO LOGOUT ROBUSTO...');
    
    // Log do logout
    if (user) {
      await logAuth('logout', user.id, true, {
        email: user.email,
        role: user.role
      });
    }
    
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
        localStorage.removeItem(SESSION_STORAGE_KEY);
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

  // Considera autenticado quando há usuário do Supabase (independente de ser admin)
  const isAuthenticated = !!supabaseUser;
  
  // 🔥 FUNÇÃO PARA ATUALIZAR NOME DO USUÁRIO NO METADADOS
  const updateUserName = async (newName: string) => {
    if (!supabaseUser) return false;
    
    try {
      console.log('💾 Atualizando nome do usuário:', newName);
      
      const { error } = await supabase.auth.updateUser({ 
        data: { name: newName.trim(), full_name: newName.trim() } 
      });
      
      if (error) {
        console.error('❌ Erro ao atualizar nome no auth:', error);
      }
      
      // Atualizar no estado local
      const updatedUser = {
        ...supabaseUser,
        user_metadata: {
          ...supabaseUser.user_metadata,
          name: newName.trim(),
          full_name: newName.trim()
        }
      };
      
      setSupabaseUser(updatedUser);
      saveSupabaseUserToStorage(updatedUser);
      
      try {
        await supabase
          .from('user_profiles')
          .upsert({
            email: supabaseUser.email!,
            name: newName.trim(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'email'
          });
      } catch {}

      try {
        const { supabaseServiceClient } = await import('../lib/supabase-admin');
        await supabaseServiceClient
          .from('user_profiles')
          .upsert({
            email: supabaseUser.email!,
            name: newName.trim(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'email'
          });
        await supabaseServiceClient
          .from('comments')
          .update({ user_name: newName.trim() })
          .eq('user_id', supabaseUser.id);
      } catch {}
      
      try {
        const key = `aimindset.preferred_name:${supabaseUser.email!}`;
        localStorage.setItem(key, newName.trim());
      } catch {}
      
      // Atualizar na sessão também
      const currentSession = localStorage.getItem(SESSION_STORAGE_KEY);
      if (currentSession) {
        const sessionData = JSON.parse(currentSession);
        if (sessionData.user) {
          sessionData.user.user_metadata = {
            ...sessionData.user.user_metadata,
            name: newName.trim()
          };
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
        }
      }
      
      console.log('✅ Nome do usuário atualizado com sucesso!');
      return true;
    } catch (error) {
      console.error('💥 Erro ao atualizar nome do usuário:', error);
      return false;
    }
  };

  const updateUserAvatar = async (avatarUrl: string) => {
    if (!supabaseUser) return false;
    try {
      const { error } = await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } });
      if (error) {
        console.error('❌ Erro ao atualizar avatar no auth:', error);
      }
      const updatedUser = {
        ...supabaseUser,
        user_metadata: {
          ...supabaseUser.user_metadata,
          avatar_url: avatarUrl
        }
      };
      setSupabaseUser(updatedUser);
      saveSupabaseUserToStorage(updatedUser);
      try {
        await supabase
          .from('user_profiles')
          .upsert({
            email: supabaseUser.email!,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString()
          }, { onConflict: 'email' });
      } catch {}
      try {
        const { supabaseServiceClient } = await import('../lib/supabase-admin');
        await supabaseServiceClient
          .from('user_profiles')
          .upsert({
            email: supabaseUser.email!,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString()
          }, { onConflict: 'email' });
        await supabaseServiceClient
          .from('comments')
          .update({ user_avatar_url: avatarUrl })
          .eq('user_id', supabaseUser.id);
      } catch {}
      const currentSession = localStorage.getItem(SESSION_STORAGE_KEY);
      if (currentSession) {
        const sessionData = JSON.parse(currentSession);
        if (sessionData.user) {
          sessionData.user.user_metadata = {
            ...sessionData.user.user_metadata,
            avatar_url: avatarUrl
          };
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
        }
      }
      return true;
    } catch (error) {
      console.error('💥 Erro ao atualizar avatar do usuário:', error);
      return false;
    }
  };

  const removeUserAvatar = async () => {
    if (!supabaseUser) return false;
    try {
      const { error } = await supabase.auth.updateUser({ data: { avatar_url: null } });
      if (error) {
        console.error('❌ Erro ao remover avatar no auth:', error);
      }
      const updatedUser = {
        ...supabaseUser,
        user_metadata: {
          ...supabaseUser.user_metadata,
          avatar_url: null
        }
      };
      setSupabaseUser(updatedUser);
      saveSupabaseUserToStorage(updatedUser);
      try {
        await supabase
          .from('user_profiles')
          .upsert({
            email: supabaseUser.email!,
            avatar_url: null,
            updated_at: new Date().toISOString()
          }, { onConflict: 'email' });
      } catch {}
      try {
        const { supabaseServiceClient } = await import('../lib/supabase-admin');
        await supabaseServiceClient
          .from('user_profiles')
          .upsert({
            email: supabaseUser.email!,
            avatar_url: null,
            updated_at: new Date().toISOString()
          }, { onConflict: 'email' });
        await supabaseServiceClient
          .from('comments')
          .update({ user_avatar_url: null })
          .eq('user_id', supabaseUser.id);
      } catch {}
      const currentSession = localStorage.getItem(SESSION_STORAGE_KEY);
      if (currentSession) {
        const sessionData = JSON.parse(currentSession);
        if (sessionData.user) {
          sessionData.user.user_metadata = {
            ...sessionData.user.user_metadata,
            avatar_url: null
          };
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
        }
      }
      return true;
    } catch (error) {
      console.error('💥 Erro ao remover avatar do usuário:', error);
      return false;
    }
  };

  const applyProfileNameOverride = async (u: SupabaseUser) => {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('name')
        .eq('email', u.email!)
        .maybeSingle();
      let preferred = data?.name;
      if (!preferred) {
        try {
          const key = `aimindset.preferred_name:${u.email!}`;
          const local = localStorage.getItem(key);
          preferred = local || undefined;
        } catch {}
      }
      if (preferred) {
        const updated = {
          ...u,
          user_metadata: {
            ...(u.user_metadata || {}),
            name: preferred,
            full_name: preferred
          }
        } as SupabaseUser;
        setSupabaseUser(updated);
        saveSupabaseUserToStorage(updated);
        try {
          const key = `aimindset.preferred_name:${u.email!}`;
          localStorage.setItem(key, preferred);
        } catch {}
      }
    } catch {}
  };

  const value = {
    user,
    supabaseUser,
    isAuthenticated,
    isAdmin: !!user,
    login,
    logout,
    isLoading,
    updateUserName,
    updateUserAvatar,
    removeUserAvatar
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};