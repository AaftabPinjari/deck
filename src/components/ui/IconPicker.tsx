import { useRef, useState, useEffect } from 'react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { Smile } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';

interface IconPickerProps {
    onChange: (icon: string) => void;
    children: React.ReactNode;
    asChild?: boolean;
}

export function IconPicker({ onChange, children, asChild }: IconPickerProps) {
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
                    <EmojiPicker
                        theme={currentTheme}
                        onEmojiClick={onEmojiClick}
                        width={350}
                        height={400}
                    />
                </div>
            )}
        </div>
    );
}

export function SingleIconPicker({ icon, onChange }: { icon?: string | null, onChange: (icon: string) => void }) {
    return (
        <IconPicker onChange={onChange}>
            <div className="group relative flex items-center justify-center h-20 w-20 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-6xl select-none">
                {icon ? (
                    <span>{icon}</span>
                ) : (
                    <Smile className="h-8 w-8 text-neutral-400 group-hover:text-neutral-600 dark:text-neutral-500" />
                )}
                {icon && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs text-white font-medium">Change</span>
                    </div>
                )}
            </div>
        </IconPicker>
    );
}
