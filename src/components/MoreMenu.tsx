import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Copy, Trash, Download } from 'lucide-react';
import { useDocumentStore } from '../store/useDocumentStore';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Modal } from './ui/Modal';
import { blocksToMarkdown, downloadMarkdown } from '../utils/markdownUtils';
import { toast } from 'sonner';

interface MoreMenuProps {
    documentId: string;
}

export function MoreMenu({ documentId }: MoreMenuProps) {
    const navigate = useNavigate();
    const { documents, updateDocument, archiveDocument, duplicateDocument } = useDocumentStore();
    const currentDoc = documents[documentId];
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [pageToDelete, setPageToDelete] = useState<string | null>(null);

    // Font Styles
    const fontStyles = [
        { id: 'sans', label: 'Default', fontClass: 'font-sans', description: 'Sans-serif' },
        { id: 'serif', label: 'Serif', fontClass: 'font-serif', description: 'Serif' },
        { id: 'mono', label: 'Mono', fontClass: 'font-mono', description: 'Monospace' },
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        window.addEventListener('mousedown', handleClickOutside);
        return () => window.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!currentDoc) return null;

    const handleDuplicate = async () => {
        setIsOpen(false);
        const newId = await duplicateDocument(documentId);
        if (newId) navigate(`/${newId}`);
    };

    const handleDelete = async () => {
        setIsOpen(false);
        setPageToDelete(documentId);
    };

    const confirmDelete = async () => {
        if (pageToDelete) {
            await archiveDocument(pageToDelete);
            navigate('/');
            setPageToDelete(null);
        }
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-neutral-500 transition-colors"
                title="Style, export, and more..."
            >
                <MoreHorizontal className="h-5 w-5" />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg z-50 py-1 animation-in fade-in zoom-in-95 duration-100 overflow-hidden">

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

                        {/* Full Width Toggle */}
                        <div className="flex items-center justify-between">
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
                    </div>

                    <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

                    {/* Actions */}
                    <div className="py-1">
                        <button
                            onClick={async () => {
                                const markdown = blocksToMarkdown(currentDoc.content);
                                await navigator.clipboard.writeText(markdown);
                                toast.success("Copied to clipboard");
                                setIsOpen(false);
                            }}
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
                            onClick={() => {
                                const markdown = blocksToMarkdown(currentDoc.content);
                                downloadMarkdown(markdown, currentDoc.title || 'Untitled');
                                setIsOpen(false);
                                toast.success("Exported to Markdown");
                            }}
                            className="w-full text-left px-3 py-1.5 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Export to Markdown
                        </button>
                    </div>

                    <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

                    <div className="px-3 py-2 text-xs text-neutral-400 text-center">
                        Word count: {currentDoc.content.reduce((acc, block) => acc + (block.content?.replace(/<[^>]*>/g, '').length || 0), 0)} characters
                    </div>

                </div>
            )}

            <Modal isOpen={!!pageToDelete} onClose={() => setPageToDelete(null)} title="Delete Page?">
                <div className="flex flex-col gap-4">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Are you sure you want to delete this page?</p>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setPageToDelete(null)} className="px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 rounded">Cancel</button>
                        <button onClick={confirmDelete} className="px-3 py-1.5 text-sm bg-red-500 hover:bg-red-600 text-white rounded shadow-sm">Delete</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
