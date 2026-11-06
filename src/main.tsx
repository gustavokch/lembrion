import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { setupServiceWorker } from './core/utils/serviceWorker';
import '@fontsource/libre-franklin/400.css';
import '@fontsource/libre-franklin/400-italic.css';
import '@fontsource/libre-franklin/500.css';
import '@fontsource/libre-franklin/600.css';
import '@fontsource/libre-franklin/700.css';
import '@fontsource/libre-franklin/800.css';
import '@fontsource/archivo-narrow/500.css';
import '@fontsource/archivo-narrow/600.css';
import '@fontsource/archivo-narrow/700.css';
import './index.css';

setupServiceWorker(import.meta.env.PROD, location.hostname);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
