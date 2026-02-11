import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

interface SelfClosingAlertProps {
    message: string;
    duration?: number;
    onClose: () => void;
    className?: string; // Add className prop for flexibility
}

export function SelfClosingAlert({ message, duration = 5000, onClose, className }: SelfClosingAlertProps) {
    const [width, setWidth] = useState(100);

    useEffect(() => {
        // Start the animation slightly after mount to ensure transition works
        const animationTimeout = setTimeout(() => {
            setWidth(0);
        }, 50);

        // Close the alert after the duration
        const closeTimeout = setTimeout(() => {
            onClose();
        }, duration);

        return () => {
            clearTimeout(animationTimeout);
            clearTimeout(closeTimeout);
        };
    }, [duration, onClose]);

    return (
        <div className={cn("relative overflow-hidden bg-green-50 border border-green-200 rounded-md p-4 text-center", className)}>
            <p className="text-sm text-green-800 font-medium">{message}</p>
            <div
                className="absolute bottom-0 left-0 h-1 bg-green-500 transition-all ease-linear"
                style={{
                    width: `${width}%`,
                    transitionDuration: `${duration}ms`,
                }}
            />
        </div>
    );
}
