import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initErrorSuppression } from './utils/errorSuppressor'

// Inicializar supressão de erros ERR_ABORTED
initErrorSuppression();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
