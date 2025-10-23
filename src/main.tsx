import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Performance optimization: preload critical chunks
const preloadCriticalChunks = () => {
  // Preload router chunk since it's needed for navigation
  import('./App.tsx').catch(() => {});
};

// Start preloading as soon as possible
preloadCriticalChunks();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
