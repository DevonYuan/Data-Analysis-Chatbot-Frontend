export default function ConfirmModal({
    isOpen,
    eyebrow = "CONFIRM ACTION",
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
    isLoading = false,
    danger = false,
}) {
    if (!isOpen) return null

    return (
        <div className="modal-backdrop">
            <div className="new-chat-modal">
                <button className="modal-close-button" onClick={onCancel}>
                    ×
                </button>

                <p className="eyebrow">{eyebrow}</p>

                <h2 className="modal-title">{title}</h2>

                <p className="modal-subtitle">{message}</p>

                <div className="modal-button-row">
                    <button
                        type="button"
                        className="modal-cancel-button"
                        onClick={onCancel}
                    >
                        {cancelText}
                    </button>

                    <button
                        type="button"
                        className={danger ? "modal-danger-button" : "modal-create-button"}
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? "Deleting..." : confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}