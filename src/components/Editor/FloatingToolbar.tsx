import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bold, Italic, Strikethrough, Code, Link as LinkIcon, Palette, X, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

type ToolbarView = 'main' | 'link' | 'color';

export function FloatingToolbar() {
    const [show, setShow] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [view, setView] = useState<ToolbarView>('main');
    const [url, setUrl] = useState('');
    const [savedRange, setSavedRange] = useState<Range | null>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleSelectionChange = () => {
            // Don't hide if interacting with the toolbar inputs
            if (view !== 'main') return;

            const selection = window.getSelection();
            if (!selection || selection.isCollapsed) {
                setShow(false);
                return;
            }

            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            // Only show if selection is within the editor (rudimentary check, can be improved)
            if (rect.width === 0 && rect.height === 0) {
                setShow(false);
                return;
            }

            // Calculate position
            // We want it above the selection.
            const top = rect.top - 50 + window.scrollY;
            const left = rect.left + rect.width / 2 + window.scrollX;

            setPosition({ top, left });
            setShow(true);
        };

        const handleMouseDown = (e: MouseEvent) => {
            // Prevent clearing selection when clicking toolbar buttons
            if (toolbarRef.current?.contains(e.target as Node)) {
                // Only prevent default if not clicking an input
                if ((e.target as HTMLElement).tagName !== 'INPUT') {
                    e.preventDefault();
                }
            } else {
                // Clicked outside toolbar
                if (view !== 'main') {
                    setView('main');
                }
            }
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        document.addEventListener('mousedown', handleMouseDown);

        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
            document.removeEventListener('mousedown', handleMouseDown);
        };
    }, [view]);

    const executeCommand = (command: string, value: string | undefined = undefined) => {
        // Restore range if saved
        if (savedRange) {
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(savedRange);
        }
        document.execCommand(command, false, value);
        // Reset
        setSavedRange(null);
        setView('main');
    };

    const saveSelectionAndSwitch = (newView: ToolbarView) => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            setSavedRange(selection.getRangeAt(0));
            // Pre-fill URL if it's a link?
            if (newView === 'link') {
                const node = selection.anchorNode?.parentElement;
                if (node?.tagName === 'A') {
                    setUrl(node.getAttribute('href') || '');
                } else {
                    setUrl('');
                }
            }
            setView(newView);
        }
    };

    if (!show) return null;

    return createPortal(
        <div
            ref={toolbarRef}
            className="fixed z-50 flex items-center gap-1 p-1 bg-white dark:bg-neutral-800 rounded-md shadow-lg border border-neutral-200 dark:border-neutral-700 animate-in fade-in zoom-in-95 duration-200"
            style={{
                top: position.top,
                left: position.left,
                transform: 'translateX(-50%)',
            }}
        >
            {view === 'main' && (
                <>
                    <ToolbarButton
                        icon={Bold}
                        onClick={() => executeCommand('bold')}
                        isActive={document.queryCommandState('bold')}
                    />
                    <ToolbarButton
                        icon={Italic}
                        onClick={() => executeCommand('italic')}
                        isActive={document.queryCommandState('italic')}
                    />
                    <ToolbarButton
                        icon={Strikethrough}
                        onClick={() => executeCommand('strikeThrough')}
                        isActive={document.queryCommandState('strikeThrough')}
                    />
                    <ToolbarButton
                        icon={Code}
                        onClick={() => {
                            const selection = window.getSelection();
                            if (!selection || selection.isCollapsed) return;
                            const text = selection.toString();
                            document.execCommand('insertHTML', false, `<code class="bg-neutral-200 dark:bg-neutral-700 rounded px-1 py-0.5 font-mono text-sm">${text}</code>`);
                        }}
                    />
                    <ToolbarButton
                        icon={LinkIcon}
                        onClick={() => saveSelectionAndSwitch('link')}
                        isActive={document.queryCommandState('createLink')}
                    />
                    <ToolbarButton
                        icon={Palette}
                        onClick={() => saveSelectionAndSwitch('color')}
                    />
                </>
            )}

            {view === 'link' && (
                <div className="flex items-center gap-1 p-1">
                    <input
                        autoFocus
                        type="url"
                        className="bg-transparent border-b border-neutral-300 dark:border-neutral-600 focus:border-blue-500 outline-none text-sm px-1 min-w-[200px] text-neutral-800 dark:text-neutral-200"
                        placeholder="Paste link"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                executeCommand('createLink', url);
                            } else if (e.key === 'Escape') {
                                setView('main');
                            }
                        }}
                    />
                    <ToolbarButton icon={Check} onClick={() => executeCommand('createLink', url)} />
                    <ToolbarButton icon={X} onClick={() => setView('main')} />
                </div>
            )}

            {view === 'color' && (
                <div className="flex flex-col gap-2 p-2 max-h-[300px] overflow-y-auto">
                    <div className="text-xs font-semibold text-neutral-500">Color</div>
                    <div className="flex gap-1 flex-wrap w-[200px]">
                        {['Default', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280', '#92400E'].map((color) => (
                            <button
                                key={color}
                                className="w-6 h-6 rounded-sm border border-neutral-200 dark:border-neutral-700 hover:scale-110 transition-transform"
                                style={{ backgroundColor: color === 'Default' ? 'transparent' : color }}
                                onClick={() => executeCommand('foreColor', color === 'Default' ? '#000000' : color)}
                                title={color}
                            >
                                {color === 'Default' && <span className="text-xs">A</span>}
                            </button>
                        ))}
                    </div>
                    <div className="text-xs font-semibold text-neutral-500 mt-2">Background</div>
                    <div className="flex gap-1 flex-wrap w-[200px]">
                        {['Default', '#FEE2E2', '#FEF3C7', '#D1FAE5', '#DBEAFE', '#EDE9FE', '#FCE7F3', '#F3F4F6'].map((color) => (
                            <button
                                key={color}
                                className="w-6 h-6 rounded-sm border border-neutral-200 dark:border-neutral-700 hover:scale-110 transition-transform"
                                style={{ backgroundColor: color === 'Default' ? 'transparent' : color }}
                                onClick={() => executeCommand('hiliteColor', color === 'Default' ? 'transparent' : color)}
                                title={color}
                            >
                                {color === 'Default' && <X className="w-3 h-3 mx-auto text-neutral-500" />}
                            </button>
                        ))}
                    </div>
                    <div className="w-full flex justify-end mt-2">
                        <button onClick={() => setView('main')} className="text-xs text-neutral-500 hover:text-neutral-900">Back</button>
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
}

function ToolbarButton({ icon: Icon, onClick, isActive }: { icon: any, onClick: () => void, isActive?: boolean }) {
    return (
        <button
            className={cn(
                "p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors",
                isActive && "bg-neutral-200 dark:bg-neutral-600 text-neutral-900 dark:text-white"
            )}
            onClick={onClick}
        >
            <Icon className="w-4 h-4" />
        </button>
    );
}
