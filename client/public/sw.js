// Intentionally does no caching — its only job is to satisfy the browser's
// "installable web app" requirement so the dashboard can be added to a
// phone's home screen. Never intercepts fetches, so it can't ever serve
// stale content after a deploy.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
