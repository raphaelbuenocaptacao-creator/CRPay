import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRoot from './AppRoot';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>,
);

const secureServiceWorkerOrigin = window.location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(window.location.hostname);
const baseUrl = import.meta.env.BASE_URL || '/';
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
});

window.CRPayPWA = {
  async install() {
    if (!deferredInstallPrompt) return false;
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return choice.outcome === 'accepted';
  },
};

if ('serviceWorker' in navigator && secureServiceWorkerOrigin) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(`${baseUrl}sw.js?v=14-raster-safe`, {
        scope: baseUrl,
        updateViaCache: 'none',
      });
      await registration.update();

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration.update().catch(() => {});
      });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    } catch (_) {}
  });
}
