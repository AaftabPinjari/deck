import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Block } from './Block';
import { Block as BlockType } from '../../store/useDocumentStore';

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
    index?: number;
    className?: string;
    readOnly?: boolean;
}

export const SortableBlock = memo(function SortableBlock({ block, documentId, onChange, onKeyDown, onFocus, onTypeChange, onSlashMenu, onUpdate, onDelete, onDuplicate, index, className, readOnly }: SortableBlockProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id, data: { type: block.type, block } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 1000 : 1,
        position: 'relative' as const,
        touchAction: 'none',
    };

    return (
        <div ref={setNodeRef} style={style} className={className}>
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
                dragHandleProps={!readOnly ? { ...attributes, ...listeners } : undefined}
                readOnly={readOnly}
            />
        </div>
    );
});
