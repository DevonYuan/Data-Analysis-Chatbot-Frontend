import { useState, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { getChats, createChat, deleteChat } from "./api/chats";
import { sendMessage, getMessages } from "./api/messages";
import { uploadFile } from "./api/upload";
import { logout, getUserProfile } from "./api/auth";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import NewChatModal from "./NewChatModal";
import ConfirmModal from "./ConfirmModal"
import RateLimitModal from "./RateLimitModal"
import { RateLimitError } from "./api/errors"
import "./styles/globals.css";
import "./styles/effects.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/sidebar.css";
import "./styles/chat.css";

function BackgroundSphere() {
    const meshRef = useRef();

    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.0009;
            meshRef.current.rotation.x += 0.0004;
        }
    });

    return (
        <mesh ref={meshRef} position={[0, 0, -4]}>
            <icosahedronGeometry args={[11, 3]} />
            <meshBasicMaterial
                color="#c0442b"
                wireframe
                transparent
                opacity={0.25}
            />
        </mesh>
    );
}

export default function ChatDashboard() {
    const [messages, setMessages] = useState([]);
    const [chats, setChats] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [input, setInput] = useState("");
    const navigate = useNavigate();
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
    const [isCreatingChat, setIsCreatingChat] = useState(false);
    const [chatToDelete, setChatToDelete] = useState(null);
    const [isDeletingChat, setIsDeletingChat] = useState(false);
    const [shouldSendOnCreate, setShouldSendOnCreate] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [rateLimitError, setRateLimitError] = useState(null);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [pendingFile, setPendingFile] = useState(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const username = localStorage.getItem("username") || "";

    function getAvatarInitials(first, last) {
        if (!first && !last) return "??";
        const firstInitial = first ? first.charAt(0).toUpperCase() : "";
        const lastInitial = last ? last.charAt(0).toUpperCase() : "";
        return firstInitial + lastInitial || "??";
    }

    useEffect(() => {
        async function loadProfile() {
            try {
                const profile = await getUserProfile();
                setFirstName(profile.first_name || "")
                setLastName(profile.last_name || "")
            } catch (error) {
                console.error("Failed to load user profile:", error)
            }
        }

        loadProfile();
    }, []);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    async function handleCreateChat(title) {
        try {
            setIsCreatingChat(true);

            await createChat(title);

            const updated = await getChats();
            setChats(updated);

            setCurrentChat(title);

            setIsNewChatModalOpen(false);

            if (pendingFile) {
                setMessages([]);
                await processFileUpload(title, pendingFile);
                if (shouldSendOnCreate && input.trim()) {
                    setMessages((prev) => [...prev, { sender: "user", text: input }]);
                    const reply = await sendMessage(title, input);
                    setMessages((prev) => [...prev, { sender: "ai", text: reply }]);
                    setInput("");
                }
            } else if (shouldSendOnCreate && input.trim()) {
                setMessages([{ sender: "user", text: input }]);
                const reply = await sendMessage(title, input);
                setMessages((prev) => [...prev, { sender: "ai", text: reply }]);
                setInput("");
            } else {
                setMessages([]);
            }
            setShouldSendOnCreate(false);
        } catch (error) {
            if (error instanceof RateLimitError) {
                setRateLimitError(error.message);
            } else {
                console.error("Failed to create chat:", error);
            }
        } finally {
            setIsCreatingChat(false);
        }
    }

    async function handleDeleteChat() {
        if (!chatToDelete) return

        try {
            setIsDeletingChat(true)

            await deleteChat(chatToDelete)

            const updated = await getChats()
            setChats(updated)

            if (currentChat === chatToDelete) {
                setCurrentChat(null)
                setMessages([])
            }

            setChatToDelete(null)
        } catch (error) {
            if (error instanceof RateLimitError) {
                setRateLimitError(error.message);
            } else {
                console.error("Failed to delete chat:", error);
            }
        } finally {
            setIsDeletingChat(false)
        }
    }

    async function handleSend() {
        const title = currentChat;

        if (!currentChat) {
            setShouldSendOnCreate(true);
            setIsNewChatModalOpen(true);
            return;
        }

        if (!input.trim()) return;

        // Add user message to UI
        setMessages((prev) => [...prev, { sender: "user", text: input }]);

        try {
            const reply = await sendMessage(title, input);
            // Add AI message to UI
            setMessages((prev) => [...prev, { sender: "ai", text: reply }]);
        } catch (error) {
            // Remove the optimistically-added user message on rate limit
            if (error instanceof RateLimitError) {
                setMessages((prev) => prev.slice(0, -1));
                setRateLimitError(error.message);
            } else {
                console.error("Failed to send message:", error);
            }
        }

        setInput("");
    }

    async function processFileUpload(chatTitle, file) {
        try {
            setIsUploading(true);
            const result = await uploadFile(chatTitle, file);
            setMessages((prev) => [...prev, { sender: "user", text: `Uploaded file: ${file.name}` }]);
            setMessages((prev) => [...prev, { sender: "ai", text: `File uploaded successfully to bucket storage. You can now ask questions about your data.` }]);
        } catch (error) {
            if (error instanceof RateLimitError) {
                setRateLimitError(error.message);
            } else {
                console.error("Failed to upload file:", error);
                alert(`Failed to upload file: ${error.message}`);
            }
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
            setPendingFile(null);
        }
    }

    async function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!currentChat) {
            setPendingFile(file);
            setShouldSendOnCreate(true);
            setIsNewChatModalOpen(true);
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        await processFileUpload(currentChat, file);
    }

    useEffect(() => {
        async function loadChats() {
            try {
                const list = await getChats();
                setChats(Array.isArray(list) ? list : []);
            } catch (error) {
                if (error instanceof RateLimitError) {
                    setRateLimitError(error.message);
                } else {
                    console.error("Failed to load chats:", error);
                    setChats([]);
                }
            }
        }

        loadChats();
    }, []);

    useEffect(() => {
        if (!currentChat) {
            setMessages([]);
            return;
        }

        async function loadMessages() {
            try {
                const list = await getMessages(currentChat);
                setMessages(Array.isArray(list) ? list : []);
            } catch (error) {
                if (error instanceof RateLimitError) {
                    setRateLimitError(error.message);
                } else {
                    console.error("Failed to load messages:", error);
                    setMessages([]);
                }
            }
        }

        loadMessages();
    }, [currentChat]);

    return (
        <div className="chat-container">
            <NewChatModal
                isOpen={isNewChatModalOpen}
                onClose={() => setIsNewChatModalOpen(false)}
                onCreate={handleCreateChat}
                isCreating={isCreatingChat}
                existingTitles={chats}
            />

            <RateLimitModal
                isOpen={Boolean(rateLimitError)}
                message={rateLimitError}
                onClose={() => setRateLimitError(null)}
            />

            <ConfirmModal
                isOpen={Boolean(chatToDelete)}
                eyebrow="DELETE CHAT"
                title="Delete this conversation?"
                message={`Are you sure you want to delete "${chatToDelete}"? This action cannot be undone.`}
                confirmText="Delete Chat"
                cancelText="Cancel"
                danger
                isLoading={isDeletingChat}
                onCancel={() => setChatToDelete(null)}
                onConfirm={handleDeleteChat}
            />

            {/* SIDEBAR */}
            <aside className="chat-sidebar">

                <h2 className="sidebar-title">Chats</h2>

                <button
                    className="sidebar-back-button"
                    onClick={async () => {
                        try {
                            await logout()
                        } catch (error) {
                            console.error("Logout failed:", error)
                        } finally {
                            navigate("/login")
                        }
                    }}
                >
                    Log out
                </button>

                <button
                    className="new-chat-button"
                    onClick={() => {
                        setShouldSendOnCreate(false);
                        setIsNewChatModalOpen(true);
                    }}
                >
                    New Chat
                </button>

                <div className="chat-history">
                    {chats.map((title, i) => (
                        <div
                            key={i}
                            className={`chat-history-item ${currentChat === title ? "active" : ""}`}
                            onClick={() => {
                                setCurrentChat(title)
                            }}
                        >
                            <span className="chat-history-label">{title}</span>

                            <button
                                className="chat-history-menu"
                                onClick={(event) => {
                                    event.stopPropagation()
                                    setChatToDelete(title)
                                }}
                            >
                                ⋯
                            </button>
                        </div>
                    ))}
                </div>

                <div className="sidebar-user">
                    <div className="sidebar-user-name">{firstName} {lastName}</div>
                    <div className="sidebar-user-avatar">{getAvatarInitials(firstName, lastName)}</div>
                </div>

            </aside>

            {/* MAIN PANEL */}
            <main className="chat-main">

                <div className="chat-main-3d">
                    <Canvas camera={{ position: [0, 0, 7], fov: 60 }}>
                        <ambientLight intensity={0.4} />
                        <BackgroundSphere />
                        <OrbitControls enablePan={false} enableZoom={false} enableRotate={false} />
                    </Canvas>
                </div>

                {!currentChat && (
                    <div className="chat-welcome-card">
                        <h1 className="chat-welcome-title">Start a new analysis</h1>
                        <p className="chat-welcome-subtitle">
                            Upload a CSV and ask a question, or try one of these to get started.
                        </p>

                        <div className="chat-example-prompts">
                            {[
                                { icon: "↗", text: "Summarize the key statistics of my dataset" },
                                { icon: "⬡", text: "Find and explain any outliers in the data" },
                                { icon: "≋", text: "Which columns have missing values, and how many?" },
                                { icon: "◎", text: "Calculate the distribution of values in a column" },
                            ].map(({ icon, text }) => (
                                <button
                                    key={text}
                                    className="chat-example-prompt"
                                    onClick={() => {
                                        setInput(text);
                                        setShouldSendOnCreate(true);
                                        setIsNewChatModalOpen(true);
                                    }}
                                >
                                    <span className="chat-example-prompt-icon">{icon}</span>
                                    {text}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="chat-messages">
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={msg.sender === "user" ? "message-user" : "message-ai"}
                        >
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.text || ""}
                            </ReactMarkdown>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-bar">
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        accept=".csv,.tsv,.xlsx"
                        onChange={handleFileUpload}
                    />
                    <button
                        className="chat-upload-button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? "..." : "+"}
                    </button>

                    <input
                        className="chat-input"
                        placeholder="Send a message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleSend();
                            }
                        }}
                    />

                    <button className="chat-send-button" onClick={handleSend}>→</button>
                </div>
            </main>
        </div>
    );
}
