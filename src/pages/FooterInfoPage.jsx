import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import FloatingBookCTA from "../components/FloatingBookCTA";
import SiteFooter from "../components/SiteFooter";
import api from "../services/api";
import defaultStudioContent from "../data/defaultStudioContent";

const pageConfig = {
    contact: { eyebrow: "GET IN TOUCH", title: "Contact us" },
    terms: { eyebrow: "THE IMPORTANT DETAILS", title: "Terms & Conditions" },
    privacy: { eyebrow: "YOUR INFORMATION, RESPECTED", title: "Privacy Policy" }
};

const getSafeExternalUrl = (value) => {
    if (typeof value !== "string" || !value.trim()) return "";
    try {
        const url = new URL(value.trim());
        return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
    } catch {
        return "";
    }
};

const renderLegalContent = (body = "") => body
    .replace(/\r/g, "")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, index) => {
        const lines = block.split("\n");
        const heading = lines[0].startsWith("## ") ? lines.shift().slice(3) : "";
        const paragraph = lines.join(" ").trim();
        return (
            <section className="legal-copy-block" key={`${heading || "paragraph"}-${index}`}>
                {heading && <h2>{heading}</h2>}
                {paragraph && <p>{paragraph}</p>}
            </section>
        );
    });

const FooterInfoPage = ({ page }) => {
    const [content, setContent] = useState(defaultStudioContent);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        window.scrollTo(0, 0);
        api.get("/studio")
            .then(({ data }) => {
                setContent(data.content);
                localStorage.setItem("studioContent", JSON.stringify(data.content));
            })
            .catch((requestError) => setError(requestError.response?.data?.message || "Studio details could not be loaded."))
            .finally(() => setLoading(false));
    }, [page]);

    const config = pageConfig[page] || pageConfig.contact;
    const pageContent = content.footerPages?.[page] || defaultStudioContent.footerPages[page];
    const studio = content.studio || defaultStudioContent.studio;
    const address = studio.address?.trim() || "";
    const mapsUrl = getSafeExternalUrl(studio.mapUrl) || (
        address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : ""
    );
    const title = pageContent.title || config.title;
    const description = page === "contact" ? pageContent.description : pageContent.intro;

    return (
        <div className="footer-info-site">
            <Navbar />
            <main className="footer-info-main">
                <section className={`footer-info-hero footer-info-hero-${page}`}>
                    <Link className="back-link" to="/"><ArrowLeft size={15} /> Back to the studio</Link>
                    <p className="eyebrow">{pageContent.eyebrow || config.eyebrow}</p>
                    <h1>{title}</h1>
                    {description && <p className="footer-info-intro">{description}</p>}
                </section>

                {page === "contact" ? (
                    <section className="contact-page-details" aria-label="Studio contact information">
                        {error && <p className="form-error">{error}</p>}
                        {loading ? <p className="state-message">Loading studio contact details…</p> : (
                            <div className="contact-details-grid">
                                {(address || mapsUrl) && (
                                    <a className="contact-detail-card contact-address-card" href={mapsUrl} target="_blank" rel="noreferrer">
                                        <span className="contact-detail-icon"><MapPin size={20} /></span>
                                        <span className="contact-detail-copy"><small>FIND THE STUDIO</small><strong>{address || studio.location || "View studio location"}</strong><span>Open in Google Maps <ArrowUpRight size={14} /></span></span>
                                    </a>
                                )}
                                {studio.email && (
                                    <a className="contact-detail-card" href={`mailto:${studio.email}`}>
                                        <span className="contact-detail-icon"><Mail size={20} /></span>
                                        <span className="contact-detail-copy"><small>WRITE TO US</small><strong>{studio.email}</strong><span>Send an email <ArrowUpRight size={14} /></span></span>
                                    </a>
                                )}
                                {studio.phone && (
                                    <a className="contact-detail-card" href={`tel:${studio.phone}`}>
                                        <span className="contact-detail-icon"><Phone size={20} /></span>
                                        <span className="contact-detail-copy"><small>GIVE US A CALL</small><strong>{studio.phone}</strong><span>Call the studio <ArrowUpRight size={14} /></span></span>
                                    </a>
                                )}
                            </div>
                        )}
                        {studio.location && <p className="contact-location-note">{studio.name || "Our studio"} · {studio.location}</p>}
                        <Link className="button button-dark contact-page-cta" to="/book">Tell us about your day <ArrowUpRight size={16} /></Link>
                    </section>
                ) : (
                    <article className="legal-page-content">
                        {error && <p className="form-error">{error}</p>}
                        {renderLegalContent(pageContent.body)}
                        {loading && <p className="state-message">Loading page content…</p>}
                        <a className="legal-contact-link" href={`mailto:${studio.email || defaultStudioContent.studio.email}`}>Questions? Contact the studio <ArrowUpRight size={15} /></a>
                    </article>
                )}
            </main>
            <SiteFooter studio={studio} />
            <FloatingBookCTA />
        </div>
    );
};

export default FooterInfoPage;
