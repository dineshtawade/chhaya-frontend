import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [form, setForm] = useState({
        identifier: "",
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
            const response = await api.post("/auth/login", form);

            const { token, user } = response.data;

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));

            const returnTo = location.state?.from;
            navigate(
                returnTo ? `${returnTo.pathname}${returnTo.search || ""}` :
                (user.role === "admin" ? "/admin" : "/profile"),
                { replace: true }
            );

        } catch (error) {
            setError(
                error.response?.data?.message || "Login failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">

                <h1>Welcome Back</h1>
                <p>Login to your account</p>

                {error && <div className="error">{error}</div>}

                <form onSubmit={handleSubmit}>

                    <label htmlFor="login-identifier">Email or phone number</label>
                    <input
                        id="login-identifier"
                        type="text"
                        name="identifier"
                        autoComplete="username"
                        placeholder="Enter your email or phone"
                        value={form.identifier}
                        onChange={handleChange}
                        required
                    />

                    <label htmlFor="login-password">Password</label>
                    <input
                        id="login-password"
                        type="password"
                        name="password"
                        autoComplete="current-password"
                        placeholder="Enter password"
                        value={form.password}
                        onChange={handleChange}
                        required
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </button>

                </form>

                <p className="auth-link">
                    Don't have an account?
                    <Link to="/register" state={location.state}> Register</Link>
                </p>

            </div>
        </div>
    );
};

export default Login;