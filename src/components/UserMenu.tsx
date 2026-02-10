import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronsUpDown, LogOut, Check } from 'lucide-react';
import { auth } from '../services/auth';


export function UserMenu() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Fetch current user details
        auth.getUser().then(({ data: { user } }) => {
            if (user) {
                setUserEmail(user.email || null);
                setDisplayName(user.user_metadata?.full_name || 'User');
            }
        });

        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await auth.signOut();
        navigate('/login');
    };

    const initial = displayName ? displayName[0].toUpperCase() : 'U';

    return (
        <div className="relative" ref={menuRef}>
            <div
                role="button"
                className="flex items-center gap-2 p-2 mx-2 mt-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors cursor-pointer text-neutral-700 dark:text-neutral-300"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="h-5 w-5 bg-neutral-200 dark:bg-neutral-700 rounded flex items-center justify-center text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    {initial}
                </div>
                <span className="text-sm font-medium truncate flex-1 text-left">
                    {displayName}'s Deck
                </span>
                <ChevronsUpDown className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
            </div>

            {isOpen && (
                <div className="absolute top-full left-2 right-2 mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg z-50 py-1 animation-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800 mb-1">
                        <p className="text-xs text-neutral-600 dark:text-neutral-500 font-medium mb-1">
                            {userEmail}
                        </p>
                    </div>

                    <div className="flex items-center justify-between px-3 py-1.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 mx-1 rounded cursor-default">
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-5 bg-neutral-200 dark:bg-neutral-700 rounded flex items-center justify-center text-xs font-medium">
                                {initial}
                            </div>
                            <span className="truncate">{displayName}'s Deck</span>
                        </div>
                        <Check className="h-3 w-3 text-neutral-700 dark:text-neutral-300" />
                    </div>

                    <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-1.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 mx-1 rounded flex items-center gap-2"
                        style={{ width: 'calc(100% - 8px)' }}
                    >
                        <LogOut className="h-4 w-4" />
                        Log out
                    </button>
                </div>
            )}
        </div>
    );
}
