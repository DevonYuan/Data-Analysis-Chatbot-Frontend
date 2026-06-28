import { useState, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { getChats, createChat, deleteChat } from "./api/chats";
import { sendMessage, getMessages } from "./api/messages";
import { useNavigate } from "react-router-dom";
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

function renderMarkdown(text) {
    if (!text) return null;

    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
            const lines = part.slice(3, -3).trim().split("\n");
            let language = "";
            let codeLines = lines;
            if (lines[0] && !lines[0].includes(" ") && lines[0].length < 15) {
                language = lines[0];
                codeLines = lines.slice(1);
            }
            const code = codeLines.join("\n");
            return (
                <pre key={index} style={{
                    background: "rgba(0, 0, 0, 0.35)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    padding: "12px",
                    overflowX: "auto",
                    fontFamily: "monospace",
                    fontSize: "0.88rem",
                    margin: "12px 0",
                    color: "#a6daff"
                }}>
                    <code>{code}</code>
                </pre>
            );
        }

        const paragraphs = part.split(/\n/);
        return paragraphs.map((paragraph, pIndex) => {
            const trimmed = paragraph.trim();
            if (!trimmed) return null;

            const boldParts = paragraph.split(/\*\*([^*]+)\*\*/g);
            const parsedContent = boldParts.map((bPart, i) => {
                if (i % 2 === 1) {
                    return <strong key={i}>{bPart}</strong>;
                }
                return bPart;
            });

            const listMatch = paragraph.match(/^(\d+\.\s+|\*\s+|-\s+)(.*)$/);
            if (listMatch) {
                const listContent = listMatch[2].split(/\*\*([^*]+)\*\*/g).map((bPart, i) => {
                    if (i % 2 === 1) {
                        return <strong key={i}>{bPart}</strong>;
                    }
                    return bPart;
                });
                return (
                    <div key={`${index}-${pIndex}`} className="markdown-list-item" style={{ marginLeft: "16px", marginBottom: "6px" }}>
                        {listMatch[1].trim().startsWith('*') || listMatch[1].trim().startsWith('-') ? "• " : listMatch[1]}
                        {listContent}
                    </div>
                );
            }

            return (
                <p key={`${index}-${pIndex}`} style={{ margin: "0 0 10px 0" }}>
                    {parsedContent}
                </p>
            );
        });
    });
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
    const messagesEndRef = useRef(null);

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
                setCurrentChat(updated.length > 0 ? updated[0] : null)
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

    useEffect(() => {
        const username = localStorage.getItem("username");

        async function loadChats() {
            try {
                const list = await getChats(username);
                setChats(Array.isArray(list) ? list : []);

                if (Array.isArray(list) && list.length > 0) {
                    setCurrentChat(list[0]);
                }
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
                    <div className="sidebar-user-name">Devon</div>
                    <div className="sidebar-user-avatar">DY</div>
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
                            {renderMarkdown(msg.text)}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-bar">
                    <button className="chat-upload-button">+</button>

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
