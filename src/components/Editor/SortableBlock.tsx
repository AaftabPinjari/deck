import { memo } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Block } from './Block';
import { Block as BlockType } from '../../store/useDocumentStore';
import { cn } from '../../lib/utils';

interface SortableBlockProps {
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
    index: number; // Index is required for Draggable
    blockIndex?: number;
    className?: string;
    readOnly?: boolean;
    dropLine?: 'top' | 'bottom' | null;
}

export const SortableBlock = memo(function SortableBlock({ block, documentId, onChange, onKeyDown, onFocus, onTypeChange, onSlashMenu, onUpdate, onDelete, onDuplicate, index, blockIndex, className, readOnly = false, dropLine }: SortableBlockProps) {
    return (
        <Draggable draggableId={block.id} index={index} isDragDisabled={readOnly}>
            {(provided, snapshot) => {
                // Drop Line Logic via snapshot or parent? 
                // Parent passes dropLine prop based on its own calculation, but snapshot.isDragging is internal.
                // We'll trust parent for dropLine for now, but snapshot.isDragging is useful for styling.

                const style = {
                    ...provided.draggableProps.style,
                    opacity: snapshot.isDragging ? 0.5 : 1, // Notion keeps it visible but ghosted? Or fully visible in overlay?
                    // hello-pangea/dnd handles the "lifting" automatically.
                    // We just style the draggable item.
                    // If we want a separate drag overlay, it's different.
                    // hello-pangea/dnd moves the ACTUAL item.

                    // Mobile scroll fix: 
                    // hello-pangea/dnd handles this well usually.
                };

                return (
                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        style={style}
                        className={cn("relative", className, snapshot.isDragging && "z-50 shadow-xl bg-white dark:bg-neutral-900 rounded-md")}
                        {...(false ? provided.dragHandleProps : {})} // Disable whole-block drag on mobile to allow focus and use specific handle
                    // actually, just remove the spread completely if we are using specific handle
                    >
                        {dropLine === 'top' && (
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 z-50 pointer-events-none rounded-full" />
                        )}

                        <Block
                            block={block}
                            documentId={documentId}
                            onChange={onChange}
                            onKeyDown={onKeyDown}
                            onFocus={onFocus}
                            onTypeChange={onTypeChange}
                            onSlashMenu={onSlashMenu}
                            onUpdate={onUpdate}
                            onDelete={onDelete}
                            onDuplicate={onDuplicate}
                            index={index}
                            blockIndex={blockIndex}
                            // Pass drag handle props to Block for the "six-dot" grip on desktop AND mobile
                            dragHandleProps={provided.dragHandleProps}
                            readOnly={readOnly}
                        />

                        {dropLine === 'bottom' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 z-50 pointer-events-none rounded-full" />
                        )}
                    </div>
                );
            }}
        </Draggable>
    );
});
