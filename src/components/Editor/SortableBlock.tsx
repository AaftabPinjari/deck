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
}

export const SortableBlock = memo(function SortableBlock({ block, documentId, onChange, onKeyDown, onFocus, onTypeChange, onSlashMenu, onUpdate, onDelete, onDuplicate, index, className }: SortableBlockProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        position: 'relative' as const,
        zIndex: isDragging ? 999 : 'auto',
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
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
                dragHandleProps={listeners}
                index={index}
                className={className}
            />
        </div>
    );
});
