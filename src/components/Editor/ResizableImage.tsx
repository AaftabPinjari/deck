import { useState, useRef, useCallback, memo } from 'react';

interface ResizableImageProps {
    src: string;
    alt?: string;
    initialWidth?: number;
    onWidthChange: (width: number) => void;
    onClear: () => void;
}

// Pre-defined constants to avoid re-creation
const MIN_WIDTH = 25;
const MAX_WIDTH = 100;

export const ResizableImage = memo(function ResizableImage({
    src,
    alt = 'Image',
    initialWidth = 100,
    onWidthChange,
    onClear,
}: ResizableImageProps) {
    const [width, setWidth] = useState(initialWidth);
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const dragStateRef = useRef({ startX: 0, startY: 0, startWidth: 0 });
    const widthRef = useRef(width);

    // Sync ref with state
    widthRef.current = width;

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const parentWidth = containerRef.current?.parentElement?.offsetWidth;
        if (!parentWidth) return;

        setIsResizing(true);
        dragStateRef.current = { startX: e.clientX, startY: e.clientY, startWidth: widthRef.current };

        const parentW = parentWidth; // Capture for closure

        const handleMouseMove = (e: MouseEvent) => {
            const { startX, startY, startWidth } = dragStateRef.current;
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            const deltaPercent = ((deltaX + deltaY) / 2 / parentW) * 100;

            const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth + deltaPercent));
            setWidth(newWidth);
            widthRef.current = newWidth;
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            onWidthChange(widthRef.current);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [onWidthChange]);

    return (
        <div
            ref={containerRef}
            className="relative group/image"
            style={{ width: `${width}%` }}
        >
            <img src={src} alt={alt} className="w-full rounded-md shadow-sm" draggable={false} />

            {/* Resize handle */}
            <div
                className="absolute right-0 bottom-0 w-6 h-6 cursor-nwse-resize z-10 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center"
                onMouseDown={handleMouseDown}
            >
                <svg width="12" height="12" viewBox="0 0 12 12" className="text-blue-500">
                    <path d="M11 1v10H1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </div>

            {/* Edit button */}
            <div className="absolute right-2 top-2 opacity-0 group-hover/image:opacity-100 transition-opacity">
                <button className="p-1 bg-black/50 text-white rounded hover:bg-black/70 text-xs" onClick={onClear}>
                    Edit
                </button>
            </div>

            {/* Width indicator */}
            {isResizing && (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/70 text-white px-2 py-1 rounded text-sm font-medium">
                    {Math.round(width)}%
                </div>
            )}
        </div>
    );
});
