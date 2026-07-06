import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { register } from "./api/auth";
import StatusToast from "./StatusToast"
import "./styles/globals.css"
import "./styles/effects.css"
import "./styles/layout.css"
import "./styles/components.css"
import "./styles/auth.css"

export default function SignupPage() {
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const navigate = useNavigate()
    const [toast, setToast] = useState(null)
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(event) {
        event.preventDefault()

        if (!firstName.trim() || !lastName.trim()) {
            showToast("Please enter both your first and last name.", "error")
            return
        }

        if (password !== confirmPassword) {
            showToast("Passwords do not match.", "error")
            return
        }

        try {
            setIsLoading(true)

            const result = await register(email, password, firstName, lastName)
            const message = String(result.message || result).trim()

            console.log("Signup result:", message)

            if (message === "Username is taken!") {
                showToast("This email is already registered.", "error")
                return
            }

            if (message === "User created!" || message === "Registered successfully!" || message === "Username is now registered!" || message.includes("verify your email")) {
                showToast("Account created! Please check your email to verify.", "success")

                return
            }

            showToast(message, "info")
        } catch (error) {
            console.error("Signup failed:", error)
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

    return (
        <div className="login-container">
            <StatusToast message={toast?.message} type={toast?.type} />

            <Link className="back-button" to="/">
                ← Back
            </Link>

            <div className="login-layout">
                <div className="login-copy">
                    <h1 className="login-heading">
                        Build your personal data workspace.
                    </h1>

                    <p className="login-description">
                        Create an account to upload datasets, ask questions, save analysis
                        history, and generate Python-powered insights with Pandas.
                    </p>

                    <div className="login-feature-list">
                        <div className="login-feature">Upload CSV datasets</div>
                        <div className="login-feature">Ask natural language questions</div>
                        <div className="login-feature">Generate Pandas-based analysis</div>
                    </div>
                </div>

                <form className="login-card signup-card" onSubmit={handleSubmit}>
                    <h2 className="login-card-title">Create account</h2>

                    <label className="input-label">
                        First name
                        <input
                            className="login-input"
                            type="text"
                            placeholder="John"
                            value={firstName}
                            onChange={(event) => setFirstName(event.target.value)}
                            required
                        />
                    </label>

                    <label className="input-label">
                        Last name
                        <input
                            className="login-input"
                            type="text"
                            placeholder="Doe"
                            value={lastName}
                            onChange={(event) => setLastName(event.target.value)}
                            required
                        />
                    </label>

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
                            placeholder="Create a password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                        />
                    </label>

                    <label className="input-label">
                        Confirm password
                        <input
                            className="login-input"
                            type="password"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            required
                        />
                    </label>

                    <button className="login-submit-button" type="submit" disabled={isLoading}>
                        {isLoading ? "Creating account..." : "Sign Up"}
                    </button>

                    <p className="signup-text">
                        Already have an account? <Link to="/login">Log in</Link>
                    </p>
                </form>
            </div>
        </div>
    )
}
