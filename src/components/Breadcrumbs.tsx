import { useLocation, Link } from 'react-router-dom';
import { useDocumentStore } from '../store/useDocumentStore';
import { ChevronRight, FileText } from 'lucide-react';
import { Publish } from './Publish';
import { MoreMenu } from './MoreMenu';

export function Breadcrumbs() {
    const location = useLocation();
    const { documents } = useDocumentStore();

    // Extract document ID from URL /:documentId
    const documentId = location.pathname.split('/')[1];

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
            <div className="flex items-center gap-1 text-sm text-neutral-500 overflow-hidden whitespace-nowrap">
                <div className="flex items-center hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded px-1 py-0.5 transition-colors">
                    <span className="text-xs">Workspace</span>
                </div>
                {breadcrumbs.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-1 shrink-0">
                        <ChevronRight className="h-3 w-3 text-neutral-400" />
                        <Link
                            to={`/${doc.id}`}
                            className="flex items-center gap-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded px-1 py-0.5 transition-colors max-w-[150px]"
                        >
                            <span className="text-lg leading-none">{doc.icon || <FileText className="h-3 w-3" />}</span>
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
