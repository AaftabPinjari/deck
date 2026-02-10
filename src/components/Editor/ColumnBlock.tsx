import { useRef, useLayoutEffect, useCallback, memo } from 'react';
import { Block as BlockType } from '../../store/useDocumentStore';
import { cn } from '../../lib/utils';
import { Plus, GripVertical } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ColumnBlockProps {
    block: BlockType;
    documentId: string;
    onUpdate?: (id: string, props: Record<string, unknown>) => void;
    readOnly?: boolean;
}

interface ColumnCellBlockProps {
    columnBlock: BlockType;
    onContentChange: (content: string) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    readOnly?: boolean;
}

// Memoized inner component for individual cells
const ColumnCellBlock = memo(function ColumnCellBlock({
    columnBlock,
    onContentChange,
    onKeyDown,
    readOnly
}: ColumnCellBlockProps) {
    const contentRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const el = contentRef.current;
        if (el && el.innerHTML !== columnBlock.content && document.activeElement !== el) {
            el.innerHTML = columnBlock.content;
        }
    }, [columnBlock.content]);

    const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
        if (readOnly) return;
        onContentChange(e.currentTarget.innerHTML);
    }, [onContentChange, readOnly]);

    return (
        <div
            ref={contentRef}
            contentEditable={!readOnly}
            suppressContentEditableWarning
            data-column-block-id={columnBlock.id}
            className={cn(
                "flex-1 outline-none min-h-[1.5em] p-1 rounded text-neutral-800 dark:text-neutral-200",
                !readOnly && "focus:bg-neutral-50 dark:focus:bg-neutral-800",
                !readOnly && "empty:before:content-['Type_something...'] empty:before:text-neutral-400",
                columnBlock.type === 'h1' && "text-2xl font-bold",
                columnBlock.type === 'h2' && "text-xl font-semibold",
                columnBlock.type === 'h3' && "text-lg font-medium"
            )}
            onInput={handleInput}
            onKeyDown={onKeyDown}
        />
    );
});

export const ColumnBlock = memo(function ColumnBlock({ block, onUpdate, readOnly }: ColumnBlockProps) {
    const columns: BlockType[][] = block.props?.columns || [[], []];

    const updateColumns = useCallback((newColumns: BlockType[][]) => {
        if (readOnly || !onUpdate) return;
        onUpdate(block.id, { props: { ...block.props, columns: newColumns } });
    }, [block.id, block.props, onUpdate, readOnly]);

    const handleBlockChange = useCallback((columnIndex: number, blockIndex: number, content: string) => {
        if (readOnly) return;
        const newColumns = columns.map((col, ci) =>
            ci === columnIndex
                ? col.map((b, bi) => (bi === blockIndex ? { ...b, content } : b))
                : col
        );
        updateColumns(newColumns);
    }, [columns, updateColumns, readOnly]);

    const handleAddBlock = useCallback((columnIndex: number) => {
        if (readOnly) return;
        const newBlock: BlockType = { id: uuidv4(), type: 'text', content: '' };
        const newColumns = columns.map((col, ci) =>
            ci === columnIndex ? [...col, newBlock] : col
        );
        updateColumns(newColumns);
    }, [columns, updateColumns, readOnly]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent, columnIndex: number, blockIndex: number) => {
        if (readOnly) return;
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const newBlock: BlockType = { id: uuidv4(), type: 'text', content: '' };
            const newColumns = columns.map((col, ci) =>
                ci === columnIndex
                    ? [...col.slice(0, blockIndex + 1), newBlock, ...col.slice(blockIndex + 1)]
                    : col
            );
            updateColumns(newColumns);
            return;
        }

        if (e.key === 'Backspace' && columns[columnIndex][blockIndex].content === '' && columns[columnIndex].length > 1) {
            e.preventDefault();
            const newColumns = columns.map((col, ci) =>
                ci === columnIndex ? col.filter((_, bi) => bi !== blockIndex) : col
            );
            updateColumns(newColumns);
        }
    }, [columns, updateColumns, readOnly]);

    return (
        <div className="flex gap-4 w-full my-2 group/columns">
            {columns.map((column, columnIndex) => (
                <div
                    key={columnIndex}
                    className={cn(
                        "flex-1 min-w-0 border border-dashed border-transparent rounded-lg p-2 transition-colors",
                        !readOnly && "hover:border-neutral-200 dark:hover:border-neutral-700",
                        !readOnly && "focus-within:border-blue-300 dark:focus-within:border-blue-700"
                    )}
                >
                    {column.length === 0 ? (
                        !readOnly ? (
                            <button
                                type="button"
                                onClick={() => handleAddBlock(columnIndex)}
                                className="w-full h-16 flex items-center justify-center text-neutral-400 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded"
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                <span className="text-sm">Add block</span>
                            </button>
                        ) : null
                    ) : (
                        <div className="space-y-1">
                            {column.map((columnBlock, blockIndex) => (
                                <div key={columnBlock.id} className="group/block flex items-start gap-1">
                                    {!readOnly && (
                                        <div className="opacity-0 group-hover/block:opacity-100 transition-opacity cursor-grab pt-1">
                                            <GripVertical className="h-4 w-4 text-neutral-400" />
                                        </div>
                                    )}
                                    <ColumnCellBlock
                                        columnBlock={columnBlock}
                                        onContentChange={(content) => handleBlockChange(columnIndex, blockIndex, content)}
                                        onKeyDown={(e) => handleKeyDown(e, columnIndex, blockIndex)}
                                        readOnly={readOnly}
                                    />
                                </div>
                            ))}
                            {!readOnly && (
                                <button
                                    type="button"
                                    onClick={() => handleAddBlock(columnIndex)}
                                    className="w-full text-left px-2 py-1 text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 opacity-0 group-hover/columns:opacity-100 transition-opacity"
                                >
                                    + Add block
                                </button>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
});
