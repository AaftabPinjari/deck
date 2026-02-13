import { useState, memo, useMemo, useCallback } from 'react';
import { flushSync } from 'react-dom';
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
    DragDropContext,
    Droppable,
    Draggable,
    DropResult,
    BeforeCapture
} from '@hello-pangea/dnd';

interface DocumentItemProps {
    document: Document;
    level?: number;
    onDeleteLabel: (doc: Document) => void;
    index: number;
}

const DocumentItem = memo(function DocumentItem({ document, level = 0, onDeleteLabel, index }: DocumentItemProps) {
    const navigate = useNavigate();
    const { documents, createDocument, toggleExpand, toggleFavorite, updateDocument } = useDocumentStore();
    const hasChildren = useMemo(() =>
        document.children.some(childId => documents[childId] && !documents[childId].isArchived),
        [document.children, documents]
    );
    const isExpanded = document.isExpanded;

    const [isRenaming, setIsRenaming] = useState(false);
    const [title, setTitle] = useState(document.title || 'Untitled');

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

    return (
        <Draggable draggableId={document.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    id={`sidebar-item-${document.id}`}
                    style={{
                        ...provided.draggableProps.style,
                        opacity: snapshot.isDragging ? 0.6 : 1
                    }}
                    className={cn(
                        "relative select-none rounded-md transition-colors duration-150",
                        snapshot.combineTargetFor && "bg-blue-100 dark:bg-blue-900/30 ring-1 ring-blue-500", // Visual feedback for nesting
                        snapshot.isDragging && "shadow-lg bg-white dark:bg-neutral-800 z-50 ring-1 ring-neutral-200 dark:ring-neutral-700"
                    )}
                >
                    <div
                        className={cn(
                            "group flex items-center py-1.5 pr-2 text-sm rounded-sm min-h-[28px] cursor-grab active:cursor-grabbing",
                            "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800",
                            snapshot.combineTargetFor && "bg-transparent"
                        )}
                        style={{ paddingLeft: `${level * 16 + 8}px` }}
                        onContextMenu={() => {
                            // Prevent context menu to allow regular interaction if needed
                        }}
                    >
                        {/* Chevron */}
                        <div
                            className={cn(
                                "flex items-center justify-center w-5 h-5 shrink-0 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer",
                                !hasChildren && "invisible"
                            )}
                            onClick={handleToggle}
                            onMouseDown={(e) => e.stopPropagation()} // Prevent drag start
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
                                        e.stopPropagation();
                                        handleKeyDown(e);
                                    }}
                                    autoFocus
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className="flex-1 h-6 px-1 bg-white dark:bg-neutral-900 border border-blue-500 rounded text-sm focus:outline-none"
                                />
                            </div>
                        ) : (
                            <NavLink
                                to={toPageSlug(document.title, document.id)}
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

                    {isExpanded && hasChildren && (
                        <div className="mt-1">
                            <DocumentList parentId={document.id} level={level + 1} onDeleteLabel={onDeleteLabel} />
                        </div>
                    )}
                </div>
            )}
        </Draggable>
    );
});

interface DocumentListProps {
    parentId?: string | null;
    level?: number;
    onDeleteLabel: (doc: Document) => void;
}

const DocumentList = ({ parentId = null, level = 0, onDeleteLabel }: DocumentListProps) => {
    const { documents, rootDocumentIds } = useDocumentStore();

    const docIds = parentId
        ? documents[parentId]?.children
        : rootDocumentIds;

    if (!docIds || docIds.length === 0) {
        if (level === 0 && !parentId) return <div className="p-4 text-xs text-neutral-500 dark:text-neutral-400 italic">No pages yet</div>;
        return null;
    }

    // Filter valid docs
    const validDocIds = docIds.filter(id => documents[id] && !documents[id].isArchived);

    return (
        <Droppable droppableId={parentId || 'root'} type="DOCUMENT" isCombineEnabled>
            {(provided) => (
                <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex flex-col gap-0.5"
                >
                    {validDocIds.map((id, index) => (
                        <DocumentItem
                            key={id}
                            document={documents[id]}
                            level={level}
                            onDeleteLabel={onDeleteLabel}
                            index={index}
                        />
                    ))}
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    );
};

export function Sidebar() {
    const navigate = useNavigate();
    const { documents, createDocument, archiveDocument, isLoading, moveDocument, error, fetchDocuments } = useDocumentStore();
    const { toggleSettings } = useSettingsStore();
    const [docToDelete, setDocToDelete] = useState<Document | null>(null);
    const [isTrashOpen, setIsTrashOpen] = useState(false);
    const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
    const { isMobileSidebarOpen, setIsMobileSidebarOpen } = useSettingsStore();

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

    // DnD State
    const onBeforeCapture = useCallback((before: BeforeCapture) => {
        const docId = before.draggableId;
        const doc = useDocumentStore.getState().documents[docId];
        if (doc && doc.isExpanded) {
            // Synchronously collapse the item before dimensions are captured
            // This ensures the placeholder is the size of the collapsed item (small)
            flushSync(() => {
                useDocumentStore.getState().updateDocument(docId, { isExpanded: false });
            });
        }
    }, []);

    const onDragEnd = useCallback((result: DropResult) => {
        const { source, destination, combine, draggableId } = result;

        // 1. NESTING (Combine)
        if (combine) {
            const overDocId = combine.draggableId;
            const targetDoc = documents[overDocId];
            if (!targetDoc) return;
            // Prevent nesting into itself or its own children (store usually handles cycle check, but good to check basic)
            if (overDocId === draggableId) return;

            // Move to be a child of targetDoc, at the end
            moveDocument(draggableId, overDocId, targetDoc.children.length);
            // Also expand the target to show the new child
            if (!targetDoc.isExpanded) {
                useDocumentStore.getState().updateDocument(overDocId, { isExpanded: true });
            }
            return;
        }

        // 2. REORDERING
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const parentId = destination.droppableId === 'root' ? null : destination.droppableId;
        moveDocument(draggableId, parentId, destination.index);

    }, [documents, moveDocument]);

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

                            <DragDropContext onBeforeCapture={onBeforeCapture} onDragEnd={onDragEnd}>
                                <DocumentList onDeleteLabel={setDocToDelete} />
                            </DragDropContext>
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
