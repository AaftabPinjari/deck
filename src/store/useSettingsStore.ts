import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface SettingsState {
    theme: Theme;
    isSettingsOpen: boolean;
    isMobileSidebarOpen: boolean;
    setTheme: (theme: Theme) => void;
    toggleSettings: (isOpen?: boolean) => void;
    setIsMobileSidebarOpen: (isOpen: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            theme: 'system',
            isSettingsOpen: false,
            isMobileSidebarOpen: false,
            setTheme: (theme) => set({ theme }),
            toggleSettings: (isOpen) => set((state) => ({
                isSettingsOpen: isOpen !== undefined ? isOpen : !state.isSettingsOpen
            })),
            setIsMobileSidebarOpen: (isOpen) => set({ isMobileSidebarOpen: isOpen }),
        }),
        {
            name: 'notion-clone-settings',
        }
    )
);
