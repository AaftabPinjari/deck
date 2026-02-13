import { useState } from 'react';
import { useDocumentStore } from '../store/useDocumentStore';
import { Globe, Check, Copy, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { toPageSlug } from '../lib/slugUtils';

interface PublishProps {
    documentId: string;
}

export function Publish({ documentId }: PublishProps) {
    const { documents, updateDocument } = useDocumentStore();
    const document = documents[documentId];
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    if (!document) return null;

    const url = `${window.location.origin}/preview${toPageSlug(document.title, document.id)}`;

    const handlePublish = async () => {
        await updateDocument(documentId, { isPublished: !document.isPublished });
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors",
                    document.isPublished
                        ? "text-blue-500"
                        : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300"
                )}
                title={document.isPublished ? "Published" : "Share"}
            >
                <Globe className="h-4 w-4" />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 z-50 w-80 bg-white dark:bg-neutral-900 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-800 p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                {document.isPublished ? "Published to web" : "Publish to web"}
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-neutral-400 hover:text-neutral-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                Publish this page
                            </span>
                            <button
                                onClick={handlePublish}
                                className={cn(
                                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                                    document.isPublished ? "bg-blue-500" : "bg-neutral-200 dark:bg-neutral-700"
                                )}
                            >
                                <span
                                    className={cn(
                                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                        document.isPublished ? "translate-x-6" : "translate-x-1"
                                    )}
                                />
                            </button>
                        </div>

                        {document.isPublished && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="flex items-center gap-2 p-2 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
                                    <input
                                        type="text"
                                        readOnly
                                        value={url}
                                        className="flex-1 bg-transparent text-xs text-neutral-600 dark:text-neutral-400 outline-none truncate"
                                    />
                                    <button
                                        onClick={handleCopy}
                                        className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                                    >
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </button>
                                </div>
                                <p className="text-xs text-neutral-500">
                                    Anyone with the link can view this page.
                                </p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
