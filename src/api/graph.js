import { RateLimitError } from "./errors";

export async function getGraphData(chatTitle, graphType = "histogram", column = null) {
    const apiUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
    const username = localStorage.getItem("username");
    
    let url = `${apiUrl}/get-graph-data?username=${encodeURIComponent(username)}&title=${encodeURIComponent(chatTitle)}&graph_type=${graphType}`;
    
    if (column) {
        url += `&column=${encodeURIComponent(column)}`;
    }
    
    const res = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
        },
    });

    if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        throw new RateLimitError(data.detail || "Too many requests. Please wait and try again.");
    }

    const data = await res.json();

    if (!res.ok) {
        throw new Error(JSON.stringify(data));
    }

    return data;
}
