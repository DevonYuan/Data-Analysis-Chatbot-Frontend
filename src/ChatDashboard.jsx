import { useState, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { getChats, createChat, deleteChat } from "./api/chats";
import { sendMessage } from "./api/messages";
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

    async function handleCreateChat(title) {
        const username = localStorage.getItem("username");

        try {
            setIsCreatingChat(true);

            await createChat(username, title);

            const updated = await getChats(username);
            setChats(updated);

            setCurrentChat(title);
            setMessages([]);

            setIsNewChatModalOpen(false);
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
            alert("Please select or create a chat first.");
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
                    onClick={() => setIsNewChatModalOpen(true)}
                >
                    New Chat
                </button>

                <div className="chat-history">
                    {chats.map((title, i) => (
                        <div
                            key={i}
                            className="chat-history-item"
                            onClick={() => {
                                setCurrentChat(title)
                                setMessages([])
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

                <div className="chat-welcome-card">
                    <h1 className="chat-welcome-title">Start a new analysis</h1>
                    <p className="chat-welcome-subtitle">
                        Upload a dataset or ask a question to begin exploring your data.
                    </p>
                </div>

                <div className="chat-messages">
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={msg.sender === "user" ? "message-user" : "message-ai"}
                        >
                            {msg.text}
                        </div>
                    ))}
                </div>

                <div className="chat-input-bar">
                    <button className="chat-upload-button">+</button>

                    <input
                        className="chat-input"
                        placeholder="Send a message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />

                    <button className="chat-send-button" onClick={handleSend}>→</button>
                </div>
            </main>
        </div>
    );
}
