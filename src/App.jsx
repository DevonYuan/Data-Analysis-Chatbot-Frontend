import { Routes, Route, Navigate } from "react-router-dom"
import HomePage from "./HomePage"
import LoginPage from "./LoginPage"
import SignupPage from "./SignUpPage"
import ChatDashboard from "./ChatDashboard"

import "./styles/auth.css"
import "./styles/chat.css"
import "./styles/effects.css"
import "./styles/globals.css"
import "./styles/landing.css"
import "./styles/layout.css"
import "./styles/sidebar.css"

function RequireAuth({ children }) {
    const username = localStorage.getItem("username")

    if (!username) {
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

            <Route
                path="/chat"
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