import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { Link } from "react-router"
import { useRef, useState, useEffect } from "react"
import * as THREE from "three"

import "./styles/globals.css"
import "./styles/effects.css"
import "./styles/layout.css"
import "./styles/components.css"
import "./styles/landing.css"

const ACCENT = "#c0442b"
const WIREFRAME_COLOR = "#c0442b"

// Reduced-motion check
function usePrefersReducedMotion() {
    const [reduced, setReduced] = useState(() =>
        typeof window !== "undefined"
            ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
            : false
    )
    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const handler = (e) => setReduced(e.matches)
        mq.addEventListener("change", handler)
        return () => mq.removeEventListener("change", handler)
    }, [])
    return reduced
}

function GlobeScene({ mouseX, mouseY }) {
    const reduced = usePrefersReducedMotion()
    const groupRef = useRef()

    const RADIUS = 1.9

    useFrame((_, delta) => {
        if (reduced || !groupRef.current) return

        // Slow continuous rotation
        groupRef.current.rotation.y += delta * 0.22

        // Subtle mouse parallax tilt
        groupRef.current.rotation.x = THREE.MathUtils.lerp(
            groupRef.current.rotation.x,
            mouseY * 0.18,
            0.04
        )
        groupRef.current.rotation.z = THREE.MathUtils.lerp(
            groupRef.current.rotation.z,
            -mouseX * 0.1,
            0.04
        )
    })

    return (
        <group ref={groupRef}>
            <mesh>
                <icosahedronGeometry args={[RADIUS, 3]} />
                <meshBasicMaterial
                    color={WIREFRAME_COLOR}
                    wireframe
                    transparent
                    opacity={0.22}
                />
            </mesh>
        </group>
    )
}

export default function HomePage() {
    const [mouse, setMouse] = useState({ x: 0, y: 0 })

    function handleMouseMove(e) {
        // Normalize to -1 … 1
        setMouse({
            x: (e.clientX / window.innerWidth - 0.5) * 2,
            y: (e.clientY / window.innerHeight - 0.5) * 2,
        })
    }

    return (
        <div className="landing-container" onMouseMove={handleMouseMove}>
            {/* Grain texture overlay */}
            <div className="landing-grain" aria-hidden="true" />

            <div className="content-wrapper">

                {/* LEFT: 3D Scene */}
                <div className="canvas-wrapper">
                    {/* Dot-pattern background with radial fade */}
                    <div className="canvas-dot-bg" aria-hidden="true" />
                    <Canvas camera={{ position: [2.5, 0, 5], fov: 48 }}>
                        <ambientLight intensity={0.6} />
                        <directionalLight position={[5, 5, 5]} intensity={0.8} />
                        <GlobeScene mouseX={mouse.x} mouseY={mouse.y} />
                        <OrbitControls enablePan={false} enableZoom={false} enableRotate={false} />
                    </Canvas>
                </div>

                {/* RIGHT: Hero card */}
                <div className="right-section">
                    <div className="glass-card">
                        <h1 className="panel-title">Analysis in Python</h1>

                        <p className="panel-subtitle">
                            Upload a CSV, ask questions in plain English, and generate
                            insights using the Pandas library — no code required.
                        </p>

                        {/* Mini sparkline accent — ties visual to data theme */}
                        <div className="hero-sparkline" aria-hidden="true">
                            <svg width="180" height="42" viewBox="0 0 180 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                                {/* Bar chart */}
                                {[8,18,12,28,16,36,22,32,14,26,38,20,30,10,34].map((h, i) => (
                                    <rect
                                        key={i}
                                        x={i * 12 + 1}
                                        y={42 - h}
                                        width={8}
                                        height={h}
                                        rx={2}
                                        fill={i === 10 ? "var(--color-accent)" : "var(--color-border-strong)"}
                                        opacity={i === 10 ? 1 : 0.7}
                                    />
                                ))}
                            </svg>
                            <span className="hero-sparkline-label">rows analyzed</span>
                        </div>

                        <div className="button-row">
                            <Link
                                to="/signup"
                                className="nav-button button button-primary hover-lift"
                            >
                                Get started
                            </Link>

                            <Link
                                to="/login"
                                className="nav-button button button-glass hover-lift"
                            >
                                Log in
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
