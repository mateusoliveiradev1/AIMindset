import { createClient } from '@supabase/supabase-js';

// Cliente admin com service_role_key para operações administrativas
// IMPORTANTE: Este cliente só deve ser usado no backend ou em contextos seguros
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ';

// Global singleton instance para evitar múltiplas instâncias GoTrueClient
declare global {
  var __supabase_admin_singleton__: any;
}

let adminInstance: any = null;

export const supabaseAdmin = (() => {
  // Retornar instância existente se já foi criada
  if (adminInstance) {
    return adminInstance;
  }

  // Verificar se já existe uma instância global
  if (typeof window !== 'undefined' && window.__supabase_admin_singleton__) {
    adminInstance = window.__supabase_admin_singleton__;
    return adminInstance;
  }

  if (typeof global !== 'undefined' && global.__supabase_admin_singleton__) {
    adminInstance = global.__supabase_admin_singleton__;
    return adminInstance;
  }

  // Criar nova instância apenas se não existir
  adminInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      storage: undefined,
      // 🔥 DESABILITAR COMPLETAMENTE O GOTRUECLIENT PARA EVITAR MÚLTIPLAS INSTÂNCIAS
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'x-client-info': 'supabase-admin'
      }
    }
  });

  // Armazenar a instância globalmente
  if (typeof window !== 'undefined') {
    window.__supabase_admin_singleton__ = adminInstance;
  } else if (typeof global !== 'undefined') {
    global.__supabase_admin_singleton__ = adminInstance;
  }
  
  return adminInstance;
})();

// Export alternativo para compatibilidade
export const supabaseServiceClient = supabaseAdmin;