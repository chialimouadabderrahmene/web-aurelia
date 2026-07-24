self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "AURELIA", body: event.data.text() };
  }
  const title = payload.title || "AURELIA";
  const options = {
    body: payload.body || "",
    icon: "https://jfoxyvsxsguz29h1.public.blob.vercel-storage.com/brand/logo.png",
    badge: "https://jfoxyvsxsguz29h1.public.blob.vercel-storage.com/brand/logo.png",
    data: { url: payload.url || "/admin" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/admin";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
