import { Skeleton } from '../ui/Skeleton';

export function EditorSkeleton() {
    return (
        <div className="max-w-[800px] mx-auto pt-24 px-12 md:px-24 pb-40">
            {/* Cover Image Skeleton */}
            <div className="group relative h-[20vh] w-full mb-8 hidden">
                <Skeleton className="w-full h-full" />
            </div>

            {/* Icon Skeleton */}
            <div className="mb-4">
                <Skeleton className="h-16 w-16 rounded-full" />
            </div>

            {/* Title Skeleton */}
            <div className="mb-8 space-y-2">
                <Skeleton className="h-12 w-3/4" />
            </div>

            {/* Content Blocks Skeleton */}
            <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[90%]" />
                <Skeleton className="h-4 w-[95%]" />
                <Skeleton className="h-4 w-[85%]" />

                <div className="py-4"></div>

                <Skeleton className="h-8 w-1/2 mb-4" /> {/* Heading */}
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[92%]" />

                <div className="py-2"></div>

                {/* List Item Skeletons */}
                <div className="flex items-center gap-2">
                    <Skeleton className="h-2 w-2 rounded-full" />
                    <Skeleton className="h-4 w-[80%]" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-2 w-2 rounded-full" />
                    <Skeleton className="h-4 w-[70%]" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-2 w-2 rounded-full" />
                    <Skeleton className="h-4 w-[75%]" />
                </div>
            </div>
        </div>
    );
}
