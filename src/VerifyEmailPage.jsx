import { useState, useEffect } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { verifyEmail } from "./api/auth"
import StatusToast from "./StatusToast"
import "./styles/globals.css"
import "./styles/effects.css"
import "./styles/layout.css"
import "./styles/components.css"
import "./styles/auth.css"

export default function VerifyEmailPage() {
    const [searchParams] = useSearchParams()
    const token = searchParams.get("token")
    const [status, setStatus] = useState("verifying")
    const [message, setMessage] = useState("")
    const [toast, setToast] = useState(null)

    useEffect(() => {
        async function verify() {
            if (!token) {
                setStatus("error")
                setMessage("Invalid verification link.")
                return
            }

            try {
                const result = await verifyEmail(token)
                setStatus("success")
                setMessage(result.message)
            } catch (error) {
                setStatus("error")
                setMessage(error.message)
            }
        }

        verify()
    }, [token])

    function showToast(message, type = "info") {
        setToast({ message, type })
        setTimeout(() => setToast(null), 2800)
    }

    return (
        <div className="login-container">
            <StatusToast message={toast?.message} type={toast?.type} />

            <Link className="back-button" to="/">
                ← Back
            </Link>

            <div className="login-layout">
                <div className="login-copy">
                    <p className="eyebrow">EMAIL VERIFICATION</p>

                    <h1 className="login-heading">
                        {status === "verifying" && "Verifying your email..."}
                        {status === "success" && "Email verified!"}
                        {status === "error" && "Verification failed"}
                    </h1>

                    <p className="login-description">
                        {status === "verifying" && "Please wait while we verify your email address."}
                        {status === "success" && message}
                        {status === "error" && message}
                    </p>

                    {status === "success" && (
                        <div className="login-feature-list">
                            <div className="login-feature">
                                <Link to="/login" className="verify-link">Click here to log in</Link>
                            </div>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="login-feature-list">
                            <div className="login-feature">
                                <Link to="/login" className="verify-link">Back to login</Link>
                            </div>
                        </div>
                    )}
                </div>

                <div className="login-card">
                    <p className="eyebrow">DATA ANALYSIS CHATBOT</p>

                    <h2 className="login-card-title">
                        {status === "verifying" && "Verifying..."}
                        {status === "success" && "Success!"}
                        {status === "error" && "Something went wrong"}
                    </h2>

                    {status === "verifying" && (
                        <p className="login-description">Please wait while we verify your email address.</p>
                    )}

                    {status === "success" && (
                        <p className="login-description">{message}</p>
                    )}

                    {status === "error" && (
                        <p className="login-description">{message}</p>
                    )}
                </div>
            </div>
        </div>
    )
}
