import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { enableBookingNotifications, restoreBookingNotifications } from "../services/pushNotifications";

const BookingPushSetup = ({ audience = "admin" }) => {
    const [enabled, setEnabled] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const supported = typeof window !== "undefined" &&
        "Notification" in window &&
        "serviceWorker" in navigator &&
        "PushManager" in window;

    useEffect(() => {
        if (!supported) return;
        restoreBookingNotifications(audience)
            .then(setEnabled)
            .catch((requestError) => setError(requestError.response?.data?.message || requestError.message));
    }, [audience, supported]);

    const enable = async () => {
        setLoading(true);
        setError("");
        setMessage("");
        try {
            await enableBookingNotifications(audience);
            setEnabled(true);
            setMessage("Booking alerts are enabled on this device.");
        } catch (requestError) {
            setError(requestError.response?.data?.message || requestError.message || "Booking alerts could not be enabled.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="booking-push-setup">
            <div className="booking-push-copy">
                <span className="booking-push-icon">{enabled ? <Check size={17} /> : <Bell size={17} />}</span>
                <div>
                    <strong>{enabled ? "Booking alerts enabled" : audience === "user" ? "Get booking updates" : "Get booking alerts"}</strong>
                    <span className={error ? "booking-push-error" : ""}>{error || message || (supported
                        ? audience === "user"
                            ? "Receive booking status updates on this device."
                            : "Receive a push alert when a client sends a request."
                        : "Push alerts are not supported in this browser.")}</span>
                </div>
            </div>
            {supported && !enabled && (
                <button className="button button-outline" type="button" onClick={enable} disabled={loading}>
                    {loading ? "Enabling…" : "Enable alerts"}
                </button>
            )}
        </div>
    );
};

export default BookingPushSetup;
