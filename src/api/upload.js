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

    const text = await res.text()

    if (!res.ok) {
        throw new Error(text)
    }

    return text
}
