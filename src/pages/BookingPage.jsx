import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3 } from "lucide-react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import LocationMapPicker from "../components/LocationMapPicker";
import Navbar from "../components/Navbar";
import api from "../services/api";

const today = new Date();
const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

const readStoredUser = () => {
    try {
        return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
        return null;
    }
};

const readPendingBooking = () => {
    try {
        return JSON.parse(sessionStorage.getItem("pendingBooking") || "null");
    } catch {
        return null;
    }
};

const isValidCoordinates = (coordinates) => (
    typeof coordinates?.latitude === "number" &&
    typeof coordinates?.longitude === "number" &&
    Number.isFinite(coordinates.latitude) &&
    Number.isFinite(coordinates.longitude) &&
    coordinates.latitude >= -90 && coordinates.latitude <= 90 &&
    coordinates.longitude >= -180 && coordinates.longitude <= 180
);

const normalizeIndianPhone = (value) => {
    let digits = String(value || "").replace(/\D/g, "");
    if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2);
    if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
    return /^[6-9]\d{9}$/.test(digits) ? digits : "";
};

const BookingPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [plans, setPlans] = useState([]);
    const [offer, setOffer] = useState(null);
    const [offerClock, setOfferClock] = useState(() => Date.now());
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [verification, setVerification] = useState(null);
    const [emailCode, setEmailCode] = useState("");
    const [verifying, setVerifying] = useState(false);
    const user = readStoredUser();
    const isAuthenticated = Boolean(localStorage.getItem("token") && user);
    const [form, setForm] = useState(() => {
        const pending = readPendingBooking() || {};
        return {
            planId: searchParams.get("plan") || pending.planId || "",
            offerId: searchParams.get("offer") || pending.offerId || "",
            eventDate: pending.eventDate || "",
            eventType: pending.eventType || "",
            contactName: user?.name || pending.contactName || "",
            phone: user?.phone || pending.phone || "",
            location: pending.location || "",
            coordinates: isValidCoordinates(pending.coordinates) ? pending.coordinates : null,
            notes: pending.notes || ""
        };
    });

    useEffect(() => {
        api.get("/studio")
            .then(({ data }) => {
                const availablePlans = data.content.plans.filter((plan) => plan.active !== false);
                const currentOffer = data.content.offer || null;
                setPlans(availablePlans);
                setOffer(currentOffer);
                setForm((current) => {
                    const planId = availablePlans.some((plan) => plan.id === current.planId)
                        ? current.planId
                        : availablePlans[0]?.id || "";
                    const offerPrice = Number(currentOffer?.offerPrice);
                    const startAt = Date.parse(currentOffer?.startAt);
                    const endAt = Date.parse(currentOffer?.endAt);
                    const offerIsValid = currentOffer?.active === true &&
                        current.offerId === currentOffer.id &&
                        current.planId === currentOffer.planId &&
                        availablePlans.some((plan) => plan.id === current.planId) &&
                        Number.isFinite(startAt) &&
                        Number.isFinite(endAt) &&
                        Date.now() >= startAt &&
                        Date.now() < endAt &&
                        Number.isFinite(offerPrice) &&
                        offerPrice > 0 &&
                        offerPrice < Number(availablePlans.find((plan) => plan.id === current.planId)?.price);
                    return { ...current, planId, offerId: offerIsValid ? current.offerId : "" };
                });
            })
            .catch((requestError) => setError(requestError.response?.data?.message || "Packages could not be loaded. Please try again."))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!offer?.active) return undefined;
        const timer = window.setInterval(() => setOfferClock(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [offer]);

    useEffect(() => {
        const offerEndTime = Date.parse(offer?.endAt);
        if (!offer || form.offerId !== offer.id || !Number.isFinite(offerEndTime) || offerClock < offerEndTime) return;
        setForm((current) => current.offerId === offer.id ? { ...current, offerId: "" } : current);
    }, [offer, form.offerId, offerClock]);

    const selectedPlan = useMemo(() => plans.find((plan) => plan.id === form.planId), [plans, form.planId]);
    const offerAppliesTo = (plan) => {
        const price = Number(offer?.offerPrice);
        const startAt = Date.parse(offer?.startAt);
        const endAt = Date.parse(offer?.endAt);
        return offer?.active === true &&
            offer.id === form.offerId &&
            plan?.id === offer.planId &&
            Number.isFinite(startAt) &&
            Number.isFinite(endAt) &&
            offerClock >= startAt &&
            offerClock < endAt &&
            Number.isFinite(price) &&
            price > 0 &&
            price < Number(plan.price);
    };
    const selectedPlanHasOffer = offerAppliesTo(selectedPlan);
    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({
            ...current,
            [name]: value,
            ...(name === "planId" && value !== offer?.planId ? { offerId: "" } : {})
        }));
    };

    const sendBookingRequest = async () => {
        await api.post("/bookings", form);
        sessionStorage.removeItem("pendingBooking");
        setSuccess(true);
    };

    const beginVerification = async () => {
        setError("");
        setSubmitting(true);
        try {
            const { data } = await api.post("/bookings/verification");
            if (data.verified) {
                await sendBookingRequest();
            } else {
                setVerification(data);
                setEmailCode("");
            }
        } catch (requestError) {
            if (requestError.response?.status === 401) {
                sessionStorage.setItem("pendingBooking", JSON.stringify(form));
                navigate("/login", {
                    state: { from: { pathname: location.pathname, search: location.search } }
                });
            } else {
                setError(requestError.response?.data?.message || "Contact verification could not start. Please try again.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!selectedPlan) {
            setError("Please choose an available package.");
            return;
        }
        if (!normalizeIndianPhone(form.phone)) {
            setError("Enter a valid Indian mobile number starting with 6, 7, 8 or 9.");
            return;
        }
        if (!isAuthenticated) {
            sessionStorage.setItem("pendingBooking", JSON.stringify(form));
            navigate("/login", {
                state: {
                    from: {
                        pathname: location.pathname,
                        search: location.search
                    }
                }
            });
            return;
        }
        if (
            normalizeIndianPhone(form.phone) !== normalizeIndianPhone(user?.phone) ||
            form.contactName.trim().toLowerCase() !== (user?.name || "").trim().toLowerCase()
        ) {
            setError("Booking name and phone must match your account details.");
            return;
        }
        await beginVerification();
    };

    const handleVerifyAndBook = async (event) => {
        event.preventDefault();
        setError("");
        setVerifying(true);
        try {
            await api.post("/bookings/verification/confirm", { emailCode });
            setVerification(null);
            await sendBookingRequest();
        } catch (requestError) {
            if (requestError.response?.status === 401) {
                sessionStorage.setItem("pendingBooking", JSON.stringify(form));
                navigate("/login", {
                    state: { from: { pathname: location.pathname, search: location.search } }
                });
            } else {
                setError(requestError.response?.data?.message || "The code could not be verified. Check it and try again.");
            }
        } finally {
            setVerifying(false);
        }
    };

    return (
        <>
            <Navbar />
            <main className="booking-page">
                <Link className="back-link" to="/"><ArrowLeft size={16} /> Back to the studio</Link>
                <div className="booking-layout">
                    <section className="booking-intro">
                        <p className="eyebrow">LET'S MAKE SOMETHING LAST</p>
                        <h1>Your date.<br />Your story.</h1>
                        <p>Tell us a little about what you're dreaming up. We'll check availability and be in touch to plan the details together.</p>
                        <div className="booking-promise"><Check size={17} /> No payment required to send a request</div>
                        {user && (
                            <div className="booking-account-summary">
                                <span>Booking as</span>
                                <strong>{user.name}</strong>
                                <span>{user.email}{user.phone ? ` · ${user.phone}` : ""}</span>
                            </div>
                        )}
                        {selectedPlan && (
                            <aside className={`selected-plan-card${selectedPlanHasOffer ? " selected-plan-card-discount" : ""}`}>
                                <span className="eyebrow">{selectedPlanHasOffer ? (offer.badge || "SPECIAL OFFER") : "YOUR PACKAGE"}</span>
                                <h2>{selectedPlan.name}</h2>
                                <p><Clock3 size={15} /> {selectedPlan.duration}</p>
                                {selectedPlanHasOffer ? (
                                    <div className="selected-plan-offer-prices">
                                        <del>₹{Number(selectedPlan.price).toLocaleString("en-IN")}</del>
                                        <strong>₹{Number(offer.offerPrice).toLocaleString("en-IN")}</strong>
                                    </div>
                                ) : <strong>₹{Number(selectedPlan.price).toLocaleString("en-IN")}</strong>}
                                {selectedPlanHasOffer && <span className="selected-plan-offer-badge">Limited-time offer applied</span>}
                            </aside>
                        )}
                    </section>

                    <section className="booking-form-card">
                        {success ? (
                            <div className="booking-success">
                                <span className="success-icon"><Check size={25} /></span>
                                <p className="eyebrow">REQUEST RECEIVED</p>
                                <h2>Thank you, {form.contactName.split(" ")[0]}.</h2>
                                <p>We've received your {selectedPlan?.name} request for {form.eventDate}. Our studio will reach out to you soon to confirm the date.</p>
                                <button className="button button-dark" onClick={() => navigate("/profile")}>View my bookings <ArrowRight size={16} /></button>
                            </div>
                        ) : (
                            <>
                                <div className="form-heading">
                                    <p className="eyebrow">BOOKING ENQUIRY</p>
                                    <h2>Tell us about your day</h2>
                                </div>
                                {error && <p className="form-error">{error}</p>}
                                {loading ? <p className="state-message">Loading packages…</p> : plans.length === 0 ? (
                                    <p className="state-message">There are no packages available at the moment. Please check back soon.</p>
                                ) : (
                                    <form className="booking-form" onSubmit={handleSubmit}>
                                        <label className="field-full">Choose a package
                                            <select name="planId" value={form.planId} onChange={handleChange} required>
                                                {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · ₹{Number(offerAppliesTo(plan) ? offer.offerPrice : plan.price).toLocaleString("en-IN")}</option>)}
                                            </select>
                                        </label>
                                        <label>Event date
                                            <input type="date" name="eventDate" min={minDate} value={form.eventDate} onChange={handleChange} required />
                                        </label>
                                        <label>Celebration
                                            <select name="eventType" value={form.eventType} onChange={handleChange} required>
                                                <option value="">Select event type</option>
                                                <option>Wedding</option><option>Engagement</option><option>Pre-wedding</option>
                                                <option>Portrait session</option><option>Family event</option><option>Other</option>
                                            </select>
                                        </label>
                                        <label>Your name
                                            <input name="contactName" value={form.contactName} onChange={handleChange} autoComplete="name" readOnly={isAuthenticated} required />
                                        </label>
                                        <label>Phone number
                                            <input type="tel" name="phone" value={form.phone} onChange={handleChange} autoComplete="tel" placeholder="+91 98765 43210" readOnly={isAuthenticated} required />
                                        </label>
                                        <div className="field-full booking-location-field">
                                            <label htmlFor="booking-location">Event location</label>
                                            <div className="booking-location-controls">
                                                <input id="booking-location" name="location" value={form.location} onChange={handleChange} placeholder="City, venue or neighbourhood" required />
                                                <LocationMapPicker coordinates={form.coordinates} onSelect={(coordinates) => setForm((current) => ({ ...current, coordinates }))} />
                                            </div>
                                            {form.coordinates && <span className="booking-coordinates">Selected pin: {form.coordinates.latitude.toFixed(6)}, {form.coordinates.longitude.toFixed(6)}</span>}
                                        </div>
                                        <label className="field-full">Anything else we should know? <span className="optional-label">Optional</span>
                                            <textarea name="notes" value={form.notes} onChange={handleChange} rows="4" maxLength="1500" placeholder="Share your plans, questions or ideas…" />
                                        </label>
                                        <button className="button button-dark field-full submit-button" type="submit" disabled={submitting}>
                                            {submitting ? "Preparing verification…" : isAuthenticated ? "Verify email & continue" : "Continue to login & confirm"} {!submitting && <ArrowRight size={17} />}
                                        </button>
                                        {!isAuthenticated && <p className="booking-login-hint field-full">Your selected package and details will be saved. Log in or create an account to confirm your request.</p>}
                                    </form>
                                )}
                                {verification && (
                                    <form className="booking-verification-form" onSubmit={handleVerifyAndBook}>
                                        <div className="booking-verification-heading">
                                            <span className="success-icon"><Check size={22} /></span>
                                            <div><p className="eyebrow">VERIFY YOUR EMAIL</p><h3>One last step</h3><p>Enter the verification code sent to {verification.email}.</p></div>
                                        </div>
                                        <div className="booking-verification-summary">
                                            <strong>{selectedPlan?.name}</strong>
                                            <span>{form.eventDate} · {form.location}</span>
                                            {form.coordinates && <span>{form.coordinates.latitude.toFixed(6)}, {form.coordinates.longitude.toFixed(6)}</span>}
                                        </div>
                                        <label>Email verification code
                                            <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength="6" value={emailCode} onChange={(event) => setEmailCode(event.target.value.replace(/\D/g, ""))} required />
                                        </label>
                                        <button className="button button-dark submit-button" type="submit" disabled={verifying || submitting}>
                                            {verifying ? "Verifying & booking…" : "Verify & confirm booking"} {!verifying && <Check size={16} />}
                                        </button>
                                        <button className="booking-resend" type="button" onClick={beginVerification} disabled={submitting || verifying}>Resend email code</button>
                                        <p className="booking-otp-note">The code expires in 10 minutes. You have a limited number of attempts.</p>
                                    </form>
                                )}
                            </>
                        )}
                    </section>
                </div>
            </main>
        </>
    );
};

export default BookingPage;
