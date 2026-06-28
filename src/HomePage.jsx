import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { Link } from "react-router"
import { useRef } from "react"

import "./styles/globals.css"
import "./styles/effects.css"
import "./styles/layout.css"
import "./styles/components.css"
import "./styles/landing.css"

function SpinningSphere() {
    const meshRef = useRef()

    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.003
        }
    })

    return (
        <mesh ref={meshRef} position={[0, 0, 0]}>
            <icosahedronGeometry args={[1.8, 3]} />
            <meshBasicMaterial
                color="#8ab4ff"
                wireframe
                transparent
                opacity={0.9}
            />
        </mesh>
    )
}

export default function HomePage() {
    return (
        <div className="landing-container">
            <div className="content-wrapper">

                {/* LEFT: 3D Scene */}
                <div className="canvas-wrapper">
                    <Canvas camera={{ position: [2.5, 0, 5], fov: 50 }}>
                        <ambientLight intensity={0.4} />
                        <directionalLight position={[5, 5, 5]} intensity={1} />
                        <SpinningSphere />
                        <OrbitControls enablePan={false} enableZoom enableRotate />
                    </Canvas>
                </div>

                {/* RIGHT: Glass UI */}
                <div className="right-section">
                    <div className="glass-card">
                        <p className="eyebrow">AI DATA ANALYSIS</p>

                        <h1 className="panel-title">Analysis In Python</h1>

                        <p className="panel-subtitle">
                            Upload a CSV, ask questions, and generate insights using the
                            Pandas library.
                        </p>

                        <div className="button-row">
                            <Link
                                to="/login"
                                className="nav-button button button-glass hover-lift"
                            >
                                Log In
                            </Link>

                            <Link
                                to="/signup"
                                className="nav-button button button-primary hover-lift"
                            >
                                Sign Up
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
