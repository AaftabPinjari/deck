import { useState, useMemo, useRef, useLayoutEffect, memo } from 'react';
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

function Card({ card, onDelete, onChange, readOnly }: { card: KanbanCard; onDelete?: () => void; onChange?: (val: string) => void; readOnly?: boolean }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: card.id, data: { type: 'Card', card }, disabled: readOnly });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    const isEditingRef = useRef(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (contentRef.current && contentRef.current.innerText !== card.content && !isEditingRef.current) {
            contentRef.current.innerText = card.content;
        }
    }, [card.content]);

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="bg-neutral-100 dark:bg-neutral-800 p-2 rounded shadow-inner border border-transparent opacity-50 h-[40px]"
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn(
                "group relative bg-white dark:bg-neutral-800 p-2.5 rounded shadow-sm border border-neutral-200 dark:border-neutral-700 mb-2 transition-all hover:shadow-md",
                !readOnly && "hover:border-neutral-300 dark:hover:border-neutral-600 cursor-grab active:cursor-grabbing"
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
            >
                {card.content}
            </div>
            {onDelete && !readOnly && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-500 rounded bg-white/80 dark:bg-black/80 transition-opacity"
                    title="Delete card"
                >
                    <X className="h-3 w-3" />
                </button>
            )}
        </div>
    );
}

// --- Column Component ---

function Column({
    column,
    updateColumn,
    deleteColumn,
    createCard,
    deleteCard,
    updateCard,
    readOnly
}: {
    column: KanbanColumn;
    updateColumn: (id: string, title?: string, color?: string) => void;
    deleteColumn: (id: string) => void;
    createCard: (colId: string) => void;
    deleteCard: (colId: string, cardId: string) => void;
    updateCard: (colId: string, cardId: string, content: string) => void;
    readOnly?: boolean;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: column.id, data: { type: 'Column', column }, disabled: readOnly });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const cardIds = useMemo(() => column.cards.map((c) => c.id), [column.cards]);

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="w-72 h-[300px] rounded-lg bg-neutral-100 dark:bg-neutral-800 border-2 border-dashed border-neutral-300 dark:border-neutral-700 opacity-50 flex-shrink-0"
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="w-72 flex flex-col rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 h-fit max-h-[600px] flex-shrink-0 shadow-sm"
        >
            {/* Header */}
            <div
                {...attributes}
                {...listeners}
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
                    placeholder="Column Title"
                    readOnly={readOnly}
                />
                {!readOnly && (
                    <button
                        onClick={() => deleteColumn(column.id)}
                        className="p-1 text-neutral-500 hover:text-red-600 rounded opacity-0 group-hover/column:opacity-100 hover:bg-black/5 transition-all"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {/* Cards Area */}
            <div className="flex-1 p-2 overflow-y-auto min-h-[50px] scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-700">
                <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-0.5">
                        {column.cards.map((card) => (
                            <Card
                                key={card.id}
                                card={card}
                                onDelete={() => deleteCard(column.id, card.id)}
                                onChange={(content) => updateCard(column.id, card.id, content)}
                                readOnly={readOnly}
                            />
                        ))}
                    </div>
                </SortableContext>
            </div>

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
    );
}

// --- Main Kanban Block ---

export const KanbanBlock = memo(function KanbanBlock({ block, onUpdate, readOnly }: KanbanBlockProps) {
    const columns: KanbanColumn[] = useMemo(() =>
        block.props?.columns || DEFAULT_COLUMNS,
        [block.props?.columns]);

    const columnIds = useMemo(() => columns.map((col) => col.id), [columns]);

    const [activeDragItem, setActiveDragItem] = useState<any>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

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

    // Drag Handlers
    const onDragStart = (event: DragStartEvent) => {
        if (readOnly) return;
        if (event.active.data.current?.type === 'Column') {
            setActiveDragItem(event.active.data.current.column);
        } else if (event.active.data.current?.type === 'Card') {
            setActiveDragItem(event.active.data.current.card);
        }
    };

    const onDragOver = (event: DragOverEvent) => {
        if (readOnly) return;
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveCard = active.data.current?.type === 'Card';
        const isOverCard = over.data.current?.type === 'Card';
        const isOverColumn = over.data.current?.type === 'Column';

        if (!isActiveCard) return;

        // Card over Card
        if (isActiveCard && isOverCard) {
            const activeColumnIndex = columns.findIndex(col => col.cards.some(c => c.id === activeId));
            const overColumnIndex = columns.findIndex(col => col.cards.some(c => c.id === overId));

            if (activeColumnIndex === -1 || overColumnIndex === -1) return;

            if (activeColumnIndex !== overColumnIndex) {
                const activeColumn = columns[activeColumnIndex];
                const overColumn = columns[overColumnIndex];
                const activeCardIndex = activeColumn.cards.findIndex(c => c.id === activeId);
                const overCardIndex = overColumn.cards.findIndex(c => c.id === overId);

                let newColumns = [...columns];

                const sourceCards = [...activeColumn.cards];
                const [movedCard] = sourceCards.splice(activeCardIndex, 1);

                const targetCards = [...overColumn.cards];
                targetCards.splice(overCardIndex, 0, movedCard);

                newColumns[activeColumnIndex] = { ...activeColumn, cards: sourceCards };
                newColumns[overColumnIndex] = { ...overColumn, cards: targetCards };

                updateColumnsState(newColumns);
            }
        }

        // Card over Column
        if (isActiveCard && isOverColumn) {
            const activeColumnIndex = columns.findIndex(col => col.cards.some(c => c.id === activeId));
            const overColumnIndex = columns.findIndex(col => col.id === overId);

            if (activeColumnIndex !== overColumnIndex && overColumnIndex !== -1) {
                const activeColumn = columns[activeColumnIndex];
                const overColumn = columns[overColumnIndex];
                const activeCardIndex = activeColumn.cards.findIndex(c => c.id === activeId);

                let newColumns = [...columns];
                const sourceCards = [...activeColumn.cards];
                const [movedCard] = sourceCards.splice(activeCardIndex, 1);

                const targetCards = [...overColumn.cards, movedCard];

                newColumns[activeColumnIndex] = { ...activeColumn, cards: sourceCards };
                newColumns[overColumnIndex] = { ...overColumn, cards: targetCards };

                updateColumnsState(newColumns);
            }
        }
    };

    const onDragEnd = (event: DragEndEvent) => {
        if (readOnly) {
            setActiveDragItem(null);
            return;
        }
        setActiveDragItem(null);
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveColumn = active.data.current?.type === 'Column';

        if (isActiveColumn) {
            const oldIndex = columns.findIndex((col) => col.id === activeId);
            const newIndex = columns.findIndex((col) => col.id === overId);
            updateColumnsState(arrayMove(columns, oldIndex, newIndex));
            return;
        }

        const activeColumnIndex = columns.findIndex(col => col.cards.some(c => c.id === activeId));
        const overColumnIndex = columns.findIndex(col => col.cards.some(c => c.id === overId));

        if (activeColumnIndex !== -1 && overColumnIndex !== -1 && activeColumnIndex === overColumnIndex) {
            const columnIndex = activeColumnIndex;
            const column = columns[columnIndex];
            const oldIndex = column.cards.findIndex(c => c.id === activeId);
            const newIndex = column.cards.findIndex(c => c.id === overId);

            const newCards = arrayMove(column.cards, oldIndex, newIndex);
            const newColumns = [...columns];
            newColumns[columnIndex] = { ...column, cards: newCards };
            updateColumnsState(newColumns);
        }
    };


    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            modifiers={[restrictToWindowEdges]}
        >
            <div className="flex flex-col gap-2 my-4 w-full group/kanban">
                <div className="flex gap-4 overflow-x-auto pb-4 items-start px-1">
                    <SortableContext items={columnIds} strategy={horizontalListSortingStrategy} disabled={readOnly}>
                        {columns.map((col) => (
                            <Column
                                key={col.id}
                                column={col}
                                updateColumn={updateColumn}
                                deleteColumn={deleteColumn}
                                createCard={createCard}
                                updateCard={updateCard}
                                deleteCard={deleteCard}
                                readOnly={readOnly}
                            />
                        ))}
                    </SortableContext>

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
            </div>

            <DragOverlay>
                {activeDragItem && (
                    activeDragItem.cards ? ( // Column
                        <div className="w-72 h-[300px] bg-neutral-50 dark:bg-neutral-900 rounded-lg border shadow-2xl opacity-90 scale-105 cursor-grabbing" />
                    ) : ( // Card
                        <div className="bg-white dark:bg-neutral-800 p-3 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 w-[280px] rotate-2 cursor-grabbing">
                            <div className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
                                {activeDragItem.content}
                            </div>
                        </div>
                    )
                )}
            </DragOverlay>
        </DndContext>
    );
});
