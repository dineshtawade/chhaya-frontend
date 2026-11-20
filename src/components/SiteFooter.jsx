import { ArrowUpRight, Camera, Mail, MapPin, MessageCircle, Phone, Play } from "lucide-react";
import { Link } from "react-router-dom";
import defaultStudioContent from "../data/defaultStudioContent";

const getSafeExternalUrl = (value) => {
    if (typeof value !== "string" || !value.trim()) return "";
    try {
        const url = new URL(value.trim());
        return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
    } catch {
        return "";
    }
};

const SiteFooter = ({ studio = defaultStudioContent.studio }) => {
    const address = studio.address?.trim() || "";
    const mapsUrl = getSafeExternalUrl(studio.mapUrl) || (
        address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : ""
    );
    const socialLinks = [
        { key: "instagram", label: "Instagram", Icon: Camera },
        { key: "facebook", label: "Facebook" },
        { key: "youtube", label: "YouTube", Icon: Play },
        { key: "whatsapp", label: "WhatsApp", Icon: MessageCircle }
    ].map(({ key, ...social }) => ({ ...social, href: getSafeExternalUrl(studio[key]) }))
        .filter((social) => social.href);
    const mapLabel = address || studio.location || "View studio location";

    return (
        <footer className="site-footer">
            <div className="site-footer-main">
                <div className="site-footer-brand-block">
                    <Link className="footer-brand" to="/">
                        <span className="footer-brand-mark"><Camera size={19} /></span>
                        <span>{studio.name || defaultStudioContent.studio.name}</span>
                    </Link>
                    <p>Photographs that bring you right back to how it felt.</p>
                    {studio.location && <span className="footer-location-label">{studio.location}</span>}
                </div>

                <div className="site-footer-details">
                    {(address || mapsUrl) && (
                        <a className="footer-detail-link footer-address-link" href={mapsUrl} target="_blank" rel="noreferrer">
                            <MapPin size={17} />
                            <span><small>VISIT THE STUDIO</small><strong>{mapLabel}</strong></span>
                            <ArrowUpRight size={14} />
                        </a>
                    )}
                    {studio.email && (
                        <a className="footer-detail-link" href={`mailto:${studio.email}`}>
                            <Mail size={16} /><span><small>EMAIL</small><strong>{studio.email}</strong></span>
                        </a>
                    )}
                    {studio.phone && (
                        <a className="footer-detail-link" href={`tel:${studio.phone}`}>
                            <Phone size={16} /><span><small>CALL THE STUDIO</small><strong>{studio.phone}</strong></span>
                        </a>
                    )}
                </div>

                <nav className="site-footer-links" aria-label="Footer links">
                    <span>INFORMATION</span>
                    <Link to="/contact">Contact us <ArrowUpRight size={13} /></Link>
                    <Link to="/terms">Terms & conditions <ArrowUpRight size={13} /></Link>
                    <Link to="/privacy">Privacy policy <ArrowUpRight size={13} /></Link>
                </nav>
            </div>

            <div className="site-footer-bottom">
                <span>© {new Date().getFullYear()} {studio.name || defaultStudioContent.studio.name}. All rights reserved.</span>
                <div className="site-footer-socials" aria-label="Social media">
                    {socialLinks.map(({ label, Icon, href }) => (
                        <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} title={label}>
                            {Icon ? <Icon size={16} /> : <span className="footer-social-letter">f</span>}
                        </a>
                    ))}
                </div>
                <span className="footer-made-with">MADE WITH FEELING · IN INDIA</span>
            </div>
        </footer>
    );
};

export default SiteFooter;
