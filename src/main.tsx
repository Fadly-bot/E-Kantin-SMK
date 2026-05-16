import React from 'react';
import ReactDOM from 'react-dom/client';
// Import HelmetProvider dari CDN agar aman di ekosistem Vercel HP
import { HelmetProvider } from 'https://esm.sh/react-helmet-async@2.0.1';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);
