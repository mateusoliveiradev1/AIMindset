import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { devSecurityTest } from './utils/securityTest'
import { autoReset } from './utils/localStorageReset'
import { initializeLogging } from './lib/logging'
import { unifiedPerformanceService } from './services/UnifiedPerformanceService'
import { initServiceWorker } from './utils/serviceWorker'

// 🔄 RESET AUTOMÁTICO DO LOCALSTORAGE
// Executar reset automático antes de qualquer coisa
autoReset().then((resetResult) => {
  if (resetResult) {
    console.log('🚀 [MAIN] Reset automático executado:', resetResult);
  }
}).catch((error) => {
  console.error('❌ [MAIN] Erro no reset automático:', error);
});

// 📝 INICIALIZAR SISTEMA DE LOGS
// Inicializar sistema de logs após reset automático
initializeLogging().then(() => {
  console.log('📝 [MAIN] Sistema de logs inicializado com sucesso');
  // Capturar e persistir performance-report.json do dist, se disponível
  if (import.meta.env.PROD) {
    fetch('/performance-report.json')
      .then(async (res) => {
        if (!res.ok) return;
        const report = await res.json();
        const bundleSizeKB = Math.round((report.totalGzip || report.totalSize || 0) / 1024);
        localStorage.setItem('build-performance-report', JSON.stringify({
          bundleSize: { bytes: report.totalSize || 0, gzip: report.totalGzip || 0, br: report.totalBr || 0 },
          assets: report.assets || [],
          generatedAt: report.generatedAt,
          bundleSizeKB
        }));
        console.log('📊 [MAIN] Build performance report armazenado', bundleSizeKB, 'KB');
      })
      .catch(() => {});
  }
}).catch((error) => {
  console.error('❌ [MAIN] Erro ao inicializar sistema de logs:', error);
});

// Executar testes de segurança em desenvolvimento
if (import.meta.env.DEV) {
  // Aguardar um pouco para garantir que o DOM esteja carregado
  setTimeout(() => {
    devSecurityTest();
  }, 1000);
}

// Listener para mensagens vindas do Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    const data = event.data || {};
    if (data.type === 'CLEAR_BROWSER_STORAGE') {
      try {
        const preserveKeys = ['aimindset_session', 'aimindset.auth.token', 'aimindset_user', 'aimindset_supabase_user'];
        const preserved: Record<string, string | null> = {};
        preserveKeys.forEach(k => {
          try { preserved[k] = localStorage.getItem(k); } catch { preserved[k] = null; }
        });
        try {
          Object.keys(localStorage)
            .filter(k => k.startsWith('sb-') && k.includes('auth-token'))
            .forEach(k => { preserved[k] = localStorage.getItem(k); });
        } catch {}
        localStorage.clear();
        sessionStorage.clear();
        Object.entries(preserved).forEach(([k, v]) => {
          if (v !== null) {
            try { localStorage.setItem(k, v); } catch { try { sessionStorage.setItem(k, v); } catch {} }
          }
        });
        console.log('🧹 [MAIN] Storage limpo com preservação de sessão/token');
      } catch (e) {
        console.warn('⚠️ [MAIN] Falha ao limpar browser storage:', e);
      }
    }
  });
}

// Inicializar Service Worker para cache offline e performance
if (import.meta.env.PROD) {
  initServiceWorker({
    onUpdate: () => {
      console.log('Nova versão disponível. Recarregue a página para atualizar.');
    },
    onOffline: () => {
      console.log('Aplicação funcionando offline');
    },
    onOnline: () => {
      console.log('Conexão restaurada');
    }
  }).catch(error => {
    console.error('Erro ao inicializar Service Worker:', error);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
