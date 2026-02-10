import { useState, memo, useMemo, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    ChevronRight,
    Plus,
    Trash,
    FileText,
    Settings
} from 'lucide-react';
import { UserMenu } from './UserMenu';
import { useDocumentStore, Document } from '../store/useDocumentStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { cn } from '../lib/utils';
import { Modal } from './ui/Modal';
import { SettingsModal } from './Settings/SettingsModal';
import { SidebarSkeleton } from './Skeletons/SidebarSkeleton';
import { TrashBox } from './TrashBox';
import { TemplatesModal } from './Templates/TemplatesModal';
import { Layout } from 'lucide-react';
import { toPageSlug } from '../lib/slugUtils';

// DnD Imports
import {
    DndContext,
    pointerWithin,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DropAnimation,
    DragOverEvent,
    MeasuringStrategy
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';

type DropPosition = 'top' | 'bottom' | 'nest' | null;

interface DocumentItemProps {
    document: Document;
    level?: number;
    onDeleteLabel: (doc: Document) => void;
    isOverlay?: boolean;
    dropState?: { overId: string; position: DropPosition };
}

const DocumentItem = memo(function DocumentItem({ document, level = 0, onDeleteLabel, isOverlay, dropState }: DocumentItemProps) {
    const navigate = useNavigate();
    const { createDocument, toggleExpand, toggleFavorite, updateDocument } = useDocumentStore();
    const hasChildren = document.children.length > 0;
    const isExpanded = document.isExpanded;

    const [isRenaming, setIsRenaming] = useState(false);
    const [title, setTitle] = useState(document.title || 'Untitled');

    const {
        attributes,
        listeners,
        setNodeRef,
        transition,
        isDragging
    } = useSortable({ id: document.id, data: { document } });

    const handleCreateChild = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const newDocId = await createDocument(document.id);
        navigate(toPageSlug('Untitled', newDocId));
    };

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleExpand(document.id);
    };

    const handleRename = async () => {
        setIsRenaming(false);
        if (title.trim() === '') {
            setTitle(document.title || 'Untitled');
            return;
        }
        await updateDocument(document.id, { title: title });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleRename();
        } else if (e.key === 'Escape') {
            setIsRenaming(false);
            setTitle(document.title || 'Untitled');
        }
    };

    const isOver = dropState?.overId === document.id;
    const dropPosition = isOver ? dropState.position : null;
    const isNesting = dropPosition === 'nest';
    const showTopBar = dropPosition === 'top';
    const showBottomBar = dropPosition === 'bottom';

    return (
        <div
            ref={setNodeRef}
            id={`sidebar-item-${document.id}`}
            style={{ transition, opacity: isDragging ? 0.3 : 1 }}
            className={cn(
                "relative select-none rounded-md transition-colors duration-150",
                isOverlay && "opacity-100 bg-white dark:bg-neutral-800 shadow-xl border border-neutral-200 dark:border-neutral-700",
                isNesting && !isDragging && "bg-blue-100 dark:bg-blue-900/30"
            )}
        >
            {!isDragging && !isOverlay && showTopBar && (
                <div className="absolute -top-0.5 left-2 right-2 h-0.5 bg-blue-500 z-50 pointer-events-none rounded-full" />
            )}

            <div
                {...attributes}
                {...listeners}
                className={cn(
                    "group flex items-center py-1.5 pr-2 text-sm rounded-sm min-h-[28px] cursor-grab active:cursor-grabbing",
                    "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800",
                    isNesting && "bg-transparent hover:bg-transparent"
                )}
                style={{ paddingLeft: `${level * 16 + 8}px` }}
            >
                {/* Chevron - always takes space, invisible if no children */}
                <div
                    className={cn(
                        "flex items-center justify-center w-5 h-5 shrink-0 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer",
                        !hasChildren && "invisible"
                    )}
                    onClick={handleToggle}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <ChevronRight className={cn("h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400 transition-transform", isExpanded && "rotate-90")} />
                </div>

                {isRenaming ? (
                    <div
                        className="flex items-center gap-2 flex-1 min-w-0"
                        onClick={(e) => e.preventDefault()}
                    >
                        <div className="flex items-center justify-center h-5 w-5 shrink-0 text-base">
                            {document.icon || <FileText className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />}
                        </div>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleRename}
                            onKeyDown={(e) => {
                                e.stopPropagation(); // Prevent dnd-kit interference
                                handleKeyDown(e);
                            }}
                            autoFocus
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            onPointerDown={(e) => e.stopPropagation()} // Prevent dnd-kit drag start
                            onMouseDown={(e) => e.stopPropagation()}
                            className="flex-1 h-6 px-1 bg-white dark:bg-neutral-900 border border-blue-500 rounded text-sm focus:outline-none"
                        />
                    </div>
                ) : (
                    <NavLink
                        to={toPageSlug(document.title, document.id)}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-2 flex-1 min-w-0 rounded",
                                isActive && "text-neutral-900 dark:text-neutral-100 font-medium"
                            )
                        }
                    >
                        <div className="flex items-center justify-center h-5 w-5 shrink-0 text-base">
                            {document.icon || <FileText className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />}
                        </div>
                        <span
                            className="truncate flex-1"
                            onDoubleClick={(e) => {
                                e.preventDefault();
                                setIsRenaming(true);
                            }}
                        >
                            {document.title || 'Untitled'}
                        </span>
                    </NavLink>
                )}

                {!isRenaming && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <div
                            role="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleFavorite(document.id);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-500"
                        >
                            {document.isFavorite ? <span className="text-yellow-500 text-xs">★</span> : <span className="text-neutral-500 dark:text-neutral-400 text-xs">☆</span>}
                        </div>
                        <div
                            role="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onDeleteLabel(document);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-600 dark:text-neutral-400"
                        >
                            <Trash className="h-3 w-3" />
                        </div>
                        <div
                            role="button"
                            onClick={handleCreateChild}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-600 dark:text-neutral-400"
                        >
                            <Plus className="h-3 w-3" />
                        </div>
                    </div>
                )}
            </div>

            {!isDragging && !isOverlay && showBottomBar && (
                <div className="absolute -bottom-0.5 left-2 right-2 h-0.5 bg-blue-500 z-50 pointer-events-none rounded-full" />
            )}

            {isExpanded && hasChildren && !isOverlay && (
                <div className="mt-1">
                    <DocumentList parentId={document.id} level={level + 1} onDeleteLabel={onDeleteLabel} dropState={dropState} />
                </div>
            )}
        </div>
    );
});

interface DocumentListProps {
    parentId?: string | null;
    level?: number;
    onDeleteLabel: (doc: Document) => void;
    dropState?: { overId: string; position: DropPosition };
}

const DocumentList = ({ parentId = null, level = 0, onDeleteLabel, dropState }: DocumentListProps) => {
    const { documents, rootDocumentIds } = useDocumentStore();

    const docIds = parentId
        ? documents[parentId]?.children
        : rootDocumentIds;

    if (!docIds || docIds.length === 0) {
        if (level === 0 && !parentId) return <div className="p-4 text-xs text-neutral-500 dark:text-neutral-400 italic">No pages yet</div>;
        return null;
    }

    const validDocIds = docIds.filter(id => documents[id] && !documents[id].isArchived);

    return (
        <SortableContext items={validDocIds} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-0.5">
                {validDocIds.map(id => (
                    <DocumentItem
                        key={id}
                        document={documents[id]}
                        level={level}
                        onDeleteLabel={onDeleteLabel}
                        dropState={dropState}
                    />
                ))}
            </div>
        </SortableContext>
    );
};

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: '0.5',
            },
        },
    }),
};

export function Sidebar() {
    const navigate = useNavigate();
    const { documents, createDocument, archiveDocument, isLoading, moveDocument, error, fetchDocuments } = useDocumentStore();
    const { toggleSettings } = useSettingsStore();
    const [docToDelete, setDocToDelete] = useState<Document | null>(null);
    const [isTrashOpen, setIsTrashOpen] = useState(false);
    const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
    const { isMobileSidebarOpen, setIsMobileSidebarOpen } = useSettingsStore();

    // DnD State
    const [activeDragDoc, setActiveDragDoc] = useState<Document | null>(null);
    const [dropState, setDropState] = useState<{ overId: string; position: DropPosition }>({ overId: '', position: null });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const favorites = useMemo(() =>
        Object.values(documents).filter(doc => doc.isFavorite && !doc.isArchived),
        [documents]
    );

    const handleAddPage = useCallback(async () => {
        const newId = await createDocument();
        navigate(toPageSlug('Untitled', newId), { state: { focusTitle: true } });
        setIsMobileSidebarOpen(false);
    }, [createDocument, navigate, setIsMobileSidebarOpen]);

    const confirmDelete = useCallback(() => {
        if (docToDelete) {
            archiveDocument(docToDelete.id);
            navigate('/');
            setDocToDelete(null);
        }
    }, [docToDelete, archiveDocument, navigate]);

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const doc = documents[active.id as string];
        if (doc) setActiveDragDoc(doc);
    };

    // Calculate Y relative to the dragged item OR pointer
    // Using pointer is safer when items don't shift.
    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;

        if (!over) {
            if (dropState.position !== null) setDropState({ overId: '', position: null });
            return;
        }

        const activeId = active.id as string;
        const overId = over.id as string;

        if (activeId === overId) {
            if (dropState.position !== null) setDropState({ overId: '', position: null });
            return;
        }

        const overElement = document.getElementById(`sidebar-item-${overId}`);
        if (!overElement) return;

        const rect = overElement.getBoundingClientRect();

        // Use active.rect.current.translated (dragged item visuals)
        const draggedRect = active.rect.current.translated;
        if (!draggedRect) return;

        const mouseY = draggedRect.top + (draggedRect.height / 2);

        // Zones: 
        // We want Nesting to be easy.
        // If items are 32px high.
        // Top 8px, Bottom 8px = Reorder.
        // Middle 16px = Nest.

        const zoneBefore = rect.top + 8; // Top 8px
        const zoneAfter = rect.bottom - 8; // Bottom 8px

        let position: DropPosition = 'nest';

        if (mouseY < zoneBefore) position = 'top';
        else if (mouseY > zoneAfter) position = 'bottom';
        else position = 'nest';

        if (dropState.overId !== overId || dropState.position !== position) {
            setDropState({ overId, position });
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragDoc(null);
        setDropState({ overId: '', position: null });

        if (!over) return;

        const activeDocId = active.id as string;
        const overDocId = over.id as string;

        if (activeDocId === overDocId) return;

        // Re-calculate one last time based on final position to be sure
        const overElement = document.getElementById(`sidebar-item-${overDocId}`);
        if (!overElement) return;

        const rect = overElement.getBoundingClientRect();
        const draggedRect = active.rect.current.translated;
        if (!draggedRect) return;

        const mouseY = draggedRect.top + (draggedRect.height / 2);

        const zoneBefore = rect.top + 8;
        const zoneAfter = rect.bottom - 8;

        let position: DropPosition = 'nest';
        if (mouseY < zoneBefore) position = 'top';
        else if (mouseY > zoneAfter) position = 'bottom';
        else position = 'nest';

        // 1. NEST
        if (position === 'nest') {
            const overDoc = documents[overDocId];
            if (!overDoc) return;
            if (overDoc.parentId === activeDocId) return; // Can't nest into own child (basic check)

            moveDocument(activeDocId, overDocId, overDoc.children.length);
            return;
        }

        // 2. REORDER
        const overDoc = documents[overDocId];
        if (!overDoc) return;

        const parentId = overDoc.parentId;
        const siblings = parentId ? documents[parentId].children : useDocumentStore.getState().rootDocumentIds;
        const visibleSiblings = siblings.filter(id => !documents[id]?.isArchived);
        const overIndex = visibleSiblings.indexOf(overDocId);

        if (overIndex === -1) return;

        let newIndex = overIndex;
        if (position === 'bottom') newIndex = overIndex + 1;

        // Adjustment for same-list move
        const siblingsWithoutActive = visibleSiblings.filter(id => id !== activeDocId);
        const adjustedOverIndex = siblingsWithoutActive.indexOf(overDocId);

        if (adjustedOverIndex !== -1) {
            newIndex = adjustedOverIndex;
            if (position === 'bottom') newIndex = adjustedOverIndex + 1;
        }

        moveDocument(activeDocId, parentId, newIndex);
    };

    return (
        <>
            {/* Overlay for mobile */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-30 md:hidden animate-in fade-in duration-200"
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}

            <div className={cn(
                "fixed inset-y-0 left-0 z-40 w-72 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col transition-all duration-300 ease-in-out md:relative md:inset-auto md:translate-x-0 shadow-xl md:shadow-none",
                isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                {isLoading ? (
                    <SidebarSkeleton />
                ) : (
                    <>
                        <UserMenu />
                        {error && (
                            <div className="mx-2 mt-2 p-2 bg-red-50 text-red-600 text-xs rounded border border-red-200 break-words">
                                Error: {error}
                            </div>
                        )}
                        <div className="flex-1 overflow-y-auto py-2">
                            <div className="px-2 mb-2 flex flex-col gap-1">
                                <button onClick={() => toggleSettings(true)} className="flex items-center gap-2 w-full p-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"><Settings className="h-4 w-4" />Settings</button>
                                <button onClick={() => setIsTrashOpen(true)} className="flex items-center gap-2 w-full p-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"><Trash className="h-4 w-4" />Trash</button>
                                <button onClick={() => fetchDocuments()} className="flex items-center gap-2 w-full p-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"><div className="h-4 w-4 flex items-center justify-center">↺</div>Refresh</button>
                            </div>

                            {/* Favorites */}
                            {favorites.length > 0 && (
                                <div className="mb-4">
                                    <div className="px-3 py-1 text-xs font-semibold text-neutral-600 dark:text-neutral-500 uppercase">Favorites</div>
                                    {favorites.map(doc => (
                                        <NavLink key={doc.id} to={toPageSlug(doc.title, doc.id)} className={({ isActive }) => cn("group flex items-center gap-2 py-1 px-3 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded mx-2 min-h-[30px]", isActive && "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium")}>
                                            <div className="flex items-center justify-center h-4 w-4 mr-1 shrink-0">{doc.icon || <FileText className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />}</div>
                                            <span className="truncate flex-1">{doc.title || 'Untitled'}</span>
                                        </NavLink>
                                    ))}
                                </div>
                            )}

                            <div className="px-3 py-1 text-xs font-semibold text-neutral-600 dark:text-neutral-500 uppercase">Private</div>

                            <DndContext
                                sensors={sensors}
                                collisionDetection={pointerWithin} // Use pointer for accurate handle drag
                                onDragStart={handleDragStart}
                                onDragOver={handleDragOver}
                                onDragEnd={handleDragEnd}
                                measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
                            >
                                <DocumentList onDeleteLabel={setDocToDelete} dropState={dropState} />
                                <DragOverlay dropAnimation={dropAnimation}>
                                    {activeDragDoc ? (
                                        <DocumentItem
                                            document={activeDragDoc}
                                            onDeleteLabel={() => { }}
                                            isOverlay
                                        />
                                    ) : null}
                                </DragOverlay>
                            </DndContext>
                        </div>

                        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex gap-2">
                            <button onClick={handleAddPage} className="flex items-center gap-2 flex-1 p-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"><Plus className="h-4 w-4" />New Page</button>
                            <button onClick={() => setIsTemplatesOpen(true)} className="flex items-center gap-2 p-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors" title="Templates"><Layout className="h-4 w-4" /></button>
                        </div>
                    </>
                )}
            </div>

            <SettingsModal />
            <TrashBox isOpen={isTrashOpen} onClose={() => setIsTrashOpen(false)} />
            <TemplatesModal isOpen={isTemplatesOpen} onClose={() => setIsTemplatesOpen(false)} />
            <Modal isOpen={!!docToDelete} onClose={() => setDocToDelete(null)} title="Delete Page?">
                <div className="flex flex-col gap-4">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Are you sure you want to delete <span className="font-semibold">{docToDelete?.title || 'Untitled'}</span>?</p>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setDocToDelete(null)} className="px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 rounded">Cancel</button>
                        <button onClick={confirmDelete} className="px-3 py-1.5 text-sm bg-red-500 hover:bg-red-600 text-white rounded shadow-sm">Delete</button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
