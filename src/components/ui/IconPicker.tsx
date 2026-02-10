import { useRef, useState, useEffect, lazy, Suspense } from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';
import type { EmojiClickData, Theme } from 'emoji-picker-react';

// Dynamically import the heavy emoji picker (~400KB) only when opened
const EmojiPicker = lazy(() => import('emoji-picker-react'));

interface IconPickerProps {
    onChange: (icon: string) => void;
    children: React.ReactNode;
    asChild?: boolean;
}

export function IconPicker({ onChange, children }: IconPickerProps) {
    const { theme } = useSettingsStore();
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    const currentTheme = (theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme) as Theme;

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

    const onEmojiClick = (data: EmojiClickData) => {
        onChange(data.emoji);
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block">
            <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                {children}
            </div>

            {isOpen && (
                <div
                    ref={popoverRef}
                    className="absolute z-50 top-full mt-2 left-0 shadow-xl rounded-xl border border-neutral-200 dark:border-neutral-800"
                >
                    <Suspense fallback={
                        <div className="w-[350px] h-[400px] flex items-center justify-center bg-white dark:bg-neutral-900 rounded-xl">
                            <div className="animate-spin w-6 h-6 border-2 border-neutral-300 border-t-blue-500 rounded-full" />
                        </div>
                    }>
                        <EmojiPicker
                            theme={currentTheme}
                            onEmojiClick={onEmojiClick}
                            width={350}
                            height={400}
                        />
                    </Suspense>
                </div>
            )}
        </div>
    );
}
