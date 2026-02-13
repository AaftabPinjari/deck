import { Link } from 'react-router-dom';
import { useDocumentStore } from '../../store/useDocumentStore';
import { ChevronRight, FileText } from 'lucide-react';
import { toPageSlug } from '../../lib/slugUtils';
import { cn } from '../../lib/utils';
import { memo } from 'react';

interface BreadcrumbsBlockProps {
    documentId: string;
}

export const BreadcrumbsBlock = memo(({ documentId }: BreadcrumbsBlockProps) => {
    const { documents } = useDocumentStore();

    if (!documentId || !documents[documentId]) return null;

    const breadcrumbs = [];
    let currentDoc = documents[documentId];

    // Build breadcrumbs path
    while (currentDoc) {
        breadcrumbs.unshift(currentDoc);
        if (currentDoc.parentId) {
            currentDoc = documents[currentDoc.parentId];
        } else {
            break;
        }
    }

    // Don't show if it's just the current page (root level with no parents)
    if (breadcrumbs.length <= 1) return null;

    return (
        <div className="flex flex-wrap items-center gap-1 py-1 select-none group/breadcrumbs">
            {breadcrumbs.map((doc, index) => {
                const isLast = index === breadcrumbs.length - 1;
                const isFirst = index === 0;

                return (
                    <div key={doc.id} className="flex items-center gap-1 min-w-0">
                        {!isFirst && <ChevronRight className="h-4 w-4 text-neutral-400 dark:text-neutral-500 shrink-0" />}

                        <Link
                            to={toPageSlug(doc.title, doc.id)}
                            className={cn(
                                "flex items-center gap-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md px-1 py-1 transition-all duration-200 min-w-0",
                                isLast ? "text-neutral-900 dark:text-neutral-100 font-semibold cursor-default" : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                            )}
                            onClick={(e) => isLast && e.preventDefault()}
                        >
                            <span className="text-xl leading-none shrink-0 opacity-80 group-hover/breadcrumbs:opacity-100 transition-opacity">
                                {doc.icon || <FileText className="h-4 w-4" />}
                            </span>
                            <span className="truncate text-sm">
                                {doc.title || 'Untitled'}
                            </span>
                        </Link>
                    </div>
                );
            })}
        </div>
    );
});

BreadcrumbsBlock.displayName = 'BreadcrumbsBlock';
