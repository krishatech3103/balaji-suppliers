// Balaji Building Material Supplier - Service Worker Registration
// Clean service worker registration for offline support and asset caching.
// Note: In-app prompt banner has been removed as requested. The owner can install the app
// directly via the browser's native install menu (Chrome/Edge 'Install app' or Safari 'Add to Home Screen').

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          console.log('BBMS Service Worker registered with scope:', reg.scope);

          // Check for service worker updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New version available
                  console.log('New BBMS update available. Will activate on reload.');
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn('Service Worker registration failed:', err);
        });
    });
  }
}
