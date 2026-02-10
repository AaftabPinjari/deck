/**
 * Notion-style slug utilities.
 * 
 * URL format: /Page-Title-<32-char-hex-id>
 * Example:    /Getting-Started-a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6
 */

/**
 * Convert a title and UUID into a Notion-style slug.
 * "My Page" + "a1b2c3d4-e5f6-..." → "/My-Page-a1b2c3d4e5f6..."
 */
export function toPageSlug(title: string, id: string): string {
    // Strip dashes from UUID
    const hexId = id.replace(/-/g, '');

    // Slugify the title
    const slug = (title || 'Untitled')
        .trim()
        .replace(/[^\w\s-]/g, '')   // Remove non-word chars (except spaces & dashes)
        .replace(/\s+/g, '-')       // Spaces → dashes
        .replace(/-+/g, '-')        // Collapse multiple dashes
        .replace(/^-|-$/g, '')      // Trim leading/trailing dashes
        || 'Untitled';

    return `/${slug}-${hexId}`;
}

/**
 * Extract the document UUID from a Notion-style slug.
 * Supports:
 *   - Slug format:  "My-Page-a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"
 *   - Raw UUID:     "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6"
 *   - Raw hex ID:   "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"
 */
export function extractIdFromSlug(slug: string): string | null {
    if (!slug) return null;

    // Remove leading slash if present
    const cleaned = slug.startsWith('/') ? slug.slice(1) : slug;

    // 1. Try: raw UUID with dashes (backward compat)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(cleaned)) {
        return cleaned;
    }

    // 2. Try: extract last 32 hex chars (the undashed UUID at the end of slug)
    const match = cleaned.match(/([0-9a-f]{32})$/i);
    if (match) {
        const hex = match[1];
        // Re-insert dashes to form standard UUID
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }

    return null;
}
