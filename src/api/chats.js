const API = import.meta.env.VITE_API_URL.replace(/\/$/, "")

export async function getChats(username) {
    const res = await fetch(
        `${API}/get-chats?username=${encodeURIComponent(username)}`
    )

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

    const text = await res.text()

    if (!res.ok) {
        throw new Error(text)
    }

    return text
}