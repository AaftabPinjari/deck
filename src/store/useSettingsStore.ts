import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface SettingsState {
    theme: Theme;
    isSettingsOpen: boolean;
    setTheme: (theme: Theme) => void;
    toggleSettings: (isOpen?: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            theme: 'system',
            isSettingsOpen: false,
            setTheme: (theme) => set({ theme }),
            toggleSettings: (isOpen) => set((state) => ({
                isSettingsOpen: isOpen !== undefined ? isOpen : !state.isSettingsOpen
            })),
        }),
        {
            name: 'notion-clone-settings',
        }
    )
);
