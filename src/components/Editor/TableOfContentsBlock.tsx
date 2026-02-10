import { memo, useMemo } from 'react';
import { useDocumentStore } from '../../store/useDocumentStore';
import { cn } from '../../lib/utils';
import { Settings2 } from 'lucide-react';

interface TableOfContentsBlockProps {
    block: any;
    documentId: string;
    readOnly?: boolean;
}

export const TableOfContentsBlock = memo(function TableOfContentsBlock({ block, documentId, readOnly }: TableOfContentsBlockProps) {
    // Select the document content to find headings
    const content = useDocumentStore(state => state.documents[documentId]?.content);

    const headings = useMemo(() => {
        if (!content) return [];
        return content.filter(b => ['h1', 'h2', 'h3'].includes(b.type) && b.content.trim().length > 0);
    }, [content]);

    const scrollToBlock = (blockId: string) => {
        const element = document.querySelector(`[data-block-id="${blockId}"]`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    if (headings.length === 0) {
        return (
            <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-400 text-sm select-none">
                <p>No headings to display.</p>
            </div>
        );
    }

    return (
        <div className={cn(
            "p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-transparent transition-colors",
            !readOnly && "hover:border-neutral-200 dark:hover:border-neutral-800"
        )}>
            {!readOnly && (
                <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-wider text-neutral-400 font-semibold select-none">
                    <Settings2 className="w-3 h-3" />
                    Table of Contents
                </div>
            )}
            <div className="flex flex-col gap-1">
                {headings.map((heading) => (
                    <button
                        key={heading.id}
                        onClick={() => scrollToBlock(heading.id)}
                        className={cn(
                            "text-left hover:underline decoration-neutral-400 underline-offset-2 transition-all text-sm",
                            heading.type === 'h1' && "font-semibold text-neutral-800 dark:text-neutral-200",
                            heading.type === 'h2' && "ml-4 text-neutral-600 dark:text-neutral-300",
                            heading.type === 'h3' && "ml-8 text-neutral-500 dark:text-neutral-400"
                        )}
                    >
                        {heading.content}
                    </button>
                ))}
            </div>
        </div>
    );
});
