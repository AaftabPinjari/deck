import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div
                className={cn(
                    "bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-md border border-neutral-200 dark:border-neutral-800",
                    className
                )}
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800">
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className={cn("p-4", className?.includes("p-0") && "p-0")}>
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
