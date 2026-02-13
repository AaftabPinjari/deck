import { Link } from 'react-router-dom';
import { useDocumentStore } from '../../store/useDocumentStore';
import { FileText } from 'lucide-react';
import { toPageSlug } from '../../lib/slugUtils';
import { cn } from '../../lib/utils';
import { memo } from 'react';

interface PageBlockProps {
    blockId: string;
    documentId: string;
}

export const PageBlock = memo(({ blockId, documentId }: PageBlockProps) => {
    const { documents } = useDocumentStore();
    const block = documents[documentId]?.content.find(b => b.id === blockId);

    // The block's content stores the target document ID
    const targetId = block?.content;
    const targetDoc = targetId ? documents[targetId] : null;

    if (!targetDoc) {
        return (
            <div className="flex items-center gap-2 p-3 text-neutral-400 dark:text-neutral-500 italic text-sm">
                <FileText className="h-4 w-4" />
                <span>Page not found</span>
            </div>
        );
    }

    return (
        <Link
            to={toPageSlug(targetDoc.title, targetDoc.id)}
            className={cn(
                "flex items-center gap-2.5 w-full p-2.5 rounded-lg border border-transparent transition-all duration-200",
                "hover:bg-neutral-100 dark:hover:bg-neutral-800/50 hover:border-neutral-200 dark:hover:border-neutral-700/50",
                "group/page-block"
            )}
        >
            <div className="flex items-center justify-center h-6 w-6 shrink-0 text-xl leading-none opacity-80 group-hover/page-block:opacity-100 transition-opacity">
                {targetDoc.icon || <FileText className="h-5 w-5 text-neutral-500" />}
            </div>
            <span className="truncate flex-1 font-medium text-neutral-700 dark:text-neutral-200">
                {targetDoc.title || 'Untitled'}
            </span>
        </Link>
    );
});

PageBlock.displayName = 'PageBlock';
