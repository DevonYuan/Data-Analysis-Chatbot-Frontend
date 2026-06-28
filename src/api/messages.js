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

    return res.text();
}

export async function getMessages(username, title) {
    const res = await fetch(
        `${API}/get-messages?username=${encodeURIComponent(username)}&title=${encodeURIComponent(title)}`
    );
    if (!res.ok) {
        throw new Error("Failed to fetch messages");
    }
    return res.json();
}
