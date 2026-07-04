import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { login, resendVerification } from "./api/auth"
import StatusToast from "./StatusToast"
import "./styles/effects.css"
import "./styles/layout.css"
import "./styles/components.css"
import "./styles/auth.css"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [toast, setToast] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [showResend, setShowResend] = useState(false)
    const [isResending, setIsResending] = useState(false)
    const navigate = useNavigate()

    async function handleSubmit(event) {
        event.preventDefault()

        try {
            setIsLoading(true)

            const result = await login(email, password)
            const message = String(result.message || result).trim()

            console.log("Login result:", message)

            if (message === "Logged in!") {
                navigate("/chat", { replace: true })
                return
            }

            if (message === "Please verify your email before logging in.") {
                showToast("Please verify your email before logging in.", "error")
                setShowResend(true)
                return
            }

            showToast(message, "error")
        } catch (error) {
            console.error("Login failed:", error)
            showToast(error.message, "error")
        } finally {
            setIsLoading(false)
        }
    }

    function showToast(message, type = "info") {
        setToast({ message, type })

        setTimeout(() => {
            setToast(null)
        }, 2800)
    }

    async function handleResend(event) {
        event.preventDefault()
        if (!email) {
            showToast("Please enter your email address first.", "error")
            return
        }

        try {
            setIsResending(true)
            await resendVerification(email)
            showToast("Verification email sent! Please check your inbox.", "success")
            setShowResend(false)
        } catch (error) {
            showToast(error.message, "error")
        } finally {
            setIsResending(false)
        }
    }

    return (
        <div className="login-container">
            <StatusToast message={toast?.message} type={toast?.type} />
            <Link className="back-button" to="/">
                ← Back
            </Link>

            <div className="login-layout">
                <div className="login-copy">
                    <p className="eyebrow">WELCOME BACK</p>

                    <h1 className="login-heading">
                        Turn raw data into answers.
                    </h1>

                    <p className="login-description">
                        Sign in to upload datasets, continue conversations, and generate
                        Python-powered analysis from natural language.
                    </p>

                    <div className="login-feature-list">
                        <div className="login-feature">Private dataset workspace</div>
                        <div className="login-feature">AI-assisted data exploration</div>
                        <div className="login-feature">Persistent analysis history</div>
                    </div>
                </div>

                <form className="login-card" onSubmit={handleSubmit}>
                    <p className="eyebrow">DATA ANALYSIS CHATBOT</p>

                    <h2 className="login-card-title">Sign in</h2>

                    <label className="input-label">
                        Email
                        <input
                            className="login-input"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                        />
                    </label>

                    <label className="input-label">
                        Password
                        <input
                            className="login-input"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                        />
                    </label>

                    <button className="login-submit-button" type="submit" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Continue"}
                    </button>

                    <p className="signup-text">
                        Don&apos;t have an account?{" "}
                        <Link to="/signup">Create one</Link>
                    </p>

                    {showResend && (
                        <form className="signup-text" onSubmit={handleResend} style={{ marginTop: 16 }}>
                            <button
                                type="submit"
                                disabled={isResending}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "#8ab4ff",
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                    fontSize: "0.82rem",
                                    textDecoration: "underline",
                                }}
                            >
                                {isResending ? "Sending..." : "Resend verification email"}
                            </button>
                        </form>
                    )}
                </form>
            </div>
        </div>
    )
}
