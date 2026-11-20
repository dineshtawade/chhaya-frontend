import { Link, useNavigate } from "react-router-dom";
import { Camera, LogOut, User } from "lucide-react";

const getStoredUser = () => {
    try {
        return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
        return null;
    }
};

const Navbar = () => {
    const navigate = useNavigate();
    const user = getStoredUser();

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/");
    };

    return (
        <header className="site-nav">
            <Link className="site-brand" to="/">
                <span className="site-brand-mark"><Camera size={19} /></span>
                <span>Chhaya<span className="brand-light">Picture</span></span>
            </Link>
            <nav className="site-nav-links" aria-label="Main navigation">
                <Link to="/">Visit website</Link>
                {!user ? (
                    <>
                        <Link to="/login">Log in</Link>
                        <Link className="nav-cta" to="/register">Create account</Link>
                    </>
                ) : user.role === "admin" ? (
                    <Link to="/admin">Studio dashboard</Link>
                ) : (
                    <>
                        <Link to="/profile">My profile</Link>
                        <Link className="nav-cta" to="/book">Book a shoot</Link>
                    </>
                )}
            </nav>
            {user && <div className="site-nav-account">
                    <span className="account-name"><User size={16} />{user.name}</span>
                    <button className="text-button" onClick={logout}>
                        <LogOut size={16} /> Sign out
                    </button>
                </div>}
        </header>
    );
};

export default Navbar;