import { useState } from 'react';
import { useDocumentStore } from '../store/useDocumentStore';
import { Modal } from './ui/Modal';
import { FileText, RefreshCw, Trash2, Search } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';

interface TrashBoxProps {
    isOpen: boolean;
    onClose: () => void;
}

export function TrashBox({ isOpen, onClose }: TrashBoxProps) {
    // const navigate = useNavigate(); // Unused
    const { documents, restoreDocument, permanentlyDeleteDocument } = useDocumentStore();
    const [search, setSearch] = useState('');

    const archivedDocs = Object.values(documents).filter((doc) => doc.isArchived);
    const filteredDocs = archivedDocs.filter((doc) =>
        doc.title.toLowerCase().includes(search.toLowerCase())
    );

    const handleRestore = async (docId: string) => {
        await restoreDocument(docId);
        // If we are currently on the trash page (if we had one), we might want to navigate
    };

    const handleDelete = async (docId: string) => {
        if (confirm('Are you sure you want to permanently delete this page? This action cannot be undone.')) {
            await permanentlyDeleteDocument(docId);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Trash">
            <div className="flex flex-col h-[60vh]">
                <div className="relative mb-4">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search in trash..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-8 pr-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 text-neutral-900 dark:text-neutral-100"
                    />
                </div>

                <div className="flex-1 overflow-y-auto">
                    {filteredDocs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-neutral-500">
                            <Trash2 className="h-8 w-8 mb-2 opacity-50" />
                            <p className="text-sm">Trash is empty</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {filteredDocs.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="flex items-center justify-between p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded group text-neutral-900 dark:text-neutral-100"
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="flex items-center justify-center h-6 w-6 text-lg shrink-0">
                                            {doc.icon || <FileText className="h-4 w-4 text-neutral-400" />}
                                        </div>
                                        <span className="text-sm truncate">{doc.title || 'Untitled'}</span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleRestore(doc.id)}
                                            className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-500 hover:text-green-600"
                                            title="Restore page"
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(doc.id)}
                                            className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-500 hover:text-red-600"
                                            title="Delete permanently"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
