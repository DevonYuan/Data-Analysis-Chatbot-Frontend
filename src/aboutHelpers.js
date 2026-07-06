// ---------------------------------------------------------------------------
// Non-component helpers for AboutPage — kept separate so that
// @vitejs/plugin-react Fast Refresh can properly process AboutPage.jsx
// (which must export only React components).
// ---------------------------------------------------------------------------

/**
 * Parse ## headings out of raw markdown.
 * Returns an array of plain-text heading strings.
 */
export function parseH2Headings(md) {
    const lines = md.split("\n")
    const headings = []
    for (const line of lines) {
        const m = line.match(/^##\s+(.+)$/)
        if (m) headings.push(m[1].trim())
    }
    return headings
}

/**
 * Slugify a heading string the way react-markdown generates element IDs.
 * Lowercase, strip non-alphanumeric (except spaces/hyphens), collapse spaces → "-".
 */
export function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
}
