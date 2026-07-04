import { RateLimitError } from "./errors";
import { postForm } from "./apiClient";

export async function getChats() {
    const res = await fetch(
        `${import.meta.env.VITE_API_URL.replace(/\/$/, "")}/get-chats`,
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

export async function createChat(username, title) {
    return postForm("/create-chat", { username, title })
}

export async function deleteChat(username, title) {
    return postForm("/delete-chat", { username, title })
}
