import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const StudioHome = lazy(() => import("./pages/StudioHome"));
const StudioSectionPage = lazy(() => import("./pages/StudioSectionPage"));
const FooterInfoPage = lazy(() => import("./pages/FooterInfoPage"));
const BookingPage = lazy(() => import("./pages/BookingPage"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));

const loadPage = (Page, props = {}) => (
    <Suspense fallback={<div className="site-loading">LOADING PAGE</div>}>
        <Page {...props} />
    </Suspense>
);

function App() {
    return (
        <BrowserRouter>
            <Routes>

                <Route path="/" element={loadPage(StudioHome)} />
                <Route path="/portfolio" element={loadPage(StudioSectionPage, { section: "portfolio" })} />
                <Route path="/gallery" element={loadPage(StudioSectionPage, { section: "gallery" })} />
                <Route path="/reels" element={loadPage(StudioSectionPage, { section: "reels" })} />
                <Route path="/about" element={loadPage(StudioSectionPage, { section: "about" })} />
                <Route path="/packages" element={loadPage(StudioSectionPage, { section: "packages" })} />
                <Route path="/journal" element={loadPage(StudioSectionPage, { section: "journal" })} />
                <Route path="/testimonials" element={loadPage(StudioSectionPage, { section: "testimonials" })} />
                <Route path="/faq" element={loadPage(StudioSectionPage, { section: "faq" })} />
                <Route path="/contact" element={loadPage(FooterInfoPage, { page: "contact" })} />
                <Route path="/terms" element={loadPage(FooterInfoPage, { page: "terms" })} />
                <Route path="/privacy" element={loadPage(FooterInfoPage, { page: "privacy" })} />

                <Route path="/login" element={loadPage(Login)} />

                <Route path="/register" element={loadPage(Register)} />

                <Route element={<ProtectedRoute allowedRole="admin" />}>
                    <Route path="/admin" element={loadPage(AdminDashboard)} />
                </Route>

                <Route element={<ProtectedRoute allowedRole="user" />}>
                    <Route path="/user" element={loadPage(UserDashboard)} />
                    <Route path="/profile" element={loadPage(UserDashboard)} />
                </Route>

                <Route path="/book" element={loadPage(BookingPage)} />

                <Route
                    path="*"
                    element={<Navigate to="/" replace />}
                />

            </Routes>
        </BrowserRouter>
    );
}

export default App;