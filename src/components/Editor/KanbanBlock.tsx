import { useState, useMemo, useRef, useLayoutEffect, memo } from 'react';
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult,
    DroppableProvided,
    DraggableProvided,
    DraggableStateSnapshot,
    DroppableStateSnapshot
} from '@hello-pangea/dnd';
import { Block as BlockType } from '../../store/useDocumentStore';
import { cn } from '../../lib/utils';
import { Plus, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface KanbanBlockProps {
    block: BlockType;
    documentId: string;
    onUpdate?: (id: string, props: Record<string, any>) => void;
    readOnly?: boolean;
}

interface KanbanCard {
    id: string;
    content: string;
}

interface KanbanColumn {
    id: string;
    title: string;
    color: string;
    cards: KanbanCard[];
}

const DEFAULT_COLUMNS: KanbanColumn[] = [
    { id: 'todo', title: 'To Do', color: 'bg-red-100 dark:bg-red-900/20', cards: [] },
    { id: 'doing', title: 'In Progress', color: 'bg-yellow-100 dark:bg-yellow-900/20', cards: [] },
    { id: 'done', title: 'Done', color: 'bg-green-100 dark:bg-green-900/20', cards: [] },
];

// --- Card Component ---

function Card({ card, index, onDelete, onChange, readOnly }: { card: KanbanCard; index: number; onDelete?: () => void; onChange?: (val: string) => void; readOnly?: boolean }) {
    const isEditingRef = useRef(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (contentRef.current && contentRef.current.innerText !== card.content && !isEditingRef.current) {
            contentRef.current.innerText = card.content;
        }
    }, [card.content]);

    return (
        <Draggable draggableId={card.id} index={index} isDragDisabled={readOnly}>
            {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{
                        ...provided.draggableProps.style,
                        opacity: snapshot.isDragging ? 0.5 : 1
                    }}
                    className={cn(
                        "group relative bg-white dark:bg-neutral-800 p-2.5 rounded shadow-sm border border-neutral-200 dark:border-neutral-700 mb-2 transition-all hover:shadow-md",
                        !readOnly && "hover:border-neutral-300 dark:hover:border-neutral-600 cursor-grab active:cursor-grabbing",
                        snapshot.isDragging && "shadow-xl ring-1 ring-blue-500/50 rotate-2 z-50"
                    )}
                >
                    <div
                        ref={contentRef}
                        contentEditable={!readOnly}
                        suppressContentEditableWarning
                        className={cn(
                            "outline-none min-h-[1.5em] text-sm text-neutral-800 dark:text-neutral-200 break-words whitespace-pre-wrap leading-relaxed",
                            !readOnly && "cursor-text"
                        )}
                        onFocus={() => { if (!readOnly) isEditingRef.current = true; }}
                        onBlur={(e) => {
                            if (readOnly) return;
                            isEditingRef.current = false;
                            const newContent = e.currentTarget.innerText;
                            if (newContent !== card.content) {
                                onChange?.(newContent);
                            }
                        }}
                        onKeyDown={(e) => {
                            if (readOnly) return;
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                e.currentTarget.blur();
                            }
                            e.stopPropagation();
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        {card.content}
                    </div>
                    {onDelete && !readOnly && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-500 rounded bg-white/80 dark:bg-black/80 transition-opacity"
                            title="Delete card"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </div>
            )}
        </Draggable>
    );
}

// --- Column Component ---

function Column({
    column,
    index,
    updateColumn,
    deleteColumn,
    createCard,
    deleteCard,
    updateCard,
    readOnly
}: {
    column: KanbanColumn;
    index: number;
    updateColumn: (id: string, title?: string, color?: string) => void;
    deleteColumn: (id: string) => void;
    createCard: (colId: string) => void;
    deleteCard: (colId: string, cardId: string) => void;
    updateCard: (colId: string, cardId: string, content: string) => void;
    readOnly?: boolean;
}) {
    return (
        <Draggable draggableId={column.id} index={index} isDragDisabled={readOnly}>
            {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    style={{
                        ...provided.draggableProps.style,
                        opacity: snapshot.isDragging ? 0.5 : 1
                    }}
                    className={cn(
                        "w-72 flex flex-col rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 h-fit max-h-[600px] flex-shrink-0 shadow-sm",
                        snapshot.isDragging && "shadow-2xl z-40"
                    )}
                >
                    {/* Header */}
                    <div
                        {...provided.dragHandleProps}
                        className={cn(
                            "p-3 flex items-center justify-between rounded-t-lg transition-colors border-b border-transparent",
                            column.color,
                            !readOnly && "cursor-grab active:cursor-grabbing hover:border-black/5 dark:hover:border-white/5"
                        )}
                    >
                        <input
                            className={cn(
                                "bg-transparent border-none outline-none font-semibold text-sm text-neutral-700 dark:text-neutral-200 w-full placeholder:text-neutral-400",
                                readOnly && "pointer-events-none"
                            )}
                            value={column.title}
                            onChange={(e) => !readOnly && updateColumn(column.id, e.target.value)}
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            placeholder="Column Title"
                            readOnly={readOnly}
                        />
                        {!readOnly && (
                            <button
                                onClick={() => deleteColumn(column.id)}
                                onPointerDown={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="p-1 text-neutral-500 hover:text-red-600 rounded opacity-0 group-hover/column:opacity-100 hover:bg-black/5 transition-all"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Cards Area */}
                    <Droppable droppableId={column.id} type="CARD">
                        {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={cn(
                                    "flex-1 p-2 overflow-y-auto min-h-[50px] scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-700",
                                    snapshot.isDraggingOver && "bg-neutral-100/50 dark:bg-neutral-800/50"
                                )}
                            >
                                <div className="flex flex-col gap-0.5">
                                    {column.cards.map((card, cardIndex) => (
                                        <Card
                                            key={card.id}
                                            card={card}
                                            index={cardIndex}
                                            onDelete={() => deleteCard(column.id, card.id)}
                                            onChange={(content) => updateCard(column.id, card.id, content)}
                                            readOnly={readOnly}
                                        />
                                    ))}
                                    {provided.placeholder}
                                </div>
                            </div>
                        )}
                    </Droppable>

                    {/* Footer */}
                    {!readOnly && (
                        <button
                            onClick={() => createCard(column.id)}
                            className="m-2 p-2 text-left text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 rounded-md flex items-center gap-1.5 transition-all"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            New
                        </button>
                    )}
                </div>
            )}
        </Draggable>
    );
}

// --- Main Kanban Block ---

export const KanbanBlock = memo(function KanbanBlock({ block, onUpdate, readOnly }: KanbanBlockProps) {
    const columns: KanbanColumn[] = useMemo(() =>
        block.props?.columns || DEFAULT_COLUMNS,
        [block.props?.columns]);

    const updateColumnsState = (newColumns: KanbanColumn[]) => {
        if (readOnly || !onUpdate) return;
        onUpdate(block.id, { props: { ...block.props, columns: newColumns } });
    };

    // Actions
    const createColumn = () => {
        if (readOnly) return;
        const newColumn: KanbanColumn = {
            id: uuidv4(),
            title: 'New Group',
            color: 'bg-gray-100 dark:bg-gray-800',
            cards: [],
        };
        updateColumnsState([...columns, newColumn]);
    };

    const updateColumn = (id: string, title?: string, color?: string) => {
        if (readOnly) return;
        const newColumns = columns.map((col) => {
            if (col.id !== id) return col;
            return {
                ...col,
                title: title ?? col.title,
                color: color ?? col.color,
            };
        });
        updateColumnsState(newColumns);
    };

    const deleteColumn = (id: string) => {
        if (readOnly) return;
        updateColumnsState(columns.filter((col) => col.id !== id));
    };

    const createCard = (colId: string) => {
        if (readOnly) return;
        const newCard: KanbanCard = { id: uuidv4(), content: '' };
        const newColumns = columns.map((col) => {
            if (col.id !== colId) return col;
            return { ...col, cards: [...col.cards, newCard] };
        });
        updateColumnsState(newColumns);
    };

    const updateCard = (colId: string, cardId: string, content: string) => {
        if (readOnly) return;
        const newColumns = columns.map((col) => {
            if (col.id !== colId) return col;
            return {
                ...col,
                cards: col.cards.map(c => c.id === cardId ? { ...c, content } : c)
            };
        });
        updateColumnsState(newColumns);
    };

    const deleteCard = (colId: string, cardId: string) => {
        if (readOnly) return;
        const newColumns = columns.map((col) => {
            if (col.id !== colId) return col;
            return { ...col, cards: col.cards.filter((c) => c.id !== cardId) };
        });
        updateColumnsState(newColumns);
    };

    const onDragEnd = (result: DropResult) => {
        if (readOnly) return;
        const { source, destination, type } = result;

        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        // Column Reordering
        if (type === 'COLUMN') {
            const newColumns = Array.from(columns);
            const [removed] = newColumns.splice(source.index, 1);
            newColumns.splice(destination.index, 0, removed);
            updateColumnsState(newColumns);
            return;
        }

        // Card Reordering
        if (type === 'CARD') {
            const sourceColId = source.droppableId;
            const destColId = destination.droppableId;

            // Same Column
            if (sourceColId === destColId) {
                const column = columns.find(col => col.id === sourceColId);
                if (!column) return;

                const newCards = Array.from(column.cards);
                const [removed] = newCards.splice(source.index, 1);
                newCards.splice(destination.index, 0, removed);

                const newColumns = columns.map(col => {
                    if (col.id === sourceColId) {
                        return { ...col, cards: newCards };
                    }
                    return col;
                });
                updateColumnsState(newColumns);
                return;
            }

            // Different Column
            const sourceCol = columns.find(col => col.id === sourceColId);
            const destCol = columns.find(col => col.id === destColId);
            if (!sourceCol || !destCol) return;

            const newSourceCards = Array.from(sourceCol.cards);
            const [movedCard] = newSourceCards.splice(source.index, 1);

            const newDestCards = Array.from(destCol.cards);
            newDestCards.splice(destination.index, 0, movedCard);

            const newColumns = columns.map(col => {
                if (col.id === sourceColId) {
                    return { ...col, cards: newSourceCards };
                }
                if (col.id === destColId) {
                    return { ...col, cards: newDestCards };
                }
                return col;
            });
            updateColumnsState(newColumns);
        }
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex flex-col gap-2 my-4 w-full group/kanban">
                <Droppable droppableId="board" direction="horizontal" type="COLUMN">
                    {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="flex gap-4 overflow-x-auto pb-4 items-start px-1"
                        >
                            {columns.map((col, index) => (
                                <Column
                                    key={col.id}
                                    column={col}
                                    index={index}
                                    updateColumn={updateColumn}
                                    deleteColumn={deleteColumn}
                                    createCard={createCard}
                                    updateCard={updateCard}
                                    deleteCard={deleteCard}
                                    readOnly={readOnly}
                                />
                            ))}
                            {provided.placeholder}

                            {!readOnly && (
                                <button
                                    onClick={createColumn}
                                    className="w-72 h-12 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-neutral-600 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all flex-shrink-0 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Group
                                </button>
                            )}
                        </div>
                    )}
                </Droppable>
            </div>
        </DragDropContext>
    );
});
