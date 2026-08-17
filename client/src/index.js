import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/rtl-support.css'; // RTL support for Arabic and other RTL languages
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// PWA & Cache Management: Clean up legacy Service Workers and cached assets
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().then((unregistered) => {
            if (unregistered) {
              console.log('[SW] Legacy service worker unregistered successfully.');
            }
          });
        });
      })
      .catch((err) => console.warn('[SW] Cleanup error:', err));

    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          if (name.startsWith('cybershield')) {
            caches.delete(name);
          }
        });
      }).catch(() => {});
    }
  });
}

