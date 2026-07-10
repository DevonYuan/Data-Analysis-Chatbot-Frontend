import { useState, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { uploadFile } from "./api/upload";
import { getFilenames } from "./api/chats";
import { useNavigate, useParams } from "react-router-dom";
import { RateLimitError } from "./api/errors";
import RateLimitModal from "./RateLimitModal";
import "./styles/globals.css";
import "./styles/effects.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/chat-access.css";

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

export default function ChatAccess() {
    const [isUploading, setIsUploading] = useState(false);
    const [rateLimitError, setRateLimitError] = useState(null);
    const [uploadedFileName, setUploadedFileName] = useState("");
    const navigate = useNavigate();
    const { chatTitle } = useParams();
    const fileInputRef = useRef(null);

    const decodedChatTitle = decodeURIComponent(chatTitle);

    useEffect(() => {
        let cancelled = false;

        async function checkExistingDataset() {
            try {
                const filenames = await getFilenames(decodedChatTitle);
                // If a dataset is already attached to this chat, skip the
                // upload screen and go straight to the analysis interface.
                if (!cancelled && Array.isArray(filenames) && filenames.length > 0) {
                    navigate(`/chat-interface/${chatTitle}`);
                }
            } catch (error) {
                if (error instanceof RateLimitError) {
                    setRateLimitError(error.message);
                } else {
                    console.error("Failed to check existing dataset:", error);
                }
            }
        }

        checkExistingDataset();

        return () => {
            cancelled = true;
        };
    }, [chatTitle, decodedChatTitle, navigate]);

    async function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const result = await uploadFile(decodedChatTitle, file);
            setUploadedFileName(file.name);
            
            // After successful upload, navigate to the actual chat interface
            setTimeout(() => {
                navigate(`/chat-interface/${chatTitle}`);
            }, 500);
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
        }
    }

    function handleBack() {
        navigate("/dashboard");
    }

    return (
        <div className="chat-access-container">
            <RateLimitModal
                isOpen={Boolean(rateLimitError)}
                message={rateLimitError}
                onClose={() => setRateLimitError(null)}
            />

            <div className="chat-access-main">
                <div className="chat-access-3d">
                    <Canvas camera={{ position: [0, 0, 7], fov: 60 }}>
                        <ambientLight intensity={0.4} />
                        <BackgroundSphere />
                        <OrbitControls enablePan={false} enableZoom={false} enableRotate={false} />
                    </Canvas>
                </div>

                <div className="chat-access-content">
                    <button
                        className="chat-access-back-button dashboard-logout-button"
                        onClick={handleBack}
                    >
                        ← Back to Dashboard
                    </button>

                    <div className="chat-access-card card-glass">
                        <h1 className="chat-access-title">{decodedChatTitle}</h1>
                        <p className="chat-access-subtitle">
                            Upload a dataset to begin your analysis
                        </p>

                        <div className="chat-access-upload-area">
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: "none" }}
                                accept=".csv,.tsv,.xlsx,.xls,.txt,.json,.parquet,.feather"
                                onChange={handleFileUpload}
                            />
                            
                            {!uploadedFileName ? (
                                <button
                                    className="chat-access-upload-button button button-primary"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    {isUploading ? "Uploading..." : "Upload Dataset"}
                                </button>
                            ) : (
                                <div className="chat-access-success">
                                    <div className="chat-access-success-icon">✓</div>
                                    <p className="chat-access-success-text">
                                        File uploaded successfully
                                    </p>
                                    <p className="chat-access-success-filename">
                                        {uploadedFileName}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="chat-access-info">
                            <p className="chat-access-info-title">Supported formats:</p>
                            <p className="chat-access-info-formats">
                                CSV, TSV, Excel, TXT, JSON, Parquet, Feather
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
