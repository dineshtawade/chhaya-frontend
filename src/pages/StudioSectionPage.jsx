import { useEffect, useState } from "react";
import { ArrowDown, ArrowRight, Camera, Check, ChevronDown, Menu, Play, Quote, X } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../services/api";
import defaultStudioContent from "../data/defaultStudioContent";
import AutoplayReel from "../components/AutoplayReel";
import FloatingBookCTA from "../components/FloatingBookCTA";
import SiteFooter from "../components/SiteFooter";

const navigation = [
    { to: "/portfolio", label: "Our work" },
    { to: "/gallery", label: "Gallery" },
    { to: "/reels", label: "Reels" },
    { to: "/about", label: "Our approach" },
    { to: "/packages", label: "Packages" },
    { to: "/journal", label: "Journal" }
];

const pageDetails = {
    portfolio: {
        eyebrow: "COLLECTED MOMENTS",
        title: "Stories we've held.",
        description: "Every frame is a feeling. Take your time and find a story that feels like yours.",
        className: "portfolio-section"
    },
    gallery: {
        eyebrow: "LATEST FROM THE STUDIO",
        title: "The full gallery.",
        description: "A growing collection of celebrations, portraits, and moments worth keeping.",
        className: "gallery-section"
    },
    reels: {
        eyebrow: "IN MOTION",
        title: "Stories in motion.",
        description: "Little films from recent shoots, celebrations, and the moments in between.",
        className: "reels-section"
    },
    about: {
        eyebrow: "THE FEELING IS THE THING",
        title: "A little more like you.",
        description: "We believe the best photographs don't ask you to pose. They give you room to be exactly who you are.",
        className: "about-page-content"
    },
    packages: {
        eyebrow: "GOOD THINGS, MADE SIMPLE",
        title: "For the days that matter.",
        description: "Thoughtful packages, made to fit the way your celebration unfolds.",
        className: "packages-section"
    },
    journal: {
        eyebrow: "A LITTLE MORE TO THE STORY",
        title: "Beyond the still.",
        description: "Moving pictures, little details, and life between the frames.",
        className: "media-section"
    },
    testimonials: {
        eyebrow: "KIND WORDS, KEPT CLOSE",
        title: "Don't just take ours.",
        description: "A few notes from the people who let us be part of their day.",
        className: "testimonial-section"
    },
    faq: {
        eyebrow: "THE LITTLE DETAILS",
        title: "A few things you might wonder.",
        description: "A few answers to help you feel at home before we meet.",
        className: "faq-section"
    }
};

const getInitialContent = () => {
    try {
        return JSON.parse(localStorage.getItem("studioContent")) || defaultStudioContent;
    } catch {
        return defaultStudioContent;
    }
};

const StudioSectionPage = ({ section }) => {
    const [content, setContent] = useState(getInitialContent);
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeFaq, setActiveFaq] = useState(0);
    const [error, setError] = useState("");

    useEffect(() => {
        window.scrollTo(0, 0);
        const loadContent = async () => {
            try {
                const { data } = await api.get("/studio");
                setContent(data.content);
                localStorage.setItem("studioContent", JSON.stringify(data.content));
                setError("");
            } catch (requestError) {
                setError(requestError.response?.data?.message || "Studio server se connection nahi ho pa raha.");
            }
        };
        loadContent();
    }, [section]);

    const detail = pageDetails[section] || pageDetails.portfolio;
    const { hero, portfolio = [], gallery = [], reels = [], media = [], testimonials = [], faqs = [], plans = [], studio = defaultStudioContent.studio } = content;
    const user = (() => {
        try {
            return JSON.parse(localStorage.getItem("user") || "null");
        } catch {
            return null;
        }
    })();

    const renderPortfolio = (items) => (
        <div className="portfolio-grid section-page-portfolio-grid">
            {items.map((item, index) => (
                <article className={`portfolio-item portfolio-item-${index % 3}`} key={item.id || item.title || index}>
                    <img src={item.imageUrl} alt={item.title || `Photography story ${index + 1}`} loading="lazy" />
                    <div className="portfolio-overlay"><span>{item.category}</span><h3>{item.title}</h3></div>
                    <span className="portfolio-index">{String(index + 1).padStart(2, "0")}</span>
                </article>
            ))}
        </div>
    );

    const renderGallery = () => (
        <div className="studio-gallery-grid">
            {gallery.map((item, index) => (
                <article className={`studio-gallery-item gallery-item-${index % 6}`} key={item.id || item.imageUrl || index}>
                    <img src={item.imageUrl} alt={item.title || `Studio gallery photo ${index + 1}`} loading="lazy" />
                    <div><span>{item.category}</span><h3>{item.title}</h3></div>
                </article>
            ))}
        </div>
    );

    const renderReels = () => (
        <div className="reels-feed" aria-label="Studio reels">
            {reels.map((reel, index) => {
                const isDirectVideo = reel.videoUrl && (reel.videoUrl.includes("/uploads/") || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(reel.videoUrl));
                return (
                    <article className="reel-slide" key={reel.id || reel.videoUrl || index}>
                        <div className="reel-visual">
                            {isDirectVideo ? (
                                <AutoplayReel src={reel.videoUrl} title={reel.title} />
                            ) : reel.videoUrl ? (
                                <a className="reel-external" href={reel.videoUrl} target="_blank" rel="noreferrer" aria-label={`Watch ${reel.title}`}>
                                    <span className="reel-external-prompt"><Play size={26} fill="currentColor" /><span>Open this reel</span></span>
                                </a>
                            ) : <div className="reel-empty"><Play size={26} /></div>}
                        </div>
                        <div className="reel-caption"><span>{reel.category || "STUDIO REEL"}</span><h3>{reel.title || "A moment in motion"}</h3></div>
                    </article>
                );
            })}
        </div>
    );

    const renderPlans = () => (
        <div className="packages-grid section-page-packages-grid">
            {plans.filter((plan) => plan.active !== false).map((plan) => (
                <article className={`package-card${plan.featured ? " package-featured" : ""}`} key={plan.id || plan.name}>
                    <div className="package-topline"><span>{plan.category}</span>{plan.featured && <span className="package-tag">THE FAVOURITE</span>}</div>
                    <h3>{plan.name}</h3>
                    <p className="package-description">{plan.description}</p>
                    <p className="package-duration"><span />{plan.duration}</p>
                    <div className="package-price"><span>FROM</span><strong>₹{Number(plan.price).toLocaleString("en-IN")}</strong></div>
                    <ul>{(plan.features || []).map((feature) => <li key={feature}><Check size={15} />{feature}</li>)}</ul>
                    <Link className={`package-link${plan.featured ? " package-link-light" : ""}`} to={`/book?plan=${encodeURIComponent(plan.id)}`}>Enquire about this package <ArrowRight size={16} /></Link>
                </article>
            ))}
        </div>
    );

    const renderTestimonials = () => (
        <div className="testimonial-grid">
            {testimonials.map((item, index) => (
                <article className="testimonial-card" key={item.id || item.name || index}>
                    <span className="quote-mark">“</span>
                    <blockquote>{item.quote}</blockquote>
                    <div><span className="testimonial-dot" /><p><strong>{item.name}</strong><span>{item.event}</span></p></div>
                </article>
            ))}
        </div>
    );

    const renderFaqs = () => (
        <div className="faq-list">
            {faqs.map((faq, index) => (
                <article className={`faq-item${activeFaq === index ? " faq-item-open" : ""}`} key={faq.id || faq.question || index}>
                    <button onClick={() => setActiveFaq(activeFaq === index ? -1 : index)} aria-expanded={activeFaq === index}>
                        <span>{String(index + 1).padStart(2, "0")}</span><strong>{faq.question}</strong><ChevronDown size={18} />
                    </button>
                    {activeFaq === index && <p>{faq.answer}</p>}
                </article>
            ))}
        </div>
    );

    const renderJournal = () => (
        <div className="media-grid section-page-media-grid">
            {media.map((item, index) => (
                <a className="media-card" key={item.id || item.title || index} href={item.videoUrl || undefined} target={item.videoUrl ? "_blank" : undefined} rel={item.videoUrl ? "noreferrer" : undefined}>
                    <img src={item.imageUrl} alt={item.title || "Studio journal"} loading="lazy" />
                    <span className="media-play">{item.videoUrl ? <Play size={16} fill="currentColor" /> : <Camera size={17} />}</span>
                    <div><span className="eyebrow">{item.type}</span><h3>{item.title}</h3></div>
                </a>
            ))}
        </div>
    );

    const closeMenu = () => setMenuOpen(false);

    return (
        <div className="studio-site section-page-site">
            {error && <div className="api-warning" role="status"><span>Showing saved studio content while the server reconnects.</span></div>}
            <header className="public-nav public-nav-inner">
                <Link className="public-brand" to="/" onClick={closeMenu}>
                    <span className="public-brand-icon"><Camera size={19} /></span>
                    <span>{studio.name || defaultStudioContent.studio.name}</span>
                </Link>
                <button className="mobile-menu-toggle" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
                    {menuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
                <nav className={`public-links${menuOpen ? " public-links-open" : ""}`} aria-label="Main navigation">
                    {navigation.map((item) => <Link className={section === item.to.slice(1) ? "public-link-active" : ""} key={item.to} to={item.to} onClick={closeMenu}>{item.label}</Link>)}
                    <Link className="public-book-link" to="/book" onClick={closeMenu}>Check your date <ArrowRight size={15} /></Link>
                    <Link className="public-login-link" to={localStorage.getItem("token") ? (user?.role === "admin" ? "/admin" : "/user") : "/login"} onClick={closeMenu}>
                        {localStorage.getItem("token") ? "My account" : "Log in"}
                    </Link>
                </nav>
            </header>

            <main className="section-page-main">
                <section className={`section-page-hero ${detail.className}`}>
                    <p className="eyebrow">{detail.eyebrow}</p>
                    <h1>{detail.title}</h1>
                    <p>{detail.description}</p>
                    <a href="#section-content"><ArrowDown size={16} /> Explore the stories</a>
                </section>

                <section className={`section-page-content ${detail.className}`} id="section-content">
                    {section === "portfolio" && (
                        portfolio.length ? renderPortfolio(portfolio) : <p className="empty-note">New stories are on their way. Come back soon.</p>
                    )}
                    {section === "gallery" && (
                        gallery.length ? renderGallery() : <p className="empty-note">Fresh photographs are coming soon.</p>
                    )}
                    {section === "reels" && (
                        reels.length ? renderReels() : <p className="empty-note">New reels are coming soon.</p>
                    )}
                    {section === "about" && (
                        <>
                            <div className="section-page-about">
                                <div className="section-page-about-image"><img src={portfolio[0]?.imageUrl || hero.imageUrl} alt="A moment from behind the lens" loading="lazy" /></div>
                                <div className="section-page-about-copy">
                                    <Quote size={25} />
                                    <h2>“The best photographs don't ask you to pose. They ask you to <em>be.”</em></h2>
                                    <p>We make photographs for the people who want to remember it all: the happy chaos, the quiet glances, the dance floor at midnight. We'll give you room to forget we're there. That's when the real stuff happens.</p>
                                    <span className="signature">{studio.name || defaultStudioContent.studio.name}</span>
                                </div>
                            </div>
                            <div className="section-page-about-bottom">
                                <p>Based in {studio.location || defaultStudioContent.studio.location}, available wherever your story takes us.</p>
                                <Link className="button button-dark" to="/book">Let's plan your day <ArrowRight size={16} /></Link>
                            </div>
                        </>
                    )}
                    {section === "packages" && (
                        plans.filter((plan) => plan.active !== false).length ? renderPlans() : <p className="empty-note">Packages are being refreshed. Contact us for details.</p>
                    )}
                    {section === "journal" && (
                        media.length ? renderJournal() : <p className="empty-note">A few more moments, coming soon.</p>
                    )}
                    {section === "testimonials" && (
                        testimonials.length ? renderTestimonials() : <p className="empty-note">Kind words from our couples are coming soon.</p>
                    )}
                    {section === "faq" && (
                        faqs.length ? renderFaqs() : <p className="empty-note">Have a question? <a href={`mailto:${studio.email || defaultStudioContent.studio.email}`}>Get in touch</a>.</p>
                    )}
                </section>

                {section === "reels" && (
                    <div className="reel-book-cta">
                        <Link to="/book">Book your event <ArrowRight size={17} /></Link>
                    </div>
                )}

                <section className="section-page-cta">
                    <p className="eyebrow">YOUR STORY'S NEXT</p>
                    <h2>Shall we make something lasting?</h2>
                    <Link className="button button-cream" to="/book">Tell us about your day <ArrowRight size={16} /></Link>
                </section>
            </main>

            <SiteFooter studio={studio} />
            <FloatingBookCTA />
        </div>
    );
};

export default StudioSectionPage;
