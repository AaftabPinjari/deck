import { useSettingsStore } from '../../store/useSettingsStore';
import { Modal } from '../ui/Modal';
import { Moon, Sun, Laptop } from 'lucide-react';
import { cn } from '../../lib/utils';

export function SettingsModal() {
    const { isSettingsOpen, toggleSettings, theme, setTheme } = useSettingsStore();

    return (
        <Modal
            isOpen={isSettingsOpen}
            onClose={() => toggleSettings(false)}
            title="Settings"
            className="max-w-2xl h-[70vh] flex flex-col p-0 overflow-hidden" // Custom class for layout
        >
            <div className="flex h-full">
                {/* Sidebar */}
                <div className="w-48 border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2">
                    <div className="px-3 py-1.5 text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                        Account
                    </div>
                    {/* Placeholder for future settings */}
                    <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-900 dark:text-neutral-100 bg-neutral-200 dark:bg-neutral-800 rounded mb-1 cursor-default">
                        <span>My settings</span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-8 overflow-y-auto">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                        My settings
                    </h3>

                    <div className="mb-8">
                        <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-3 uppercase tracking-wider">Appearance</h4>
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col gap-2">
                                <p className="text-sm text-neutral-900 dark:text-neutral-100">Theme</p>
                                <p className="text-xs text-neutral-500">Customize how Notion Clone looks on your device.</p>
                            </div>

                            <div className="flex-1" />

                            <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                <button
                                    onClick={() => setTheme('light')}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all",
                                        theme === 'light'
                                            ? "bg-white dark:bg-neutral-600 shadow-sm text-neutral-900 dark:text-neutral-100 font-medium"
                                            : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300"
                                    )}
                                >
                                    <Sun className="w-4 h-4" />
                                    Light
                                </button>
                                <button
                                    onClick={() => setTheme('dark')}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all",
                                        theme === 'dark'
                                            ? "bg-white dark:bg-neutral-600 shadow-sm text-neutral-900 dark:text-neutral-100 font-medium"
                                            : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300"
                                    )}
                                >
                                    <Moon className="w-4 h-4" />
                                    Dark
                                </button>
                                <button
                                    onClick={() => setTheme('system')}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all",
                                        theme === 'system'
                                            ? "bg-white dark:bg-neutral-600 shadow-sm text-neutral-900 dark:text-neutral-100 font-medium"
                                            : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300"
                                    )}
                                >
                                    <Laptop className="w-4 h-4" />
                                    System
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
