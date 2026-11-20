import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDown, ArrowRight, Camera, Check, ChevronDown, ChevronLeft, ChevronRight, Menu, Play, Quote, X } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../services/api";
import defaultStudioContent from "../data/defaultStudioContent";
import AutoplayReel from "../components/AutoplayReel";
import FloatingBookCTA from "../components/FloatingBookCTA";
import SiteFooter from "../components/SiteFooter";

gsap.registerPlugin(ScrollTrigger);

const formatOfferDateTime = (value) => `${new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
}).format(new Date(value))} IST`;

const StudioHome = () => {
    const siteRef = useRef(null);
    const heroCopyRef = useRef(null);
    const scrollProgressRef = useRef(null);
    const testimonialTrackRef = useRef(null);
    const [content, setContent] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("studioContent")) || defaultStudioContent;
        } catch {
            return defaultStudioContent;
        }
    });
    const [error, setError] = useState("");
    const [retryCount, setRetryCount] = useState(0);
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeFaq, setActiveFaq] = useState(0);
    const [activeHero, setActiveHero] = useState(0);
    const [touchStart, setTouchStart] = useState(null);
    const [testimonialWindow, setTestimonialWindow] = useState({ start: 0, end: 0, canGoPrev: false, canGoNext: false });
    const [offerClock, setOfferClock] = useState(() => Date.now());

    useEffect(() => {
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
    }, [retryCount]);

    const { hero, portfolio = [], gallery = [], reels = [], media = [], testimonials = [], faqs = [], plans = [], studio = defaultStudioContent.studio } = content;
    const offer = content.offer && typeof content.offer === "object" && !Array.isArray(content.offer)
        ? content.offer
        : defaultStudioContent.offer;
    const offerPlan = plans.find((plan) => plan.id === offer.planId && plan.active !== false);
    const offerPrice = Number(offer.offerPrice);
    const offerStartTime = Date.parse(offer.startAt);
    const offerEndTime = Date.parse(offer.endAt);
    const hasOfferSchedule = Number.isFinite(offerStartTime) &&
        Number.isFinite(offerEndTime) &&
        offerEndTime > offerStartTime;
    const hasLiveOffer = offer.active === true &&
        offerPlan &&
        Number.isFinite(offerPrice) &&
        offerPrice > 0 &&
        offerPrice < Number(offerPlan.price) &&
        hasOfferSchedule &&
        offerEndTime > offerClock &&
        typeof offer.title === "string" &&
        Boolean(offer.title.trim()) &&
        typeof offer.imageUrl === "string" &&
        Boolean(offer.imageUrl.trim());
    const offerHasStarted = offerClock >= offerStartTime;
    const countdownTarget = offerHasStarted ? offerEndTime : offerStartTime;
    const countdownTime = Math.max(0, countdownTarget - offerClock);
    const countdownDays = Math.floor(countdownTime / 86400000);
    const countdownHours = Math.floor((countdownTime % 86400000) / 3600000);
    const countdownMinutes = Math.floor((countdownTime % 3600000) / 60000);
    const countdownSeconds = Math.floor((countdownTime % 60000) / 1000);
    const heroSlides = Array.isArray(hero?.slides) && hero.slides.length
        ? hero.slides
        : [{ ...hero, id: "hero-1" }];
    const safeHeroIndex = heroSlides.length ? activeHero % heroSlides.length : 0;
    const currentHero = heroSlides[safeHeroIndex] || heroSlides[0] || {};
    const showPreviousHero = () => setActiveHero((index) => (index - 1 + heroSlides.length) % heroSlides.length);
    const showNextHero = () => setActiveHero((index) => (index + 1) % heroSlides.length);

    useEffect(() => {
        if (!hasLiveOffer) return undefined;
        const timer = window.setInterval(() => setOfferClock(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [hasLiveOffer]);

    const updateTestimonialWindow = useCallback((track = testimonialTrackRef.current) => {
        if (!track) return;
        const firstCard = track.firstElementChild;
        if (!firstCard) {
            setTestimonialWindow({ start: 0, end: 0, canGoPrev: false, canGoNext: false });
            return;
        }

        const cardWidth = firstCard.getBoundingClientRect().width;
        const gap = Number.parseFloat(window.getComputedStyle(track).gap) || 0;
        const stride = cardWidth + gap;
        const start = stride ? Math.round(track.scrollLeft / stride) : 0;
        const visibleCount = stride ? Math.max(1, Math.round((track.clientWidth + gap) / stride)) : 1;
        const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);

        setTestimonialWindow({
            start,
            end: Math.min(testimonials.length, start + visibleCount),
            canGoPrev: track.scrollLeft > 1,
            canGoNext: track.scrollLeft < maxScroll - 1
        });
    }, [testimonials.length]);

    const scrollTestimonials = (direction) => {
        const track = testimonialTrackRef.current;
        const firstCard = track?.firstElementChild;
        if (!track || !firstCard) return;

        const gap = Number.parseFloat(window.getComputedStyle(track).gap) || 0;
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        track.scrollBy({
            left: direction * (firstCard.getBoundingClientRect().width + gap),
            behavior: prefersReducedMotion ? "auto" : "smooth"
        });
    };

    useEffect(() => {
        const track = testimonialTrackRef.current;
        if (!track) return undefined;

        updateTestimonialWindow(track);
        const observer = new ResizeObserver(() => updateTestimonialWindow(track));
        observer.observe(track);
        return () => observer.disconnect();
    }, [testimonials.length, updateTestimonialWindow]);

    useEffect(() => {
        if (heroSlides.length < 2) return undefined;
        const interval = window.setInterval(() => {
            setActiveHero((index) => (index + 1) % heroSlides.length);
        }, 6000);
        return () => window.clearInterval(interval);
    }, [heroSlides.length]);

    useEffect(() => {
        setActiveHero((index) => heroSlides.length ? index % heroSlides.length : 0);
    }, [heroSlides.length]);

    const handleHeroTouchEnd = (event) => {
        if (touchStart === null) return;
        const distance = event.changedTouches[0].clientX - touchStart;
        if (Math.abs(distance) > 45) {
            if (distance < 0) showNextHero();
            else showPreviousHero();
        }
        setTouchStart(null);
    };

    useEffect(() => {
        if (!siteRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

        const context = gsap.context(() => {
            gsap.from(".public-brand", { x: -24, opacity: 0, duration: 0.8, ease: "power3.out" });
            gsap.from(".public-links > a", {
                y: -12,
                opacity: 0,
                duration: 0.65,
                stagger: 0.07,
                delay: 0.18,
                ease: "power3.out"
            });

            if (scrollProgressRef.current) {
                gsap.fromTo(
                    scrollProgressRef.current,
                    { scaleX: 0 },
                    {
                        scaleX: 1,
                        ease: "none",
                        scrollTrigger: {
                            trigger: siteRef.current,
                            start: "top top",
                            end: "bottom bottom",
                            scrub: 0.25
                        }
                    }
                );
            }

            gsap.utils.toArray("[data-gsap-reveal]").forEach((element) => {
                gsap.from(element, {
                    y: 52,
                    opacity: 0,
                    duration: 1,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: element,
                        start: "top 86%",
                        once: true
                    }
                });
            });

            gsap.utils.toArray("[data-gsap-grid]").forEach((grid) => {
                const items = Array.from(grid.children);
                if (!items.length) return;
                gsap.from(items, {
                    y: 48,
                    opacity: 0,
                    duration: 0.9,
                    stagger: 0.13,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: grid,
                        start: "top 88%",
                        once: true
                    }
                });
            });

            gsap.utils.toArray("[data-gsap-parallax]").forEach((frame) => {
                const image = frame.querySelector("img");
                if (!image) return;
                gsap.fromTo(
                    image,
                    { yPercent: -4, scale: 1.08 },
                    {
                        yPercent: 4,
                        scale: 1.08,
                        ease: "none",
                        scrollTrigger: {
                            trigger: frame,
                            start: "top bottom",
                            end: "bottom top",
                            scrub: true
                        }
                    }
                );
            });

            gsap.utils.toArray("[data-gsap-image]").forEach((image) => {
                gsap.from(image, {
                    scale: 1.08,
                    opacity: 0.35,
                    duration: 1.25,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: image,
                        start: "top 88%",
                        once: true
                    }
                });
            });
        }, siteRef);

        return () => context.revert();
    }, [content]);

    useEffect(() => {
        if (!heroCopyRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const heroCopyItems = Array.from(heroCopyRef.current.children);
        gsap.fromTo(
            heroCopyItems,
            { y: 22, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.75, stagger: 0.09, ease: "power3.out", clearProps: "transform,opacity" }
        );
    }, [activeHero]);

    const closeMenu = () => setMenuOpen(false);

    return (
        <div className="studio-site" ref={siteRef}>
            <div className="site-scroll-progress" aria-hidden="true">
                <span ref={scrollProgressRef} />
            </div>
            {error && (
                <div className="api-warning" role="status">
                    <span>{error} Default/last saved studio content dikhaya ja raha hai.</span>
                    <button onClick={() => setRetryCount((count) => count + 1)}>Retry</button>
                </div>
            )}
            <header className="public-nav">
                <a className="public-brand" href="#top" onClick={closeMenu}>
                    <span className="public-brand-icon"><Camera size={19} /></span>
                    <span>{studio.name || defaultStudioContent.studio.name}</span>
                </a>
                <button className="mobile-menu-toggle" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen((open) => !open)}>
                    {menuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
                <nav className={`public-links${menuOpen ? " public-links-open" : ""}`}>
                    <Link to="/portfolio" onClick={closeMenu}>Our work</Link>
                    <Link to="/gallery" onClick={closeMenu}>Gallery</Link>
                    <Link to="/reels" onClick={closeMenu}>Reels</Link>
                    <Link to="/about" onClick={closeMenu}>Our approach</Link>
                    <Link to="/packages" onClick={closeMenu}>Packages</Link>
                    <Link to="/journal" onClick={closeMenu}>Journal</Link>
                    <Link className="public-book-link" to="/book" onClick={closeMenu}>Check your date <ArrowRight size={15} /></Link>
                    {localStorage.getItem("token") ? (
                        <Link className="public-login-link" to={JSON.parse(localStorage.getItem("user") || "{}").role === "admin" ? "/admin" : "/user"} onClick={closeMenu}>My account</Link>
                    ) : <Link className="public-login-link" to="/login" onClick={closeMenu}>Log in</Link>}
                </nav>
            </header>

            <main id="top">
                <section
                    className="hero-section"
                    onTouchStart={(event) => setTouchStart(event.touches[0].clientX)}
                    onTouchEnd={handleHeroTouchEnd}
                >
                    {heroSlides.map((slide, index) => (
                        <img
                            key={slide.id || `hero-slide-${index}`}
                            className={`hero-image${index === safeHeroIndex ? " hero-image-active" : ""}`}
                            src={slide.imageUrl || hero.imageUrl}
                            alt={slide.title ? `${slide.title.replace(/\n/g, " ")} - Chhaya Picture` : "Chhaya Picture photography"}
                        />
                    ))}
                    <div className="hero-shade" />
                    <div className="hero-copy" ref={heroCopyRef}>
                        <span className="hero-eyebrow"><span />{currentHero.eyebrow}</span>
                        <h1>{currentHero.title}</h1>
                        <p>{currentHero.description}</p>
                        <div className="hero-actions">
                            <Link className="button button-cream" to="/portfolio">{currentHero.buttonText || "Explore our work"} <ArrowRight size={17} /></Link>
                            <Link className="hero-text-link" to="/book">Let's plan your day <ArrowRight size={16} /></Link>
                        </div>
                    </div>
                    <div className="hero-bottom">
                        <span>{studio.location || defaultStudioContent.studio.location}</span>
                        <a href="#portfolio"><ArrowDown size={17} /> SCROLL TO EXPLORE</a>
                        <span>EST. MMXVI</span>
                    </div>
                    {heroSlides.length > 1 && (
                        <div className="hero-controls" aria-label="Hero slides">
                            <button type="button" onClick={showPreviousHero} aria-label="Previous hero slide"><ChevronLeft size={17} /></button>
                            <div className="hero-dots">
                                {heroSlides.map((slide, index) => (
                                    <button
                                        key={slide.id || `hero-dot-${index}`}
                                        type="button"
                                        className={index === safeHeroIndex ? "hero-dot-active" : ""}
                                        onClick={() => setActiveHero(index)}
                                        aria-label={`Show hero slide ${index + 1}`}
                                    />
                                ))}
                            </div>
                            <button type="button" onClick={showNextHero} aria-label="Next hero slide"><ChevronRight size={17} /></button>
                        </div>
                    )}
                    <div className="hero-side-note">A LITTLE MORE LIKE YOU <span>—</span> ALWAYS</div>
                </section>

                <section className="intro-section" id="about" data-gsap-reveal>
                    <p className="eyebrow">THE FEELING IS THE THING</p>
                    <h2>Not just how it looked.<br /><em>How it felt.</em></h2>
                    <div className="intro-bottom">
                        <span className="intro-number">01 — 06</span>
                        <p>We make photographs for the people who want to remember it all: the happy chaos, the quiet glances, the dance floor at midnight. The things that make your story yours.</p>
                        <Link to="/about">A little about us <ArrowRight size={15} /></Link>
                    </div>
                </section>

                {hasLiveOffer && (
                    <section className="home-offer-section" data-gsap-reveal aria-labelledby="home-offer-title">
                        <div className="home-offer-card">
                            <div className="home-offer-art">
                                <img src={offer.imageUrl} alt={`${offerPlan.name} photography offer`} loading="lazy" />
                                <span className="home-offer-ribbon">{offer.badge || "FESTIVE OFFER"}</span>
                                <div className="home-offer-art-caption">
                                    <span>MADE FOR THE MOMENTS THAT MATTER</span>
                                    <strong>{offerPlan.name}</strong>
                                </div>
                                <div className="home-offer-save-stamp">
                                    <span>YOU SAVE</span>
                                    <strong>₹{(Number(offerPlan.price) - offerPrice).toLocaleString("en-IN")}</strong>
                                </div>
                            </div>
                            <div className="home-offer-copy">
                                <p className="eyebrow">{offer.eyebrow || "A LITTLE SOMETHING EXTRA"}</p>
                                <h2 id="home-offer-title">{offer.title}</h2>
                                <p className="home-offer-description">{offer.description}</p>
                                <p className="home-offer-package">{offerPlan.category || "STUDIO PACKAGE"} <span /> {offerPlan.name}</p>
                                <div className="home-offer-prices">
                                    <div><span>REGULAR PRICE</span><del>₹{Number(offerPlan.price).toLocaleString("en-IN")}</del></div>
                                    <div className="home-offer-special-price"><span>OFFER PRICE</span><strong>₹{offerPrice.toLocaleString("en-IN")}</strong></div>
                                </div>
                                <div className="home-offer-countdown" role="timer" aria-label={`${offerHasStarted ? "Offer ends" : "Offer starts"} in ${countdownDays} days, ${countdownHours} hours, ${countdownMinutes} minutes, and ${countdownSeconds} seconds`}>
                                    <span>{offerHasStarted ? "OFFER ENDS IN" : "OFFER STARTS IN"}</span>
                                    <div aria-hidden="true">
                                        <span><strong>{String(countdownDays).padStart(2, "0")}</strong><small>days</small></span>
                                        <span><strong>{String(countdownHours).padStart(2, "0")}</strong><small>hrs</small></span>
                                        <span><strong>{String(countdownMinutes).padStart(2, "0")}</strong><small>min</small></span>
                                        <span><strong>{String(countdownSeconds).padStart(2, "0")}</strong><small>sec</small></span>
                                    </div>
                                </div>
                                {offerHasStarted ? (
                                    <Link
                                        className="button button-dark home-offer-cta"
                                        to={`/book?plan=${encodeURIComponent(offerPlan.id)}&offer=${encodeURIComponent(offer.id)}`}
                                    >
                                        {offer.buttonText || "Claim this offer"} <ArrowRight size={17} />
                                    </Link>
                                ) : (
                                    <button className="button button-dark home-offer-cta home-offer-cta-disabled" type="button" disabled>
                                        Offer starts soon
                                    </button>
                                )}
                                <small>Offer ends {formatOfferDateTime(offer.endAt)} · Booking subject to studio availability.</small>
                            </div>
                        </div>
                    </section>
                )}

                <section className="portfolio-section" id="portfolio">
                    <div className="section-heading" data-gsap-reveal>
                        <div><p className="eyebrow">COLLECTED MOMENTS</p><h2>Stories we've <em>held.</em></h2></div>
                        <p>Every frame is a feeling.<br />Here are a few of ours.</p>
                    </div>
                    <div className="portfolio-grid" data-gsap-grid>
                        {portfolio.slice(0, 3).map((item, index) => (
                            <article className={`portfolio-item portfolio-item-${index % 3}`} key={item.id || item.title}>
                                <img src={item.imageUrl} alt={item.title} loading="lazy" />
                                <div className="portfolio-overlay"><span>{item.category}</span><h3>{item.title}</h3></div>
                                <span className="portfolio-index">0{index + 1}</span>
                            </article>
                        ))}
                    </div>
                    {portfolio.length === 0 && <p className="empty-note">New stories are on their way. Come back soon.</p>}
                    <Link className="section-more-link" to="/portfolio">Explore all our work <ArrowRight size={15} /></Link>
                </section>

                <section className="gallery-section" id="gallery">
                    <div className="section-heading" data-gsap-reveal>
                        <div><p className="eyebrow">LATEST FROM THE STUDIO</p><h2>The full <em>gallery.</em></h2></div>
                        <p>Fresh stories, celebrations,<br />and moments worth keeping.</p>
                    </div>
                    <div className="studio-gallery-grid" data-gsap-grid>
                        {gallery.slice(0, 4).map((item, index) => (
                            <article className={`studio-gallery-item gallery-item-${index % 6}`} key={item.id || item.imageUrl}>
                                <img src={item.imageUrl} alt={item.title || `Chhaya Picture gallery photo ${index + 1}`} loading="lazy" />
                                <div><span>{item.category}</span><h3>{item.title}</h3></div>
                            </article>
                        ))}
                    </div>
                    {gallery.length === 0 && <p className="empty-note">Fresh photographs are coming soon.</p>}
                    <Link className="section-more-link" to="/gallery">View the full gallery <ArrowRight size={15} /></Link>
                </section>

                <section className="reels-section" id="reels">
                    <div className="section-heading" data-gsap-reveal>
                        <div><p className="eyebrow">IN MOTION</p><h2>Latest <em>reels.</em></h2></div>
                        <p>Small films from recent shoots,<br />stories, and celebrations.</p>
                    </div>
                    <div className="reels-grid" data-gsap-grid>
                        {reels.slice(0, 4).map((reel) => {
                            const isDirectVideo = reel.videoUrl && (reel.videoUrl.includes("/uploads/") || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(reel.videoUrl));
                            return (
                                <article className="reel-card" key={reel.id || reel.videoUrl}>
                                    {isDirectVideo ? (
                                        <AutoplayReel src={reel.videoUrl} title={reel.title} />
                                    ) : reel.videoUrl ? (
                                        <a className="reel-external" href={reel.videoUrl} target="_blank" rel="noreferrer" aria-label={`Open ${reel.title || "reel"}`}>
                                            <span className="reel-external-prompt"><Play size={26} fill="currentColor" /><span>Open this reel</span></span>
                                        </a>
                                    ) : (
                                        <div className="reel-empty"><Play size={26} /></div>
                                    )}
                                    <div className="reel-caption"><span>{reel.category}</span><h3>{reel.title}</h3></div>
                                </article>
                            );
                        })}
                    </div>
                    {reels.length === 0 && <p className="empty-note">New reels are coming soon.</p>}
                    <Link className="section-more-link" to="/reels">Watch all reels <ArrowRight size={15} /></Link>
                </section>

                <section className="manifesto-section">
                    <div className="manifesto-image" data-gsap-image data-gsap-parallax><img src={portfolio[0]?.imageUrl || hero.imageUrl} alt="A quiet moment from a wedding story" loading="lazy" /></div>
                    <div className="manifesto-copy" data-gsap-reveal>
                        <p className="eyebrow">A NOTE FROM BEHIND THE LENS</p>
                        <Quote size={25} strokeWidth={1.2} />
                        <h2>“The best photographs don't ask you to pose. They ask you to <em>be.”</em></h2>
                        <p>We'll give you room to forget we're there. That's when the real stuff happens.</p>
                        <span className="signature">{studio.name || defaultStudioContent.studio.name}</span>
                    </div>
                </section>

                <section className="media-section" id="journal">
                    <div className="section-heading" data-gsap-reveal>
                        <div><p className="eyebrow">A LITTLE MORE TO THE STORY</p><h2>Beyond the <em>still.</em></h2></div>
                        <p>Moving pictures, little details,<br />and life between the frames.</p>
                    </div>
                    <div className="media-grid" data-gsap-grid>
                        {media.slice(0, 2).map((item) => (
                            <a className="media-card" key={item.id || item.title} href={item.videoUrl || "#journal"} target={item.videoUrl ? "_blank" : undefined} rel={item.videoUrl ? "noreferrer" : undefined}>
                                <img src={item.imageUrl} alt={item.title} loading="lazy" />
                                <span className="media-play">{item.videoUrl ? <Play size={16} fill="currentColor" /> : <Camera size={17} />}</span>
                                <div><span className="eyebrow">{item.type}</span><h3>{item.title}</h3></div>
                            </a>
                        ))}
                    </div>
                    {media.length === 0 && <p className="empty-note">A few more moments, coming soon.</p>}
                    <Link className="section-more-link" to="/journal">Read the journal <ArrowRight size={15} /></Link>
                </section>

                <section className="packages-section" id="packages">
                    <div className="section-heading packages-heading" data-gsap-reveal>
                        <div><p className="eyebrow">GOOD THINGS, MADE SIMPLE</p><h2>For the days that <em>matter.</em></h2></div>
                        <p>Thoughtful packages, made to fit<br />the way your day unfolds.</p>
                    </div>
                    <div className="packages-grid" data-gsap-grid>
                        {plans.filter((plan) => plan.active !== false).slice(0, 3).map((plan) => (
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
                    {plans.length === 0 && <p className="empty-note">Packages are being refreshed. Contact us for details.</p>}
                    <Link className="section-more-link" to="/packages">Compare all packages <ArrowRight size={15} /></Link>
                    <p className="package-note">Every celebration is different. <a href={`mailto:${studio.email || defaultStudioContent.studio.email}`}>Let's make a custom plan <ArrowRight size={14} /></a></p>
                </section>

                <section className="testimonial-section home-testimonials">
                    <div className="testimonial-heading" data-gsap-reveal><p className="eyebrow">KIND WORDS, KEPT CLOSE</p><h2>Don't just take <em>ours.</em></h2></div>
                    {testimonials.length > 0 && (
                        <div className="home-testimonial-carousel" data-gsap-reveal>
                            <div
                                className="testimonial-grid home-testimonial-grid"
                                ref={testimonialTrackRef}
                                onScroll={(event) => updateTestimonialWindow(event.currentTarget)}
                                role="region"
                                aria-label="Client testimonials"
                                tabIndex={0}
                            >
                                {testimonials.map((item, index) => {
                                    const initials = (item.name?.trim() || "Chhaya Picture")
                                        .split(/\s+/)
                                        .slice(0, 2)
                                        .map((part) => part[0])
                                        .join("")
                                        .toUpperCase();
                                    return (
                                        <article className={`testimonial-card home-testimonial-card home-testimonial-card-${(index % 3) + 1}`} key={item.id || item.name || index}>
                                            <div className="home-testimonial-topline">
                                                <span className="home-testimonial-quote" aria-hidden="true">“</span>
                                                {item.event && <span className="home-testimonial-event">{item.event}</span>}
                                            </div>
                                            <blockquote>{item.quote}</blockquote>
                                            <footer className="home-testimonial-author">
                                                <span className="home-testimonial-avatar" aria-hidden="true">{initials}</span>
                                                <span className="home-testimonial-author-copy">
                                                    <strong>{item.name}</strong>
                                                    <span>Shared with Chhaya Picture</span>
                                                </span>
                                                <span className="home-testimonial-sparkle" aria-hidden="true">✳</span>
                                            </footer>
                                        </article>
                                    );
                                })}
                            </div>
                            {testimonials.length > 1 && (
                                <div className="home-testimonial-controls">
                                    <span className="home-testimonial-count" aria-live="polite">
                                        <strong>{String(testimonialWindow.start + 1).padStart(2, "0")}–{String(testimonialWindow.end).padStart(2, "0")}</strong>
                                        <span> / {String(testimonials.length).padStart(2, "0")}</span>
                                    </span>
                                    <div
                                        className="home-testimonial-progress"
                                        role="progressbar"
                                        aria-label="Testimonials viewed"
                                        aria-valuemin={0}
                                        aria-valuemax={testimonials.length}
                                        aria-valuenow={testimonialWindow.end}
                                    >
                                        <span style={{ width: `${(testimonialWindow.end / testimonials.length) * 100}%` }} />
                                    </div>
                                    <div className="home-testimonial-buttons">
                                        <button type="button" aria-label="Previous testimonials" onClick={() => scrollTestimonials(-1)} disabled={!testimonialWindow.canGoPrev}>
                                            <ChevronLeft size={17} />
                                        </button>
                                        <button type="button" aria-label="Next testimonials" onClick={() => scrollTestimonials(1)} disabled={!testimonialWindow.canGoNext}>
                                            <ChevronRight size={17} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {testimonials.length === 0 && <p className="empty-note">We can't wait to share kind words from our couples.</p>}
                    <Link className="section-more-link" to="/testimonials">Read more kind words <ArrowRight size={15} /></Link>
                </section>

                <section className="faq-section" id="faq">
                    <div className="faq-heading" data-gsap-reveal><p className="eyebrow">THE LITTLE DETAILS</p><h2>A few things<br />you might <em>wonder.</em></h2><p>Still have a question? We'd love to hear from you.</p><a href={`mailto:${studio.email || defaultStudioContent.studio.email}`}>{studio.email || defaultStudioContent.studio.email} <ArrowRight size={15} /></a></div>
                    <div className="faq-list" data-gsap-reveal>
                        {faqs.slice(0, 3).map((faq, index) => (
                            <article className={`faq-item${activeFaq === index ? " faq-item-open" : ""}`} key={faq.id || faq.question}>
                                <button onClick={() => setActiveFaq(activeFaq === index ? -1 : index)} aria-expanded={activeFaq === index}>
                                    <span>{String(index + 1).padStart(2, "0")}</span><strong>{faq.question}</strong><ChevronDown size={18} />
                                </button>
                                {activeFaq === index && <p>{faq.answer}</p>}
                            </article>
                        ))}
                    </div>
                    <Link className="section-more-link faq-more-link" to="/faq">Explore all FAQs <ArrowRight size={15} /></Link>
                </section>

                <section className="contact-section" data-gsap-reveal>
                    <div><p className="eyebrow">YOUR STORY'S NEXT</p><h2>Shall we make<br /><em>something lasting?</em></h2></div>
                    <div className="contact-cta"><p>Tell us what you're dreaming up.<br />We'll take it from there.</p><Link className="button button-cream" to="/book">Tell us about your day <ArrowRight size={17} /></Link></div>
                    <span className="contact-stamp">MADE WITH<br />FEELING · IN INDIA</span>
                </section>
            </main>

            <SiteFooter studio={studio} />
            <FloatingBookCTA />
        </div>
    );
};

export default StudioHome;
