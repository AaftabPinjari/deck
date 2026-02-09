import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';

export function Layout() {
    return (
        <div className="flex h-screen w-full bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50">
            <Sidebar />
            <main className="flex-1 overflow-y-auto h-full">
                <Outlet />
            </main>
        </div>
    );
}
