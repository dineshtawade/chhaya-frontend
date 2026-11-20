self.addEventListener("push", (event) => {
    let payload = {};
    try {
        payload = event.data ? event.data.json() : {};
    } catch (error) {
        console.error("Could not read the booking push payload.", error);
    }

    event.waitUntil(self.registration.showNotification(payload.title || "Chhaya Picture", {
        body: payload.body || "A new booking request has arrived.",
        icon: "/icons.svg",
        tag: payload.tag || "Chhaya-picture-booking",
        data: { url: payload.url || "/admin?tab=bookings" }
    }));
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const targetUrl = new URL(event.notification.data?.url || "/admin?tab=bookings", self.location.origin).href;

    event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
        const existingWindow = windows.find((client) => new URL(client.url).origin === self.location.origin);
        if (existingWindow) {
            return existingWindow.navigate(targetUrl).then(() => existingWindow.focus());
        }
        return self.clients.openWindow(targetUrl);
    }));
});
