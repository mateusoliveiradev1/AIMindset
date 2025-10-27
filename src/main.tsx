import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { devSecurityTest } from './utils/securityTest'
// import { initServiceWorker } from './utils/serviceWorker'

// Executar testes de segurança em desenvolvimento
if (import.meta.env.DEV) {
  // Aguardar um pouco para garantir que o DOM esteja carregado
  setTimeout(() => {
    devSecurityTest();
  }, 1000);
}

// Desabilitar Service Worker temporariamente para corrigir erros no preview
// Inicializar Service Worker para cache offline e performance
// if (import.meta.env.PROD) {
//   initServiceWorker({
//     onUpdate: (registration) => {
//       console.log('Nova versão disponível. Recarregue a página para atualizar.');
      
//       // Opcional: mostrar toast de atualização
//       const updateToast = document.createElement('div');
//       updateToast.innerHTML = `
//         <div style="
//           position: fixed;
//           top: 20px;
//           right: 20px;
//           background: #1f2937;
//           color: white;
//           padding: 16px;
//           border-radius: 8px;
//           box-shadow: 0 4px 12px rgba(0,0,0,0.15);
//           z-index: 9999;
//           max-width: 300px;
//           font-family: system-ui, -apple-system, sans-serif;
//         ">
//           <div style="font-weight: 600; margin-bottom: 8px;">Atualização Disponível</div>
//           <div style="font-size: 14px; margin-bottom: 12px;">Uma nova versão está disponível.</div>
//           <button onclick="window.location.reload()" style="
//             background: #3b82f6;
//             color: white;
//             border: none;
//             padding: 8px 16px;
//             border-radius: 4px;
//             cursor: pointer;
//             font-size: 14px;
//           ">Atualizar</button>
//           <button onclick="this.parentElement.parentElement.remove()" style="
//             background: transparent;
//             color: #9ca3af;
//             border: none;
//             padding: 8px 16px;
//             border-radius: 4px;
//             cursor: pointer;
//             font-size: 14px;
//             margin-left: 8px;
//           ">Depois</button>
//         </div>
//       `;
//       document.body.appendChild(updateToast);
      
//       // Auto-remover após 10 segundos
//       setTimeout(() => {
//         if (updateToast.parentElement) {
//           updateToast.remove();
//         }
//       }, 10000);
//     },
//     onOffline: () => {
//       console.log('Aplicação funcionando offline');
//     },
//     onOnline: () => {
//       console.log('Conexão restaurada');
//     }
//   }).catch(error => {
//     console.error('Erro ao inicializar Service Worker:', error);
//   });
// }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
