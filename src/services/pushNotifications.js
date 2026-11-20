import api from "./api";

const decodeVapidKey = (base64UrlKey) => {
    const base64 = base64UrlKey.replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return Uint8Array.from(window.atob(paddedBase64), (character) => character.charCodeAt(0));
};

const getSubscriptionPath = (audience) => audience === "user"
    ? "/notifications/subscribe/user"
    : "/notifications/subscribe";

const saveBrowserSubscription = async (audience) => {
    const { data } = await api.get("/notifications/public-key");
    const registration = await navigator.serviceWorker.register("/push-sw.js");
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: decodeVapidKey(data.publicKey)
        });
    }

    await api.post(getSubscriptionPath(audience), subscription.toJSON());
};

export const enableBookingNotifications = async (audience = "admin") => {
    if (!("serviceWorker" in navigator) || !("Notification" in window) || !("PushManager" in window)) {
        throw new Error("This browser does not support push notifications.");
    }

    const permission = Notification.permission === "granted"
        ? "granted"
        : await Notification.requestPermission();
    if (permission !== "granted") {
        throw new Error(permission === "denied"
            ? "Notifications are blocked. Allow them for this site in your browser settings."
            : "Allow notifications to receive new booking alerts.");
    }

    await saveBrowserSubscription(audience);
};

export const restoreBookingNotifications = async (audience = "admin") => {
    if (
        !("serviceWorker" in navigator) ||
        !("Notification" in window) ||
        !("PushManager" in window) ||
        Notification.permission !== "granted"
    ) return false;

    await saveBrowserSubscription(audience);
    return true;
};
