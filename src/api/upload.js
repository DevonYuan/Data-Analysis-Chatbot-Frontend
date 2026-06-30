import { RateLimitError } from "./errors";

const API = import.meta.env.VITE_API_URL.replace(/\/$/, "")

export async function uploadFile(username, chatTitle, file) {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("user", username)
    formData.append("chat", chatTitle)

    const res = await fetch(`${API}/upload`, {
        method: "POST",
        body: formData,
    })

    if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        throw new RateLimitError(data.detail || "Too many uploads. Please wait and try again.");
    }

    const text = await res.text()

    if (!res.ok) {
        throw new Error(text)
    }

    return text
}

