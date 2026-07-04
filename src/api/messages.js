import { RateLimitError } from "./errors";
import { postForm, get } from "./apiClient";

const API = import.meta.env.VITE_API_URL.replace(/\/$/, "")

export async function sendMessage(username, title, message) {
    return postForm("/send-message", { username, title, message, sender: "user" })
}

export async function getMessages(title) {
    const res = await fetch(
        `${API}/get-messages?title=${encodeURIComponent(title)}`,
        {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
            },
        }
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
