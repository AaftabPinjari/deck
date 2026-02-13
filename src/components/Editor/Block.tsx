import { useRef, useState, useLayoutEffect, memo, lazy, Suspense } from 'react';
import { Block as BlockType } from '../../store/useDocumentStore';
import { cn } from '../../lib/utils';
import { GripVertical, Square, CheckSquare, Copy, Check, Info, Video, ChevronRight } from 'lucide-react';
import { BlockMenu } from './BlockMenu';
import { ResizableImage } from './ResizableImage';

// Lazy load heavy sub-components (each pulls in significant dependencies)
const TableBlock = lazy(() => import('./TableBlockComponent').then(m => ({ default: m.TableBlock })));
const ColumnBlock = lazy(() => import('./ColumnBlock').then(m => ({ default: m.ColumnBlock })));
const BookmarkBlock = lazy(() => import('./BookmarkBlock').then(m => ({ default: m.BookmarkBlock })));
const KanbanBlock = lazy(() => import('./KanbanBlock').then(m => ({ default: m.KanbanBlock })));
const TableOfContentsBlock = lazy(() => import('./TableOfContentsBlock').then(m => ({ default: m.TableOfContentsBlock })));
const CodeBlock = lazy(() => import('./CodeBlock').then(m => ({ default: m.CodeBlock })));
const BreadcrumbsBlock = lazy(() => import('./BreadcrumbsBlock').then(m => ({ default: m.BreadcrumbsBlock })));
const PageBlock = lazy(() => import('./PageBlock').then(m => ({ default: m.PageBlock })));

interface BlockProps {
    block: BlockType;
    documentId: string;
    onChange: (id: string, content: string) => void;
    onKeyDown: (e: React.KeyboardEvent, id: string) => void;
    onFocus: (id: string) => void;
    onTypeChange?: (id: string, type: string) => void;
    onSlashMenu?: (id: string) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUpdate?: (id: string, props: any) => void;
    onDelete?: (id: string) => void;
    onDuplicate?: (id: string) => void;
    index?: number;
    blockIndex?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dragHandleProps?: any;
    readOnly?: boolean;
    className?: string;
}

export const Block = memo(function Block({ block, documentId, onChange, onKeyDown, onFocus, onTypeChange, onSlashMenu, onUpdate, onDelete, onDuplicate, index, blockIndex, dragHandleProps, className, readOnly }: BlockProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const dragHandleRef = useRef<HTMLDivElement>(null);

    const previousType = useRef(block.type);

    useLayoutEffect(() => {
        const typeChanged = previousType.current !== block.type;

        if (contentRef.current && contentRef.current.innerHTML !== block.content) {
            if (document.activeElement !== contentRef.current || typeChanged) {
                contentRef.current.innerHTML = block.content;
            }
        }

        previousType.current = block.type;
    }, [block.content, block.type]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        if (readOnly) return;
        const newContent = e.currentTarget.innerHTML;
        onChange(block.id, newContent);
    };

    const handleCopy = () => {
        if (contentRef.current) {
            navigator.clipboard.writeText(contentRef.current.innerText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const toggleTodo = () => {
        if (readOnly) return;
        const checked = block.props?.checked;
        onUpdate?.(block.id, { props: { ...block.props, checked: !checked } });
    };

    const handleKeyDownLocal = (e: React.KeyboardEvent) => {
        if (readOnly) return;

        if (e.key === '/') {
            onSlashMenu?.(block.id);
        }

        if (e.key === ' ' && block.type === 'text') {
            const text = contentRef.current?.innerText || '';
            if (text === '#') {
                e.preventDefault();
                onTypeChange?.(block.id, 'h1');
                onChange(block.id, '');
            } else if (text === '##') {
                e.preventDefault();
                onTypeChange?.(block.id, 'h2');
                onChange(block.id, '');
            } else if (text === '###') {
                e.preventDefault();
                onTypeChange?.(block.id, 'h3');
                onChange(block.id, '');
            } else if (text === '-') {
                e.preventDefault();
                onTypeChange?.(block.id, 'bullet');
                onChange(block.id, '');
            } else if (text === '[]') {
                e.preventDefault();
                onTypeChange?.(block.id, 'todo');
                onChange(block.id, '');
            } else if (text === '>') {
                e.preventDefault();
                onTypeChange?.(block.id, 'quote');
                onChange(block.id, '');
            }
        }

        onKeyDown(e, block.id);
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        if (readOnly) return;
        const text = e.clipboardData.getData('text');
        const selection = window.getSelection();

        const isUrl = /^(http|https):\/\/[^ "]+$/.test(text);

        if (isUrl && selection && !selection.isCollapsed && selection.rangeCount > 0) {
            e.preventDefault();
            document.execCommand('createLink', false, text);
            if (contentRef.current) {
                onChange(block.id, contentRef.current.innerHTML);
            }
        }
    };

    const level = block.props?.level || 0;
    const textColor = block.props?.textColor;
    const bgColor = block.props?.bgColor;

    return (
        <div
            id={`block-${block.id}`}
            className={cn(
                "group flex items-start gap-1 md:gap-2 py-1 relative rounded",
                "[--base-gutter:0.75rem] md:[--base-gutter:1.25rem]", // CSS var for responsive gutter
                "[--handle-offset:-1.25rem] md:[--handle-offset:-1.75rem]", // Offset for drag handle
                className
            )}
            style={{
                paddingLeft: `calc(${level * 1.5}rem + var(--base-gutter))`,
                color: textColor || undefined,
                backgroundColor: bgColor || undefined,
            }}
        >
            {/* Drag Handle - Desktop & Mobile */}
            {!readOnly && (
                <div
                    ref={dragHandleRef}
                    className="block absolute top-1 p-1 rounded opacity-0 group-focus-within:opacity-100 md:group-hover:opacity-100 cursor-grab hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 touch-none transition-opacity z-10"
                    style={{ left: `calc(${level * 1.5}rem + var(--handle-offset))` }} // Position based on level and offset
                    contentEditable={false}
                    {...dragHandleProps}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        dragHandleProps?.onMouseDown?.(e);
                        (e.currentTarget as any)._startX = e.clientX;
                        (e.currentTarget as any)._startY = e.clientY;
                    }}
                    onMouseUp={(e) => {
                        dragHandleProps?.onMouseUp?.(e);
                        const startX = (e.currentTarget as any)._startX;
                        const startY = (e.currentTarget as any)._startY;
                        const dx = Math.abs(e.clientX - startX);
                        const dy = Math.abs(e.clientY - startY);
                        if (dx < 5 && dy < 5) {
                            e.preventDefault();
                            e.stopPropagation();
                            // Blur active element to dismiss keyboard on mobile
                            if (document.activeElement instanceof HTMLElement) {
                                document.activeElement.blur();
                            }
                            setMenuOpen(true);
                        }
                    }}
                    onTouchStart={(e) => {
                        e.stopPropagation();
                        dragHandleProps?.onTouchStart?.(e);
                    }}
                >
                    <GripVertical className="w-4 h-4" />
                </div>
            )}

            {menuOpen && !readOnly && (
                <BlockMenu
                    isOpen={menuOpen}
                    onClose={() => setMenuOpen(false)}
                    anchorElement={dragHandleRef.current}
                    blockId={block.id}
                    documentId={documentId}
                    onTurnInto={(type) => {
                        onTypeChange?.(block.id, type);
                        setMenuOpen(false);
                    }}
                    onDelete={() => {
                        onDelete?.(block.id);
                        setMenuOpen(false);
                    }}
                    onDuplicate={() => {
                        onDuplicate?.(block.id);
                        setMenuOpen(false);
                    }}
                    onColor={(textColor, bgColor) => {
                        const newProps = { ...block.props };
                        if (textColor !== null) {
                            if (textColor === '') {
                                delete newProps.textColor;
                            } else {
                                newProps.textColor = textColor;
                            }
                        }
                        if (bgColor !== null) {
                            if (bgColor === '') {
                                delete newProps.bgColor;
                            } else {
                                newProps.bgColor = bgColor;
                            }
                        }
                        if (onUpdate) {
                            onUpdate(block.id, { props: newProps });
                        }
                        setMenuOpen(false);
                    }}
                />
            )}

            {/* Prefix rendering based on type */}
            <div className="select-none flex-shrink-0 w-5 md:w-6 flex justify-end" contentEditable={false}>
                {block.type === 'bullet' && (
                    <span className="text-xl leading-snug">•</span>
                )}
                {block.type === 'number' && (
                    <span className="font-medium text-neutral-600">{blockIndex !== undefined ? `${blockIndex}.` : (index ? `${index}.` : '1.')}</span>
                )}
                {block.type === 'todo' && (
                    <div
                        className={cn(
                            "transition-colors",
                            !readOnly && "cursor-pointer hover:text-neutral-700",
                            block.props?.checked ? "text-blue-500" : "text-neutral-500"
                        )}
                        onClick={toggleTodo}
                    >
                        {block.props?.checked ? (
                            <CheckSquare className="w-5 h-5" />
                        ) : (
                            <Square className="w-5 h-5" />
                        )}
                    </div>
                )}
                {block.type === 'quote' && (
                    <div className="w-1 h-full bg-neutral-800 dark:bg-neutral-200 mr-2" />
                )}
                {block.type === 'toggle' && (
                    <div
                        className={cn(
                            "rounded p-0.5 transition-colors",
                            !readOnly && "cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700"
                        )}
                        onClick={() => {
                            const isOpen = block.props?.isOpen ?? true;
                            onUpdate?.(block.id, { props: { ...block.props, isOpen: !isOpen } });
                        }}
                    >
                        <ChevronRight
                            className={cn(
                                "w-5 h-5 text-neutral-500 transition-transform",
                                (block.props?.isOpen ?? true) ? "rotate-90" : ""
                            )}
                        />
                    </div>
                )}
            </div>

            {block.type === 'image' ? (
                <div key="image" className="w-full">
                    {block.content ? (
                        <ResizableImage
                            src={block.content}
                            initialWidth={block.props?.width || 100}
                            onWidthChange={(width) => !readOnly && onUpdate?.(block.id, { props: { ...block.props, width } })}
                            onClear={() => !readOnly && onChange(block.id, '')}
                            readOnly={readOnly}
                        />
                    ) : (
                        !readOnly ? (
                            <input
                                className="w-full p-4 bg-neutral-100 dark:bg-neutral-800 rounded-md text-neutral-800 dark:text-neutral-200 outline-none border border-transparent focus:border-neutral-300 dark:focus:border-neutral-600 transition-colors placeholder:text-neutral-500"
                                placeholder="Paste image URL and press Enter..."
                                defaultValue=""
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        onChange(block.id, e.currentTarget.value);
                                        onKeyDown(e, block.id);
                                    } else {
                                        e.stopPropagation();
                                    }
                                }}
                                onBlur={(e) => {
                                    if (e.currentTarget.value) {
                                        onChange(block.id, e.currentTarget.value);
                                    }
                                }}
                                autoFocus
                            />
                        ) : null
                    )}
                </div>
            ) : block.type === 'divider' ? (
                <hr key="divider" className="w-full border-t border-neutral-300 dark:border-neutral-700 my-2" />
            ) : block.type === 'code' ? (
                <Suspense key="code" fallback={<div className="w-full h-16 bg-neutral-100 dark:bg-neutral-800 rounded-md animate-pulse" />}>
                    <CodeBlock block={block} onChange={onChange} onUpdate={readOnly ? undefined : onUpdate!} readOnly={readOnly} />
                </Suspense>
            ) : block.type === 'quote' ? (
                <div key="quote" className="relative w-full group/quote flex-1">
                    <div className="absolute right-2 top-0 opacity-0 group-hover/quote:opacity-100 transition-opacity z-10">
                        <button
                            onClick={handleCopy}
                            className="p-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-500 transition-colors"
                            title="Copy quote"
                        >
                            {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                    </div>
                    <div
                        ref={contentRef}
                        contentEditable={!readOnly}
                        suppressContentEditableWarning
                        onInput={handleInput}
                        onKeyDown={handleKeyDownLocal}
                        onPaste={handlePaste}
                        onFocus={() => !readOnly && onFocus(block.id)}
                        className={cn(
                            "flex-1 outline-none min-h-[1.5em]",
                            "pl-4 text-lg italic",
                            !textColor && "text-neutral-600 dark:text-neutral-400",
                            "empty:before:content-[''] empty:before:text-neutral-300 focus:empty:before:content-['Shift+Enter_for_next_line']",
                            "placeholder:text-neutral-200"
                        )}
                        data-block-id={block.id}
                    />
                </div>
            ) : block.type === 'video' ? (
                <div key="video" className="w-full">
                    {block.content ? (
                        <div className="relative w-full aspect-video bg-neutral-100 dark:bg-neutral-800 rounded-md overflow-hidden">
                            <iframe
                                src={block.content.replace('watch?v=', 'embed/')}
                                className="w-full h-full"
                                title="Video player"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    ) : (
                        !readOnly ? (
                            <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-md text-neutral-500 flex items-center gap-2">
                                <Video className="w-5 h-5" />
                                <span>Add a video embed link...</span>
                            </div>
                        ) : null
                    )}
                </div>
            ) : block.type === 'callout' ? (
                <div key="callout" className="w-full p-4 bg-neutral-100 dark:bg-neutral-800 rounded-md flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                        <Info className="w-5 h-5 text-neutral-500" />
                    </div>
                    <div
                        ref={contentRef}
                        contentEditable={!readOnly}
                        suppressContentEditableWarning
                        onInput={handleInput}
                        onKeyDown={handleKeyDownLocal}
                        onPaste={handlePaste}
                        onFocus={() => !readOnly && onFocus(block.id)}
                        className="flex-1 outline-none text-neutral-800 dark:text-neutral-200 empty:before:content-['Shift+Enter_for_next_line'] empty:before:text-neutral-400"
                        data-block-id={block.id}
                    />
                </div>
            ) : block.type === 'table' ? (
                <Suspense key="table" fallback={<div className="w-full h-20 bg-neutral-100 dark:bg-neutral-800 rounded-md animate-pulse" />}>
                    <TableBlock block={block} onUpdate={readOnly ? undefined : onUpdate!} readOnly={readOnly} />
                </Suspense>
            ) : block.type === 'column_container' ? (
                <Suspense key="column_container" fallback={<div className="w-full h-20 bg-neutral-100 dark:bg-neutral-800 rounded-md animate-pulse" />}>
                    <ColumnBlock block={block} documentId={documentId} onUpdate={readOnly ? undefined : onUpdate!} readOnly={readOnly} />
                </Suspense>
            ) : block.type === 'bookmark' ? (
                <Suspense key="bookmark" fallback={<div className="w-full h-16 bg-neutral-100 dark:bg-neutral-800 rounded-md animate-pulse" />}>
                    <BookmarkBlock block={block} onUpdate={readOnly ? undefined : onUpdate!} onKeyDown={onKeyDown} readOnly={readOnly} />
                </Suspense>
            ) : block.type === 'kanban' ? (
                <Suspense key="kanban" fallback={<div className="w-full h-32 bg-neutral-100 dark:bg-neutral-800 rounded-md animate-pulse" />}>
                    <KanbanBlock block={block} documentId={documentId} onUpdate={readOnly ? undefined : onUpdate!} readOnly={readOnly} />
                </Suspense>
            ) : block.type === 'table_of_contents' ? (
                <Suspense key="table_of_contents" fallback={<div className="w-full h-16 bg-neutral-100 dark:bg-neutral-800 rounded-md animate-pulse" />}>
                    <TableOfContentsBlock block={block} documentId={documentId} readOnly={readOnly} />
                </Suspense>
            ) : block.type === 'breadcrumbs' ? (
                <Suspense key="breadcrumbs" fallback={<div className="w-full h-8 bg-neutral-100 dark:bg-neutral-800 rounded-md animate-pulse" />}>
                    <BreadcrumbsBlock documentId={documentId} />
                </Suspense>
            ) : block.type === 'page' ? (
                <Suspense key="page" fallback={<div className="w-full h-10 bg-neutral-100 dark:bg-neutral-800 rounded-md animate-pulse" />}>
                    <PageBlock blockId={block.id} documentId={documentId} />
                </Suspense>
            ) : (
                <div
                    key="default"
                    ref={contentRef}
                    contentEditable={!readOnly}
                    suppressContentEditableWarning
                    onInput={handleInput}
                    onKeyDown={handleKeyDownLocal}
                    onPaste={handlePaste}
                    onFocus={() => !readOnly && onFocus(block.id)}
                    className={cn(
                        "flex-1 outline-none min-h-[1.5em]",
                        !textColor && "text-neutral-800 dark:text-neutral-200",
                        block.type === 'h1' && "text-3xl font-bold mb-2",
                        block.type === 'h2' && "text-2xl font-semibold mb-2",
                        block.type === 'h3' && "text-xl font-medium mb-1",
                        block.type === 'todo' && block.props?.checked && "line-through text-neutral-400",
                        !readOnly && "empty:before:content-[''] empty:before:text-neutral-300 focus:empty:before:content-['Type_/_for_options.']",
                        (block.type === 'h1' || block.type === 'h2' || block.type === 'h3') && "placeholder:text-neutral-200"
                    )}
                    data-block-id={block.id}
                />
            )}
        </div>
    );
});
