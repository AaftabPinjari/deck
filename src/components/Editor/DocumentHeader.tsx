import { memo, useRef, useEffect } from 'react';
import { useDocumentStore } from '../../store/useDocumentStore';
import { IconPicker } from '../ui/IconPicker';
import { CoverImagePicker } from '../ui/CoverImagePicker';
import { ImageIcon, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLocation } from 'react-router-dom';

interface DocumentHeaderProps {
    documentId: string;
}

export const DocumentHeader = memo(function DocumentHeader({ documentId }: DocumentHeaderProps) {
    const currentDoc = useDocumentStore(state => state.documents[documentId]);
    const updateDocument = useDocumentStore(state => state.updateDocument);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const location = useLocation();

    // Focus title if requested via navigation state
    useEffect(() => {
        if (location.state?.focusTitle && currentDoc) {
            // Use requestAnimationFrame for smoother focus
            requestAnimationFrame(() => {
                titleInputRef.current?.focus();
            });
        }
    }, [location.state, currentDoc?.id]);

    if (!currentDoc) return null;

    const hasCover = !!currentDoc.coverImage;
    const hasIcon = !!currentDoc.icon;

    return (
        <div className="group/cover relative w-full">
            {/* Cover Image - Edge to Edge */}
            <div className={cn(
                "group/cover relative w-full",
                hasCover ? "h-[30vh] min-h-[200px]" : "h-0"
            )}>
                {hasCover && (
                    <>
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{
                                backgroundColor: currentDoc.coverImage?.startsWith('#') ? currentDoc.coverImage : undefined,
                                backgroundImage: !currentDoc.coverImage?.startsWith('#')
                                    ? (currentDoc.coverImage?.startsWith('http') ? `url(${currentDoc.coverImage})` : currentDoc.coverImage)
                                    : undefined
                            }}
                        />
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

                        {/* Cover controls */}
                        <div className="absolute bottom-3 right-4 opacity-0 group-hover/cover:opacity-100 transition-opacity flex gap-2">
                            <CoverImagePicker align="right" onChange={(url) => updateDocument(documentId, { coverImage: url })}>
                                <button className="text-xs bg-white/90 hover:bg-white dark:bg-neutral-800/90 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-3 py-1.5 rounded-md shadow-sm flex items-center gap-1.5 font-medium">
                                    <ImageIcon className="h-3.5 w-3.5" />
                                    Change cover
                                </button>
                            </CoverImagePicker>
                            <button
                                onClick={() => updateDocument(documentId, { coverImage: undefined })}
                                className="text-xs bg-white/90 hover:bg-white dark:bg-neutral-800/90 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2 py-1.5 rounded-md shadow-sm"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Header Content */}
            <div className={cn(
                "mx-auto px-4 md:px-12 transition-all duration-300",
                currentDoc.isFullWidth ? "max-w-full px-6 md:px-24" : "max-w-3xl"
            )}>
                {/* Header Controls & Icon */}
                <div className={cn(
                    "group/header relative mb-8",
                    !hasCover && "pt-8" // Only add top padding if NO cover
                )}>
                    {/* Controls */}
                    <div className={cn(
                        "flex items-center gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity mb-2 text-xs text-neutral-500 select-none relative z-20",
                        !hasIcon && !hasCover && "opacity-100"
                    )}>
                        {!hasIcon && (
                            <IconPicker onChange={(icon) => updateDocument(documentId, { icon })}>
                                <button className="flex items-center gap-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 px-2 py-1 rounded transition-colors">
                                    <span className="text-sm">😀</span>
                                    Add icon
                                </button>
                            </IconPicker>
                        )}
                        {!hasCover && (
                            <CoverImagePicker onChange={(url) => updateDocument(documentId, { coverImage: url })}>
                                <button className="flex items-center gap-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 px-2 py-1 rounded transition-colors">
                                    <ImageIcon className="h-3.5 w-3.5" />
                                    Add cover
                                </button>
                            </CoverImagePicker>
                        )}
                    </div>

                    {/* Icon/Emoji */}
                    {hasIcon && (
                        <div className={cn(
                            "relative group/icon inline-block z-10",
                            hasCover ? "-mt-20 md:-mt-32 mb-4" : "mb-4" // Stronger negative margin
                        )}>
                            <span
                                className={cn(
                                    "text-5xl md:text-7xl cursor-pointer select-none block hover:opacity-90 transition-opacity",
                                    hasCover && "drop-shadow-md" // Add shadow to help visual pop against cover
                                )}
                            >
                                <IconPicker onChange={(icon) => updateDocument(documentId, { icon })}>
                                    <span>{currentDoc.icon}</span>
                                </IconPicker>
                            </span>
                            <button
                                onClick={() => updateDocument(documentId, { icon: undefined })}
                                className="absolute -top-2 -right-2 opacity-0 group-hover/icon:opacity-100 transition-opacity bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-full p-1 shadow-sm"
                            >
                                <X className="h-3 w-3 text-neutral-600 dark:text-neutral-300" />
                            </button>
                        </div>
                    )}

                    {/* Last Edited Time */}
                    <div className="text-xs text-neutral-400 mb-4 select-none">
                        Edited {new Date(currentDoc.updatedAt).toLocaleDateString()} {new Date(currentDoc.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    {/* Title */}
                    <input
                        ref={titleInputRef}
                        className={cn(
                            "w-full text-3xl md:text-4xl font-bold outline-none bg-transparent placeholder:text-neutral-300 text-neutral-800 dark:text-neutral-100 placeholder-opacity-50 break-words",
                            currentDoc.isLocked && "pointer-events-none"
                        )}
                        value={currentDoc.title}
                        onChange={(e) => !currentDoc.isLocked && updateDocument(documentId, { title: e.target.value })}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                if (currentDoc.content.length > 0) {
                                    const firstBlockId = currentDoc.content[0].id;
                                    const el = document.querySelector(`[data-block-id="${firstBlockId}"]`) as HTMLElement;
                                    el?.focus();
                                }
                            }
                        }}
                        placeholder="Untitled"
                        readOnly={currentDoc.isLocked}
                    />
                </div>
            </div>
        </div>
    );
});
