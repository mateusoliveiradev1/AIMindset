import { createClient } from '@supabase/supabase-js';

// Cliente admin com service_role_key para operações administrativas
// IMPORTANTE: Este cliente só deve ser usado no backend ou em contextos seguros
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ';

// Singleton instance para evitar múltiplas instâncias GoTrueClient
let supabaseAdminInstance: any = null;

export const supabaseAdmin = (() => {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        storage: undefined // Evita conflitos de storage
      },
      global: {
        headers: {
          'x-client-info': 'supabase-admin'
        }
      }
    });
  }
  return supabaseAdminInstance;
})();