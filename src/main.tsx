import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
// import { initErrorSuppression } from './utils/errorSuppressor' // DESABILITADO

// Inicializar supressão de erros ERR_ABORTED
// initErrorSuppression(); // DESABILITADO

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
