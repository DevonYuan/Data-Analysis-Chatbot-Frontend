import { RateLimitError } from "./errors";

const API = import.meta.env.VITE_API_URL.replace(/\/$/, "")

export async function getChats(username) {
    const res = await fetch(
        `${API}/get-chats?username=${encodeURIComponent(username)}`
    )

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

export async function createChat(username, title) {
    const res = await fetch(`${API}/create-chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            username,
            title,
        }),
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

export async function deleteChat(username, title) {
    const res = await fetch(`${API}/delete-chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            username,
            title,
        }),
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