import { useState, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { sendMessage, getMessages, getGraphData } from "./api/messages";
import { getDatasetMetadata } from "./api/chats";
import GraphDisplay from "./GraphDisplay";
import { getUserProfile } from "./api/auth";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import RateLimitModal from "./RateLimitModal"
import { RateLimitError } from "./api/errors"
import "./styles/globals.css";
import "./styles/effects.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/chat.css";
import "./styles/chat-interface.css";

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
    const [input, setInput] = useState("");
    const [showGraph, setShowGraph] = useState(false);
    const [graphData, setGraphData] = useState(null);
    const [datasetMetadata, setDatasetMetadata] = useState(null);
    const navigate = useNavigate();
    const [rateLimitError, setRateLimitError] = useState(null);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [isSending, setIsSending] = useState(false);
    const requestedChatRef = useRef(null);
    const messagesEndRef = useRef(null);
    const { chatTitle } = useParams();
    const decodedChatTitle = decodeURIComponent(chatTitle);

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

    async function handleSend() {
        if (!input.trim()) return;

        if (isSending) return;

        const userMessage = input;
        // Add user message to UI
        setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
        setInput("");
        setIsSending(true);

        try {
            const reply = await sendMessage(decodedChatTitle, userMessage);
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
        } finally {
            setIsSending(false);
        }
    }

    useEffect(() => {
        if (!decodedChatTitle) {
            setMessages([]);
            return;
        }

        const requestedChat = decodedChatTitle;
        requestedChatRef.current = requestedChat;

        async function loadMessages() {
            try {
                const list = await getMessages(requestedChat);
                // Check if the request is still for the current chat
                if (requestedChatRef.current === requestedChat) {
                    setMessages(Array.isArray(list) ? list : []);
                }
            } catch (error) {
                if (error instanceof RateLimitError) {
                    setRateLimitError(error.message);
                } else {
                    console.error("Failed to load messages:", error);
                }
                // Only set messages to empty if the request is still for the current chat
                if (requestedChatRef.current === requestedChat) {
                    setMessages([]);
                }
            }
        }

        async function loadInitialGraph() {
            try {
                const data = await getGraphData(requestedChat);
                if (requestedChatRef.current === requestedChat) {
                    setGraphData(data);
                    setShowGraph(true);
                }
            } catch (error) {
                console.error("Failed to load graph data:", error);
                if (requestedChatRef.current === requestedChat) {
                    setShowGraph(false);
                }
            }
        }

        async function loadDatasetMetadata() {
            try {
                const meta = await getDatasetMetadata(requestedChat);
                if (requestedChatRef.current === requestedChat && !meta.error) {
                    setDatasetMetadata(meta);
                }
            } catch (error) {
                console.error("Failed to load dataset metadata:", error);
            }
        }

        loadMessages();
        loadInitialGraph();
        loadDatasetMetadata();

        // We return an empty cleanup function because we cannot abort the fetch request.
        // But we can note that if the component unmounts, the request might still complete and then be ignored by the check above.
        return () => {
            // No cleanup needed for now.
        };
    }, [decodedChatTitle]);

    return (
        <div className="chat-interface-container">
            <RateLimitModal
                isOpen={Boolean(rateLimitError)}
                message={rateLimitError}
                onClose={() => setRateLimitError(null)}
            />

            {/* HEADER */}
            <header className="chat-interface-header">
                <button
                    className="chat-interface-back-button dashboard-logout-button"
                    onClick={() => navigate("/dashboard")}
                >
                    ← Back to Dashboard
                </button>
                <h1 className="chat-interface-title">{decodedChatTitle}</h1>
                <div className="chat-interface-user">
                    <div className="dashboard-user-name">{firstName} {lastName}</div>
                    <div className="dashboard-user-avatar">{getAvatarInitials(firstName, lastName)}</div>
                </div>
            </header>

            {/* BODY (SIDEBAR + MAIN) */}
            <div className="chat-interface-body">
                {/* SIDEBAR */}
                <aside className="chat-interface-sidebar">
                    <div className="sidebar-section">
                        <h2 className="sidebar-title">Dataset Details</h2>
                        <div className="sidebar-meta">
                            <span className="meta-label">Name</span>
                            <span className="meta-value">{datasetMetadata?.name || "Loading..."}</span>
                        </div>
                        <div className="sidebar-meta">
                            <span className="meta-label">Type</span>
                            <span className="meta-value">{datasetMetadata?.type || "-"}</span>
                        </div>
                        <div className="sidebar-meta">
                            <span className="meta-label">Size</span>
                            <span className="meta-value">{datasetMetadata?.size || "-"}</span>
                        </div>
                    </div>
                    
                    <div className="sidebar-section sidebar-columns-section">
                        <h3 className="sidebar-subtitle">Columns</h3>
                        {datasetMetadata?.columns ? (
                            <ul className="sidebar-columns-list">
                                {Object.entries(datasetMetadata.columns).map(([colName, rows]) => (
                                    <li key={colName} className="sidebar-column-item">
                                        <span className="sidebar-column-name">{colName}</span>
                                        <span className="sidebar-column-rows">{rows} rows</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="sidebar-loading">Loading columns...</div>
                        )}
                    </div>
                </aside>

                {/* MAIN PANEL */}
                <main className="chat-interface-main">

                <div className="chat-interface-3d">
                    <Canvas camera={{ position: [0, 0, 7], fov: 60 }}>
                        <ambientLight intensity={0.4} />
                        <BackgroundSphere />
                        <OrbitControls enablePan={false} enableZoom={false} enableRotate={false} />
                    </Canvas>
                </div>

                <div className="chat-messages">
                    {showGraph && graphData && (
                        <div className="message-ai">
                            <GraphDisplay graphData={graphData} />
                        </div>
                    )}
                    
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
                        className="chat-input"
                        placeholder="Ask a question about your data..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleSend();
                            }
                        }}
                    />

                    <button className="chat-send-button" onClick={handleSend} disabled={isSending}>→</button>
                </div>
            </main>
            </div>
        </div>
    );
}
