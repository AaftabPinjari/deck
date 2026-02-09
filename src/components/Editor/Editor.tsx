import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useDocumentStore, BlockType } from '../../store/useDocumentStore';
import { SortableBlock } from './SortableBlock';
import { SlashMenu } from './SlashMenu';
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
import { SingleIconPicker } from '../ui/IconPicker';
import { CoverImagePicker } from '../ui/CoverImagePicker';
import { ImageIcon, X } from 'lucide-react';
import { cn } from '../../lib/utils';
export function Editor() {
    const { documentId } = useParams();
    const currentDoc = useDocumentStore(useCallback((state) => documentId ? state.documents[documentId] : null, [documentId]));
    const { updateDocument, moveBlock, updateBlock: updateBlockStore, addBlock: addBlockStore, deleteBlock: deleteBlockStore, duplicateBlock: duplicateBlockStore, isLoading } = useDocumentStore();
    const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
    const [focusPosition, setFocusPosition] = useState<'start' | 'end'>('start');
    const [slashMenu, setSlashMenu] = useState<{ isOpen: boolean; anchorRect: DOMRect; blockId: string } | null>(null);

    // Use refs to access latest state in callbacks without triggering re-creation
    const currentDocRef = useRef(currentDoc);
    const slashMenuRef = useRef(slashMenu);

    useEffect(() => {
        currentDocRef.current = currentDoc;
    }, [currentDoc]);

    useEffect(() => {
        slashMenuRef.current = slashMenu;
    }, [slashMenu]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (focusedBlockId && currentDoc) {
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
    }, [focusedBlockId, currentDoc?.content, focusPosition]);

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

    const updateBlockContent = useCallback((blockId: string, content: string) => {
        if (!documentId) return;
        // Use store action to avoid stale closure issues
        updateBlockStore(documentId, blockId, { content });

        // Handle Slash Menu Trigger
        if (content.startsWith('/')) {
            if (!slashMenuRef.current) {
                handleSlashMenu(blockId);
            }
        } else if (slashMenuRef.current && slashMenuRef.current.blockId === blockId) {
            setSlashMenu(null);
        }
    }, [documentId, updateBlockStore, handleSlashMenu]);

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
        if (!documentId || !currentDocRef.current) return;
        const currentContent = currentDocRef.current.content;

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
        if (!documentId || !currentDocRef.current) return;
        const currentContent = currentDocRef.current.content;

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
        if (!currentDocRef.current || !documentId) return;
        const currentContent = currentDocRef.current.content;

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

    const handleSlashSelect = useCallback((type: BlockType) => {
        if (slashMenuRef.current && documentId) {
            const menu = slashMenuRef.current;
            // Forcefully clear the DOM content immediately to prevent persistence
            const el = document.querySelector(`[data-block-id="${menu.blockId}"]`) as HTMLElement;
            if (el) el.innerHTML = '';

            // Updating atomically via store actions
            updateBlockStore(documentId, menu.blockId, { type: type as BlockType, content: '' });

            setSlashMenu(null);
            setFocusedBlockId(menu.blockId);
        }
    }, [documentId, updateBlockStore]);


    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id && documentId && currentDocRef.current) {
            const currentContent = currentDocRef.current.content;
            const oldIndex = currentContent.findIndex((b) => b.id === active.id);
            const newIndex = currentContent.findIndex((b) => b.id === over?.id);

            moveBlock(documentId, oldIndex, newIndex);
        }
    }, [documentId, moveBlock]);

    const visibleBlocks = useMemo(() => {
        if (!currentDoc) return [];
        const blocks: typeof currentDoc.content = [];
        let hiddenThreshold: number | null = null;

        for (const block of currentDoc.content) {
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
    }, [currentDoc]);

    if (!documentId) return <div>Select a page</div>;
    if (isLoading && !currentDoc) return <EditorSkeleton />;
    if (!currentDoc) return <div>Page not found</div>;

    if (!currentDoc) return <div>Page not found</div>;

    return (
        <div className={cn(
            "mx-auto py-12 px-12 pb-32 transition-all duration-300",
            currentDoc.isFullWidth ? "max-w-full px-24" : "max-w-3xl",
            currentDoc.fontStyle === 'serif' && "font-serif",
            currentDoc.fontStyle === 'mono' && "font-mono",
            (!currentDoc.fontStyle || currentDoc.fontStyle === 'sans') && "font-sans"
        )}>

            {/* Cover Image */}
            <div className="group relative h-[20vh] w-full mb-8 group/cover">
                {currentDoc.coverImage ? (
                    <div
                        className="w-full h-full bg-cover bg-center rounded-md"
                        style={{ backgroundImage: `url(${currentDoc.coverImage})` }}
                    />
                ) : (
                    <div className="w-full h-full hidden group-hover/cover:block bg-neutral-100 dark:bg-neutral-800 rounded-md transition-all">
                        <div className="h-full flex items-center justify-center text-neutral-400">
                            <CoverImagePicker onChange={(url) => updateDocument(documentId, { coverImage: url })}>
                                <button className="flex items-center gap-2 text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 px-3 py-2 rounded text-neutral-500">
                                    <ImageIcon className="h-4 w-4" />
                                    Add cover
                                </button>
                            </CoverImagePicker>
                        </div>
                    </div>
                )}

                {currentDoc.coverImage && (
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover/cover:opacity-100 transition-opacity flex gap-2">
                        <CoverImagePicker onChange={(url) => updateDocument(documentId, { coverImage: url })}>
                            <button className="text-xs bg-white/80 hover:bg-white dark:bg-black/50 dark:hover:bg-black/70 text-neutral-700 dark:text-neutral-300 px-2 py-1 rounded">
                                Change cover
                            </button>
                        </CoverImagePicker>
                        <button
                            onClick={() => updateDocument(documentId, { coverImage: undefined })}
                            className="text-xs bg-white/80 hover:bg-white dark:bg-black/50 dark:hover:bg-black/70 text-neutral-700 dark:text-neutral-300 px-2 py-1 rounded"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                )}
            </div>

            {/* Icon Picker */}
            <div className="mb-8 group">
                <SingleIconPicker
                    icon={currentDoc.icon}
                    onChange={(icon) => updateDocument(documentId, { icon })}
                />
            </div>

            <input
                className="w-full text-4xl font-bold outline-none bg-transparent placeholder:text-neutral-300 mb-8 text-neutral-800 dark:text-neutral-100 placeholder-opacity-50"
                value={currentDoc.title}
                onChange={(e) => updateDocument(documentId, { title: e.target.value })}
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
            />

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
                            // Only handle clicks directly on the container (empty space)
                            if (e.target !== e.currentTarget) return;

                            const content = currentDocRef.current?.content;
                            if (!content || content.length === 0) return;

                            const lastBlock = content[content.length - 1];

                            // If last block is empty text, focus it
                            if (lastBlock.type === 'text' && !lastBlock.content) {
                                const el = document.querySelector(`[data-block-id="${lastBlock.id}"]`) as HTMLElement;
                                el?.focus();
                            } else {
                                // Otherwise add new block at the end
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
                                    // Increment count for current level
                                    counts[level] = (counts[level] || 0) + 1;
                                    blockIndex = counts[level];

                                    // Reset all deeper levels
                                    for (let l = level + 1; l < 10; l++) {
                                        counts[l] = 0;
                                    }
                                } else {
                                    // Non-number block: reset counts for this level and all deeper
                                    // This ensures lists break when interrupted by other content at the same level
                                    for (let l = level; l < 10; l++) {
                                        counts[l] = 0;
                                    }
                                }

                                // Determine visual grouping
                                const isList = ['bullet', 'number', 'todo'].includes(block.type);
                                const prevBlock = index > 0 ? visibleBlocks[index - 1] : null;
                                const isGrouped = isList && prevBlock && prevBlock.type === block.type;

                                return (
                                    <SortableBlock
                                        key={block.id}
                                        block={block}
                                        documentId={documentId}
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
                                    />
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
                        currentDoc.content.find(b => b.id === slashMenu.blockId)?.content.slice(1) || ''
                    }
                />
            )}
            <FloatingToolbar />
        </div>
    );
}
