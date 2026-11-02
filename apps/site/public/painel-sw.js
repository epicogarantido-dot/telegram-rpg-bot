/* Service worker do painel do barbeiro: só mostra os avisos de horário novo.
   Tocar no aviso abre a página do horário (/app/confirmar/<id>), com o "Confirmar no WhatsApp". */
self.addEventListener("push", (evento) => {
  let d = {};
  try { d = evento.data ? evento.data.json() : {}; } catch { d = {}; }
  evento.waitUntil(self.registration.showNotification(d.titulo || "Novo horário", {
    body: d.corpo || "",
    tag: d.tag,
    icon: "/painel/icone-192.png",
    badge: "/painel/selo-96.png",
    data: { url: typeof d.url === "string" && d.url.startsWith("/app") ? d.url : "/app" },
  }));
});

self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  const { url } = evento.notification.data || {};
  evento.waitUntil((async () => {
    const janelas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const j of janelas) {
      if (new URL(j.url).pathname.startsWith("/app")) {
        await j.navigate(url);
        return j.focus();
      }
    }
    return self.clients.openWindow(url);
  })());
});
