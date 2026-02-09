import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useDocumentStore } from '../store/useDocumentStore';
import { useNavigate } from 'react-router-dom';
import { FileText, Search } from 'lucide-react';

export function SearchCommand() {
    const { documents } = useDocumentStore();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const onSelect = (id: string) => {
        navigate(`/${id}`);
        setOpen(false);
    };

    // Flatten documents for search
    const getAllDocs = () => {
        return Object.values(documents).filter(doc => !doc.isArchived); // Filter out archived
    };

    if (!open) return null;

    return (
        <Command.Dialog
            open={open}
            onOpenChange={setOpen}
            label="Global Search"
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[20vh]"
            onClick={(e: React.MouseEvent) => {
                if (e.target === e.currentTarget) setOpen(false);
            }}
        >
            <div className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center border-b border-neutral-200 dark:border-neutral-800 px-3">
                    <Search className="h-4 w-4 text-neutral-500 mr-2" />
                    <Command.Input
                        placeholder="Search workspace..."
                        className="w-full py-3 text-sm outline-none bg-transparent placeholder:text-neutral-500"
                    />
                </div>

                <Command.List className="max-h-[300px] overflow-y-auto p-2">
                    <Command.Empty className="py-6 text-center text-sm text-neutral-500">
                        No results found.
                    </Command.Empty>

                    <Command.Group heading="Documents" className="text-xs font-medium text-neutral-500 mb-1 px-2">
                        {getAllDocs().map((doc) => (
                            <Command.Item
                                key={doc.id}
                                value={`${doc.id}-${doc.title}`}
                                onSelect={() => onSelect(doc.id)}
                                className="flex items-center gap-2 px-2 py-2 text-sm text-neutral-700 dark:text-neutral-200 rounded-md cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 aria-selected:bg-neutral-100 dark:aria-selected:bg-neutral-800"
                            >
                                <div className="flex items-center justify-center h-5 w-5 shrink-0">
                                    {doc.icon ? (
                                        <span className="text-base">{doc.icon}</span>
                                    ) : (
                                        <FileText className="h-4 w-4 text-neutral-400" />
                                    )}
                                </div>
                                <span className="truncate">{doc.title || 'Untitled'}</span>
                            </Command.Item>
                        ))}
                    </Command.Group>
                </Command.List>
            </div>
        </Command.Dialog>
    );
}
