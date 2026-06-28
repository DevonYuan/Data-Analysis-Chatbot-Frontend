const API = import.meta.env.VITE_API_URL.replace(/\/$/, "")

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

    const data = await readResponse(res)

    if (!res.ok) {
        throw new Error(typeof data === "string" ? data : JSON.stringify(data))
    }

    return data
}

export async function register(username, password) {
    const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            username,
            password,
        }),
    })

    const data = await readResponse(res)

    if (!res.ok) {
        throw new Error(typeof data === "string" ? data : JSON.stringify(data))
    }

    return data
}