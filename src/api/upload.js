import { RateLimitError } from "./errors";
import { postMultipart } from "./apiClient";

export async function uploadFile(chatTitle, file) {
    const username = localStorage.getItem("username")
    const formData = new FormData()
    formData.append("file", file)
    formData.append("username", username)
    formData.append("chat", chatTitle)

    return postMultipart("/upload", formData)
}
