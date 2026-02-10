import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useDocumentStore, BlockType } from '../../store/useDocumentStore';
import { extractIdFromSlug, toPageSlug } from '../../lib/slugUtils';
import { SortableBlock } from './SortableBlock';
import { SlashMenu } from './SlashMenu';
import { MentionMenu } from './MentionMenu';
import { FloatingToolbar } from './FloatingToolbar';
import { v4 as uuidv4 } from 'uuid';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { EditorSkeleton } from '../Skeletons/EditorSkeleton';
import { DocumentHeader } from './DocumentHeader';
import { cn } from '../../lib/utils';
import { isLikelyMarkdown, parseMarkdownToBlocks } from '../../utils/markdownUtils';
export function Editor() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const documentId = extractIdFromSlug(slug || '');

    const content = useDocumentStore(useCallback(state => documentId ? state.documents[documentId]?.content : undefined, [documentId]));
    const isFullWidth = useDocumentStore(useCallback(state => documentId ? state.documents[documentId]?.isFullWidth : undefined, [documentId]));
    const fontStyle = useDocumentStore(useCallback(state => documentId ? state.documents[documentId]?.fontStyle : undefined, [documentId]));
    const isLocked = useDocumentStore(useCallback(state => documentId ? state.documents[documentId]?.isLocked : undefined, [documentId]));
    const isSmallText = useDocumentStore(useCallback(state => documentId ? state.documents[documentId]?.isSmallText : undefined, [documentId]));

    // We need documents for the mention click handler
    const { moveBlock, updateBlock: updateBlockStore, addBlock: addBlockStore, deleteBlock: deleteBlockStore, duplicateBlock: duplicateBlockStore, isLoading, documents } = useDocumentStore();
    const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
    const [focusPosition, setFocusPosition] = useState<'start' | 'end'>('start');
    const [slashMenu, setSlashMenu] = useState<{ isOpen: boolean; anchorRect: DOMRect; blockId: string } | null>(null);
    const [mentionMenu, setMentionMenu] = useState<{ isOpen: boolean; anchorRect: DOMRect; blockId: string; query: string } | null>(null);

    // Refs for non-rendering state
    const slashMenuRef = useRef(slashMenu);
    const mentionMenuRef = useRef(mentionMenu);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const location = useLocation();

    // No need for currentDocRef anymore - handlers will read from store directly

    // Helper to get fresh doc state
    const getDoc = () => {
        if (!documentId) return null;
        return useDocumentStore.getState().documents[documentId];
    };

    // Focus title if requested via navigation state
    useEffect(() => {
        const doc = getDoc();
        if (location.state?.focusTitle && !isLoading && doc) {
            // Small timeout to ensure input is mounted and ready
            setTimeout(() => {
                titleInputRef.current?.focus();
                // Select all text in title if unnecessary? No, usually empty for new pages.
            }, 100);

            // Clear the state so it doesn't refocus on refresh? 
            // In react-router v6, we can't easily clear state without navigating again with replace.
            // But since we navigate away or reload, it might persist.
            // A simple way is to check if title is 'Untitled'.
        }
    }, [location.state, isLoading, documentId]);

    // Auto-sync URL slug when title changes
    const docTitle = useDocumentStore(useCallback(state => documentId ? state.documents[documentId]?.title : undefined, [documentId]));
    useEffect(() => {
        if (documentId && docTitle && slug) {
            const expectedSlug = toPageSlug(docTitle, documentId);
            const currentPath = `/${slug}`;
            if (currentPath !== expectedSlug) {
                navigate(expectedSlug, { replace: true });
            }
        }
    }, [docTitle, documentId, slug, navigate]);

    useEffect(() => {
        slashMenuRef.current = slashMenu;
    }, [slashMenu]);

    useEffect(() => {
        mentionMenuRef.current = mentionMenu;
    }, [mentionMenu]);

    // Focus title logic handled in DocumentHeader now. 
    // But we might need check for existence or loading
    if ((!content) && !isLoading && documentId) {
        // Double check existence in store directly to avoid race conditions?
        // Actually, if content is undefined, it means doc doesn't exist or not loaded.
    }


    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (focusedBlockId && documentId) {
            // Small timeout to allow render to complete
            setTimeout(() => {
                const el = document.querySelector(`[data-block-id="${focusedBlockId}"]`) as HTMLElement;
                if (el) {
                    el.focus();
                    if (focusPosition === 'end') {
                        // Move cursor to end
                        const range = document.createRange();
                        range.selectNodeContents(el);
                        range.collapse(false);
                        const sel = window.getSelection();
                        sel?.removeAllRanges();
                        sel?.addRange(range);
                    }
                }
                setFocusedBlockId(null);
                setFocusPosition('start'); // Reset default
            }, 0);
        }
    }, [focusedBlockId, documentId, focusPosition]);


    const handleSlashMenu = useCallback((blockId: string) => {
        const el = document.querySelector(`[data-block-id="${blockId}"]`) as HTMLElement;
        if (el) {
            const rect = el.getBoundingClientRect();
            setSlashMenu({
                isOpen: true,
                anchorRect: rect,
                blockId
            });
        }
    }, []);

    const handleMentionMenu = useCallback((blockId: string, query: string = '') => {
        const el = document.querySelector(`[data-block-id="${blockId}"]`) as HTMLElement;
        if (el) {
            const rect = el.getBoundingClientRect();
            setMentionMenu({
                isOpen: true,
                anchorRect: rect,
                blockId,
                query
            });
        }
    }, []);

    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    (useDocumentStore as any).temporal.getState().redo();
                } else {
                    (useDocumentStore as any).temporal.getState().undo();
                }
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    // Global Markdown paste handler
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (!documentId) return;
            const doc = getDoc();
            if (!doc) return;

            const text = e.clipboardData?.getData('text/plain');
            if (!text) return;

            // Fast multi-line check using indexOf (faster than split)
            if (text.indexOf('\n') === -1) return;
            if (!isLikelyMarkdown(text)) return;

            e.preventDefault();
            const newBlocks = parseMarkdownToBlocks(text);
            const startIndex = doc.content.length;

            // Use for loop for better performance
            for (let i = 0; i < newBlocks.length; i++) {
                addBlockStore(documentId, newBlocks[i], startIndex + i);
            }
        };

        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, [documentId, addBlockStore]);

    const updateBlockContent = useCallback((blockId: string, content: string) => {
        if (!documentId) return;
        // Use store action to avoid stale closure issues
        updateBlockStore(documentId, blockId, { content });

        // Handle Slash Menu Trigger
        // Handle Mention Trigger
        const lastOpen = content.lastIndexOf('[[');
        const lastClose = content.lastIndexOf(']]');

        if (content.startsWith('/')) {
            if (!slashMenuRef.current) {
                handleSlashMenu(blockId);
            }
        } else if (lastOpen !== -1 && lastOpen > lastClose) {
            const query = content.substring(lastOpen + 2);
            if (!mentionMenuRef.current) {
                handleMentionMenu(blockId, query);
            } else {
                setMentionMenu(prev => prev ? { ...prev, query } : null);
            }
        } else {
            if (slashMenuRef.current && slashMenuRef.current.blockId === blockId) {
                setSlashMenu(null);
            }
            if (mentionMenuRef.current && mentionMenuRef.current.blockId === blockId) {
                setMentionMenu(null);
            }
        }
    }, [documentId, updateBlockStore, handleSlashMenu, handleMentionMenu]);

    const handleMentionSelect = useCallback((docId: string, title: string) => {
        if (!mentionMenu) return;

        const { blockId } = mentionMenu;
        const el = document.querySelector(`[data-block-id="${blockId}"]`) as HTMLElement;
        if (!el) return;

        // Replace [[query]] with a link
        const content = el.innerHTML;
        const lastMentionIndex = content.lastIndexOf('[[');
        if (lastMentionIndex !== -1) {
            const targetDoc = documents[docId];
            const mentionSlug = toPageSlug(targetDoc?.title || title, docId);
            const newContent = content.substring(0, lastMentionIndex) +
                `<a href="${mentionSlug}" class="text-blue-600 dark:text-blue-400 font-medium underline decoration-blue-500/30 underline-offset-4 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-1 rounded transition-colors" data-mention="true">@${title}</a>&nbsp;`;

            updateBlockStore(documentId!, blockId, { content: newContent });

            // Set focus back and move cursor
            setFocusedBlockId(blockId);
            setFocusPosition('end');
        }

        setMentionMenu(null);
    }, [mentionMenu, documentId, updateBlockStore]);

    const updateBlockType = useCallback((blockId: string, type: string) => {
        if (!documentId) return;
        updateBlockStore(documentId, blockId, { type: type as BlockType });
    }, [documentId, updateBlockStore]);

    // Independent update handler similar to updateBlockContent but for arbitrary props
    const onUpdateBlock = useCallback((blockId: string, props: any) => {
        if (!documentId) return;
        updateBlockStore(documentId, blockId, props);
    }, [documentId, updateBlockStore]);

    const onFocusBlock = useCallback(() => { }, []); // No-op, just for interface

    const addBlock = useCallback((afterBlockId: string, type: BlockType = 'text') => {
        if (!documentId) return;
        const doc = getDoc();
        if (!doc) return;

        const currentContent = doc.content;

        const prevBlock = currentContent.find(b => b.id === afterBlockId);
        const level = prevBlock?.props?.level || 0;

        const newBlockId = uuidv4();
        const newBlock = {
            id: newBlockId,
            type,
            content: '',
            props: { level }
        };
        const index = currentContent.findIndex(b => b.id === afterBlockId);

        // Call store action
        addBlockStore(documentId, newBlock, index + 1);

        setFocusedBlockId(newBlockId);
        setFocusPosition('start');
    }, [documentId, addBlockStore]);

    const deleteBlock = useCallback((blockId: string) => {
        if (!documentId) return;
        const doc = getDoc();
        if (!doc) return;

        const currentContent = doc.content;

        if (currentContent.length <= 1) return;

        const index = currentContent.findIndex(b => b.id === blockId);
        const prevBlock = currentContent[index - 1];

        deleteBlockStore(documentId, blockId);

        if (prevBlock) {
            setFocusedBlockId(prevBlock.id);
            setFocusPosition('end');
        }
    }, [documentId, deleteBlockStore]);

    const onDuplicateBlock = useCallback(async (blockId: string) => {
        if (!documentId) return;
        const newBlockId = await duplicateBlockStore(documentId, blockId);
        if (newBlockId) {
            setFocusedBlockId(newBlockId);
            setFocusPosition('start'); // Or end, doesn't matter much for duplicate
        }
    }, [documentId, duplicateBlockStore]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent, blockId: string) => {
        if (!documentId) return;
        const doc = getDoc();
        if (!doc) return;

        const currentContent = doc.content;

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (slashMenuRef.current?.isOpen) return;

            const currentBlock = currentContent.find(b => b.id === blockId);
            let nextType: BlockType = 'text';

            if (currentBlock) {
                // Logic to terminate list:
                // If the block is empty AND it is a list type, convert to text and STOP
                const isListType = ['bullet', 'number', 'todo', 'quote'].includes(currentBlock.type);
                const isEmpty = !currentBlock.content || currentBlock.content === '' || currentBlock.content === '<br>';

                if (isListType && isEmpty) {
                    updateBlockType(blockId, 'text');
                    return;
                }

                if (['bullet', 'number', 'todo'].includes(currentBlock.type)) {
                    nextType = currentBlock.type;
                }
            }

            addBlock(blockId, nextType);
        } else if (e.key === 'Tab') {
            e.preventDefault();
            const block = currentContent.find(b => b.id === blockId);
            if (!block) return;

            const currentLevel = block.props?.level || 0;
            let newLevel = currentLevel;

            if (e.shiftKey) {
                // Outdent
                newLevel = Math.max(0, currentLevel - 1);
            } else {
                // Indent
                // Optional: Check if previous block allows indentation (e.g. not indenting deeper than prev + 1)
                // For now, strict max level 3
                newLevel = Math.min(3, currentLevel + 1);
            }

            if (newLevel !== currentLevel) {
                updateBlockStore(documentId, blockId, { props: { ...block.props, level: newLevel } });
            }
        } else if (e.key === 'Backspace') {
            const block = currentContent.find(b => b.id === blockId);
            const index = currentContent.findIndex(b => b.id === blockId);

            // Check if cursor is at the start of the block
            const selection = window.getSelection();
            const range = selection?.getRangeAt(0);
            const isAtStart = range?.startOffset === 0 && range?.collapsed;

            if (isAtStart && index > 0) {
                const prevBlock = currentContent[index - 1];
                // If previous block is a "void" block (not text-editable in the flow), delete it
                if (prevBlock && ['divider', 'image', 'video', 'callout'].includes(prevBlock.type)) {
                    e.preventDefault();
                    // Setup deletion of previous block
                    deleteBlockStore(documentId, prevBlock.id);
                    // Keep focus on current block
                    return;
                }
            }

            // Checking content emptiness more robustly
            // contentEditable can leave <br>, or sometimes just whitespace if not trimmed properly
            const isContentEmpty = !block?.content || block.content === '' || block.content === '<br>' || block.content === '\n';

            if (block && isContentEmpty) {
                if (currentContent.length > 1) {
                    e.preventDefault();
                    if (slashMenuRef.current?.isOpen) setSlashMenu(null);
                    deleteBlock(blockId);
                }
            } else if (block && slashMenuRef.current?.isOpen) {
                if (block.content === '/') {
                    setSlashMenu(null);
                }
            }
        }
    }, [addBlock, deleteBlock, updateBlockType, documentId, deleteBlockStore, updateBlockStore]); // Stable dependencies

    const handleSlashSelect = useCallback((type: BlockType, extraProps?: Record<string, any>) => {
        if (slashMenuRef.current && documentId) {
            const menu = slashMenuRef.current;
            // Forcefully clear the DOM content immediately to prevent persistence
            const el = document.querySelector(`[data-block-id="${menu.blockId}"]`) as HTMLElement;
            if (el) el.innerHTML = '';

            // Handle column_container initialization
            if (type === 'column_container') {
                const numColumns = extraProps?.columns || 2;
                const emptyColumns = Array.from({ length: numColumns }, () => []);
                updateBlockStore(documentId, menu.blockId, {
                    type: type as BlockType,
                    content: '',
                    props: { columns: emptyColumns }
                });
            } else {
                // Updating atomically via store actions
                updateBlockStore(documentId, menu.blockId, { type: type as BlockType, content: '' });
            }

            setSlashMenu(null);
            setFocusedBlockId(menu.blockId);
        }
    }, [documentId, updateBlockStore]);


    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id && documentId) {
            const doc = getDoc();
            if (!doc) return;
            const currentContent = doc.content;

            const oldIndex = currentContent.findIndex((b) => b.id === active.id);
            const newIndex = currentContent.findIndex((b) => b.id === over?.id);

            moveBlock(documentId, oldIndex, newIndex);
        }
    }, [documentId, moveBlock]);

    const visibleBlocks = useMemo(() => {
        if (!content) return [];
        const blocks: typeof content = [];
        let hiddenThreshold: number | null = null;

        for (const block of content) {
            const level = block.props?.level || 0;

            if (hiddenThreshold !== null) {
                if (level > hiddenThreshold) {
                    continue;
                } else {
                    hiddenThreshold = null;
                }
            }

            blocks.push(block);

            if (block.type === 'toggle') {
                const isOpen = block.props?.isOpen ?? true;
                if (!isOpen) {
                    hiddenThreshold = level;
                }
            }
        }
        return blocks;
    }, [content]);

    if (!documentId) return <div className="flex-1 flex items-center justify-center text-neutral-500">Select a page to start editing</div>;
    if (isLoading && !content) return <EditorSkeleton />;

    if (!content) return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mb-4 text-3xl">
                🤔
            </div>
            <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-2">Page Not Found</h2>
            <p className="text-neutral-500 max-w-sm mb-6">
                This page doesn't exist or has been deleted.
            </p>
            <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
            >
                Go to Home
            </button>
        </div>
    );

    return (
        <div className={cn(
            "transition-all duration-300",
            fontStyle === 'serif' && "font-serif",
            fontStyle === 'mono' && "font-mono",
            (!fontStyle || fontStyle === 'sans') && "font-sans"
        )}>
            {/* Header */}
            <DocumentHeader documentId={documentId!} />

            {/* Content area with proper padding */}
            <div className={cn(
                "mx-auto px-4 md:px-12 pb-32 transition-all duration-300",
                isFullWidth ? "max-w-full px-4 md:px-24" : "max-w-3xl",
                isSmallText ? "text-sm" : "text-base"
            )}>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={visibleBlocks}
                        strategy={verticalListSortingStrategy}
                    >
                        <div
                            className="flex flex-col pb-32 min-h-[50vh] cursor-text"
                            onClick={(e) => {
                                // Prevent adding blocks if locked
                                if (isLocked) return;

                                // Handle mention clicks
                                const target = e.target as HTMLElement;
                                if (target.tagName === 'A' && target.getAttribute('data-mention') === 'true') {
                                    e.preventDefault();
                                    const href = target.getAttribute('href');
                                    const targetId = href ? extractIdFromSlug(href) : null;

                                    if (targetId && documents[targetId]) {
                                        navigate(toPageSlug(documents[targetId].title, targetId));
                                    } else {
                                        console.warn(`Page not found: ${targetId}`);
                                    }
                                    return;
                                }

                                if (target !== e.currentTarget) return;

                                const doc = getDoc();
                                const content = doc?.content;
                                if (!content || content.length === 0) return;

                                const lastBlock = content[content.length - 1];

                                if (lastBlock.type === 'text' && !lastBlock.content) {
                                    const el = document.querySelector(`[data-block-id="${lastBlock.id}"]`) as HTMLElement;
                                    el?.focus();
                                } else {
                                    addBlock(lastBlock.id, 'text');
                                }
                            }}
                        >
                            {(() => {
                                const counts: Record<number, number> = {};

                                return visibleBlocks.map((block, index) => {
                                    let blockIndex: number | undefined = undefined;
                                    const level = block.props?.level || 0;

                                    if (block.type === 'number') {
                                        counts[level] = (counts[level] || 0) + 1;
                                        blockIndex = counts[level];

                                        for (let l = level + 1; l < 10; l++) {
                                            counts[l] = 0;
                                        }
                                    } else {
                                        for (let l = level; l < 10; l++) {
                                            counts[l] = 0;
                                        }
                                    }

                                    const isList = ['bullet', 'number', 'todo'].includes(block.type);
                                    const prevBlock = index > 0 ? visibleBlocks[index - 1] : null;
                                    const isGrouped = isList && prevBlock && prevBlock.type === block.type;

                                    return (
                                        <div key={block.id} className={cn("relative group/block", isLocked && "pointer-events-none")}>
                                            <SortableBlock
                                                block={block}
                                                documentId={documentId!}
                                                onChange={updateBlockContent}
                                                onKeyDown={handleKeyDown}
                                                onFocus={onFocusBlock}
                                                onTypeChange={updateBlockType}
                                                onSlashMenu={handleSlashMenu}
                                                onUpdate={onUpdateBlock}
                                                onDelete={deleteBlock}
                                                onDuplicate={onDuplicateBlock}
                                                index={blockIndex}
                                                className={isGrouped ? "mt-0" : "mt-2"}
                                                readOnly={isLocked}
                                            />
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </SortableContext>
                </DndContext>

                {slashMenu?.isOpen && (
                    <SlashMenu
                        anchorRect={slashMenu.anchorRect}
                        onSelect={handleSlashSelect}
                        onClose={() => setSlashMenu(null)}
                        query={
                            (() => {
                                const doc = getDoc();
                                return doc?.content.find(b => b.id === slashMenu.blockId)?.content.slice(1) || ''
                            })()
                        }
                    />
                )}
                {mentionMenu?.isOpen && (
                    <MentionMenu
                        anchorRect={mentionMenu.anchorRect}
                        onSelect={handleMentionSelect}
                        onClose={() => setMentionMenu(null)}
                        query={mentionMenu.query}
                    />
                )}
                <FloatingToolbar />
            </div>
        </div>
    );
}

