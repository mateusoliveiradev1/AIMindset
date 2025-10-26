import { createClient } from '@supabase/supabase-js';

// Cliente admin com service_role_key para operações administrativas
// IMPORTANTE: Este cliente só deve ser usado no backend ou em contextos seguros
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ';

// Global singleton instance para evitar múltiplas instâncias GoTrueClient
declare global {
  var __supabase_admin_singleton__: any;
}

export const supabaseAdmin = (() => {
  // Verificar se já existe uma instância global
  if (typeof window !== 'undefined') {
    if (window.__supabase_admin_singleton__) {
      return window.__supabase_admin_singleton__;
    }
  } else if (global.__supabase_admin_singleton__) {
    return global.__supabase_admin_singleton__;
  }

  // Criar nova instância apenas se não existir
  const instance = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      storage: undefined
    },
    global: {
      headers: {
        'x-client-info': 'supabase-admin'
      }
    }
  });

  // Armazenar a instância globalmente
  if (typeof window !== 'undefined') {
    window.__supabase_admin_singleton__ = instance;
  } else {
    global.__supabase_admin_singleton__ = instance;
  }
  
  return instance;
})();

// Export alternativo para compatibilidade
export const supabaseServiceClient = supabaseAdmin;