import { supabase } from './supabase';

// Fallback de ambiente em linha com supabase.ts
const EMERGENCY_SUPABASE_URL = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const EMERGENCY_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9zZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || (import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string) || EMERGENCY_SUPABASE_URL;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || (import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string) || EMERGENCY_SUPABASE_ANON_KEY;

function tryParseToken(raw: string | null): string | null {
  if (!raw) return null;
  // JSON comum do supabase-js
  try {
    const parsed = JSON.parse(raw);
    const token = parsed?.access_token || parsed?.currentSession?.access_token || parsed?.session?.access_token || null;
    if (token) return token;
  } catch {}
  // Token bruto JWT
  if (raw.startsWith('ey')) return raw;
  return null;
}

// Tenta obter token de várias formas com logs detalhados
async function getAccessTokenWithFallbacks(): Promise<string | null> {
  // 1) Via getSession
  try {
    const { data: sessionData, error } = await supabase.auth.getSession();
    const tokenFromSession = sessionData?.session?.access_token || null;
    if (tokenFromSession) {
      console.log('🔑 [rpcWithAuth] Token obtido via getSession');
      console.log('✅ [rpcWithAuth] access_token obtido com sucesso');
      return tokenFromSession;
    }
    if (error) {
      console.warn('⚠️ [rpcWithAuth] Erro em getSession:', error.message);
    }
  } catch (e: any) {
    console.warn('⚠️ [rpcWithAuth] Exceção em getSession:', e?.message || e);
  }

  // 1b) Fallback alternativo: tenta restaurar token salvo em aimindset_session
  try {
    if (typeof window !== 'undefined') {
      const localSessionRaw = window.localStorage.getItem('aimindset_session') || window.sessionStorage.getItem('aimindset_session');
      if (localSessionRaw) {
        try {
          const parsed = JSON.parse(localSessionRaw);
          const token = parsed?.access_token || parsed?.session?.access_token || null;
          if (token) {
            console.log('🔑 [rpcWithAuth] Token obtido via aimindset_session');
            console.log('✅ [rpcWithAuth] access_token obtido com sucesso');
            return token;
          }
        } catch (parseErr) {
          console.warn('⚠️ [rpcWithAuth] Falha ao parsear aimindset_session:', parseErr);
        }
      }
    }
  } catch (e: any) {
    console.warn('⚠️ [rpcWithAuth] Exceção ao ler aimindset_session:', e?.message || e);
  }

  // 2) Via storage com chaves conhecidas
  try {
    const storageKeys = ['aimindset.auth.token', 'sb-auth-token', 'sb:token', 'supabase.auth.token'];
    for (const key of storageKeys) {
      const token = tryParseToken(typeof window !== 'undefined' ? (window.localStorage.getItem(key) || window.sessionStorage.getItem(key)) : null);
      if (token) {
        console.log(`🔑 [rpcWithAuth] Token obtido via storage (${key})`);
        console.log('✅ [rpcWithAuth] access_token obtido com sucesso');
        return token;
      }
    }
  } catch (e: any) {
    console.warn('⚠️ [rpcWithAuth] Exceção ao ler storage conhecido:', e?.message || e);
  }

  // 3) Via chaves dinâmicas do supabase: sb-<ref>-auth-token
  try {
    if (typeof window !== 'undefined') {
      const allKeys = Object.keys(window.localStorage);
      const sbKeys = allKeys.filter(k => k.startsWith('sb-') && k.includes('auth-token'));
      for (const key of sbKeys) {
        const token = tryParseToken(window.localStorage.getItem(key));
        if (token) {
          console.log(`🔑 [rpcWithAuth] Token obtido via chave dinâmica (${key})`);
          console.log('✅ [rpcWithAuth] access_token obtido com sucesso');
          return token;
        }
      }
      // Também checar sessionStorage
      const allSessionKeys = Object.keys(window.sessionStorage);
      const sbSessionKeys = allSessionKeys.filter(k => k.startsWith('sb-') && k.includes('auth-token'));
      for (const key of sbSessionKeys) {
        const token = tryParseToken(window.sessionStorage.getItem(key));
        if (token) {
          console.log(`🔑 [rpcWithAuth] Token obtido via chave dinâmica de sessionStorage (${key})`);
          console.log('✅ [rpcWithAuth] access_token obtido com sucesso');
          return token;
        }
      }
    }
  } catch (e: any) {
    console.warn('⚠️ [rpcWithAuth] Exceção ao ler chaves dinâmicas:', e?.message || e);
  }

  // 4) Há usuário? tentar sessão novamente
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      console.log('👤 [rpcWithAuth] Usuário presente, tentando getSession novamente');
      const { data: refreshed, error: refreshError } = await supabase.auth.getSession();
      if (refreshed?.session?.access_token) {
        console.log('🔑 [rpcWithAuth] Token obtido após nova tentativa de getSession');
        console.log('✅ [rpcWithAuth] access_token obtido com sucesso');
        return refreshed.session.access_token;
      }
      if (refreshError) {
        console.warn('⚠️ [rpcWithAuth] Erro em nova getSession:', refreshError.message);
      }
    }
  } catch (e: any) {
    console.warn('⚠️ [rpcWithAuth] Exceção em getUser/getSession novamente:', e?.message || e);
  }

  // Diagnóstico detalhado
  try {
    if (typeof window !== 'undefined') {
      const diag = {
        hasLocalAimindset: !!window.localStorage.getItem('aimindset.auth.token'),
        hasSbDynamic: Object.keys(window.localStorage).some(k => k.startsWith('sb-') && k.includes('auth-token')),
        hasSessionAimindset: !!window.sessionStorage.getItem('aimindset.auth.token'),
        hasSbSessionDynamic: Object.keys(window.sessionStorage).some(k => k.startsWith('sb-') && k.includes('auth-token'))
      };
      console.error('🧪 [rpcWithAuth] Diagnóstico storage:', diag);
    }
  } catch {}

  console.error('❌ [rpcWithAuth] Não foi possível obter access_token');
  return null;
}

export async function rpcWithAuth<T = any>(fnName: string, params: Record<string, any>, accessTokenOverride?: string): Promise<T> {
  const accessToken = accessTokenOverride || await getAccessTokenWithFallbacks();

  if (!accessToken) {
    throw new Error('Sessão inválida: token não encontrado');
  }

  const url = `${supabaseUrl}/rest/v1/rpc/${fnName}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(params)
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message = isJson && (data as any)?.message ? (data as any).message : (typeof data === 'string' ? data : 'Erro RPC');
    console.error('❌ [rpcWithAuth] Erro na RPC:', { fnName, message, status: res.status });
    throw new Error(message);
  }

  return data as T;
}