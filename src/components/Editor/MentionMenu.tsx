import { useState, useEffect, useRef, useMemo, memo } from 'react';
import { useDocumentStore, Document } from '../../store/useDocumentStore';
import { FileText, Search } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MentionMenuProps {
    anchorRect: DOMRect;
    onSelect: (docId: string, title: string) => void;
    onClose: () => void;
    query: string;
}

export const MentionMenu = memo(function MentionMenu({ anchorRect, onSelect, onClose, query: initialQuery }: MentionMenuProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [query, setQuery] = useState(initialQuery);
    const documentsMap = useDocumentStore((state) => state.documents);
    const menuRef = useRef<HTMLDivElement>(null);

    // Memoize the documents array to avoid re-renders when nothing changed
    const filteredDocs = useMemo(() => {
        return Object.values(documentsMap)
            .filter((doc: Document) => doc.title.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 8);
    }, [documentsMap, query]);

    // Update internal query when prop changes, but avoid loop
    useEffect(() => {
        if (initialQuery !== query) {
            setQuery(initialQuery);
        }
    }, [initialQuery]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [filteredDocs.length]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % filteredDocs.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + filteredDocs.length) % filteredDocs.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredDocs[selectedIndex]) {
                    onSelect(filteredDocs[selectedIndex].id, filteredDocs[selectedIndex].title);
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [filteredDocs, selectedIndex, onSelect, onClose]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    if (filteredDocs.length === 0 && !query) return null;

    // Position menu below the anchor
    const style: React.CSSProperties = {
        position: 'fixed',
        top: anchorRect.bottom + window.scrollY + 8,
        left: anchorRect.left + window.scrollX,
        zIndex: 1000,
    };

    return (
        <div
            ref={menuRef}
            style={style}
            className="w-72 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-100"
        >
            <div className="p-2 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center gap-2">
                <Search className="h-4 w-4 text-neutral-400" />
                <input
                    autoFocus
                    className="bg-transparent border-none outline-none text-sm w-full text-neutral-800 dark:text-neutral-200"
                    placeholder="Search pages..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>
            <div className="max-h-64 overflow-y-auto p-1">
                {filteredDocs.length === 0 ? (
                    <div className="p-4 text-center text-sm text-neutral-500">
                        No pages found
                    </div>
                ) : (
                    filteredDocs.map((doc, index) => (
                        <button
                            key={doc.id}
                            className={cn(
                                "w-full flex items-center gap-2 p-2 rounded-md text-sm transition-colors text-left",
                                index === selectedIndex
                                    ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                            )}
                            onClick={() => onSelect(doc.id, doc.title)}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            <FileText className="h-4 w-4" />
                            <span className="truncate">{doc.title}</span>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
});
