import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, Copy, Trash, Download } from 'lucide-react';
import { useDocumentStore } from '../store/useDocumentStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Modal } from './ui/Modal';
import { blocksToMarkdown, downloadMarkdown } from '../utils/markdownUtils';
import { toast } from 'sonner';
import { toPageSlug } from '../lib/slugUtils';

interface MoreMenuProps {
    documentId: string;
}

// Font Styles - defined outside to prevent recreation
const fontStyles = [
    { id: 'sans', label: 'Default', fontClass: 'font-sans', description: 'Sans-serif' },
    { id: 'serif', label: 'Serif', fontClass: 'font-serif', description: 'Serif' },
    { id: 'mono', label: 'Mono', fontClass: 'font-mono', description: 'Monospace' },
] as const;

export const MoreMenu = memo(function MoreMenu({ documentId }: MoreMenuProps) {
    const navigate = useNavigate();

    // Optimized selectors to prevent unnecessary re-renders
    const currentDoc = useDocumentStore(useCallback(state => state.documents[documentId], [documentId]));
    const updateDocument = useDocumentStore(state => state.updateDocument);
    const archiveDocument = useDocumentStore(state => state.archiveDocument);
    const duplicateDocument = useDocumentStore(state => state.duplicateDocument);

    const theme = useSettingsStore(state => state.theme);
    const setTheme = useSettingsStore(state => state.setTheme);

    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [sheetOffset, setSheetOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const touchStart = useRef<number>(0);
    const [pageToDelete, setPageToDelete] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.matchMedia('(max-width: 768px)').matches);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Handle click outside for desktop
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node) && !isMobile) {
                setIsOpen(false);
            }
        };

        if (isOpen && !isMobile) {
            window.addEventListener('mousedown', handleClickOutside);
        }
        return () => window.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, isMobile]);

    const handleDuplicate = useCallback(async () => {
        setIsOpen(false);
        const newId = await duplicateDocument(documentId);
        if (newId) {
            const newDoc = useDocumentStore.getState().documents[newId];
            navigate(toPageSlug(newDoc?.title || 'Untitled', newId));
        }
    }, [documentId, duplicateDocument, navigate]);

    const handleDelete = useCallback(() => {
        setIsOpen(false);
        setPageToDelete(documentId);
    }, [documentId]);

    const confirmDelete = useCallback(async () => {
        if (pageToDelete) {
            await archiveDocument(pageToDelete);
            navigate('/');
            setPageToDelete(null);
        }
    }, [pageToDelete, archiveDocument, navigate]);

    const handleCopyMarkdown = useCallback(async () => {
        if (!currentDoc) return;
        const markdown = blocksToMarkdown(currentDoc.content);
        await navigator.clipboard.writeText(markdown);
        toast.success("Copied to clipboard");
        setIsOpen(false);
    }, [currentDoc]);

    const handleExportMarkdown = useCallback(() => {
        if (!currentDoc) return;
        const markdown = blocksToMarkdown(currentDoc.content);
        downloadMarkdown(markdown, currentDoc.title || 'Untitled');
        setIsOpen(false);
        toast.success("Exported to Markdown");
    }, [currentDoc]);

    const handleTouchStart = (e: React.TouchEvent) => {
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
            setIsOpen(false);
        } else {
            setSheetOffset(0);
        }
    };

    // Reset offset when opening
    useEffect(() => {
        if (isOpen) {
            setSheetOffset(0);
        }
    }, [isOpen]);

    if (!currentDoc) return null;

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-neutral-500 transition-colors"
                title="Style, export, and more..."
            >
                <MoreHorizontal className="h-5 w-5" />
            </button>

            {/* Desktop Menu */}
            {isOpen && !isMobile && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg z-50 py-1 text-neutral-900 dark:text-neutral-100 animation-in fade-in zoom-in-95 duration-100 overflow-hidden">
                    <MenuContent
                        documentId={documentId}
                        currentDoc={currentDoc}
                        updateDocument={updateDocument}
                        handleCopyMarkdown={handleCopyMarkdown}
                        handleDuplicate={handleDuplicate}
                        handleDelete={handleDelete}
                        handleExportMarkdown={handleExportMarkdown}
                        theme={theme}
                        setTheme={setTheme}
                    />
                </div>
            )}

            {/* Mobile Bottom Sheet */}
            {isOpen && isMobile && (
                createPortal(
                    <>
                        <div
                            className={cn(
                                "fixed inset-0 bg-black/40 z-[9998] transition-opacity duration-300",
                                isOpen ? "opacity-100" : "opacity-0"
                            )}
                            onClick={() => setIsOpen(false)}
                        />
                        <div
                            className={cn(
                                "fixed inset-x-0 bottom-0 z-[9999] bg-white dark:bg-neutral-900 rounded-t-xl shadow-2xl border-t border-neutral-200 dark:border-neutral-800 overflow-hidden text-neutral-900 dark:text-neutral-100 pb-safe transition-transform duration-200 ease-out",
                                !isDragging && "animate-in slide-in-from-bottom"
                            )}
                            style={{
                                transform: `translateY(${sheetOffset}px)`,
                                transition: isDragging ? 'none' : undefined
                            }}
                        >
                            <div
                                className="w-full flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none"
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                            >
                                <div className="w-12 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full" />
                            </div>
                            <div className="max-h-[80vh] overflow-y-auto overscroll-contain">
                                <MenuContent
                                    documentId={documentId}
                                    currentDoc={currentDoc}
                                    updateDocument={updateDocument}
                                    handleCopyMarkdown={handleCopyMarkdown}
                                    handleDuplicate={handleDuplicate}
                                    handleDelete={handleDelete}
                                    handleExportMarkdown={handleExportMarkdown}
                                    theme={theme}
                                    setTheme={setTheme}
                                />
                            </div>
                        </div>
                    </>,
                    document.body
                )
            )}

            {pageToDelete && (
                <Modal isOpen={!!pageToDelete} onClose={() => setPageToDelete(null)} title="Delete Page?">
                    <div className="flex flex-col gap-4">
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Are you sure you want to delete this page?</p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setPageToDelete(null)} className="px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 rounded">Cancel</button>
                            <button onClick={confirmDelete} className="px-3 py-1.5 text-sm bg-red-500 hover:bg-red-600 text-white rounded shadow-sm">Delete</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
});

// Extracted Content Component to reuse between Mobile and Desktop
const MenuContent = ({
    documentId,
    currentDoc,
    updateDocument,
    handleCopyMarkdown,
    handleDuplicate,
    handleDelete,
    handleExportMarkdown,
    theme,
    setTheme
}: any) => {
    return (
        <>
            {/* Style Section */}
            <div className="px-3 py-2">
                <div className="text-xs text-neutral-500 font-medium mb-2 uppercase tracking-wider">Style</div>

                {/* Fonts */}
                <div className="flex gap-1 mb-3">
                    {fontStyles.map((style) => (
                        <button
                            key={style.id}
                            onClick={() => updateDocument(documentId, { fontStyle: style.id as any })}
                            className={cn(
                                "flex-1 p-2 rounded border transition-all text-center",
                                currentDoc.fontStyle === style.id
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                    : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                            )}
                            title={style.description}
                        >
                            <div className={cn("text-lg leading-none mb-1", style.fontClass)}>Ag</div>
                            <div className="text-[10px] text-neutral-500">{style.label}</div>
                        </button>
                    ))}
                </div>

                {/* Small Text Toggle */}
                <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Small text</span>
                    <button
                        onClick={() => updateDocument(documentId, { isSmallText: !currentDoc.isSmallText })}
                        className={cn(
                            "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                            currentDoc.isSmallText ? "bg-blue-500" : "bg-neutral-200 dark:bg-neutral-700"
                        )}
                    >
                        <span
                            className={cn(
                                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                currentDoc.isSmallText ? "translate-x-4" : "translate-x-0.5"
                            )}
                        />
                    </button>
                </div>

                {/* Full Width Toggle */}
                <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Full width</span>
                    <button
                        onClick={() => updateDocument(documentId, { isFullWidth: !currentDoc.isFullWidth })}
                        className={cn(
                            "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                            currentDoc.isFullWidth ? "bg-blue-500" : "bg-neutral-200 dark:bg-neutral-700"
                        )}
                    >
                        <span
                            className={cn(
                                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                currentDoc.isFullWidth ? "translate-x-4" : "translate-x-0.5"
                            )}
                        />
                    </button>
                </div>

                {/* Lock Page Toggle */}
                <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Lock page</span>
                    <button
                        onClick={() => updateDocument(documentId, { isLocked: !currentDoc.isLocked })}
                        className={cn(
                            "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                            currentDoc.isLocked ? "bg-blue-500" : "bg-neutral-200 dark:bg-neutral-700"
                        )}
                    >
                        <span
                            className={cn(
                                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                currentDoc.isLocked ? "translate-x-4" : "translate-x-0.5"
                            )}
                        />
                    </button>
                </div>

                {/* Dark Mode Toggle - Deck style */}
                <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Dark mode</span>
                    <button
                        onClick={() => {
                            // Calculate effective theme
                            const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                            const isEffectiveDark = theme === 'dark' || (theme === 'system' && isSystemDark);
                            // If currently effectively dark, switch to light. Otherwise dark.
                            setTheme(isEffectiveDark ? 'light' : 'dark');
                        }}
                        className={cn(
                            "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                            (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches))
                                ? "bg-blue-500"
                                : "bg-neutral-200 dark:bg-neutral-700"
                        )}
                    >
                        <span
                            className={cn(
                                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches))
                                    ? "translate-x-4"
                                    : "translate-x-0.5"
                            )}
                        />
                    </button>
                </div>
            </div>

            <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

            {/* Actions */}
            <div className="py-1">
                <button
                    onClick={handleCopyMarkdown}
                    className="w-full text-left px-3 py-1.5 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                >
                    <Copy className="h-4 w-4" />
                    Copy as Markdown
                </button>
                <button
                    onClick={handleDuplicate}
                    className="w-full text-left px-3 py-1.5 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                >
                    <Copy className="h-4 w-4" />
                    Duplicate
                </button>
                <button
                    onClick={handleDelete}
                    className="w-full text-left px-3 py-1.5 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                >
                    <Trash className="h-4 w-4" />
                    Delete
                </button>
                <button
                    onClick={handleExportMarkdown}
                    className="w-full text-left px-3 py-1.5 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                >
                    <Download className="h-4 w-4" />
                    Export to Markdown
                </button>
            </div>

            <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

            <div className="px-3 py-2 text-xs text-neutral-400 text-center">
                Word count: {currentDoc.content.reduce((acc: any, block: any) => acc + (block.content?.replace(/<[^>]*>/g, '').length || 0), 0)} characters
            </div>
        </>
    );
};
