// @ts-nocheck
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { AppProviders } from './app/providers'
import { AppRouter } from './app/router'
import { Toaster } from 'sonner'
import './styles/index.css'

// Automatically reload the page when a dynamically imported chunk fails to load.
// This typically happens after a new deployment when old chunks are deleted.
window.addEventListener('vite:preloadError', () => {
  // Try to reload the page, but prevent infinite reload loops
  if (!window.location.search.includes('chunkLoadError=1')) {
    const url = new URL(window.location.href);
    url.searchParams.set('chunkLoadError', '1');
    window.location.replace(url.toString());
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProviders>
      <Toaster position="top-right" duration={2000} richColors expand={true} />
      <AppRouter />
    </AppProviders>
  </StrictMode>,
)
