/* Service worker do site da barbearia (app do cliente): mostra o aviso do horário. */
self.addEventListener("push", (evento) => {
  let d = {};
  try { d = evento.data ? evento.data.json() : {}; } catch { d = {}; }
  const url = typeof d.url === "string" && d.url.startsWith("/") && !d.url.startsWith("//") ? d.url : "/";
  evento.waitUntil(self.registration.showNotification(d.titulo || "Seu horário", {
    body: d.corpo || "", tag: d.tag, data: { url },
  }));
});

self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  const url = (evento.notification.data && evento.notification.data.url) || "/";
  evento.waitUntil((async () => {
    const janelas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const j of janelas) { await j.navigate(url); return j.focus(); }
    return self.clients.openWindow(url);
  })());
});
