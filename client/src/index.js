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

// PWA: Service Worker Registration (Phase 7)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/service-worker.js')
        .then((reg) => console.log('SW Registered:', reg.scope))
        .catch((err) => console.warn('SW Register Failed:', err));
      return;
    }

    navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .catch((err) => console.warn('SW Cleanup Failed:', err));
  });
}
