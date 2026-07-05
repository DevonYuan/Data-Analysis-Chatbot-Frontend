import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Sphere } from "@react-three/drei"
import { Link } from "react-router"
import { useRef, useState, useEffect, useMemo } from "react"
import * as THREE from "three"

import "./styles/globals.css"
import "./styles/effects.css"
import "./styles/layout.css"
import "./styles/components.css"
import "./styles/landing.css"

const ACCENT = "#c0442b"
const WIREFRAME_COLOR = "#c0442b"
const NODE_COLOR = "#e05535"

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

// Generate evenly distributed points on sphere surface
function useSpherePoints(count, radius) {
    return useMemo(() => {
        const pts = []
        const goldenAngle = Math.PI * (3 - Math.sqrt(5))
        for (let i = 0; i < count; i++) {
            const y = 1 - (i / (count - 1)) * 2
            const r = Math.sqrt(1 - y * y)
            const theta = goldenAngle * i
            pts.push(new THREE.Vector3(
                Math.cos(theta) * r * radius,
                y * radius,
                Math.sin(theta) * r * radius
            ))
        }
        return pts
    }, [count, radius])
}

function GlobeScene({ mouseX, mouseY }) {
    const reduced = usePrefersReducedMotion()
    const groupRef = useRef()
    const nodeRefs = useRef([])
    const connectionRefs = useRef([])
    const clock = useRef(0)

    const RADIUS = 1.9
    const nodeCount = 28
    const nodePositions = useSpherePoints(nodeCount, RADIUS)

    // Build a few connection line geometries between nearby nodes
    const connectionPairs = useMemo(() => {
        const pairs = []
        for (let i = 0; i < nodePositions.length; i++) {
            for (let j = i + 1; j < nodePositions.length; j++) {
                if (nodePositions[i].distanceTo(nodePositions[j]) < 1.6) {
                    pairs.push([i, j])
                }
            }
        }
        return pairs.slice(0, 18) // limit to 18 connections
    }, [nodePositions])

    const connectionGeometries = useMemo(() =>
        connectionPairs.map(([a, b]) => {
            const geo = new THREE.BufferGeometry().setFromPoints([
                nodePositions[a],
                nodePositions[b],
            ])
            return geo
        }),
        [connectionPairs, nodePositions]
    )

    useFrame((_, delta) => {
        if (reduced || !groupRef.current) return

        clock.current += delta

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

        // Pulsing nodes
        nodeRefs.current.forEach((mesh, i) => {
            if (!mesh) return
            const phase = (clock.current * 1.1 + i * 0.45) % (Math.PI * 2)
            const pulse = 0.8 + Math.sin(phase) * 0.35
            mesh.scale.setScalar(pulse)
            mesh.material.opacity = 0.5 + Math.sin(phase) * 0.4
        })

        // Animate connection lines opacity in sequence
        connectionRefs.current.forEach((line, i) => {
            if (!line) return
            const phase = (clock.current * 0.7 + i * 0.6) % (Math.PI * 2)
            line.material.opacity = 0.15 + Math.sin(phase) * 0.12
        })
    })

    return (
        <group ref={groupRef}>
            {/* Wireframe icosahedron globe */}
            <mesh>
                <icosahedronGeometry args={[RADIUS, 3]} />
                <meshBasicMaterial
                    color={WIREFRAME_COLOR}
                    wireframe
                    transparent
                    opacity={0.22}
                />
            </mesh>

            {/* Data node points */}
            {nodePositions.map((pos, i) => (
                <mesh
                    key={i}
                    position={pos}
                    ref={(el) => { nodeRefs.current[i] = el }}
                >
                    <sphereGeometry args={[0.045, 8, 8]} />
                    <meshBasicMaterial
                        color={NODE_COLOR}
                        transparent
                        opacity={0.7}
                    />
                </mesh>
            ))}

            {/* Connection lines between nearby nodes */}
            {connectionGeometries.map((geo, i) => (
                <line key={i} ref={(el) => { connectionRefs.current[i] = el }}>
                    <primitive object={geo} attach="geometry" />
                    <lineBasicMaterial
                        color={ACCENT}
                        transparent
                        opacity={0.2}
                    />
                </line>
            ))}
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
            <div className="content-wrapper">

                {/* LEFT: 3D Scene */}
                <div className="canvas-wrapper">
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
