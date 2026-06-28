export default function StatusToast({ message, type = "info" }) {
    if (!message) return null

    return (
        <div className={`status-toast status-toast-${type}`}>
            <div className="status-toast-dot" />
            <span>{message}</span>
        </div>
    )
}