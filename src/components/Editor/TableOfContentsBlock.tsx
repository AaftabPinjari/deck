import { memo, useMemo } from 'react';
import { useDocumentStore } from '../../store/useDocumentStore';
import { cn } from '../../lib/utils';
import { Settings2 } from 'lucide-react';

interface TableOfContentsBlockProps {
    block: any;
    documentId: string;
    readOnly?: boolean;
}

export const TableOfContentsBlock = memo(function TableOfContentsBlock({ documentId, readOnly }: TableOfContentsBlockProps) {
    // Select the document content to find headings
    const content = useDocumentStore(state => state.documents[documentId]?.content);

    const headings = useMemo(() => {
        if (!content) return [];

        const extract = (blocks: any[]): any[] => {
            let result: any[] = [];
            blocks.forEach(b => {
                if (['h1', 'h2', 'h3'].includes(b.type) && b.content.trim().length > 0) {
                    result.push(b);
                }
                // Check for columns
                if (b.type === 'column_container' && b.props?.columns) {
                    b.props.columns.forEach((col: any[]) => {
                        result = [...result, ...extract(col)];
                    });
                }
            });
            return result;
        };

        return extract(content);
    }, [content]);

    const scrollToBlock = (blockId: string) => {
        // Look for both standard block IDs and column block IDs
        const element = document.querySelector(`[data-block-id="${blockId}"], [data-column-block-id="${blockId}"]`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const stripHtml = (html: string) => {
        return html
            .replace(/&nbsp;/g, ' ')
            .replace(/<[^>]*>/g, '');
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
            "w-full p-6 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-800 transition-colors",
            !readOnly && "hover:border-neutral-300 dark:hover:border-neutral-700"
        )}>
            {!readOnly && (
                <div className="flex items-center gap-2 mb-4 text-xs uppercase tracking-wider text-neutral-400 font-semibold select-none group/title">
                    <Settings2 className="w-3.5 h-3.5" />
                    Table of Contents
                </div>
            )}
            <div className="flex flex-col gap-1">
                {headings.map((heading) => {
                    const blockLevel = heading.props?.level || 0;
                    const typeLevel = heading.type === 'h1' ? 0 : heading.type === 'h2' ? 1 : 2;
                    // Combined indentation: base on type, plus extra for actual nesting level
                    const indentSize = (typeLevel + blockLevel) * 1.25;

                    return (
                        <button
                            key={heading.id}
                            onClick={() => scrollToBlock(heading.id)}
                            className={cn(
                                "text-left hover:underline decoration-neutral-400 underline-offset-2 transition-all text-sm",
                                heading.type === 'h1' && "font-semibold text-neutral-800 dark:text-neutral-200",
                                heading.type === 'h2' && "text-neutral-600 dark:text-neutral-300",
                                heading.type === 'h3' && "text-neutral-500 dark:text-neutral-400"
                            )}
                            style={{ marginLeft: `${indentSize}rem` }}
                        >
                            {stripHtml(heading.content)}
                        </button>
                    );
                })}
            </div>
        </div>
    );
});
