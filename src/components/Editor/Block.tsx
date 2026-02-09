import { useRef, useState, useLayoutEffect, memo } from 'react';
import { Block as BlockType } from '../../store/useDocumentStore';
import { cn } from '../../lib/utils';
import { GripVertical, Square, CheckSquare, Copy, Check, Info, Video, ChevronRight } from 'lucide-react';
import { TableBlock } from './TableBlockComponent';
import { ColumnBlock } from './ColumnBlock';
import { BlockMenu } from './BlockMenu';
import { ResizableImage } from './ResizableImage';

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dragHandleProps?: any;
    className?: string;
}

export const Block = memo(function Block({ block, documentId, onChange, onKeyDown, onFocus, onTypeChange, onSlashMenu, onUpdate, onDelete, onDuplicate, index, dragHandleProps, className }: BlockProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const dragHandleRef = useRef<HTMLDivElement>(null);

    const previousType = useRef(block.type);

    useLayoutEffect(() => {
        // If the block type changes, we usually want to force an update (e.g. converting /todo to empty todo)
        // even if the element is focused.
        const typeChanged = previousType.current !== block.type;

        if (contentRef.current && contentRef.current.innerHTML !== block.content) {
            if (document.activeElement !== contentRef.current || typeChanged) {
                contentRef.current.innerHTML = block.content;
            }
        }

        previousType.current = block.type;
    }, [block.content, block.type]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
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
        const checked = block.props?.checked;
        onUpdate?.(block.id, { props: { ...block.props, checked: !checked } });
    };

    const handleKeyDownLocal = (e: React.KeyboardEvent) => {
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
        const text = e.clipboardData.getData('text');
        const selection = window.getSelection();

        // Simple URL regex
        const isUrl = /^(http|https):\/\/[^ "]+$/.test(text);

        if (isUrl && selection && !selection.isCollapsed && selection.rangeCount > 0) {
            e.preventDefault();
            document.execCommand('createLink', false, text);
            // Ensure state is updated
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
            className={cn("group flex items-start gap-2 py-1 -ml-8 pl-8 relative rounded", className)}
            style={{
                paddingLeft: `${2 + (level * 1.5)}rem`,
                color: textColor || undefined,
                backgroundColor: bgColor || undefined,
            }}
        >
            {/* Drag Handle - click to open menu, drag to reorder */}
            <div
                ref={dragHandleRef}
                className="absolute top-1.5 p-0.5 rounded opacity-0 group-hover:opacity-100 cursor-grab hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400"
                style={{ left: `${(level * 1.5)}rem` }}
                contentEditable={false}
                onMouseDown={(e) => {
                    // Store start position for click detection
                    (e.currentTarget as any)._startX = e.clientX;
                    (e.currentTarget as any)._startY = e.clientY;
                }}
                onMouseUp={(e) => {
                    const startX = (e.currentTarget as any)._startX;
                    const startY = (e.currentTarget as any)._startY;
                    const dx = Math.abs(e.clientX - startX);
                    const dy = Math.abs(e.clientY - startY);
                    // If mouse moved less than 5px, treat as click
                    if (dx < 5 && dy < 5) {
                        e.stopPropagation();
                        setMenuOpen(true);
                    }
                }}
                {...dragHandleProps}
            >
                <GripVertical className="w-4 h-4" />
            </div>

            {menuOpen && (
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
            <div className="select-none flex-shrink-0 w-6 flex justify-end" contentEditable={false}>
                {block.type === 'bullet' && (
                    <span className="text-xl leading-snug">•</span>
                )}
                {block.type === 'number' && (
                    <span className="font-medium text-neutral-600">{index ? `${index}.` : '1.'}</span>
                )}
                {block.type === 'todo' && (
                    <div
                        className={cn(
                            "cursor-pointer hover:text-neutral-700 transition-colors",
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
                        className="cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded p-0.5 transition-colors"
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
                <div className="w-full">
                    {block.content ? (
                        <ResizableImage
                            src={block.content}
                            initialWidth={block.props?.width || 100}
                            onWidthChange={(width) => onUpdate?.(block.id, { props: { ...block.props, width } })}
                            onClear={() => onChange(block.id, '')}
                        />
                    ) : (
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
                    )}
                </div>
            ) : block.type === 'divider' ? (
                <hr className="w-full border-t border-neutral-300 dark:border-neutral-700 my-2" />
            ) : block.type === 'code' ? (
                <div className="relative flex-1 min-w-0 group/code">
                    <div className="absolute right-2 top-2 opacity-0 group-hover/code:opacity-100 transition-opacity z-10">
                        <button
                            onClick={handleCopy}
                            className="p-1.5 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded text-neutral-600 dark:text-neutral-300 transition-colors"
                            title="Copy code"
                        >
                            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                    <div
                        ref={contentRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={handleInput}
                        onKeyDown={handleKeyDownLocal}
                        onFocus={() => onFocus(block.id)}
                        className="w-full bg-neutral-100 dark:bg-neutral-800 p-4 rounded-md font-mono text-sm text-neutral-800 dark:text-neutral-200 outline-none whitespace-pre overflow-x-auto"
                        data-block-id={block.id}
                        spellCheck={false}
                    />
                </div>
            ) : block.type === 'quote' ? (
                <div className="relative w-full group/quote flex-1">
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
                        contentEditable
                        suppressContentEditableWarning
                        onInput={handleInput}
                        onKeyDown={handleKeyDownLocal}
                        onPaste={handlePaste}
                        onFocus={() => onFocus(block.id)}
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
                <div className="w-full">
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
                        <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-md text-neutral-500 flex items-center gap-2">
                            <Video className="w-5 h-5" />
                            <span>Add a video embed link...</span>
                        </div>
                    )}
                </div>
            ) : block.type === 'callout' ? (
                <div className="w-full p-4 bg-neutral-100 dark:bg-neutral-800 rounded-md flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                        <Info className="w-5 h-5 text-neutral-500" />
                    </div>
                    <div
                        ref={contentRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={handleInput}
                        onKeyDown={handleKeyDownLocal}
                        onPaste={handlePaste}
                        onFocus={() => onFocus(block.id)}
                        className="flex-1 outline-none text-neutral-800 dark:text-neutral-200 empty:before:content-['Shift+Enter_for_next_line'] empty:before:text-neutral-400"
                        data-block-id={block.id}
                    />
                </div>
            ) : block.type === 'table' ? (
                <TableBlock block={block} onUpdate={onUpdate!} />
            ) : block.type === 'column_container' ? (
                <ColumnBlock block={block} documentId={documentId} onUpdate={onUpdate!} />
            ) : (
                <div
                    ref={contentRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleInput}
                    onKeyDown={handleKeyDownLocal}
                    onPaste={handlePaste}
                    onFocus={() => onFocus(block.id)}
                    className={cn(
                        "flex-1 outline-none min-h-[1.5em]",
                        !textColor && "text-neutral-800 dark:text-neutral-200",
                        block.type === 'h1' && "text-3xl font-bold mb-2",
                        block.type === 'h2' && "text-2xl font-semibold mb-2",
                        block.type === 'h3' && "text-xl font-medium mb-1",
                        block.type === 'todo' && block.props?.checked && "line-through text-neutral-400",
                        "empty:before:content-[''] empty:before:text-neutral-300 focus:empty:before:content-['Type_/_for_options.']",
                        (block.type === 'h1' || block.type === 'h2' || block.type === 'h3') && "placeholder:text-neutral-200"
                    )}
                    data-block-id={block.id}
                />
            )}
        </div>
    );
});
