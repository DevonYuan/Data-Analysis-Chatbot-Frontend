export default function RateLimitModal({ isOpen, message, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="modal-backdrop">
            <div className="new-chat-modal rate-limit-modal">
                <button className="modal-close-button" onClick={onClose}>
                    ×
                </button>

                <div className="rate-limit-icon" aria-hidden="true">⏱</div>

                <p className="eyebrow rate-limit-eyebrow">Rate limit reached</p>

                <h2 className="modal-title">Slow down a little!</h2>

                <p className="modal-subtitle rate-limit-detail">
                    {message || "You've made too many requests in a short period. Please wait a moment before trying again."}
                </p>

                <div className="modal-button-row">
                    <button
                        type="button"
                        className="modal-create-button rate-limit-ok-button"
                        onClick={onClose}
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
}
