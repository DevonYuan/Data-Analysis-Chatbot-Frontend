import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { Link } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import mermaid from "mermaid"

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
const BRANCH_X   = 8    // x-coord for branch lines (left of spine)
const BRANCH_LENGTH = 14 // length of upward branch lines

// ---------------------------------------------------------------------------
// Mermaid setup + renderer
// ---------------------------------------------------------------------------
mermaid.initialize({
    startOnLoad: false,
    theme: "neutral",
    securityLevel: "loose",
    fontFamily: "Inter, system-ui, sans-serif",
})

function Mermaid({ chart }) {
    const containerRef = useRef(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        let cancelled = false
        const id = "mermaid-" + Math.random().toString(36).slice(2, 10)

        mermaid
            .render(id, chart)
            .then(({ svg }) => {
                if (!cancelled && containerRef.current) {
                    containerRef.current.innerHTML = svg
                }
            })
            .catch((err) => {
                if (!cancelled) setError(err)
            })

        return () => {
            cancelled = true
        }
    }, [chart])

    if (error) {
        return (
            <div className="about-md-mermaid">
                <p className="about-md-mermaid-label">Architecture diagram</p>
                <pre><code>{chart}</code></pre>
            </div>
        )
    }

    return (
        <div className="about-md-mermaid">
            <p className="about-md-mermaid-label">Architecture diagram</p>
            <div className="about-mermaid-render" ref={containerRef} />
        </div>
    )
}

// ---------------------------------------------------------------------------
// Mermaid code-block renderer
// ---------------------------------------------------------------------------
function MermaidBlock({ children }) {
    return <Mermaid chart={children} />
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
// Repo Links
// ---------------------------------------------------------------------------
const RepoLinks = () => {
    return (
        <div className="repo-links">
            <a href="https://github.com/DevonYuan/Data-Analysis-Chatbot-Backend" target="_blank" rel="noopener noreferrer" className="repo-link" title="Backend Repository">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                    <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                    <line x1="6" y1="6" x2="6.01" y2="6"></line>
                    <line x1="6" y1="18" x2="6.01" y2="18"></line>
                </svg>
            </a>
            <a href="https://github.com/DevonYuan/Data-Analysis-Chatbot-Frontend" target="_blank" rel="noopener noreferrer" className="repo-link" title="Frontend Repository">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6"></polyline>
                    <polyline points="8 6 2 12 8 18"></polyline>
                    <line x1="14" y1="4" x2="10" y2="20"></line>
                </svg>
            </a>
            <a href="https://github.com/DevonYuan" target="_blank" rel="noopener noreferrer" className="repo-link" title="GitHub Profile">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                </svg>
            </a>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Sidebar SVG Timeline
// ---------------------------------------------------------------------------
function TimelineSVG({ sections, activeIdx, onDotClick, headingY }) {
    const count = sections.length
    
    let spineY1 = 0;
    let spineY2 = 0;
    
    const validSections = sections.filter(s => headingY[s.id] !== undefined)
    if (validSections.length > 0) {
        spineY1 = headingY[validSections[0].id]
        spineY2 = headingY[validSections[validSections.length - 1].id]
    }

    const commitHashes = sections.map((_, i) => {
        return (i * 7351 + 12345).toString(16).slice(0, 5)
    })

    return (
        <svg
            className="about-timeline-svg"
            aria-hidden="true"
        >
            {/* Vertical spine */}
            {validSections.length > 1 && (
                <line
                    className="timeline-spine"
                    x1={DOT_X} y1={spineY1}
                    x2={DOT_X} y2={spineY2 + 50} 
                />
            )}

            {sections.map((sec, i) => {
                const cy = headingY[sec.id]
                if (cy === undefined) return null

                const isActive = i === activeIdx
                const hasBranch = i % 2 === 0 && i < count - 1
                const branchY = cy - 36 // more pronounced

                return (
                    <g key={sec.id}>
                        {hasBranch && (
                            <>
                                <path
                                    className={`timeline-branch${isActive ? " active" : ""}`}
                                    d={`M ${DOT_X} ${cy} C ${BRANCH_X + 5} ${cy}, ${BRANCH_X} ${cy - 12}, ${BRANCH_X} ${branchY}`}
                                    fill="none"
                                />
                                <circle
                                    className={`timeline-branch-dot${isActive ? " active" : ""}`}
                                    cx={BRANCH_X}
                                    cy={branchY}
                                    r={2.5}
                                />
                                <text
                                    className={`timeline-commit-hash${isActive ? " active" : ""}`}
                                    x={BRANCH_X - 6}
                                    y={branchY + 3}
                                    textAnchor="end"
                                >
                                    {commitHashes[i]}
                                </text>
                            </>
                        )}

                        <line
                            className={`timeline-connector${isActive ? " active" : ""}`}
                            x1={DOT_X + DOT_R}
                            y1={cy}
                            x2="100%"
                            y2={cy}
                        />

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

                        <text
                            className={`timeline-label${isActive ? " active" : ""}`}
                            x={LABEL_X}
                            y={cy - 12}
                        >
                            {sec.title.includes("Overview") ? "Overview" : sec.title}
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
    const [headingY, setHeadingY] = useState({})
    const headingRefs  = useRef({})
    const observerRef  = useRef(null)
    const sidebarRef = useRef(null)
    const layoutRef = useRef(null)

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

        html.classList.add("hide-scroll")
        body.classList.add("hide-scroll")

        return () => {
            html.style.overflow = prevHtmlOverflow
            body.style.overflow = prevBodyOverflow
            html.style.height   = prevHtmlHeight
            body.style.height   = prevBodyHeight

            html.classList.remove("hide-scroll")
            body.classList.remove("hide-scroll")
        }
    }, [])

    useEffect(() => {
        function measure() {
            if (!sidebarRef.current) return
            const sidebarTop = sidebarRef.current.getBoundingClientRect().top
            const yMap = {}
            sections.forEach(sec => {
                const el = headingRefs.current[sec.id]
                if (el) {
                    yMap[sec.id] = el.getBoundingClientRect().top - sidebarTop + (el.offsetHeight / 2)
                }
            })
            setHeadingY(yMap)
        }
        
        measure()
        const timer1 = setTimeout(measure, 100)
        const timer2 = setTimeout(measure, 500)
        window.addEventListener('resize', measure)
        return () => {
            clearTimeout(timer1)
            clearTimeout(timer2)
            window.removeEventListener('resize', measure)
        }
    }, [sections])

    const H1Renderer = useCallback(({ children }) => {
        const text = Array.isArray(children)
            ? children.map(c => (typeof c === "string" ? c : "")).join("")
            : typeof children === "string"
                ? children
                : String(children ?? "")
        const id = slugify(text)
        return (
            <h1
                id={id}
                ref={el => {
                    if (el) headingRefs.current[id] = el
                }}
            >
                {children}
            </h1>
        )
    }, [])

    const H2Renderer = useCallback(({ children }) => {
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
    }, [])

    const mdComponents = useMemo(() => ({
        h1: H1Renderer,
        h2: H2Renderer,
        h3: H3Renderer,
        code: CodeRenderer,
        pre: PreRenderer,
    }), [H1Renderer, H2Renderer])

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
            <a href="/" className="about-back-btn" aria-label="Back to home">
                <span className="about-back-arrow" aria-hidden="true">&#8592;</span>
                Back
            </a>

            {/* Mobile progress bar (hidden on desktop via CSS) */}
            <MobileProgressBar sections={sections} activeIdx={activeIdx} />

            {/* Main layout */}
            <div className="about-layout" ref={layoutRef}>
                <RepoLinks />

                {/* Left sidebar */}
                <aside className="about-sidebar" ref={sidebarRef} aria-label="Page sections">
                    <TimelineSVG
                        sections={sections}
                        activeIdx={activeIdx}
                        onDotClick={scrollToSection}
                        headingY={headingY}
                    />
                </aside>

                {/* Right content */}
                <main className="about-content">
                    <article className="about-md">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
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
