import { useLocation, Link } from 'react-router-dom';
import { useDocumentStore } from '../store/useDocumentStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { ChevronRight, FileText, Menu } from 'lucide-react';
import { Publish } from './Publish';
import { MoreMenu } from './MoreMenu';
import { extractIdFromSlug, toPageSlug } from '../lib/slugUtils';
import { cn } from '../lib/utils';

export function Breadcrumbs() {
    const location = useLocation();
    const { documents } = useDocumentStore();
    const { setIsMobileSidebarOpen } = useSettingsStore();

    // Extract document ID from Deck-style slug URL
    const slug = location.pathname.split('/')[1];
    const documentId = extractIdFromSlug(slug || '');

    if (!documentId || !documents[documentId]) return null;

    const breadcrumbs = [];
    let currentDoc = documents[documentId];

    while (currentDoc) {
        breadcrumbs.unshift(currentDoc);
        if (currentDoc.parentId) {
            currentDoc = documents[currentDoc.parentId];
        } else {
            break;
        }
    }

    return (
        <div className="flex items-center justify-between px-2 md:px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 sticky top-0 z-20">
            <div className="flex items-center gap-1 text-sm text-neutral-700 dark:text-neutral-400 overflow-hidden min-w-0">
                {/* Mobile Menu Toggle */}
                <button
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className="md:hidden p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors mr-1"
                >
                    <Menu className="h-5 w-5 text-neutral-500" />
                </button>


                {breadcrumbs.map((doc, index) => {
                    const isLast = index === breadcrumbs.length - 1;
                    const isFirst = index === 0;

                    // Deck behavior: on mobile, often just shows current page or truncated path
                    // We'll show an ellipsis for middle items if there are more than 2 breadcrumbs on mobile
                    const shouldShowOnMobile = isLast || (breadcrumbs.length <= 2 && isFirst);

                    return (
                        <div key={doc.id} className={cn(
                            "flex items-center gap-1 min-w-0 shrink-0 md:shrink",
                            !shouldShowOnMobile && "hidden md:flex"
                        )}>
                            {!isFirst && <ChevronRight className="h-3 w-3 text-neutral-500 dark:text-neutral-400 shrink-0" />}

                            <Link
                                to={toPageSlug(doc.title, doc.id)}
                                className={cn(
                                    "flex items-center gap-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded px-1 py-0.5 transition-colors max-w-[120px] md:max-w-[200px] text-neutral-700 dark:text-neutral-300 min-w-0",
                                    isLast && "font-medium"
                                )}
                            >
                                <span className="text-lg leading-none shrink-0">{doc.icon || <FileText className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400" />}</span>
                                <span className="truncate">{doc.title || 'Untitled'}</span>
                            </Link>
                        </div>
                    );
                })}
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
                <Publish documentId={documentId} />
                <MoreMenu documentId={documentId} />
            </div>
        </div>
    );
}
