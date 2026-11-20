import { ArrowRight, Camera } from "lucide-react";
import { Link } from "react-router-dom";

const FloatingBookCTA = () => (
    <Link className="floating-book-cta" to="/book" aria-label="Book your event with Chhaya Picture">
        <span className="floating-book-cta-icon"><Camera size={17} /></span>
        <span className="floating-book-cta-copy">
            <span>YOUR NEXT CHAPTER</span>
            <strong>Book now</strong>
        </span>
        <ArrowRight className="floating-book-cta-arrow" size={17} />
    </Link>
);

export default FloatingBookCTA;
