// FamilyFlow service worker — bestaat alleen om Web Push-meldingen te tonen
// terwijl de app dicht is (release 3 §14, §40). Geen offline-cache, geen
// asset-precaching: bewust minimaal, zodat een app-update nooit vastloopt
// achter een verouderde service worker.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Flow", body: event.data.text() };
  }

  const title = payload.title || "Flow";
  const options = {
    body: payload.body || "",
    tag: payload.tag || "familyflow-reminder",
    data: { url: payload.url || "/kind" },
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data && event.notification.data.url ? event.notification.data.url : "/kind";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    }),
  );
});
