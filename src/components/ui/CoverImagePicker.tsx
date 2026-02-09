import { useRef, useState, useEffect } from 'react';
import { Image, Upload, Link as LinkIcon, X, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useUpload } from '../../hooks/useUpload';

interface CoverImagePickerProps {
    onChange: (url: string) => void;
    onRemove?: () => void;
    children: React.ReactNode;
}

// Curated gradients and solid colors for MVP
const COVERS = [
    // Gradients
    "linear-gradient(to right, #ff7e5f, #feb47b)", // Sunset
    "linear-gradient(to right, #8360c3, #2ebf91)", // Purple Green
    "linear-gradient(to right, #00c6ff, #0072ff)", // Blue
    "linear-gradient(to right, #11998e, #38ef7d)", // Green
    // Solid
    "#FF5733",
    "#33FF57",
    "#3357FF",
    "#F333FF",
    // Unsplash Nature (Random Valid URLs)
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1501854140884-074bf6bfa802?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"
];

export function CoverImagePicker({ onChange, onRemove, children }: CoverImagePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<'gallery' | 'upload' | 'link'>('gallery');
    const [linkUrl, setLinkUrl] = useState('');
    const { uploadFile, isUploading } = useUpload();

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleLinkSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (linkUrl) {
            onChange(linkUrl);
            setIsOpen(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = await uploadFile(file);
            if (url) {
                onChange(url);
                setIsOpen(false);
            }
        }
    };

    return (
        <div className="relative group">
            <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                {children}
            </div>

            {isOpen && (
                <div
                    ref={popoverRef}
                    className="absolute z-50 top-full mt-2 left-0 w-[400px] bg-white dark:bg-neutral-900 shadow-xl rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
                >
                    <div className="flex items-center border-b border-neutral-200 dark:border-neutral-800">
                        <button
                            onClick={() => setActiveTab('gallery')}
                            className={cn(
                                "flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                                activeTab === 'gallery'
                                    ? "border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100"
                                    : "border-transparent text-neutral-500 hover:text-neutral-700"
                            )}
                        >
                            Gallery
                        </button>
                        <button
                            onClick={() => setActiveTab('upload')}
                            className={cn(
                                "flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                                activeTab === 'upload'
                                    ? "border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100"
                                    : "border-transparent text-neutral-500 hover:text-neutral-700"
                            )}
                        >
                            Upload
                        </button>
                        <button
                            onClick={() => setActiveTab('link')}
                            className={cn(
                                "flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                                activeTab === 'link'
                                    ? "border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100"
                                    : "border-transparent text-neutral-500 hover:text-neutral-700"
                            )}
                        >
                            Link
                        </button>
                        {onRemove && (
                            <button
                                onClick={() => { onRemove(); setIsOpen(false); }}
                                className="px-4 py-2 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                            >
                                Remove
                            </button>
                        )}
                    </div>

                    <div className="p-4 max-h-[300px] overflow-y-auto">
                        {activeTab === 'gallery' && (
                            <div className="grid grid-cols-3 gap-2">
                                {COVERS.map((cover, i) => (
                                    <div
                                        key={i}
                                        onClick={() => { onChange(cover); setIsOpen(false); }}
                                        className="aspect-video rounded-md cursor-pointer hover:opacity-80 transition-opacity border border-neutral-200 dark:border-neutral-800 relative overflow-hidden"
                                        style={{ background: cover.startsWith('http') ? `url(${cover}) center/cover` : cover }}
                                    />
                                ))}
                            </div>
                        )}

                        {activeTab === 'upload' && (
                            <div className="flex flex-col items-center justify-center h-full min-h-[150px] border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                                {isUploading ? (
                                    <div className="flex flex-col items-center gap-2 text-neutral-500">
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        <span className="text-sm">Uploading...</span>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center gap-2 cursor-pointer w-full h-full justify-center p-4 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                                        <Upload className="w-6 h-6 text-neutral-400" />
                                        <span className="text-sm text-neutral-500 font-medium">Click to upload file</span>
                                        <span className="text-xs text-neutral-400">Max file size 5MB</span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                        />
                                    </label>
                                )}
                            </div>
                        )}

                        {activeTab === 'link' && (
                            <form onSubmit={handleLinkSubmit} className="flex flex-col gap-3">
                                <input
                                    type="url"
                                    placeholder="Paste an image link..."
                                    className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-md text-sm bg-transparent outline-none focus:ring-1 focus:ring-blue-500"
                                    value={linkUrl}
                                    onChange={e => setLinkUrl(e.target.value)}
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-1.5 rounded-md text-sm"
                                >
                                    Submit
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )
            }
        </div >
    );
}
