import { RateLimitError } from "./errors";

const API = import.meta.env.VITE_API_URL;

export async function sendMessage(username, title, message) {
    const res = await fetch(`${API}/send-message`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            username,
            title,
            message,
            sender: "user"
        })
    });

    if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        throw new RateLimitError(data.detail || "Too many messages. Please wait before sending another.");
    }

    return res.text();
}

export async function getMessages(username, title) {
    const res = await fetch(
        `${API}/get-messages?username=${encodeURIComponent(username)}&title=${encodeURIComponent(title)}`
    );
    if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        throw new RateLimitError(data.detail || "Too many requests. Please wait and try again.");
    }
    if (!res.ok) {
        throw new Error("Failed to fetch messages");
    }
    return res.json();
}
