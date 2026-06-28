import { useState } from "react"

export default function NewChatModal({
    isOpen,
    onClose,
    onCreate,
    isCreating,
    existingTitles = [],
}) {
    const [title, setTitle] = useState("")
    const [error, setError] = useState("")

    if (!isOpen) return null

    async function handleSubmit(event) {
        event.preventDefault()

        const trimmedTitle = title.trim()

        if (!trimmedTitle) {
            setError("Please enter a chat title.")
            return
        }

        const titleAlreadyExists = existingTitles.some(
            (existingTitle) =>
                existingTitle.trim().toLowerCase() === trimmedTitle.toLowerCase()
        )

        if (titleAlreadyExists) {
            setError("You already have a chat with this title.")
            return
        }

        setError("")
        await onCreate(trimmedTitle)
        setTitle("")
    }

    function handleClose() {
        setTitle("")
        setError("")
        onClose()
    }

    return (
        <div className="modal-backdrop">
            <div className="new-chat-modal">
                <button className="modal-close-button" onClick={handleClose}>
                    ×
                </button>

                <p className="eyebrow">NEW ANALYSIS</p>

                <h2 className="modal-title">Create a new chat</h2>

                <p className="modal-subtitle">
                    Give this analysis session a title so you can return to it later.
                </p>

                <form onSubmit={handleSubmit}>
                    <label className="input-label">
                        Chat title
                        <input
                            className="login-input"
                            type="text"
                            placeholder="e.g. Sales data analysis"
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            autoFocus
                        />
                    </label>

                    {error && <p className="modal-error">{error}</p>}

                    <div className="modal-button-row">
                        <button
                            type="button"
                            className="modal-cancel-button"
                            onClick={handleClose}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="modal-create-button"
                            disabled={isCreating}
                        >
                            {isCreating ? "Creating..." : "Create Chat"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}