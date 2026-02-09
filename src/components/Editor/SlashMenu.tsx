import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import {
    Heading1,
    Heading2,
    Heading3,
    Type,
    List,
    ListOrdered,
    CheckSquare,
    Quote,
    Minus,
    Image,
    Code,
    Video,
    SquareAsterisk,
    ChevronRight,
    Table,
    ExternalLink,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { BlockType } from '../../store/useDocumentStore';

interface SlashMenuProps {
    anchorRect: DOMRect;
    onSelect: (type: BlockType, extraProps?: Record<string, any>) => void;
    onClose: () => void;
    query: string;
}

const ITEMS = [
    { type: 'text', label: 'Text', icon: Type, description: 'Just start writing with plain text.' },
    { type: 'h1', label: 'Heading 1', icon: Heading1, description: 'Big section heading.' },
    { type: 'h2', label: 'Heading 2', icon: Heading2, description: 'Medium section heading.' },
    { type: 'h3', label: 'Heading 3', icon: Heading3, description: 'Small section heading.' },
    { type: 'bullet', label: 'Bullet List', icon: List, description: 'Create a simple bulleted list.' },
    { type: 'number', label: 'Numbered List', icon: ListOrdered, description: 'Create a list with numbering.' },
    { type: 'todo', label: 'To-do List', icon: CheckSquare, description: 'Track tasks with a to-do list.' },
    { type: 'quote', label: 'Quote', icon: Quote, description: 'Capture a quote.' },
    { type: 'divider', label: 'Divider', icon: Minus, description: 'Visually divide blocks.' },
    { type: 'code', label: 'Code', icon: Code, description: 'Capture a code snippet.' },
    { type: 'image', label: 'Image', icon: Image, description: 'Upload or embed with a link.' },
    { type: 'video', label: 'Video', icon: Video, description: 'Embed a YouTube video.' },
    { type: 'callout', label: 'Callout', icon: SquareAsterisk, description: 'Make writing stand out.' },
    { type: 'toggle', label: 'Toggle List', icon: ChevronRight, description: 'Toggles can hide and show content inside.' },
    { type: 'table', label: 'Table', icon: Table, description: 'Add a simple table.' },
    { type: 'column_container', label: '2 Columns', icon: Table, description: 'Split content into 2 columns.', columns: 2 },
    { type: 'column_container', label: '3 Columns', icon: Table, description: 'Split content into 3 columns.', columns: 3 },
    { type: 'bookmark', label: 'Bookmark', icon: ExternalLink, description: 'Save a link with a preview.' },
] as const;

export function SlashMenu({ anchorRect, onSelect, onClose, query }: SlashMenuProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    const filteredItems = ITEMS.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.type.toLowerCase().includes(query.toLowerCase())
    );

    useLayoutEffect(() => {
        if (menuRef.current) {
            const menuHeight = menuRef.current.offsetHeight;
            const spaceBelow = window.innerHeight - anchorRect.bottom;

            // Default to below
            let top = anchorRect.bottom + 5;
            let left = anchorRect.left;

            // If not enough space below, flip to existing above
            if (spaceBelow < menuHeight && anchorRect.top > menuHeight) {
                top = anchorRect.top - menuHeight - 5;
            }

            // Ensure not off-screen horizontally
            if (left + 288 > window.innerWidth) { // 288px is w-72
                left = window.innerWidth - 300;
            }

            setPosition({ top, left });
        }
    }, [anchorRect, filteredItems.length]); // Re-calc if items change (height changes)

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                // Ensure we have a valid selection
                if (filteredItems.length > 0) {
                    const item = filteredItems[selectedIndex];
                    onSelect(item.type, 'columns' in item ? { columns: item.columns } : undefined);
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [filteredItems, selectedIndex, onSelect, onClose]);

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

    return (
        <div
            ref={menuRef}
            className="fixed z-50 w-72 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden max-h-[300px] overflow-y-auto"
            style={{ top: position.top, left: position.left }}
        >
            <div className="p-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Basic blocks
            </div>
            <div className="flex flex-col">
                {filteredItems.length === 0 ? (
                    <div className="p-2 text-sm text-neutral-500 text-center">No matching blocks</div>
                ) : (
                    filteredItems.map((item, index) => (
                        <div
                            key={item.type}
                            className={cn(
                                "flex items-center gap-2 p-2 cursor-pointer transition-colors",
                                index === selectedIndex ? "bg-neutral-100 dark:bg-neutral-700" : "hover:bg-neutral-50 dark:hover:bg-neutral-700"
                            )}
                            onClick={() => {
                                const extraProps = 'columns' in item ? { columns: item.columns } : undefined;
                                onSelect(item.type as BlockType, extraProps);
                            }}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            <div className="p-1 border border-neutral-200 dark:border-neutral-600 rounded bg-white dark:bg-neutral-900 shadow-sm">
                                <item.icon className="w-8 h-8 md:w-5 md:h-5 text-neutral-600 dark:text-neutral-300" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                                    {item.label}
                                </div>
                                <div className="text-xs text-neutral-500 line-clamp-1">
                                    {item.description}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
