import { RateLimitError } from "./errors";

const API = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "")

function getAuthHeaders() {
    const token = localStorage.getItem("access_token")
    if (token) {
        return {
            "Authorization": `Bearer ${token}`,
        }
    }
    return {}
}

export async function get(endpoint) {
    const res = await fetch(`${API}${endpoint}`, {
        headers: {
            ...getAuthHeaders(),
        },
    })

    if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        throw new RateLimitError(data.detail || "Too many requests. Please wait and try again.");
    }

    const data = await res.json()

    if (!res.ok) {
        throw new Error(JSON.stringify(data))
    }

    return data
}

export async function postForm(endpoint, formData) {
    const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            ...getAuthHeaders(),
        },
        body: new URLSearchParams(formData),
    })

    if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        throw new RateLimitError(data.detail || "Too many requests. Please wait and try again.");
    }

    const text = await res.text()

    if (!res.ok) {
        throw new Error(text)
    }

    return text
}

export async function postMultipart(endpoint, formData) {
    const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: {
            ...getAuthHeaders(),
        },
        body: formData,
    })

    if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        throw new RateLimitError(data.detail || "Too many requests. Please wait and try again.");
    }

    const text = await res.text()

    if (!res.ok) {
        throw new Error(text)
    }

    return text
}
