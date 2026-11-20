import { useEffect, useState } from "react";
import { ArrowUpRight, CalendarDays, Camera, Check, ChevronDown, CircleHelp, Film, Image, LayoutDashboard, MapPin, Menu, MessageSquareQuote, Package, PanelsTopLeft, Pencil, Plus, Save, Trash2, Upload, Users, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import BookingPushSetup from "../../components/BookingPushSetup";
import api from "../../services/api";
import defaultStudioContent from "../../data/defaultStudioContent";

const formatIndiaDateTimeInput = (value) => {
    const date = new Date(value);
    if (!value || !Number.isFinite(date.getTime())) return "";
    const indiaDate = new Date(date.getTime() + 330 * 60 * 1000);
    const pad = (part) => String(part).padStart(2, "0");
    return `${indiaDate.getUTCFullYear()}-${pad(indiaDate.getUTCMonth() + 1)}-${pad(indiaDate.getUTCDate())}T${pad(indiaDate.getUTCHours())}:${pad(indiaDate.getUTCMinutes())}`;
};

const parseIndiaDateTimeInput = (value) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
    if (!match) return "";
    const [, year, month, day, hour, minute] = match.map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, hour, minute) - 330 * 60 * 1000);
    return formatIndiaDateTimeInput(date.toISOString()) === value ? date.toISOString() : "";
};

const formatIndiaDateTimeLabel = (value) => {
    const date = new Date(value);
    return Number.isFinite(date.getTime())
        ? `${new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }).format(date)} IST`
        : "Not set";
};

const editorFields = {
    portfolio: [
        { name: "title", label: "Story title" },
        { name: "category", label: "Category" },
        { name: "imageUrl", label: "Image", type: "image", wide: true }
    ],
    gallery: [
        { name: "title", label: "Photo title" },
        { name: "category", label: "Category" },
        { name: "imageUrl", label: "Image", type: "image", wide: true }
    ],
    reels: [
        { name: "title", label: "Reel title" },
        { name: "category", label: "Category" },
        { name: "videoUrl", label: "Video", type: "video", wide: true }
    ],
    media: [
        { name: "title", label: "Title" },
        { name: "type", label: "Media type" },
        { name: "imageUrl", label: "Cover image", type: "image", wide: true },
        { name: "videoUrl", label: "Video (optional)", type: "video", wide: true }
    ],
    testimonials: [
        { name: "name", label: "Client names" },
        { name: "event", label: "Event" },
        { name: "quote", label: "Testimonial", multiline: true, wide: true }
    ],
    faqs: [
        { name: "question", label: "Question", wide: true },
        { name: "answer", label: "Answer", multiline: true, wide: true }
    ],
    plans: [
        { name: "name", label: "Package name" },
        { name: "category", label: "Category" },
        { name: "price", label: "Price (₹)", type: "number" },
        { name: "duration", label: "Duration" },
        { name: "description", label: "Short description", multiline: true, wide: true },
        { name: "features", label: "What's included (one per line)", multiline: true, wide: true },
        { name: "featured", label: "Highlight as featured package", type: "checkbox" },
        { name: "active", label: "Show this package on the website", type: "checkbox" }
    ]
};

const sectionInfo = {
    portfolio: { title: "Portfolio", subtitle: "The image stories visitors see on the website.", icon: Image, addLabel: "Add story", blank: { title: "", category: "Wedding", imageUrl: "" } },
    gallery: { title: "Photo gallery", subtitle: "Upload and manage the latest photos from your studio.", icon: Image, addLabel: "Add photo", blank: { title: "", category: "Studio gallery", imageUrl: "" } },
    reels: { title: "Reels", subtitle: "Upload short videos and manage your latest studio reels.", icon: Film, addLabel: "Add reel", blank: { title: "", category: "Studio reel", videoUrl: "" } },
    media: { title: "Media & journal", subtitle: "Add behind-the-scenes clips, films, and studio moments.", icon: Image, addLabel: "Add media", blank: { title: "", type: "Behind the scenes", imageUrl: "", videoUrl: "" } },
    testimonials: { title: "Testimonials", subtitle: "Published testimonials appear on the home page and reviews page.", icon: MessageSquareQuote, addLabel: "Add testimonial", blank: { name: "", event: "Wedding", quote: "" } },
    faqs: { title: "Frequently asked questions", subtitle: "Answer common questions before a client gets in touch.", icon: MessageSquareQuote, addLabel: "Add question", blank: { question: "", answer: "" } },
    plans: { title: "Packages & pricing", subtitle: "Wedding, engagement, candid, and custom photography packages.", icon: Package, addLabel: "Add package", blank: { name: "", category: "Wedding", price: 0, duration: "", description: "", features: [], featured: false, active: true } },
    offers: { title: "Homepage offer", subtitle: "Set up one featured offer with a package, discounted price, and banner image.", icon: Package },
    footer: { title: "Footer & information pages", subtitle: "Manage your studio address, social links, contact page, terms and privacy policy.", icon: PanelsTopLeft }
};

const tableFields = {
    portfolio: ["title", "category", "imageUrl"],
    gallery: ["title", "category", "imageUrl"],
    reels: ["title", "category", "videoUrl"],
    media: ["title", "type", "imageUrl", "videoUrl"],
    testimonials: ["name", "event", "quote"],
    faqs: ["question", "answer"],
    plans: ["name", "category", "price", "duration", "active"]
};

const heroFields = [
    { name: "eyebrow", label: "Small heading" },
    { name: "title", label: "Headline", multiline: true },
    { name: "description", label: "Description", multiline: true },
    { name: "imageUrl", label: "Hero image", type: "image" },
    { name: "buttonText", label: "Button label" }
];

const studioFields = [
    { name: "name", label: "Studio name" },
    { name: "location", label: "Location" },
    { name: "address", label: "Full studio address", multiline: true, rows: 3, wide: true },
    { name: "mapUrl", label: "Google Maps link (optional)", type: "url", wide: true },
    { name: "email", label: "Email address", type: "email" },
    { name: "phone", label: "Phone number" },
    { name: "instagram", label: "Instagram URL", type: "url" },
    { name: "facebook", label: "Facebook URL", type: "url" },
    { name: "youtube", label: "YouTube URL", type: "url" },
    { name: "whatsapp", label: "WhatsApp URL (for example wa.me link)", type: "url" }
];

const offerFields = [
    { name: "active", label: "Show this offer on the homepage", type: "checkbox", wide: true },
    { name: "planId", label: "Package", type: "plan", wide: true },
    { name: "offerPrice", label: "Offer price (₹)", type: "number" },
    { name: "startAt", label: "Start date & time (IST)", type: "datetime-local" },
    { name: "endAt", label: "End date & time (IST)", type: "datetime-local" },
    { name: "badge", label: "Offer badge" },
    { name: "eyebrow", label: "Small heading" },
    { name: "title", label: "Offer heading", wide: true },
    { name: "description", label: "Offer description", multiline: true, rows: 4, wide: true },
    { name: "imageUrl", label: "Offer image", type: "image", wide: true },
    { name: "buttonText", label: "Button label" }
];

const footerPageFields = {
    contact: [
        { name: "eyebrow", label: "Small heading" },
        { name: "title", label: "Page title" },
        { name: "description", label: "Introduction", multiline: true, rows: 4, wide: true }
    ],
    terms: [
        { name: "title", label: "Page title" },
        { name: "intro", label: "Introduction", multiline: true, rows: 3, wide: true },
        { name: "body", label: "Sections (use ## Heading, leave a blank line between paragraphs)", multiline: true, rows: 14, wide: true }
    ],
    privacy: [
        { name: "title", label: "Page title" },
        { name: "intro", label: "Introduction", multiline: true, rows: 3, wide: true },
        { name: "body", label: "Sections (use ## Heading, leave a blank line between paragraphs)", multiline: true, rows: 14, wide: true }
    ]
};

const heroDisplay = (slide) => slide.title || slide.eyebrow || "Untitled slide";

const websiteModules = [
    { key: "hero", label: "Homepage & studio", icon: PanelsTopLeft },
    { key: "portfolio", label: "Portfolio", icon: Image },
    { key: "gallery", label: "Photo gallery", icon: Image },
    { key: "reels", label: "Reels", icon: Film },
    { key: "media", label: "Media & journal", icon: Film },
    { key: "plans", label: "Packages & pricing", icon: Package },
    { key: "offers", label: "Homepage offer", icon: Package },
    { key: "testimonials", label: "Testimonials", icon: MessageSquareQuote },
    { key: "faqs", label: "FAQs", icon: CircleHelp },
    { key: "footer", label: "Footer & pages", icon: PanelsTopLeft }
];

const makeId = () => `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const renderBookingMapPin = (coordinates) => {
    const latitude = Number(coordinates?.latitude);
    const longitude = Number(coordinates?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return <span className="admin-map-pin-empty">Not pinned</span>;
    }

    const mapUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
    return (
        <a className="admin-map-pin" href={mapUrl} target="_blank" rel="noreferrer">
            <MapPin size={14} />{latitude.toFixed(5)}, {longitude.toFixed(5)}<ArrowUpRight size={13} />
        </a>
    );
};

const CompactMediaField = ({ label, value, kind, uploading, onChange, onUpload }) => (
    <div className="cms-table-media">
        <input
            type="url"
            aria-label={`${label} URL`}
            value={value || ""}
            onChange={(event) => onChange(event.target.value)}
            placeholder={`${kind === "image" ? "Image" : "Video"} URL`}
        />
        <label className="cms-table-upload" title={`Upload ${label}`}>
            <Upload size={15} />
            <input
                type="file"
                accept={kind === "image" ? "image/jpeg,image/png,image/webp,image/gif" : "video/mp4,video/webm,video/quicktime"}
                disabled={uploading}
                aria-label={`Upload ${label}`}
                onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onUpload(file);
                    event.target.value = "";
                }}
            />
        </label>
    </div>
);

const AdminDashboard = () => {
    const [searchParams] = useSearchParams();
    const [content, setContent] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [users, setUsers] = useState([]);
    const [tab, setTab] = useState(() => searchParams.get("tab") === "bookings" ? "bookings" : "overview");
    const [section, setSection] = useState("portfolio");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadingReels, setUploadingReels] = useState(false);
    const [uploadingField, setUploadingField] = useState("");
    const [editDialog, setEditDialog] = useState(null);
    const [notice, setNotice] = useState("");
    const [error, setError] = useState("");

    const loadData = async () => {
        setLoading(true);
        setError("");
        const results = await Promise.allSettled([
            api.get("/studio"),
            api.get("/bookings"),
            api.get("/auth/admin/users")
        ]);
        if (results[0].status === "fulfilled") {
            const loadedContent = results[0].value.data.content;
            loadedContent.footerPages = {
                ...defaultStudioContent.footerPages,
                ...loadedContent.footerPages,
                contact: { ...defaultStudioContent.footerPages.contact, ...loadedContent.footerPages?.contact },
                terms: { ...defaultStudioContent.footerPages.terms, ...loadedContent.footerPages?.terms },
                privacy: { ...defaultStudioContent.footerPages.privacy, ...loadedContent.footerPages?.privacy }
            };
            if (!Array.isArray(loadedContent.gallery)) loadedContent.gallery = [];
            if (!Array.isArray(loadedContent.reels)) loadedContent.reels = [];
            loadedContent.offer = { ...defaultStudioContent.offer, ...loadedContent.offer };
            if (!Array.isArray(loadedContent.hero?.slides) || loadedContent.hero.slides.length === 0) {
                loadedContent.hero = {
                    ...loadedContent.hero,
                    slides: [{
                        id: "hero-1",
                        eyebrow: loadedContent.hero?.eyebrow || "",
                        title: loadedContent.hero?.title || "",
                        description: loadedContent.hero?.description || "",
                        imageUrl: loadedContent.hero?.imageUrl || "",
                        buttonText: loadedContent.hero?.buttonText || "Explore our work"
                    }]
                };
            }
            setContent(loadedContent);
        }
        if (results[1].status === "fulfilled") setBookings(results[1].value.data.bookings);
        if (results[2].status === "fulfilled") setUsers(results[2].value.data.users);
        const failures = results.filter((result) => result.status === "rejected");
        if (failures.length) {
            setError(failures.map((result) => result.reason.response?.data?.message || result.reason.message || "Some studio data could not be loaded.").join(" "));
        }
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const updateContent = (change) => setContent((current) => ({ ...current, ...change }));
    const openEditor = (dialog) => setEditDialog({ ...dialog, sessionId: makeId() });

    const addHeroSlide = () => {
        const slides = [...(content.hero.slides || []), {
            id: makeId(),
            eyebrow: "JAIPUR · WEDDING & LIFESTYLE PHOTOGRAPHY",
            title: "A new story,\nbeautifully told.",
            description: "Add a short introduction for this hero slide.",
            imageUrl: "",
            buttonText: "Explore our work"
        }];
        updateContent({ hero: { ...content.hero, slides } });
        openEditor({ type: "hero", index: slides.length - 1, item: slides[slides.length - 1], isNew: true });
    };
    const deleteHeroSlide = (index) => {
        if ((content.hero.slides || []).length <= 1) {
            window.alert("Hero section mein kam se kam ek slide zaroori hai.");
            return;
        }
        if (!window.confirm("Remove this hero slide from the website?")) return;
        updateContent({ hero: { ...content.hero, slides: content.hero.slides.filter((_, itemIndex) => itemIndex !== index) } });
    };

    const addItem = (key) => {
        const item = { id: makeId(), ...sectionInfo[key].blank };
        const items = [...content[key], item];
        updateContent({ [key]: items });
        openEditor({ type: "item", key, index: items.length - 1, item, isNew: true });
    };

    const deleteItem = (key, index) => {
        if (!window.confirm("Remove this item from your website?")) return;
        updateContent({ [key]: content[key].filter((_, itemIndex) => itemIndex !== index) });
    };

    const uploadMediaFile = async (file, kind, target, onUploaded) => {
        const allowedTypes = kind === "image"
            ? ["image/jpeg", "image/png", "image/webp", "image/gif"]
            : ["video/mp4", "video/webm", "video/quicktime"];
        const maxSize = kind === "image" ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
        if (!allowedTypes.includes(file.type) || file.size > maxSize) {
            setError(kind === "image"
                ? "Choose a JPG, PNG, WEBP or GIF image under 10 MB."
                : "Choose an MP4, WEBM or MOV video under 100 MB.");
            return;
        }

        const formData = new FormData();
        formData.append(kind === "image" ? "images" : "reels", file);
        setUploadingField(target);
        setError("");
        setNotice("");
        try {
            const endpoint = kind === "image" ? "/studio/upload" : "/studio/upload-reels";
            const { data } = await api.post(endpoint, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            const uploadedFile = data.files?.[0];
            const uploadedUrl = kind === "image" ? uploadedFile?.imageUrl : uploadedFile?.videoUrl;
            if (!uploadedUrl) throw new Error("The server did not return the uploaded file URL.");
            onUploaded(uploadedUrl);
            setNotice(`${file.name} uploaded. Save & publish to show it on your website.`);
        } catch (requestError) {
            setError(requestError.response?.data?.message || requestError.message || "The file could not be uploaded.");
        } finally {
            setUploadingField("");
        }
    };

    const renderMediaField = (label, value, kind, target, onChange) => (
        <CompactMediaField
            label={label}
            value={value}
            kind={kind}
            uploading={uploadingField === target}
            onChange={onChange}
            onUpload={(file) => uploadMediaFile(file, kind, target, onChange)}
        />
    );

    const closeEditor = () => {
        if (editDialog?.isNew) {
            if (editDialog.type === "item") {
                updateContent({ [editDialog.key]: content[editDialog.key].filter((_, index) => index !== editDialog.index) });
            } else if (editDialog.type === "hero") {
                updateContent({ hero: { ...content.hero, slides: content.hero.slides.filter((_, index) => index !== editDialog.index) } });
            }
        }
        setEditDialog(null);
    };

    const saveEditor = () => {
        if (editDialog.type === "item") {
            const items = [...content[editDialog.key]];
            items[editDialog.index] = editDialog.item;
            updateContent({ [editDialog.key]: items });
        } else if (editDialog.type === "hero") {
            const slides = [...content.hero.slides];
            slides[editDialog.index] = editDialog.item;
            updateContent({ hero: { ...content.hero, slides } });
        } else if (editDialog.type === "footerPage") {
            updateContent({
                footerPages: {
                    ...content.footerPages,
                    [editDialog.page]: editDialog.item
                }
            });
        } else if (editDialog.type === "offer") {
            updateContent({ offer: editDialog.item });
        } else {
            updateContent({ studio: editDialog.item });
        }
        setEditDialog(null);
    };

    const updateEditorField = (field, value) => {
        const sessionId = editDialog?.sessionId;
        setEditDialog((current) => current?.sessionId === sessionId ? { ...current, item: { ...current.item, [field]: value } } : current);
    };

    const renderEditorField = (field, item, index) => {
        const label = field.label;
        const updateValue = (value) => updateEditorField(field.name, value);

        if (field.type === "checkbox") {
            return <span className="cms-edit-checkbox"><input type="checkbox" aria-label={label} checked={Boolean(item[field.name])} onChange={(event) => updateValue(event.target.checked)} /><span>{label}</span></span>;
        }

        if (field.type === "plan") {
            return (
                <select aria-label={label} value={item[field.name] || ""} onChange={(event) => updateValue(event.target.value)}>
                    <option value="">Choose a package</option>
                    {content.plans.filter((plan) => plan.active !== false).map((plan) => (
                        <option key={plan.id} value={plan.id}>{plan.name} · ₹{Number(plan.price).toLocaleString("en-IN")}</option>
                    ))}
                </select>
            );
        }

        if (field.type === "datetime-local") {
            return (
                <input
                    type="datetime-local"
                    aria-label={label}
                    value={formatIndiaDateTimeInput(item[field.name])}
                    onChange={(event) => updateValue(parseIndiaDateTimeInput(event.target.value))}
                />
            );
        }

        if (field.type === "image" || field.type === "video") {
            const target = `${editDialog.type}-${index}-${field.name}`;
            return renderMediaField(field.label, item[field.name], field.type, target, updateValue);
        }

        if (field.multiline) {
            return (
                <textarea
                    aria-label={label}
                    rows={field.rows || 2}
                    value={field.name === "features" ? (item.features || []).join("\n") : item[field.name] || ""}
                    onChange={(event) => updateValue(field.name === "features" ? event.target.value.split("\n").filter((line) => line.trim()) : event.target.value)}
                />
            );
        }

        return (
            <input
                type={field.type || "text"}
                aria-label={label}
                min={field.type === "number" ? "0" : undefined}
                value={item[field.name] ?? ""}
                onChange={(event) => updateValue(field.type === "number" ? Number(event.target.value) : event.target.value)}
            />
        );
    };

    const renderTableValue = (fieldName, item) => {
        const field = editorFields[section].find((candidate) => candidate.name === fieldName);
        const value = item[fieldName];
        if (field?.type === "image" && value) {
            return <img className="cms-table-thumbnail" src={value} alt="" loading="lazy" />;
        }
        if (field?.type === "video") {
            return value ? <span className="cms-table-file-status"><Film size={14} />Video added</span> : <span className="cms-table-muted">No video</span>;
        }
        if (fieldName === "price") return `₹${Number(value || 0).toLocaleString("en-IN")}`;
        if (fieldName === "active") return <span className={`cms-state-badge ${value === false ? "is-inactive" : "is-active"}`}>{value === false ? "Hidden" : "Published"}</span>;
        if (field?.type === "checkbox") return <span className="cms-state-badge">{value ? "Yes" : "No"}</span>;
        if (Array.isArray(value)) return value.length ? `${value.length} included` : "Not set";
        return value || <span className="cms-table-muted">Not set</span>;
    };

    const uploadGalleryImages = async (event) => {
        const selectedFiles = Array.from(event.target.files || []);
        if (!selectedFiles.length) return;

        const formData = new FormData();
        selectedFiles.forEach((file) => formData.append("images", file));

        setUploading(true);
        setError("");
        setNotice("");
        try {
            const { data } = await api.post("/studio/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            updateContent({ gallery: [...(data.files || []).reverse(), ...content.gallery] });
            setNotice(`${data.files.length} photo${data.files.length === 1 ? "" : "s"} uploaded. Save & publish to show them.`);
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Photos could not be uploaded.");
        } finally {
            setUploading(false);
            event.target.value = "";
        }
    };

    const uploadReels = async (event) => {
        const selectedFiles = Array.from(event.target.files || []);
        if (!selectedFiles.length) return;

        const formData = new FormData();
        selectedFiles.forEach((file) => formData.append("reels", file));

        setUploadingReels(true);
        setError("");
        setNotice("");
        try {
            const { data } = await api.post("/studio/upload-reels", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            updateContent({ reels: [...(data.files || []).reverse(), ...content.reels] });
            setNotice(`${data.files.length} reel${data.files.length === 1 ? "" : "s"} uploaded. Save & publish to show them.`);
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Reels could not be uploaded.");
        } finally {
            setUploadingReels(false);
            event.target.value = "";
        }
    };

    const saveContent = async () => {
        setSaving(true);
        setError("");
        setNotice("");
        try {
            const { data } = await api.put("/studio", { content });
            const expectedOffer = content.offer || defaultStudioContent.offer;
            const savedOffer = data.content?.offer;
            if (expectedOffer.active === true && (
                !savedOffer ||
                savedOffer.active !== true ||
                savedOffer.id !== expectedOffer.id ||
                savedOffer.planId !== expectedOffer.planId ||
                Number(savedOffer.offerPrice) !== Number(expectedOffer.offerPrice) ||
                savedOffer.startAt !== expectedOffer.startAt ||
                savedOffer.endAt !== expectedOffer.endAt
            )) {
                throw new Error("The API did not return the saved offer. Restart the backend so it loads the latest StudioContent schema, then publish again.");
            }
            setContent({
                ...data.content,
                offer: { ...defaultStudioContent.offer, ...data.content.offer }
            });
            setNotice("Website content saved and published.");
        } catch (requestError) {
            setError(requestError.response?.data?.message || requestError.message || "Changes couldn't be saved. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const changeStatus = async (bookingId, status) => {
        setError("");
        try {
            const { data } = await api.patch(`/bookings/${bookingId}/status`, { status });
            setBookings((current) => current.map((booking) => booking._id === bookingId ? { ...booking, status: data.booking.status } : booking));
        } catch (requestError) {
            setError(requestError.response?.data?.message || "The booking status couldn't be updated.");
        }
    };

    const pendingCount = bookings.filter((booking) => booking.status === "pending").length;
    const upcomingBookings = bookings.filter((booking) => booking.eventDate >= new Date().toISOString().slice(0, 10) && booking.status !== "cancelled").length;
    const homepageOffer = content?.offer && typeof content.offer === "object" && !Array.isArray(content.offer)
        ? { ...defaultStudioContent.offer, ...content.offer }
        : defaultStudioContent.offer;
    const selectedOfferPlan = content?.plans?.find((plan) => plan.id === homepageOffer.planId);
    const offerStartTime = Date.parse(homepageOffer.startAt);
    const offerEndTime = Date.parse(homepageOffer.endAt);
    const hasOfferSchedule = Number.isFinite(offerStartTime) && Number.isFinite(offerEndTime) && offerEndTime > offerStartTime;
    const offerStatus = !homepageOffer.active ? "Hidden" :
        !hasOfferSchedule ? "Needs schedule" :
            Date.now() < offerStartTime ? "Scheduled" :
                Date.now() >= offerEndTime ? "Expired" : "Live";
    const offerStatusClass = offerStatus === "Live" ? "is-active" : offerStatus === "Scheduled" ? "is-scheduled" : "is-inactive";
    const currentPageTitle = tab === "overview" ? "Overview" :
        tab === "bookings" ? "Booking enquiries" :
            tab === "clients" ? "Client accounts" :
                section === "hero" ? "Homepage & studio details" : sectionInfo[section].title;

    return (
        <>
            <Navbar />
            <div className="admin-workspace">
                <aside className={`admin-sidebar${mobileMenuOpen ? " admin-sidebar-open" : ""}`}>
                    <div className="admin-sidebar-brand"><span><Camera size={19} /></span><div><strong>Chhaya Picture</strong><small>ADMIN WORKSPACE</small></div></div>
                    <div className="admin-mobile-menu-bar">
                        <span className="admin-mobile-current">{currentPageTitle}</span>
                        <button
                            className="admin-mobile-menu-toggle"
                            type="button"
                            aria-expanded={mobileMenuOpen}
                            aria-controls="admin-mobile-modules"
                            onClick={() => setMobileMenuOpen((open) => !open)}
                        >
                            {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
                            <span>{mobileMenuOpen ? "Close menu" : "Menu"}</span>
                            <ChevronDown className={mobileMenuOpen ? "menu-chevron-open" : ""} size={15} />
                        </button>
                    </div>
                    <div className="admin-sidebar-content" id="admin-mobile-modules">
                    <span className="admin-sidebar-label">WORKSPACE</span>
                    <nav className="admin-sidebar-nav" aria-label="Admin modules">
                        <button className={tab === "overview" ? "admin-nav-active" : ""} onClick={() => { setTab("overview"); setMobileMenuOpen(false); }}><LayoutDashboard size={17} />Overview</button>
                    </nav>
                    <span className="admin-sidebar-label">WEBSITE</span>
                    <nav className="admin-sidebar-nav" aria-label="Website content modules">
                        {websiteModules.map(({ key, label, icon: Icon }) => (
                            <button className={tab === "content" && section === key ? "admin-nav-active" : ""} key={key} onClick={() => { setTab("content"); setSection(key); setMobileMenuOpen(false); }}>
                                <Icon size={17} />{label}{key === "portfolio" || key === "media" || key === "plans" || key === "testimonials" || key === "faqs" ? <span className="admin-nav-count">{content?.[key]?.length ?? "—"}</span> : null}
                            </button>
                        ))}
                    </nav>
                    <span className="admin-sidebar-label">CLIENT MANAGEMENT</span>
                    <nav className="admin-sidebar-nav" aria-label="Client management modules">
                        <button className={tab === "bookings" ? "admin-nav-active" : ""} onClick={() => { setTab("bookings"); setMobileMenuOpen(false); }}><CalendarDays size={17} />Bookings{pendingCount > 0 && <span className="admin-nav-count admin-nav-alert">{pendingCount}</span>}</button>
                        <button className={tab === "clients" ? "admin-nav-active" : ""} onClick={() => { setTab("clients"); setMobileMenuOpen(false); }}><Users size={17} />Clients<span className="admin-nav-count">{users.length}</span></button>
                    </nav>
                    <a className="admin-sidebar-preview" href="/" target="_blank" rel="noreferrer"><ArrowUpRight size={15} />View live website</a>
                    </div>
                </aside>

                <main className="admin-page">
                    <header className="admin-header">
                        <div><p className="eyebrow">{tab === "content" ? "WEBSITE MANAGEMENT" : tab === "bookings" || tab === "clients" ? "CLIENT MANAGEMENT" : "YOUR STUDIO, YOUR WAY"}</p><h1>{currentPageTitle}</h1><p>{tab === "overview" ? "Everything happening in your studio, at a glance." : tab === "content" ? section === "hero" ? "Update your homepage introduction and studio contact information." : sectionInfo[section].subtitle : tab === "bookings" ? "Review enquiries and keep every shoot on track." : tab === "clients" ? "People who have created an account with your studio." : "Manage your studio."}</p></div>
                        <div className="admin-header-date"><span>STUDIO DASHBOARD</span><strong>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</strong></div>
                    </header>

                    {error && <div className="admin-alert admin-alert-error">{error}<button onClick={loadData}>Try again</button></div>}
                    {notice && <div className="admin-alert admin-alert-success"><Check size={17} />{notice}<button onClick={() => setNotice("")}>Dismiss</button></div>}

                    {tab === "overview" && <div className="admin-table-scroll admin-summary-table">
                        <table className="admin-table">
                            <thead><tr><th>STUDIO METRIC</th><th>COUNT</th><th>DETAIL</th></tr></thead>
                            <tbody>
                                <tr><td>All enquiries</td><td><strong>{loading ? "—" : bookings.length}</strong></td><td>{pendingCount} waiting for a reply</td></tr>
                                <tr><td>Upcoming dates</td><td><strong>{loading ? "—" : upcomingBookings}</strong></td><td>Not yet marked cancelled</td></tr>
                                <tr><td>Clients</td><td><strong>{loading ? "—" : users.length}</strong></td><td>Registered client accounts</td></tr>
                                <tr><td>Live packages</td><td><strong>{loading || !content ? "—" : content.plans.filter((plan) => plan.active !== false).length}</strong></td><td>Visible on your website</td></tr>
                            </tbody>
                        </table>
                    </div>}

                {loading || !content ? <div className="admin-loading">Getting your studio ready…</div> : (
                    <>
                        {tab === "overview" && (
                            <div className="admin-overview-grid">
                                <section className="admin-panel">
                                    <div className="panel-heading"><div><p className="eyebrow">NEEDS YOUR ATTENTION</p><h2>Recent booking requests</h2></div><button className="small-link" onClick={() => setTab("bookings")}>See all <ArrowUpRight size={15} /></button></div>
                                    {bookings.length === 0 ? <p className="panel-empty">No enquiries just yet. Your website is ready to welcome the first one.</p> :
                                        <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>CLIENT</th><th>PACKAGE</th><th>EVENT DATE</th><th>MAP PIN</th><th>STATUS</th></tr></thead><tbody>
                                            {bookings.slice(0, 4).map((booking) => <tr key={booking._id}><td><strong>{booking.contactName}</strong><span>{booking.user?.email}</span></td><td>{booking.plan.name}</td><td>{booking.eventDate}</td><td>{renderBookingMapPin(booking.coordinates)}</td><td><span className={`status-badge status-${booking.status}`}>{booking.status}</span></td></tr>)}
                                        </tbody></table></div>}
                                </section>
                                <div className="admin-overview-actions">
                                    <div><p className="eyebrow">MAKE IT YOURS</p><p>Website changes go live after publishing.</p></div>
                                    <BookingPushSetup />
                                    <button className="button button-dark" onClick={() => { setTab("content"); setSection("hero"); }}>Edit your website <ArrowUpRight size={16} /></button>
                                    <a className="small-link" href="/" target="_blank" rel="noreferrer">Open live website <ArrowUpRight size={15} /></a>
                                </div>
                            </div>
                        )}

                        {tab === "content" && (
                            <div className="cms-layout">
                                <section className="cms-editor">
                                    {section === "hero" ? (
                                        <>
                                            <div className="cms-section-heading"><div><p className="eyebrow">MAKE A FIRST IMPRESSION</p><h2>Homepage & studio details</h2><p>Set the welcome visitors see, and your contact information.</p></div></div>
                                            <div className="cms-table-section">
                                                <div className="cms-section-heading">
                                                    <div><h3>Hero slides</h3><p>Swipe ya arrows se move hone wale homepage slides.</p></div>
                                                    <button className="button button-outline" onClick={addHeroSlide}><Plus size={16} />Add hero slide</button>
                                                </div>
                                                <div className="admin-table-scroll">
                                                    <table className="admin-table cms-editor-table cms-hero-table">
                                                        <thead><tr><th>#</th><th>Slide content</th><th>Hero image</th><th>Button</th><th>Actions</th></tr></thead>
                                                        <tbody>
                                                            {(content.hero.slides || []).map((slide, index) => (
                                                                <tr key={slide.id || `hero-slide-${index}`}>
                                                                    <td>{String(index + 1).padStart(2, "0")}</td>
                                                                    <td><div className="cms-table-primary"><strong>{heroDisplay(slide)}</strong><span>{slide.eyebrow || "No small heading"}</span></div><p className="cms-table-description">{slide.description || "No description"}</p></td>
                                                                    <td>{slide.imageUrl ? <img className="cms-table-thumbnail cms-hero-thumbnail" src={slide.imageUrl} alt="" loading="lazy" /> : <span className="cms-table-muted">No image</span>}</td>
                                                                    <td>{slide.buttonText || "—"}</td>
                                                                    <td><div className="cms-row-actions"><button className="cms-row-edit" aria-label={`Edit hero slide ${index + 1}`} onClick={() => openEditor({ type: "hero", index, item: { ...slide } })}><Pencil size={15} />Edit</button><button className="cms-row-delete" aria-label="Remove hero slide" onClick={() => deleteHeroSlide(index)}><Trash2 size={16} /></button></div></td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                            <div className="cms-table-section">
                                                <h3>Studio contact</h3>
                                                <div className="admin-table-scroll">
                                                    <table className="admin-table cms-editor-table cms-contact-table">
                                                        <thead><tr><th>Studio detail</th><th>Current value</th><th>Action</th></tr></thead>
                                                        <tbody>{[
                                                            ["name", "Studio name"], ["location", "Location"], ["email", "Email address"], ["phone", "Phone number"], ["instagram", "Instagram URL"]
                                                        ].map(([field, label]) => (
                                                            <tr key={field}><td><strong>{label}</strong></td><td className="cms-table-long-value">{content.studio[field] || <span className="cms-table-muted">Not set</span>}</td><td><button className="cms-row-edit" aria-label={`Edit ${label}`} onClick={() => openEditor({ type: "studio", item: { ...content.studio } })}><Pencil size={15} />Edit</button></td></tr>
                                                        ))}</tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </>
                                    ) : section === "offers" ? (
                                        <>
                                            <div className="cms-section-heading">
                                                <div><p className="eyebrow">A LITTLE SOMETHING EXTRA</p><h2>Homepage offer</h2><p>Choose a package, discounted price, banner image, and start/end date-times in IST. The offer appears on the homepage only during its schedule.</p></div>
                                            </div>
                                            <div className="cms-table-section cms-offer-editor">
                                                <div className="cms-section-heading"><div><h3>Featured offer</h3><p>The crossed-out price follows the selected package's regular price. The API requires a valid schedule for live offers.</p></div><button className="cms-row-edit" aria-label="Edit homepage offer" onClick={() => openEditor({ type: "offer", item: { ...homepageOffer } })}><Pencil size={15} />Edit offer</button></div>
                                                <div className="admin-table-scroll">
                                                    <table className="admin-table cms-editor-table cms-offer-table">
                                                        <thead><tr><th>Status</th><th>Package</th><th>Regular price</th><th>Offer price</th><th>Starts (IST)</th><th>Ends (IST)</th><th>Offer image</th><th>Action</th></tr></thead>
                                                        <tbody>
                                                            <tr>
                                                                <td><span className={`cms-state-badge ${offerStatusClass}`}>{offerStatus}</span></td>
                                                                <td><strong>{selectedOfferPlan?.name || "Choose a package"}</strong></td>
                                                                <td>{selectedOfferPlan ? `₹${Number(selectedOfferPlan.price).toLocaleString("en-IN")}` : "—"}</td>
                                                                <td><strong>₹{Number(homepageOffer.offerPrice || 0).toLocaleString("en-IN")}</strong></td>
                                                                <td>{formatIndiaDateTimeLabel(homepageOffer.startAt)}</td>
                                                                <td>{formatIndiaDateTimeLabel(homepageOffer.endAt)}</td>
                                                                <td>{homepageOffer.imageUrl ? <img className="cms-table-thumbnail cms-offer-thumbnail" src={homepageOffer.imageUrl} alt="Offer banner preview" loading="lazy" /> : <span className="cms-table-muted">No image</span>}</td>
                                                                <td><button className="cms-row-edit" onClick={() => openEditor({ type: "offer", item: { ...homepageOffer } })}><Pencil size={15} />Edit offer</button></td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </>
                                    ) : section === "footer" ? (
                                        <>
                                            <div className="cms-section-heading"><div><p className="eyebrow">YOUR STUDIO, YOUR DETAILS</p><h2>Footer & information pages</h2><p>Manage the address visitors open in Google Maps, your social links, and the content on your contact and legal pages.</p></div></div>
                                            <div className="cms-table-section">
                                                <div className="cms-section-heading"><div><h3>Studio address & social media</h3><p>A full address opens a Google Maps search. Add a direct Maps URL if you have one.</p></div><button className="cms-row-edit" onClick={() => openEditor({ type: "studio", item: { ...content.studio } })}><Pencil size={15} />Edit details</button></div>
                                                <div className="admin-table-scroll">
                                                    <table className="admin-table cms-editor-table cms-contact-table">
                                                        <thead><tr><th>Studio detail</th><th>Current value</th></tr></thead>
                                                        <tbody>{studioFields.map((field) => (
                                                            <tr key={field.name}><td><strong>{field.label}</strong></td><td className="cms-table-long-value">{content.studio[field.name] || <span className="cms-table-muted">Not set</span>}</td></tr>
                                                        ))}</tbody>
                                                    </table>
                                                </div>
                                            </div>
                                            <div className="cms-table-section">
                                                <div className="cms-section-heading"><div><h3>Contact & legal pages</h3><p>Edit page titles and copy here. Changes go live after publishing.</p></div></div>
                                                <div className="admin-table-scroll">
                                                    <table className="admin-table cms-editor-table">
                                                        <thead><tr><th>Page</th><th>Current title</th><th>Action</th></tr></thead>
                                                        <tbody>{[
                                                            ["contact", "Contact Us"],
                                                            ["terms", "Terms & Conditions"],
                                                            ["privacy", "Privacy Policy"]
                                                        ].map(([page, label]) => (
                                                            <tr key={page}>
                                                                <td><strong>{label}</strong></td>
                                                                <td>{content.footerPages?.[page]?.title || label}</td>
                                                                <td><button className="cms-row-edit" aria-label={`Edit ${label} page`} onClick={() => openEditor({ type: "footerPage", page, item: { ...content.footerPages[page] } })}><Pencil size={15} />Edit page</button></td>
                                                            </tr>
                                                        ))}</tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="cms-section-heading"><div><p className="eyebrow">MAKE IT YOURS</p><h2>{sectionInfo[section].title}</h2><p>{sectionInfo[section].subtitle}</p></div><button className="button button-outline" onClick={() => addItem(section)}><Plus size={16} />{sectionInfo[section].addLabel}</button></div>
                                            {(section === "gallery" || section === "reels") && (
                                                <div className="admin-upload-toolbar">
                                                    <div><strong>{section === "gallery" ? "Upload latest photos" : "Upload latest reels"}</strong><span>{section === "gallery" ? "Select up to 20 JPG, PNG, WEBP or GIF photos." : "Select up to 10 MP4, WEBM or MOV videos, up to 100 MB each."}</span></div>
                                                    {section === "gallery" ? (
                                                        <label className="button button-dark gallery-upload-button">
                                                            {uploading ? "Uploading…" : <><Upload size={15} />Choose photos</>}
                                                            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple disabled={uploading} onChange={uploadGalleryImages} />
                                                        </label>
                                                    ) : (
                                                        <label className="button button-dark gallery-upload-button">
                                                            {uploadingReels ? "Uploading…" : <><Upload size={15} />Choose reels</>}
                                                            <input type="file" accept="video/mp4,video/webm,video/quicktime" multiple disabled={uploadingReels} onChange={uploadReels} />
                                                        </label>
                                                    )}
                                                </div>
                                            )}
                                            {content[section].length ? (
                                                <div className="admin-table-scroll">
                                                    <table className={`admin-table cms-editor-table cms-content-${section}`}>
                                                        <thead><tr><th>#</th>{tableFields[section].map((fieldName) => <th key={fieldName}>{editorFields[section].find((field) => field.name === fieldName).label}</th>)}<th>Actions</th></tr></thead>
                                                        <tbody>{content[section].map((item, index) => (
                                                            <tr key={item.id || `${section}-${index}`}>
                                                                <td>{String(index + 1).padStart(2, "0")}</td>
                                                                {tableFields[section].map((fieldName) => {
                                                                    const isLongText = ["quote", "answer", "description"].includes(fieldName);
                                                                    return <td className={isLongText ? "cms-table-long-value" : ""} key={fieldName}>{isLongText ? <span className="cms-table-clamp">{renderTableValue(fieldName, item)}</span> : renderTableValue(fieldName, item)}</td>;
                                                                })}
                                                                <td><div className="cms-row-actions"><button className="cms-row-edit" aria-label={`Edit ${sectionInfo[section].title} row ${index + 1}`} onClick={() => openEditor({ type: "item", key: section, index, item: { ...item } })}><Pencil size={15} />Edit</button><button className="cms-row-delete" aria-label={`Remove ${sectionInfo[section].title} item`} onClick={() => deleteItem(section, index)}><Trash2 size={16} /></button></div></td>
                                                            </tr>
                                                        ))}</tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <p className="cms-empty-row">No {sectionInfo[section].title.toLowerCase()} added yet. Use “{sectionInfo[section].addLabel}” to create the first row.</p>
                                            )}
                                        </>
                                    )}
                                    <div className="cms-save-bar"><span>Your changes are not live until you publish.</span><button className="button button-dark" onClick={saveContent} disabled={saving}><Save size={16} />{saving ? "Publishing…" : "Save & publish"}</button></div>
                                </section>
                            </div>
                        )}

                        {tab === "bookings" && (
                            <section className="admin-panel admin-table-panel">
                                <div className="panel-heading"><div><p className="eyebrow">THE GOOD NEWS</p><h2>Booking enquiries</h2></div><span className="count-pill">{bookings.length} total</span></div>
                                {bookings.length === 0 ? <p className="panel-empty">No enquiries yet. When someone sends a booking request, it will show up here.</p> :
                                    <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>CLIENT</th><th>PACKAGE</th><th>EVENT DATE</th><th>LOCATION</th><th>MAP PIN</th><th>PHONE</th><th>PRICE</th><th>STATUS</th></tr></thead><tbody>
                                        {bookings.map((booking) => <tr key={booking._id}><td><strong>{booking.contactName}</strong><span>{booking.user?.email}</span></td><td>{booking.plan.name}<span>{booking.eventType}</span></td><td>{booking.eventDate}</td><td>{booking.location}</td><td>{renderBookingMapPin(booking.coordinates)}</td><td>{booking.phone}</td><td>₹{Number(booking.plan.price).toLocaleString("en-IN")}</td><td><label className="status-select"><select aria-label={`Booking status for ${booking.contactName}`} value={booking.status} onChange={(event) => changeStatus(booking._id, event.target.value)}><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select><ChevronDown size={14} /></label></td></tr>)}
                                    </tbody></table></div>}
                            </section>
                        )}

                        {tab === "clients" && (
                            <section className="admin-panel admin-table-panel">
                                <div className="panel-heading"><div><p className="eyebrow">YOUR COMMUNITY</p><h2>Registered clients</h2></div><span className="count-pill">{users.length} clients</span></div>
                                <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>CLIENT</th><th>EMAIL</th><th>PHONE</th><th>ACCOUNT</th><th>JOINED</th></tr></thead><tbody>{users.map((client) => <tr key={client._id}><td><strong>{client.name}</strong></td><td>{client.email}</td><td>{client.phone || "—"}</td><td><span className="status-badge status-confirmed">{client.role}</span></td><td>{new Date(client.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td></tr>)}</tbody></table></div>
                            </section>
                        )}
                    </>
                )}
                {editDialog && (
                    <div className="cms-edit-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) closeEditor(); }}>
                        <section className="cms-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="cms-edit-title" onKeyDown={(event) => { if (event.key === "Escape") closeEditor(); }}>
                            <header className="cms-edit-header">
                                <div><p className="eyebrow">EDIT WEBSITE CONTENT</p><h2 id="cms-edit-title">{editDialog.type === "hero" ? "Homepage slide" : editDialog.type === "studio" ? "Studio contact & social details" : editDialog.type === "footerPage" ? `Edit ${editDialog.page === "terms" ? "Terms & Conditions" : editDialog.page === "privacy" ? "Privacy Policy" : "Contact Us"}` : editDialog.type === "offer" ? "Homepage offer" : `Edit ${sectionInfo[editDialog.key].title.toLowerCase()}`}</h2><p>Changes will go live after you publish.</p></div>
                                <button className="cms-edit-close" type="button" aria-label="Close editor" onClick={closeEditor}><X size={19} /></button>
                            </header>
                            <div className="cms-edit-form">
                                {(editDialog.type === "hero" ? heroFields : editDialog.type === "studio" ? studioFields : editDialog.type === "footerPage" ? footerPageFields[editDialog.page] : editDialog.type === "offer" ? offerFields : editorFields[editDialog.key]).map((field) => (
                                    <label className={`cms-edit-field${field.type === "checkbox" ? " cms-edit-field-checkbox" : ""}${field.wide ? " cms-edit-field-wide" : ""}`} key={field.name}>
                                        <span>{field.label}</span>
                                        {renderEditorField(field, editDialog.item, editDialog.index || 0)}
                                    </label>
                                ))}
                            </div>
                            <footer className="cms-edit-footer">
                                <button type="button" className="button button-outline" onClick={closeEditor}>Cancel</button>
                                <button type="button" className="button button-dark" onClick={saveEditor}><Check size={16} />Save row</button>
                            </footer>
                        </section>
                    </div>
                )}
                </main>
            </div>
        </>
    );
};

export default AdminDashboard;
