import { useLocation, Link } from 'react-router-dom';
import { useDocumentStore } from '../store/useDocumentStore';
import { ChevronRight, FileText } from 'lucide-react';
import { Publish } from './Publish';
import { MoreMenu } from './MoreMenu';
import { extractIdFromSlug, toPageSlug } from '../lib/slugUtils';

export function Breadcrumbs() {
    const location = useLocation();
    const { documents } = useDocumentStore();

    // Extract document ID from Notion-style slug URL
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
        <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-1 text-sm text-neutral-700 dark:text-neutral-400 overflow-hidden whitespace-nowrap">
                <div className="flex items-center hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded px-1 py-0.5 transition-colors">
                    <span className="text-xs">Workspace</span>
                </div>
                {breadcrumbs.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-1 shrink-0">
                        <ChevronRight className="h-3 w-3 text-neutral-500 dark:text-neutral-400" />
                        <Link
                            to={toPageSlug(doc.title, doc.id)}
                            className="flex items-center gap-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded px-1 py-0.5 transition-colors max-w-[150px] text-neutral-700 dark:text-neutral-300"
                        >
                            <span className="text-lg leading-none">{doc.icon || <FileText className="h-3 w-3 text-neutral-500 dark:text-neutral-400" />}</span>
                            <span className="truncate">{doc.title || 'Untitled'}</span>
                        </Link>
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-2">
                <Publish documentId={documentId} />
                <MoreMenu documentId={documentId} />
            </div>
        </div>
    );
}
