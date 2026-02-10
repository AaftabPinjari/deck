import { useRef, useState, useEffect, lazy, Suspense, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
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
    const triggerRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    const currentTheme = (theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme) as Theme;

    // Calculate position when opening
    useLayoutEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const PICKER_MAX_WIDTH = 350;
            const VIEWPORT_PADDING = 16;

            let top = rect.bottom + window.scrollY + 8; // 8px gap
            let left = rect.left + window.scrollX;

            // Horizontal Collision Detection
            // If the picker would go off the right edge, shift it left
            if (left + PICKER_MAX_WIDTH > window.innerWidth + window.scrollX - VIEWPORT_PADDING) {
                left = (window.innerWidth + window.scrollX) - PICKER_MAX_WIDTH - VIEWPORT_PADDING;
            }
            // If shifting left made it go off the left edge (very small screen), pin it to left padding
            if (left < VIEWPORT_PADDING) {
                left = window.scrollX + VIEWPORT_PADDING;
            }

            // Vertical Collision Detection
            if (popoverRef.current) {
                const popoverRect = popoverRef.current.getBoundingClientRect();
                const height = popoverRect.height || 400; // Estimate if not yet rendered

                // If not enough space below, and enough space above
                if (
                    rect.bottom + height > window.innerHeight + window.scrollY &&
                    rect.top + window.scrollY - height - 8 > window.scrollY
                ) {
                    top = rect.top + window.scrollY - height - 8;
                }
            }

            setPosition({ top, left });
        }
    }, [isOpen]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                popoverRef.current &&
                !popoverRef.current.contains(event.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(event.target as Node)
            ) {
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
        <>
            <div ref={triggerRef} onClick={() => setIsOpen(!isOpen)} className="cursor-pointer inline-block">
                {children}
            </div>

            {isOpen && createPortal(
                <div
                    ref={popoverRef}
                    className="fixed z-[9999] shadow-xl rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-base font-normal text-left w-[calc(100vw-32px)] sm:w-[350px]"
                    style={{
                        top: position.top,
                        left: position.left,
                    }}
                >
                    <Suspense fallback={
                        <div className="w-full h-[400px] flex items-center justify-center bg-white dark:bg-neutral-900 rounded-xl">
                            <div className="animate-spin w-6 h-6 border-2 border-neutral-300 border-t-blue-500 rounded-full" />
                        </div>
                    }>
                        <EmojiPicker
                            theme={currentTheme}
                            onEmojiClick={onEmojiClick}
                            width="100%"
                            height={400}
                        />
                    </Suspense>
                </div>,
                document.body
            )}
        </>
    );
}
