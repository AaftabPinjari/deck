import { useSettingsStore } from '../../store/useSettingsStore';
import { Modal } from '../ui/Modal';
import { Moon, Sun, Laptop } from 'lucide-react';
import { cn } from '../../lib/utils';

export function SettingsModal() {
    const isSettingsOpen = useSettingsStore(state => state.isSettingsOpen);
    const toggleSettings = useSettingsStore(state => state.toggleSettings);
    const theme = useSettingsStore(state => state.theme);
    const setTheme = useSettingsStore(state => state.setTheme);

    return (
        <Modal
            isOpen={isSettingsOpen}
            onClose={() => toggleSettings(false)}
            title="Settings"
            className="w-full max-w-2xl h-[90vh] md:h-[70vh] flex flex-col p-0 overflow-hidden mx-4 md:mx-auto" // Responsive dimensions
        >
            <div className="flex flex-col md:flex-row h-full">
                {/* Sidebar */}
                <div className="w-full md:w-48 border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 shrink-0">
                    <div className="px-3 py-1.5 text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                        Account
                    </div>
                    {/* Placeholder for future settings */}
                    <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-900 dark:text-neutral-100 bg-neutral-200 dark:bg-neutral-800 rounded mb-1 cursor-default">
                        <span>My settings</span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                        My settings
                    </h3>

                    <div className="mb-8">
                        <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-3 uppercase tracking-wider">Appearance</h4>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <p className="text-sm text-neutral-900 dark:text-neutral-100 font-medium">Theme</p>
                                <p className="text-xs text-neutral-500">Customize how Deck looks on your device.</p>
                            </div>

                            <div className="grid grid-cols-3 gap-2 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                <button
                                    onClick={() => setTheme('light')}
                                    className={cn(
                                        "flex flex-col md:flex-row items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-all",
                                        theme === 'light'
                                            ? "bg-white dark:bg-neutral-600 shadow-sm text-neutral-900 dark:text-neutral-100 font-medium"
                                            : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300"
                                    )}
                                >
                                    <Sun className="w-4 h-4" />
                                    <span>Light</span>
                                </button>
                                <button
                                    onClick={() => setTheme('dark')}
                                    className={cn(
                                        "flex flex-col md:flex-row items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-all",
                                        theme === 'dark'
                                            ? "bg-white dark:bg-neutral-600 shadow-sm text-neutral-900 dark:text-neutral-100 font-medium"
                                            : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300"
                                    )}
                                >
                                    <Moon className="w-4 h-4" />
                                    <span>Dark</span>
                                </button>
                                <button
                                    onClick={() => setTheme('system')}
                                    className={cn(
                                        "flex flex-col md:flex-row items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-all",
                                        theme === 'system'
                                            ? "bg-white dark:bg-neutral-600 shadow-sm text-neutral-900 dark:text-neutral-100 font-medium"
                                            : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300"
                                    )}
                                >
                                    <Laptop className="w-4 h-4" />
                                    <span>System</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
