import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Clock3, Mail, Phone, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import BookingPushSetup from "../components/BookingPushSetup";
import api from "../services/api";

const formatDate = (date) => new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
});

const today = new Date();
const todayDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

const getStoredUser = () => {
    try {
        return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
        return null;
    }
};

const UserDashboard = () => {
    const user = getStoredUser();
    const [bookings, setBookings] = useState([]);
    const [historyFilter, setHistoryFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const visibleBookings = bookings.filter((booking) => {
        if (historyFilter === "past") return booking.eventDate < todayDate;
        if (historyFilter === "upcoming") return booking.eventDate >= todayDate;
        return true;
    });

    useEffect(() => {
        api.get("/bookings/mine")
            .then(({ data }) => setBookings(Array.isArray(data.bookings) ? data.bookings : []))
            .catch((requestError) => setError(requestError.response?.data?.message || "We couldn't load your bookings. Please try again."))
            .finally(() => setLoading(false));
    }, []);

    return (
        <>
            <Navbar />
            <main className="account-page">
                <section className="account-welcome">
                    <div>
                        <p className="eyebrow">YOUR STUDIO SPACE</p>
                        <h1>Welcome back, {user?.name?.split(" ")[0] || "friend"}.</h1>
                        <p>Your profile and every booking request, all in one place.</p>
                    </div>
                    <Link className="button button-dark" to="/book">Plan a shoot <ArrowRight size={17} /></Link>
                </section>

                <section className="profile-card" aria-label="Profile details">
                    <div className="profile-card-heading"><UserRound size={20} /><h2>Your profile</h2></div>
                    <div className="profile-details">
                        <div><span>Name</span><strong>{user?.name || "—"}</strong></div>
                        <div><span><Mail size={14} /> Email</span><strong>{user?.email || "—"}</strong></div>
                        <div><span><Phone size={14} /> Phone</span><strong>{user?.phone ? (user.phone.length === 10 ? `+91 ${user.phone}` : user.phone) : "Not added"}</strong></div>
                    </div>
                </section>

                <section className="account-notification-section" aria-label="Booking notifications">
                    <div>
                        <p className="eyebrow">STAY IN THE LOOP</p>
                        <h2>Booking updates</h2>
                        <p>Enable browser notifications to hear when the studio updates your booking.</p>
                    </div>
                    <BookingPushSetup audience="user" />
                </section>

                <section className="account-section">
                    <div className="section-title-row">
                        <div>
                            <p className="eyebrow">YOUR JOURNEY</p>
                            <h2>Booking history</h2>
                        </div>
                        <span className="count-pill">{bookings.length} {bookings.length === 1 ? "request" : "requests"}</span>
                    </div>
                    <div className="booking-history-filters" role="tablist" aria-label="Filter booking history">
                        {[
                            ["all", "All bookings"],
                            ["upcoming", "Upcoming"],
                            ["past", "Past bookings"]
                        ].map(([filter, label]) => (
                            <button
                                key={filter}
                                type="button"
                                role="tab"
                                aria-selected={historyFilter === filter}
                                className={historyFilter === filter ? "booking-history-filter active" : "booking-history-filter"}
                                onClick={() => setHistoryFilter(filter)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    {loading ? <p className="state-message">Loading your bookings…</p> :
                        error ? <p className="form-error">{error}</p> :
                            visibleBookings.length === 0 ? (
                                <div className="empty-state">
                                    <CalendarDays size={30} />
                                    <h3>{historyFilter === "past" ? "No past shoots yet." : historyFilter === "upcoming" ? "No upcoming shoots yet." : "Your next chapter starts here."}</h3>
                                    <p>{historyFilter === "all" ? "You don't have any booking requests yet. Find a package that feels right for your story." : "Your booking history will appear here when you have a matching request."}</p>
                                    {historyFilter === "all" && <Link className="button button-dark" to="/packages">Explore packages <ArrowRight size={16} /></Link>}
                                </div>
                            ) : (
                                <div className="booking-list">
                                    {visibleBookings.map((booking) => (
                                        <article className="booking-card" key={booking._id}>
                                            <div className="booking-card-heading">
                                                <span className={`status-badge status-${booking.status}`}>{booking.status}</span>
                                                <span className="booking-date">Requested {new Date(booking.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                                            </div>
                                            <h3>{booking.plan.name}</h3>
                                            <div className="booking-meta">
                                                <span><CalendarDays size={16} />{formatDate(booking.eventDate)}</span>
                                                <span><Clock3 size={16} />{booking.eventType} · {booking.location}</span>
                                            </div>
                                            <strong className="booking-price">₹{Number(booking.plan.price).toLocaleString("en-IN")}</strong>
                                            {booking.notes && <p className="booking-notes">{booking.notes}</p>}
                                        </article>
                                    ))}
                                </div>
                            )}
                </section>
            </main>
        </>
    );
};

export default UserDashboard;
