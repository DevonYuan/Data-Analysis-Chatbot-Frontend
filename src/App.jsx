import { lazy, Suspense } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import HomePage from "./HomePage"
import LoginPage from "./LoginPage"
import SignupPage from "./SignUpPage"
import ChatDashboard from "./ChatDashboard"
import Dashboard from "./Dashboard"
import ChatAccess from "./ChatAccess"
import VerifyEmailPage from "./VerifyEmailPage"

import "./styles/auth.css"
import "./styles/chat.css"
import "./styles/effects.css"
import "./styles/globals.css"
import "./styles/landing.css"
import "./styles/layout.css"
import "./styles/sidebar.css"
import "./styles/dashboard.css"
import "./styles/chat-access.css"
import "./styles/chat-interface.css"
import "./styles/graph.css"

const AboutPage = lazy(() => import("./AboutPage"))

function RequireAuth({ children }) {
    const token = localStorage.getItem("access_token")

    if (!token) {
        return <Navigate to="/login" replace />
    }

    return children
}

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route
                path="/about"
                element={
                    <Suspense fallback={null}>
                        <AboutPage />
                    </Suspense>
                }
            />

            <Route
                path="/dashboard"
                element={
                    <RequireAuth>
                        <Dashboard />
                    </RequireAuth>
                }
            />

            <Route
                path="/chat/:chatTitle"
                element={
                    <RequireAuth>
                        <ChatAccess />
                    </RequireAuth>
                }
            />

            <Route
                path="/chat-interface/:chatTitle"
                element={
                    <RequireAuth>
                        <ChatDashboard />
                    </RequireAuth>
                }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}
