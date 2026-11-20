import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";

const Register = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        password: ""
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await api.post(
                "/auth/register",
                form
            );

            localStorage.setItem(
                "token",
                response.data.token
            );

            localStorage.setItem(
                "user",
                JSON.stringify(response.data.user)
            );

            const returnTo = location.state?.from;
            navigate(returnTo ? `${returnTo.pathname}${returnTo.search || ""}` : "/profile", { replace: true });

        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Registration failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">

                <h1>Create Account</h1>
                <p>Register as a new user</p>

                {error && <div className="error">{error}</div>}

                <form onSubmit={handleSubmit}>

                    <label htmlFor="register-name">Full Name</label>
                    <input
                        id="register-name"
                        name="name"
                        autoComplete="name"
                        placeholder="Enter your name"
                        value={form.name}
                        onChange={handleChange}
                        required
                    />

                    <label htmlFor="register-email">Email Address</label>
                    <input
                        id="register-email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        placeholder="Enter your email"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />

                    <label htmlFor="register-phone">Phone number</label>
                    <input
                        id="register-phone"
                        type="tel"
                        name="phone"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="10-digit number"
                        value={form.phone}
                        onChange={handleChange}
                        required
                    />

                    <label htmlFor="register-password">Password</label>
                    <input
                        id="register-password"
                        type="password"
                        name="password"
                        placeholder="Minimum 8 characters"
                        autoComplete="new-password"
                        minLength="8"
                        value={form.password}
                        onChange={handleChange}
                        required
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? "Creating..." : "Register"}
                    </button>

                </form>

                <p className="auth-link">
                    Already registered?
                    <Link to="/login" state={location.state}> Login</Link>
                </p>

            </div>
        </div>
    );
};

export default Register;