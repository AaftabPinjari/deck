import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { templates } from '../../data/templates';
import { useDocumentStore } from '../../store/useDocumentStore';
import { cn } from '../../lib/utils';

interface TemplatesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function TemplatesModal({ isOpen, onClose }: TemplatesModalProps) {
    const navigate = useNavigate();
    const { createDocumentFromTemplate } = useDocumentStore();

    const handleSelectTemplate = async (templateId: string) => {
        const docId = await createDocumentFromTemplate(templateId);
        if (docId) {
            navigate(`/${docId}`);
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Choose a Template" className="max-w-2xl">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto p-1">
                {templates.map((template) => (
                    <button
                        key={template.id}
                        onClick={() => handleSelectTemplate(template.id)}
                        className={cn(
                            "flex flex-col items-start p-4 rounded-lg border border-neutral-200 dark:border-neutral-700",
                            "hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-blue-400 dark:hover:border-blue-500",
                            "transition-all duration-150 text-left group"
                        )}
                    >
                        <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                            {template.icon}
                        </span>
                        <span className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
                            {template.name}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                            {template.description}
                        </span>
                    </button>
                ))}
            </div>
        </Modal>
    );
}
