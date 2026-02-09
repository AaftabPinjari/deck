import { Skeleton } from '../ui/Skeleton';

export function SidebarSkeleton() {
    return (
        <div className="flex flex-col gap-4 px-3 py-2">
            {/* User Menu Skeleton */}
            <div className="flex items-center gap-2 mb-4 px-2">
                <Skeleton className="h-5 w-5 rounded-sm" />
                <Skeleton className="h-4 w-24" />
            </div>

            {/* Navigation Items Skeleton */}
            <div className="space-y-1">
                <Skeleton className="h-7 w-full" />
                <Skeleton className="h-7 w-full" />
                <Skeleton className="h-7 w-full" />
            </div>

            {/* Separator */}
            <div className="my-2 px-2">
                <Skeleton className="h-3 w-16 mb-2" />
            </div>

            {/* Document List Skeleton */}
            <div className="space-y-1">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2 px-2 py-1">
                        <Skeleton className="h-4 w-4 rounded-sm" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                ))}
            </div>
            {/* Nested Indentation Example */}
            <div className="space-y-1 pl-6">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2 px-2 py-1">
                        <Skeleton className="h-4 w-4 rounded-sm" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                ))}
            </div>
        </div>
    );
}
