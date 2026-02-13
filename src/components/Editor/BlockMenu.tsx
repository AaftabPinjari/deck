import { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Trash,
    Copy,
    Type,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    CheckSquare,
    Quote,
    Code,
    Palette,
    Link,
    FileText,
    ChevronRight,
    ChevronLeft
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { type BlockType } from '../../store/useDocumentStore';

interface BlockMenuProps {
    isOpen: boolean;
    onClose: () => void;
    anchorElement: HTMLElement | null;
    onTurnInto: (type: BlockType) => void;
    onDelete: () => void;
    onDuplicate: () => void;
    onColor: (textColor: string | null, bgColor: string | null) => void;
    blockId: string;
    documentId: string;
}

const TURN_INTO_OPTIONS = [
    { type: 'text', label: 'Text', icon: Type },
    { type: 'h1', label: 'Heading 1', icon: Heading1 },
    { type: 'h2', label: 'Heading 2', icon: Heading2 },
    { type: 'h3', label: 'Heading 3', icon: Heading3 },
    { type: 'bullet', label: 'Bullet List', icon: List },
    { type: 'number', label: 'Numbered List', icon: ListOrdered },
    { type: 'todo', label: 'To-do List', icon: CheckSquare },
    { type: 'quote', label: 'Quote', icon: Quote },
    { type: 'code', label: 'Code', icon: Code },
    { type: 'page', label: 'Page', icon: FileText },
] as const;

const TEXT_COLORS = [
    { color: '', label: 'Default', className: 'bg-neutral-200 dark:bg-neutral-700' },
    { color: '#DC2626', label: 'Red', className: 'bg-red-500' },
    { color: '#EA580C', label: 'Orange', className: 'bg-orange-500' },
    { color: '#CA8A04', label: 'Yellow', className: 'bg-yellow-500' },
    { color: '#16A34A', label: 'Green', className: 'bg-green-500' },
    { color: '#2563EB', label: 'Blue', className: 'bg-blue-500' },
    { color: '#7C3AED', label: 'Purple', className: 'bg-purple-500' },
    { color: '#DB2777', label: 'Pink', className: 'bg-pink-500' },
    { color: '#6B7280', label: 'Gray', className: 'bg-gray-500' },
];

const BG_COLORS = [
    { color: '', label: 'Default', className: 'bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600' },
    { color: '#FEE2E2', label: 'Red', className: 'bg-red-100' },
    { color: '#FFEDD5', label: 'Orange', className: 'bg-orange-100' },
    { color: '#FEF9C3', label: 'Yellow', className: 'bg-yellow-100' },
    { color: '#DCFCE7', label: 'Green', className: 'bg-green-100' },
    { color: '#DBEAFE', label: 'Blue', className: 'bg-blue-100' },
    { color: '#EDE9FE', label: 'Purple', className: 'bg-purple-100' },
    { color: '#FCE7F3', label: 'Pink', className: 'bg-pink-100' },
    { color: '#F3F4F6', label: 'Gray', className: 'bg-gray-100' },
];

export function BlockMenu({ isOpen, onClose, anchorElement, onTurnInto, onDelete, onDuplicate, onColor, blockId, documentId }: BlockMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [hoveredItem, setHoveredItem] = useState<'none' | 'turnInto' | 'color'>('none');
    const [activeView, setActiveView] = useState<'main' | 'turnInto' | 'color'>('main');
    const [copied, setCopied] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile to disable hover-menus and enable click-traversal
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.matchMedia('(max-width: 768px)').matches);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useLayoutEffect(() => {
        if (isOpen && anchorElement && menuRef.current) {
            const rect = anchorElement.getBoundingClientRect();
            const menuRect = menuRef.current.getBoundingClientRect();

            let top = rect.bottom + window.scrollY + 5;
            let left = rect.left + window.scrollX;

            // Flip if close to bottom
            if (rect.bottom + menuRect.height > window.innerHeight + window.scrollY) {
                top = rect.top + window.scrollY - menuRect.height - 5;
            }

            // Ensure it doesn't go off-screen left/right
            if (left < 10) left = 10;
            if (left + menuRect.width > window.innerWidth) {
                left = window.innerWidth - menuRect.width - 10;
            }

            setPosition({ top, left });
        }
    }, [isOpen, anchorElement, activeView]); // Re-calculate when view changes size

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node) && anchorElement && !anchorElement.contains(e.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose, anchorElement]);

    useEffect(() => {
        if (!isOpen) {
            setHoveredItem('none');
            setActiveView('main');
            setCopied(false);
        }
    }, [isOpen]);

    const handleCopyLink = () => {
        const url = `${window.location.origin}/${documentId}#block-${blockId}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => onClose(), 500);
    };

    if (!isOpen) return null;

    const [sheetOffset, setSheetOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const touchStart = useRef<number>(0);

    const handleTouchStart = (e: React.TouchEvent) => {
        // Only allow dragging from the top handle area or if content is scrolled to top
        // For simplicity, let's allow dragging from header/handle
        touchStart.current = e.touches[0].clientY;
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const currentY = e.touches[0].clientY;
        const diff = currentY - touchStart.current;
        if (diff > 0) {
            setSheetOffset(diff);
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        if (sheetOffset > 100) {
            onClose();
        } else {
            setSheetOffset(0); // Snap back
        }
    };

    if (isMobile) {
        return createPortal(
            <>
                {/* Mobile Backdrop */}
                <div
                    className={cn(
                        "fixed inset-0 bg-black/40 z-[9998] transition-opacity duration-300",
                        isOpen ? "opacity-100" : "opacity-0"
                    )}
                    onClick={onClose}
                />
                {/* Mobile Bottom Sheet */}
                <div
                    className={cn(
                        "fixed inset-x-0 bottom-0 z-[9999] bg-white dark:bg-neutral-900 rounded-t-xl shadow-2xl border-t border-neutral-200 dark:border-neutral-800 overflow-hidden text-neutral-900 dark:text-neutral-100 pb-safe transition-transform duration-200 ease-out",
                        // Only animate slide-in if not moving manually
                        !isDragging && "animate-in slide-in-from-bottom"
                    )}
                    style={{
                        transform: `translateY(${sheetOffset}px)`,
                        transition: isDragging ? 'none' : undefined
                    }}
                >
                    {/* Handle Bar - Draggable Zone */}
                    <div
                        className="w-full flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div className="w-12 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full" />
                    </div>

                    <div className="max-h-[80vh] overflow-y-auto overscroll-contain">
                        {/* VIEW: MAIN */}
                        {activeView === 'main' && (
                            <div className="flex flex-col p-2 pb-8">
                                <button
                                    type="button"
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl text-left text-base"
                                    onClick={() => onDelete()}
                                >
                                    <Trash className="w-5 h-5 text-neutral-500" />
                                    <span>Delete</span>
                                </button>
                                <button
                                    type="button"
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl text-left text-base"
                                    onClick={() => onDuplicate()}
                                >
                                    <Copy className="w-5 h-5 text-neutral-500" />
                                    <span>Duplicate</span>
                                </button>

                                <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-2" />

                                <div
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-left justify-between hover:bg-neutral-100 dark:hover:bg-neutral-800 text-base"
                                    onClick={() => setActiveView('turnInto')}
                                >
                                    <div className="flex items-center gap-3">
                                        <Type className="w-5 h-5 text-neutral-500" />
                                        <span>Turn into</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-neutral-400" />
                                </div>

                                <div
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-left justify-between hover:bg-neutral-100 dark:hover:bg-neutral-800 text-base"
                                    onClick={() => setActiveView('color')}
                                >
                                    <div className="flex items-center gap-3">
                                        <Palette className="w-5 h-5 text-neutral-500" />
                                        <span>Color</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-neutral-400" />
                                </div>

                                <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-2" />

                                <button
                                    type="button"
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl text-left text-base"
                                    onClick={handleCopyLink}
                                >
                                    <Link className="w-5 h-5 text-neutral-500" />
                                    <span>{copied ? 'Copied!' : 'Copy link to block'}</span>
                                </button>
                            </div>
                        )}

                        {/* VIEW: TURN INTO */}
                        {activeView === 'turnInto' && (
                            <div className="flex flex-col h-full animate-in slide-in-from-right-10 duration-200 pb-8">
                                <div className="flex items-center gap-2 p-4 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 bg-white dark:bg-neutral-900 z-10">
                                    <button
                                        onClick={() => setActiveView('main')}
                                        className="p-1 -ml-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full"
                                    >
                                        <ChevronLeft className="w-6 h-6 text-neutral-500" />
                                    </button>
                                    <span className="text-lg font-semibold">Turn into</span>
                                </div>
                                <div className="flex flex-col p-2">
                                    {TURN_INTO_OPTIONS.map(opt => (
                                        <button
                                            key={opt.type}
                                            type="button"
                                            className="flex items-center gap-4 px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl text-left w-full text-base"
                                            onClick={() => {
                                                onTurnInto(opt.type as BlockType);
                                                onClose();
                                            }}
                                        >
                                            <opt.icon className="w-5 h-5 text-neutral-500" />
                                            <span>{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* VIEW: COLOR */}
                        {activeView === 'color' && (
                            <div className="flex flex-col h-full animate-in slide-in-from-right-10 duration-200 pb-8">
                                <div className="flex items-center gap-2 p-4 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 bg-white dark:bg-neutral-900 z-10">
                                    <button
                                        onClick={() => setActiveView('main')}
                                        className="p-1 -ml-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full"
                                    >
                                        <ChevronLeft className="w-6 h-6 text-neutral-500" />
                                    </button>
                                    <span className="text-lg font-semibold">Color</span>
                                </div>
                                <div className="flex flex-col p-4 gap-4">
                                    <div>
                                        <div className="text-xs font-semibold text-neutral-500 uppercase mb-2">Text Color</div>
                                        <div className="flex flex-wrap gap-3">
                                            {TEXT_COLORS.map(c => (
                                                <button
                                                    key={c.label}
                                                    type="button"
                                                    title={c.label}
                                                    className={cn(
                                                        "w-10 h-10 rounded-full ring-1 ring-neutral-200 dark:ring-neutral-700 flex items-center justify-center transition-all",
                                                        c.className
                                                    )}
                                                    onClick={() => {
                                                        onColor(c.color, null);
                                                        onClose();
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-neutral-500 uppercase mb-2">Background</div>
                                        <div className="flex flex-wrap gap-3">
                                            {BG_COLORS.map(c => (
                                                <button
                                                    key={c.label}
                                                    type="button"
                                                    title={c.label}
                                                    className={cn(
                                                        "w-10 h-10 rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-700 flex items-center justify-center transition-all",
                                                        c.className
                                                    )}
                                                    onClick={() => {
                                                        onColor(null, c.color);
                                                        onClose();
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </>,
            document.body
        );
    }

    return createPortal(
        <div ref={menuRef} className="fixed z-50" style={{ top: position.top, left: position.left }}>
            <div className="flex">
                {/* Main Content Container - Dynamic Content based on Active View */}
                <div className="w-64 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden text-sm text-neutral-900 dark:text-neutral-100 animate-in fade-in zoom-in-95 duration-150 flex flex-col">

                    {/* VIEW: MAIN */}
                    {activeView === 'main' && (
                        <div className="flex flex-col p-1">
                            <button
                                type="button"
                                className="flex items-center gap-3 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded text-left"
                                onClick={() => onDelete()}
                                onMouseEnter={() => setHoveredItem('none')}
                            >
                                <Trash className="w-4 h-4 text-neutral-500" />
                                <span>Delete</span>
                            </button>
                            <button
                                type="button"
                                className="flex items-center gap-3 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded text-left"
                                onClick={() => onDuplicate()}
                                onMouseEnter={() => setHoveredItem('none')}
                            >
                                <Copy className="w-4 h-4 text-neutral-500" />
                                <span>Duplicate</span>
                            </button>

                            <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />

                            {/* Turn Into */}
                            <div
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded text-left justify-between cursor-pointer",
                                    hoveredItem === 'turnInto' ? "bg-neutral-100 dark:bg-neutral-700" : "hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                )}
                                onMouseEnter={() => !isMobile && setHoveredItem('turnInto')}
                                onClick={() => setActiveView('turnInto')}
                            >
                                <div className="flex items-center gap-3">
                                    <Type className="w-4 h-4 text-neutral-500" />
                                    <span>Turn into</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-neutral-400" />
                            </div>

                            {/* Color */}
                            <div
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded text-left justify-between cursor-pointer",
                                    hoveredItem === 'color' ? "bg-neutral-100 dark:bg-neutral-700" : "hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                )}
                                onMouseEnter={() => !isMobile && setHoveredItem('color')}
                                onClick={() => setActiveView('color')}
                            >
                                <div className="flex items-center gap-3">
                                    <Palette className="w-4 h-4 text-neutral-500" />
                                    <span>Color</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-neutral-400" />
                            </div>

                            <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />

                            <button
                                type="button"
                                className="flex items-center gap-3 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded text-left"
                                onClick={handleCopyLink}
                                onMouseEnter={() => setHoveredItem('none')}
                            >
                                <Link className="w-4 h-4 text-neutral-500" />
                                <span>{copied ? 'Copied!' : 'Copy link to block'}</span>
                            </button>
                        </div>
                    )}

                    {/* VIEW: TURN INTO */}
                    {activeView === 'turnInto' && (
                        <div className="flex flex-col h-full animate-in slide-in-from-right-10 duration-200">
                            <div className="flex items-center gap-2 p-2 px-3 border-b border-neutral-200 dark:border-neutral-700">
                                <button
                                    onClick={() => setActiveView('main')}
                                    className="p-1 -ml-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded"
                                >
                                    <ChevronLeft className="w-4 h-4 text-neutral-500" />
                                </button>
                                <span className="text-sm font-medium text-neutral-500">Turn into</span>
                            </div>
                            <div className="flex flex-col p-1 overflow-y-auto max-h-[300px]">
                                {TURN_INTO_OPTIONS.map(opt => (
                                    <button
                                        key={opt.type}
                                        type="button"
                                        className="flex items-center gap-3 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded text-left w-full"
                                        onClick={() => {
                                            onTurnInto(opt.type as BlockType);
                                            onClose();
                                        }}
                                    >
                                        <opt.icon className="w-4 h-4 text-neutral-500" />
                                        <span>{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* VIEW: COLOR */}
                    {activeView === 'color' && (
                        <div className="flex flex-col h-full animate-in slide-in-from-right-10 duration-200">
                            <div className="flex items-center gap-2 p-2 px-3 border-b border-neutral-200 dark:border-neutral-700">
                                <button
                                    onClick={() => setActiveView('main')}
                                    className="p-1 -ml-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded"
                                >
                                    <ChevronLeft className="w-4 h-4 text-neutral-500" />
                                </button>
                                <span className="text-sm font-medium text-neutral-500">Color</span>
                            </div>
                            <div className="flex flex-col p-2 overflow-y-auto max-h-[300px]">
                                <div className="px-2 py-1 text-xs font-medium text-neutral-500 uppercase">Text Color</div>
                                <div className="flex flex-wrap gap-1.5 px-2 py-2">
                                    {TEXT_COLORS.map(c => (
                                        <button
                                            key={c.label}
                                            type="button"
                                            title={c.label}
                                            className={cn(
                                                "w-6 h-6 rounded-full hover:ring-2 hover:ring-blue-500 hover:ring-offset-1 transition-all",
                                                c.className
                                            )}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onColor(c.color, null);
                                                onClose();
                                            }}
                                        />
                                    ))}
                                </div>

                                <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />

                                <div className="px-2 py-1 text-xs font-medium text-neutral-500 uppercase">Background</div>
                                <div className="flex flex-wrap gap-1.5 px-2 py-2">
                                    {BG_COLORS.map(c => (
                                        <button
                                            key={c.label}
                                            type="button"
                                            title={c.label}
                                            className={cn(
                                                "w-6 h-6 rounded hover:ring-2 hover:ring-blue-500 hover:ring-offset-1 transition-all",
                                                c.className
                                            )}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onColor(null, c.color);
                                                onClose();
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* DESKTOP HOVER MENUS (Only render if NOT activeView replacement and NOT mobile) */}
                {!isMobile && activeView === 'main' && (
                    <>
                        {/* Turn Into Submenu (Desktop Floater) */}
                        {hoveredItem === 'turnInto' && (
                            <div
                                className="w-52 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden text-sm ml-1 animate-in fade-in slide-in-from-left-2 duration-100 absolute left-full top-0 text-neutral-900 dark:text-neutral-100"
                                onMouseEnter={() => setHoveredItem('turnInto')}
                            >
                                <div className="flex flex-col p-1 max-h-[300px] overflow-y-auto">
                                    {TURN_INTO_OPTIONS.map(opt => (
                                        <button
                                            key={opt.type}
                                            type="button"
                                            className="flex items-center gap-3 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded text-left w-full"
                                            onClick={() => {
                                                onTurnInto(opt.type as BlockType);
                                                onClose();
                                            }}
                                        >
                                            <opt.icon className="w-4 h-4 text-neutral-500" />
                                            <span>{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Color Submenu (Desktop Floater) */}
                        {hoveredItem === 'color' && (
                            <div
                                className="w-56 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden text-sm ml-1 animate-in fade-in slide-in-from-left-2 duration-100 absolute left-full top-0 text-neutral-900 dark:text-neutral-100"
                                onMouseEnter={() => setHoveredItem('color')}
                            >
                                <div className="flex flex-col p-2">
                                    <div className="px-2 py-1 text-xs font-medium text-neutral-500 uppercase">Text Color</div>
                                    <div className="flex flex-wrap gap-1.5 px-2 py-2">
                                        {TEXT_COLORS.map(c => (
                                            <button
                                                key={c.label}
                                                type="button"
                                                title={c.label}
                                                className={cn(
                                                    "w-6 h-6 rounded-full hover:ring-2 hover:ring-blue-500 hover:ring-offset-1 transition-all",
                                                    c.className
                                                )}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onColor(c.color, null);
                                                    onClose();
                                                }}
                                            />
                                        ))}
                                    </div>

                                    <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />

                                    <div className="px-2 py-1 text-xs font-medium text-neutral-500 uppercase">Background</div>
                                    <div className="flex flex-wrap gap-1.5 px-2 py-2">
                                        {BG_COLORS.map(c => (
                                            <button
                                                key={c.label}
                                                type="button"
                                                title={c.label}
                                                className={cn(
                                                    "w-6 h-6 rounded hover:ring-2 hover:ring-blue-500 hover:ring-offset-1 transition-all",
                                                    c.className
                                                )}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onColor(null, c.color);
                                                    onClose();
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>,
        document.body
    );
}
