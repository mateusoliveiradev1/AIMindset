import { createClient } from '@supabase/supabase-js';

// Cliente admin com fallback seguro: usa service role só em DEV, anon em PROD
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
// Fallback emergencial
const EMERGENCY_SUPABASE_URL = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const EMERGENCY_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ';
const EMERGENCY_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

const isBrowser = typeof window !== 'undefined';
const isDev = import.meta.env.DEV === true;
// Detectar preview local (npm run preview) para permitir service role em ambiente local
const isLocalPreview = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Em produção no browser, nunca usar service role
// Em desenvolvimento ou preview local, permitir service role para desbloquear métricas/admin
const supabaseKey = (() => {
  if (!isBrowser) {
    return serviceRoleKey || anonKey || EMERGENCY_SERVICE_ROLE_KEY;
  }
  if (isDev || isLocalPreview) {
    return serviceRoleKey || EMERGENCY_SERVICE_ROLE_KEY;
  }
  return anonKey || EMERGENCY_ANON_KEY;
})();

// Determinar URL final com fallback
const finalUrl = supabaseUrl || EMERGENCY_SUPABASE_URL;

// Global singleton instance para evitar múltiplas instâncias
declare global {
  var __supabase_admin_singleton__: any;
}

let adminInstance: any = null;

export const supabaseAdmin = (() => {
  if (adminInstance) {
    return adminInstance;
  }

  if (typeof window !== 'undefined' && (window as any).__supabase_admin_singleton__) {
    adminInstance = (window as any).__supabase_admin_singleton__;
    return adminInstance;
  }

  if (typeof global !== 'undefined' && (global as any).__supabase_admin_singleton__) {
    adminInstance = (global as any).__supabase_admin_singleton__;
    return adminInstance;
  }

  adminInstance = createClient(finalUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      // Evitar conflito com cliente anon: usar storage isolado quando necessário
      storage: isBrowser ? window.sessionStorage : undefined,
      storageKey: 'aimindset.admin.auth.token',
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'x-client-info': 'supabase-admin',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    }
  });

  if (typeof window !== 'undefined') {
    (window as any).__supabase_admin_singleton__ = adminInstance;
  } else if (typeof global !== 'undefined') {
    (global as any).__supabase_admin_singleton__ = adminInstance;
  }
  
  return adminInstance;
})();

export const supabaseServiceClient = supabaseAdmin;