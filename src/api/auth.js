import { RateLimitError } from "./errors";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "")

async function readResponse(res) {
    const contentType = res.headers.get("content-type")

    if (contentType && contentType.includes("application/json")) {
        return await res.json()
    }

    return await res.text()
}

export async function login(username, password) {
    const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            username,
            password,
        }),
    })

    if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        throw new RateLimitError(data.detail || "Too many login attempts. Please wait before trying again.");
    }

    const data = await readResponse(res)

    if (!res.ok) {
        throw new Error(typeof data === "string" ? data : JSON.stringify(data))
    }

    // Store JWT token and username
    if (data.access_token) {
        localStorage.setItem("access_token", data.access_token)
        localStorage.setItem("username", username)
    }

    return data
}

export async function register(username, password, firstName, lastName) {
    const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            username,
            password,
            first_name: firstName,
            last_name: lastName,
        }),
    })

    if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        throw new RateLimitError(data.detail || "Too many registration attempts. Please wait before trying again.");
    }

    const data = await readResponse(res)

    if (!res.ok) {
        throw new Error(typeof data === "string" ? data : JSON.stringify(data))
    }

    // Store JWT token and username
    if (data.access_token) {
        localStorage.setItem("access_token", data.access_token)
        localStorage.setItem("username", username)
    }

    return data
}

export async function getUserProfile() {
    const token = localStorage.getItem("access_token")
    if (!token) {
        throw new Error("Not authenticated")
    }

    const res = await fetch(`${API}/get-user-profile`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    })

    if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        throw new RateLimitError(data.detail || "Too many requests. Please wait and try again.");
    }

    if (!res.ok) {
        const data = await readResponse(res)
        throw new Error(typeof data === "string" ? data : JSON.stringify(data))
    }

    return await readResponse(res)
}

export async function logout() {
    const res = await fetch(`${API}/logout`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
        },
    })

    if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        throw new RateLimitError(data.detail || "Too many requests. Please wait and try again.");
    }

    const data = await readResponse(res)

    if (!res.ok) {
        throw new Error(typeof data === "string" ? data : JSON.stringify(data))
    }

    // Clear tokens from localStorage
    localStorage.removeItem("access_token")
    localStorage.removeItem("username")

    return data
}

export async function verifyEmail(token) {
    const res = await fetch(`${API}/verify-email?token=${encodeURIComponent(token)}`, {
        method: "GET",
    })

    const data = await readResponse(res)

    if (!res.ok) {
        throw new Error(typeof data === "string" ? data : JSON.stringify(data))
    }

    return data
}

export async function resendVerification(username) {
    const res = await fetch(`${API}/resend-verification`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ username }),
    })

    if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        throw new RateLimitError(data.detail || "Too many requests. Please wait and try again.");
    }

    const data = await readResponse(res)

    if (!res.ok) {
        throw new Error(typeof data === "string" ? data : JSON.stringify(data))
    }

    return data
}
