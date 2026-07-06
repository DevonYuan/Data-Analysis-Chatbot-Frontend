import { useEffect, useRef, useState, useCallback } from "react"
import { Link } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { parseH2Headings, slugify } from "./aboutHelpers.js"
import aboutContent from "./ABOUT.md?raw"
import "./styles/globals.css"
import "./styles/about.css"

// ---------------------------------------------------------------------------
// SVG timeline constants
// ---------------------------------------------------------------------------
const DOT_X      = 22   // x-coord of spine / dots
const LABEL_X    = 33   // label start x
const DOT_R      = 4.5  // default dot radius
const ROW_HEIGHT = 52   // vertical gap between dots

// ---------------------------------------------------------------------------
// Mermaid code-block renderer
// ---------------------------------------------------------------------------
function MermaidBlock({ children }) {
    return (
        <div className="about-md-mermaid">
            <p className="about-md-mermaid-label">Architecture diagram</p>
            <pre><code>{children}</code></pre>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Block code wrapper — react-markdown v10 renders <pre><code> for fenced blocks.
// We intercept at the <pre> level so we can detect the language on the child.
// ---------------------------------------------------------------------------
function PreRenderer({ children }) {
    // children is a single <code> element in the normal case
    const child = Array.isArray(children) ? children[0] : children
    const lang = (child?.props?.className || "").replace("language-", "")
    if (lang === "mermaid") {
        const src = child?.props?.children ?? ""
        return <MermaidBlock>{src}</MermaidBlock>
    }
    return <pre>{children}</pre>
}

// ---------------------------------------------------------------------------
// Sidebar SVG Timeline
// ---------------------------------------------------------------------------
function TimelineSVG({ sections, activeIdx, onDotClick }) {
    const count  = sections.length
    const height = count > 0 ? (count - 1) * ROW_HEIGHT + 40 : 40
    const spineY1 = 20
    const spineY2 = spineY1 + (count - 1) * ROW_HEIGHT

    return (
        <svg
            className="about-timeline-svg"
            viewBox={`0 0 120 ${height}`}
            height={height}
            aria-hidden="true"
        >
            {/* Vertical spine */}
            {count > 1 && (
                <line
                    className="timeline-spine"
                    x1={DOT_X} y1={spineY1}
                    x2={DOT_X} y2={spineY2}
                />
            )}

            {sections.map((sec, i) => {
                const cy       = spineY1 + i * ROW_HEIGHT
                const isActive = i === activeIdx

                return (
                    <g key={sec.id}>
                        {/* Horizontal dashed connector */}
                        <line
                            className={`timeline-connector${isActive ? " active" : ""}`}
                            x1={DOT_X + DOT_R}
                            y1={cy}
                            x2={112}
                            y2={cy}
                        />

                        {/* Dot */}
                        <circle
                            className={`timeline-dot${isActive ? " active" : ""}`}
                            cx={DOT_X}
                            cy={cy}
                            r={isActive ? 6 : DOT_R}
                            onClick={() => onDotClick(sec.id)}
                            role="button"
                            tabIndex={0}
                            aria-label={`Jump to section: ${sec.title}`}
                            onKeyDown={e => {
                                if (e.key === "Enter" || e.key === " ") onDotClick(sec.id)
                            }}
                        />

                        {/* Label */}
                        <text
                            className={`timeline-label${isActive ? " active" : ""}`}
                            x={LABEL_X}
                            y={cy + 3.5}
                        >
                            {sec.title.length > 12
                                ? sec.title.slice(0, 11) + "\u2026"
                                : sec.title}
                        </text>
                    </g>
                )
            })}
        </svg>
    )
}

// ---------------------------------------------------------------------------
// Mobile horizontal progress bar
// ---------------------------------------------------------------------------
function MobileProgressBar({ sections, activeIdx }) {
    const pct = sections.length <= 1
        ? 100
        : Math.round((activeIdx / (sections.length - 1)) * 100)

    const label = sections[activeIdx]?.title ?? ""

    return (
        <div className="about-progress-bar-wrap" aria-hidden="true">
            <div className="about-progress-label">
                <span>Section</span>
                <span>{label}</span>
            </div>
            <div className="about-progress-track">
                <div
                    className="about-progress-fill"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Markdown heading components (h1, h2, h3)
// h2 attaches a ref so IntersectionObserver can watch it
// ---------------------------------------------------------------------------
function H1Renderer({ children }) {
    return <h1>{children}</h1>
}

function makeH2Renderer(headingRefs) {
    return function H2Renderer({ children }) {
        const text = Array.isArray(children)
            ? children.map(c => (typeof c === "string" ? c : "")).join("")
            : typeof children === "string"
                ? children
                : String(children ?? "")
        const id = slugify(text)
        return (
            <h2
                id={id}
                ref={el => {
                    if (el) headingRefs.current[id] = el
                }}
            >
                {children}
            </h2>
        )
    }
}

function H3Renderer({ children }) {
    return <h3>{children}</h3>
}

// Inline <code> renderer — react-markdown v10 calls this only for inline code
function CodeRenderer({ className, children }) {
    return <code className={className}>{children}</code>
}

// ---------------------------------------------------------------------------
// Main About Page
// ---------------------------------------------------------------------------
export default function AboutPage() {
    const sections = parseH2Headings(aboutContent).map(title => ({
        title,
        id: slugify(title),
    }))

    const [activeIdx, setActiveIdx] = useState(0)
    const headingRefs  = useRef({})
    const observerRef  = useRef(null)

    // globals.css sets html,body { overflow: hidden } for the 3D landing page.
    // Override it while the About page is mounted so content can scroll.
    useEffect(() => {
        const html = document.documentElement
        const body = document.body
        const prevHtmlOverflow = html.style.overflow
        const prevBodyOverflow = body.style.overflow
        const prevHtmlHeight   = html.style.height
        const prevBodyHeight   = body.style.height
        html.style.overflow = "unset"
        body.style.overflow = "unset"
        html.style.height   = "auto"
        body.style.height   = "auto"
        return () => {
            html.style.overflow = prevHtmlOverflow
            body.style.overflow = prevBodyOverflow
            html.style.height   = prevHtmlHeight
            body.style.height   = prevBodyHeight
        }
    }, [])

    // Build component map — recreated when headingRefs changes (stable ref object)
    const H2Renderer = makeH2Renderer(headingRefs)
    const mdComponents = {
        h1: H1Renderer,
        h2: H2Renderer,
        h3: H3Renderer,
        code: CodeRenderer,
        pre: PreRenderer,
    }

    // ------- IntersectionObserver -------
    const updateActive = useCallback((entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                const idx = sections.findIndex(s => s.id === entry.target.id)
                if (idx !== -1) setActiveIdx(idx)
            }
        }
    }, [sections])

    useEffect(() => {
        const raf = requestAnimationFrame(() => {
            observerRef.current?.disconnect()

            observerRef.current = new IntersectionObserver(updateActive, {
                root: null,
                rootMargin: "-15% 0px -60% 0px",
                threshold: 0,
            })

            sections.forEach(sec => {
                const el = headingRefs.current[sec.id]
                if (el) observerRef.current.observe(el)
            })
        })

        return () => {
            cancelAnimationFrame(raf)
            observerRef.current?.disconnect()
        }
    }, [sections, updateActive])

    // ------- Dot click → smooth scroll -------
    function scrollToSection(id) {
        const el = headingRefs.current[id]
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" })
        }
    }

    return (
        <div className="about-page">
            {/* Grain texture */}
            <div className="about-grain" aria-hidden="true" />

            {/* Back button */}
            <Link to="/" className="about-back-btn" aria-label="Back to home">
                <span className="about-back-arrow" aria-hidden="true">&#8592;</span>
                Back
            </Link>

            {/* Mobile progress bar (hidden on desktop via CSS) */}
            <MobileProgressBar sections={sections} activeIdx={activeIdx} />

            {/* Main layout */}
            <div className="about-layout">
                {/* Left sidebar */}
                <aside className="about-sidebar" aria-label="Page sections">
                    <TimelineSVG
                        sections={sections}
                        activeIdx={activeIdx}
                        onDotClick={scrollToSection}
                    />
                </aside>

                {/* Right content */}
                <main className="about-content">
                    <article className="about-md">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={mdComponents}
                        >
                            {aboutContent}
                        </ReactMarkdown>
                    </article>
                </main>
            </div>
        </div>
    )
}
