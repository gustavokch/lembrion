import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { setupServiceWorker } from './core/utils/serviceWorker';
import '@fontsource/fira-sans/300.css';
import '@fontsource/fira-sans/400.css';
import '@fontsource/fira-sans/400-italic.css';
import '@fontsource/fira-sans/500.css';
import '@fontsource/fira-sans/600.css';
import '@fontsource/fira-mono/400.css';
import './index.css';

setupServiceWorker(import.meta.env.PROD, location.hostname);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
