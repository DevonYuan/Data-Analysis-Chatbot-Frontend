import { useState, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { getChats, createChat, deleteChat } from "./api/chats";
import { sendMessage, getMessages } from "./api/messages";
import { uploadFile } from "./api/upload";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import NewChatModal from "./NewChatModal";
import ConfirmModal from "./ConfirmModal"
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
                color="#8ab4ff"
                wireframe
                transparent
                opacity={0.40}
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
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const username = localStorage.getItem("username") || "";

    function getAvatarInitials(email) {
        if (!email) return "??";
        const firstChar = email.charAt(0).toUpperCase();
        const atIndex = email.indexOf("@");
        const afterAtChar = atIndex !== -1 ? email.charAt(atIndex + 1).toUpperCase() : "";
        return firstChar + afterAtChar;
    }

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    async function handleCreateChat(title) {
        const username = localStorage.getItem("username");

        try {
            setIsCreatingChat(true);

            await createChat(username, title);

            const updated = await getChats(username);
            setChats(updated);

            setCurrentChat(title);

            setIsNewChatModalOpen(false);

            if (shouldSendOnCreate && input.trim()) {
                setMessages([{ sender: "user", text: input }]);
                const reply = await sendMessage(username, title, input);
                setMessages((prev) => [...prev, { sender: "ai", text: reply }]);
                setInput("");
            } else {
                setMessages([]);
            }
            setShouldSendOnCreate(false);
        } catch (error) {
            console.error("Failed to create chat:", error);
        } finally {
            setIsCreatingChat(false);
        }
    }

    async function handleDeleteChat() {
        if (!chatToDelete) return

        const username = localStorage.getItem("username")

        try {
            setIsDeletingChat(true)

            await deleteChat(username, chatToDelete)

            const updated = await getChats(username)
            setChats(updated)

            if (currentChat === chatToDelete) {
                setCurrentChat(null)
                setMessages([])
            }

            setChatToDelete(null)
        } catch (error) {
            console.error("Failed to delete chat:", error)
        } finally {
            setIsDeletingChat(false)
        }
    }

    async function handleSend() {
        const username = localStorage.getItem("username");
        const title = currentChat;

        if (!currentChat) {
            setShouldSendOnCreate(true);
            setIsNewChatModalOpen(true);
            return;
        }

        if (!input.trim()) return;

        // Add user message to UI
        setMessages((prev) => [...prev, { sender: "user", text: input }]);

        const reply = await sendMessage(username, title, input);

        // Add AI message to UI
        setMessages((prev) => [...prev, { sender: "ai", text: reply }]);

        setInput("");
    }

    async function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const username = localStorage.getItem("username");

        if (!currentChat) {
            alert("Please create or select a chat first before uploading a file.");
            fileInputRef.current.value = "";
            return;
        }

        try {
            setIsUploading(true);
            const result = await uploadFile(username, currentChat, file);
            setMessages((prev) => [...prev, { sender: "user", text: `Uploaded file: ${file.filename}` }]);
            setMessages((prev) => [...prev, { sender: "ai", text: `File uploaded successfully to bucket storage. You can now ask questions about your data.` }]);
        } catch (error) {
            console.error("Failed to upload file:", error);
            alert(`Failed to upload file: ${error.message}`);
        } finally {
            setIsUploading(false);
            fileInputRef.current.value = "";
        }
    }

    useEffect(() => {
        const username = localStorage.getItem("username");

        async function loadChats() {
            try {
                const list = await getChats(username);
                setChats(Array.isArray(list) ? list : []);
            } catch (error) {
                console.error("Failed to load chats:", error);
                setChats([]);
            }
        }

        loadChats();
    }, []);

    useEffect(() => {
        if (!currentChat) {
            setMessages([]);
            return;
        }

        const username = localStorage.getItem("username");

        async function loadMessages() {
            try {
                const list = await getMessages(username, currentChat);
                setMessages(Array.isArray(list) ? list : []);
            } catch (error) {
                console.error("Failed to load messages:", error);
                setMessages([]);
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
                    onClick={() => {
                        localStorage.removeItem("username");
                        navigate("/login");
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
                    <div className="sidebar-user-name">{username}</div>
                    <div className="sidebar-user-avatar">{getAvatarInitials(username)}</div>
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
                            Upload a dataset or ask a question to begin exploring your data.
                        </p>
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
