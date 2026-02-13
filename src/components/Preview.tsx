import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDocumentStore } from '../store/useDocumentStore';
import { extractIdFromSlug } from '../lib/slugUtils';
import { Editor } from './Editor/Editor';
import { Loader2, Globe } from 'lucide-react';

export function Preview() {
    const { slug } = useParams();
    const { fetchPublishedDocument, documents, isLoading, error } = useDocumentStore();

    const documentId = slug ? extractIdFromSlug(slug) : null;
    const document = documentId ? documents[documentId] : null;

    useEffect(() => {
        if (documentId && !document) {
            fetchPublishedDocument(documentId);
        }
    }, [documentId, document, fetchPublishedDocument]);

    if (isLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-neutral-900">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error || !documentId) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-neutral-900 p-4 text-center">
                <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6">
                    <Globe className="w-10 h-10 text-neutral-400" />
                </div>
                <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
                    Page not found
                </h1>
                <p className="text-neutral-500 max-w-sm mb-8">
                    This page may have been unpublished, deleted, or the link might be incorrect.
                </p>
                <Link
                    to="/"
                    className="px-4 py-2 border border-neutral-200 dark:border-neutral-800 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium"
                >
                    Go to home
                </Link>
            </div>
        );
    }

    if (!document) return null;

    return (
        <div className="min-h-screen bg-white dark:bg-neutral-900 pb-20">
            {/* Minimal Header */}
            <div className="sticky top-0 z-50 w-full h-12 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4 sm:px-8">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">
                        D
                    </div>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">Deck</span>
                </Link>
                <div className="flex items-center gap-4">
                    <span className="text-xs text-neutral-500 hidden sm:inline">
                        Published with Deck
                    </span>
                    <Link
                        to="/login"
                        className="px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors text-sm font-medium"
                    >
                        Log in
                    </Link>
                </div>
            </div>

            {/* Read-only Editor */}
            <div className="mt-8">
                <Editor readOnly />
            </div>

            {/* Bottom Badge for Mobile */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-lg rounded-full px-4 py-2 flex items-center gap-2 z-50 sm:hidden">
                <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-[10px]">
                    D
                </div>
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-200">
                    Made with Deck
                </span>
            </div>
        </div>
    );
}

export default Preview;
