import { RateLimitError } from "./errors";
import { postForm } from "./apiClient";

export async function getChats() {
    const apiUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "")
    const res = await fetch(
        `${apiUrl}/get-chats`,
        {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
            },
        }
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

export async function createChat(title) {
    const username = localStorage.getItem("username")
    return postForm("/create-chat", { username, title })
}

export async function deleteChat(title) {
    const username = localStorage.getItem("username")
    return postForm("/delete-chat", { username, title })
}
