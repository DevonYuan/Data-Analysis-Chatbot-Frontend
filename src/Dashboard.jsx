import { useState, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { getChats, createChat, deleteChat, getFilenames } from "./api/chats";
import { logout, getUserProfile } from "./api/auth";
import { useNavigate } from "react-router-dom";
import NewChatModal from "./NewChatModal";
import ConfirmModal from "./ConfirmModal";
import { RateLimitError } from "./api/errors";
import RateLimitModal from "./RateLimitModal";
import "./styles/globals.css";
import "./styles/effects.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/dashboard.css";

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

export default function Dashboard() {
    const [chats, setChats] = useState([]);
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
    const [isCreatingChat, setIsCreatingChat] = useState(false);
    const [chatToDelete, setChatToDelete] = useState(null);
    const [isDeletingChat, setIsDeletingChat] = useState(false);
    const [rateLimitError, setRateLimitError] = useState(null);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const navigate = useNavigate();

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
                setFirstName(profile.first_name || "");
                setLastName(profile.last_name || "");
            } catch (error) {
                console.error("Failed to load user profile:", error);
            }
        }

        loadProfile();
    }, []);

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

    async function handleCreateChat(title) {
        try {
            setIsCreatingChat(true);
            await createChat(title);
            const updated = await getChats();
            setChats(updated);
            setIsNewChatModalOpen(false);
            navigate(`/chat/${title}`);
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
        if (!chatToDelete) return;

        try {
            setIsDeletingChat(true);
            await deleteChat(chatToDelete);
            const updated = await getChats();
            setChats(updated);
            setChatToDelete(null);
        } catch (error) {
            if (error instanceof RateLimitError) {
                setRateLimitError(error.message);
            } else {
                console.error("Failed to delete chat:", error);
            }
        } finally {
            setIsDeletingChat(false);
        }
    }

    async function handleChatClick(title) {
        try {
            const filenames = await getFilenames(title);
            const hasDataset = Array.isArray(filenames) && filenames.length > 0;
            if (hasDataset) {
                // Dataset already uploaded — go straight to the analysis
                navigate(`/chat-interface/${encodeURIComponent(title)}`);
            } else {
                // No dataset yet — show the upload page
                navigate(`/chat/${encodeURIComponent(title)}`);
            }
        } catch (error) {
            if (error instanceof RateLimitError) {
                setRateLimitError(error.message);
            } else {
                console.error("Failed to check chat dataset:", error);
                // Fall back to the upload page on error
                navigate(`/chat/${encodeURIComponent(title)}`);
            }
        }
    }

    return (
        <div className="dashboard-container">
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
                title="Delete this analysis?"
                message={`Are you sure you want to delete "${chatToDelete}"? This action cannot be undone.`}
                confirmText="Delete Analysis"
                cancelText="Cancel"
                danger
                isLoading={isDeletingChat}
                onCancel={() => setChatToDelete(null)}
                onConfirm={handleDeleteChat}
            />

            {/* HEADER */}
            <header className="dashboard-header">
                <div className="dashboard-header-left">
                    <h1 className="dashboard-title">Data Analysis</h1>
                    <p className="dashboard-subtitle">Select an analysis to begin</p>
                </div>
                <div className="dashboard-header-right">
                    <button
                        className="dashboard-logout-button"
                        onClick={async () => {
                            try {
                                await logout();
                            } catch (error) {
                                console.error("Logout failed:", error);
                            } finally {
                                navigate("/login");
                            }
                        }}
                    >
                        Log out
                    </button>
                    <div className="dashboard-user">
                        <div className="dashboard-user-name">{firstName} {lastName}</div>
                        <div className="dashboard-user-avatar">{getAvatarInitials(firstName, lastName)}</div>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="dashboard-main">
                <div className="dashboard-main-3d">
                    <Canvas camera={{ position: [0, 0, 7], fov: 60 }}>
                        <ambientLight intensity={0.4} />
                        <BackgroundSphere />
                        <OrbitControls enablePan={false} enableZoom={false} enableRotate={false} />
                    </Canvas>
                </div>

                <div className="dashboard-content">
                    <div className="dashboard-actions">
                        <button
                            className="dashboard-create-button button button-primary"
                            onClick={() => setIsNewChatModalOpen(true)}
                        >
                            + New Analysis
                        </button>
                    </div>

                    {chats.length === 0 ? (
                        <div className="dashboard-empty">
                            <h2 className="dashboard-empty-title">No analyses yet</h2>
                            <p className="dashboard-empty-subtitle">
                                Create your first analysis to get started with data exploration
                            </p>
                        </div>
                    ) : (
                        <div className="dashboard-grid">
                            {chats.map((title, i) => (
                                <div
                                    key={i}
                                    className="dashboard-card card-glass hover-lift"
                                    onClick={() => handleChatClick(title)}
                                >
                                    <div className="dashboard-card-header">
                                        <h3 className="dashboard-card-title">{title}</h3>
                                        <button
                                            className="dashboard-card-menu"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                setChatToDelete(title);
                                            }}
                                        >
                                            ⋯
                                        </button>
                                    </div>
                                    <div className="dashboard-card-body">
                                        <p className="dashboard-card-description">
                                            Click to open this analysis
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
