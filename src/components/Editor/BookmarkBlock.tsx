import { useState, useCallback, memo, useRef, useEffect } from 'react';
import { Block } from '../../store/useDocumentStore';
import { ExternalLink, Loader2 } from 'lucide-react';

interface BookmarkData {
    url: string;
    title?: string;
    description?: string;
    image?: string;
}

interface BookmarkBlockProps {
    block: Block;
    onUpdate?: (id: string, props: Record<string, unknown>) => void;
    onKeyDown?: (e: React.KeyboardEvent, id: string) => void;
    readOnly?: boolean;
}

// Parse OpenGraph and Twitter meta tags from HTML
const parseMetadata = (html: string): Partial<BookmarkData> => {
    // Optimized regex with pre-compiled pattern for better performance
    const getMetaContent = (property: string) => {
        const regex = new RegExp(`
            <meta\\s+
            (?:
                (?:property|name)=["']${property}["']\\s+content=["']([^"']+)["']
                |
                content=["']([^"']+)["']\\s+(?:property|name)=["']${property}["']
            )
        `.replace(/\s+/g, '\\s+'), 'i');
        const match = html.match(regex);
        return match ? (match[1] || match[2]) : null;
    };

    const title = (getMetaContent('og:title')
        || getMetaContent('twitter:title')
        || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]) ?? undefined;

    const description = (getMetaContent('og:description')
        || getMetaContent('twitter:description')
        || getMetaContent('description')) ?? undefined;

    const image = (getMetaContent('og:image')
        || getMetaContent('twitter:image')) ?? undefined;

    return { title, description, image };
};

// Extracted fetcher to avoid recreation
const fetchMetadata = async (url: string, signal?: AbortSignal): Promise<BookmarkData> => {
    const encodedUrl = encodeURIComponent(url);

    // Strategy 1: Microlink
    try {
        const response = await fetch(`https://api.microlink.io?url=${encodedUrl}`, { signal });
        if (!response.ok) throw new Error('Microlink failed');
        const data = await response.json();
        if (data.status === 'success') {
            return {
                url,
                title: data.data.title || undefined,
                description: data.data.description || undefined,
                image: data.data.image?.url || undefined,
            };
        }
    } catch {
        // Fallthrough to next strategy
    }

    // Strategy 2: CORS Proxy
    try {
        const response = await fetch(`https://corsproxy.io/?${encodedUrl}`, { signal });
        if (!response.ok) throw new Error('Proxy failed');

        const html = await response.text();
        const meta = parseMetadata(html);

        let image = meta.image;
        if (image && !/^https?:\/\//i.test(image)) {
            try {
                image = new URL(image, url).href;
            } catch { /* ignore */ }
        }

        if (meta.title) {
            return { url, title: meta.title, description: meta.description, image };
        }
    } catch { /* ignore */ }

    return { url, title: new URL(url).hostname };
};

export const BookmarkBlock = memo(function BookmarkBlock({ block, onUpdate, onKeyDown }: BookmarkBlockProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [inputUrl, setInputUrl] = useState('');
    const abortControllerRef = useRef<AbortController | null>(null);

    const bookmark = block.props as BookmarkData | undefined;
    const hasBookmark = bookmark?.url && bookmark?.title;

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);

    const handleSubmit = useCallback(async (url: string, originalEvent?: React.KeyboardEvent) => {
        if (!url.trim()) return;

        let finalUrl = url.trim();
        if (!/^https?:\/\//i.test(finalUrl)) {
            finalUrl = 'https://' + finalUrl;
        }

        // Cancel previous request if any
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();

        setIsLoading(true);

        try {
            const metadata = await fetchMetadata(finalUrl, abortControllerRef.current.signal);
            if (onUpdate) {
                onUpdate(block.id, { props: metadata });
            }

            if (originalEvent && onKeyDown) {
                onKeyDown(originalEvent, block.id);
            }
        } catch (e) {
            if ((e as Error).name !== 'AbortError') {
                console.error('Failed to fetch bookmark:', e);
            }
        } finally {
            setIsLoading(false);
            setInputUrl('');
        }
    }, [block.id, onUpdate, onKeyDown]);

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
                <span className="text-neutral-500 text-sm">Fetching link preview...</span>
            </div>
        );
    }

    if (!hasBookmark) {
        return (
            <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSubmit(inputUrl);
                    }
                }}
                onBlur={() => inputUrl && handleSubmit(inputUrl)}
                placeholder="Paste URL and press Enter..."
                className="w-full p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-neutral-800 dark:text-neutral-200 outline-none border border-transparent focus:border-neutral-300 dark:focus:border-neutral-600 transition-colors placeholder:text-neutral-500"
                autoFocus
            />
        );
    }

    return (
        <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group"
        >
            <div className="flex-1 p-4 min-w-0">
                <div className="font-medium text-neutral-900 dark:text-neutral-100 truncate flex items-center gap-2">
                    {bookmark.title}
                    <ExternalLink className="h-3.5 w-3.5 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {bookmark.description && (
                    <div className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1">
                        {bookmark.description}
                    </div>
                )}
                <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-2 truncate">
                    {new URL(bookmark.url).hostname}
                </div>
            </div>

            {bookmark.image && (
                <div className="w-32 h-24 flex-shrink-0 bg-neutral-100 dark:bg-neutral-800">
                    <img
                        src={bookmark.image}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                </div>
            )}
        </a>
    );
});
