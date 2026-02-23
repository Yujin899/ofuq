"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

function SidebarSkeleton() {
    return (
        <aside className="w-64 border-r bg-card h-screen flex flex-col sticky top-0 font-sans antialiased">
            <div className="p-6">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded" />
                    <Skeleton className="h-6 w-20" />
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-6 overflow-y-auto custom-scrollbar pt-2">
                <div className="space-y-2">
                    {[1, 2].map((i) => (
                        <div key={i} className="flex items-center gap-3 px-3 py-2">
                            <Skeleton className="h-4 w-4 shrink-0" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    ))}
                </div>

                <div className="space-y-4">
                    <div className="px-3">
                        <Skeleton className="h-3 w-28" />
                    </div>

                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-3 px-3 py-2">
                                <Skeleton className="h-4 w-4 shrink-0 rounded-sm" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        ))}
                    </div>
                </div>
            </nav>

            <div className="p-4 mt-auto border-t bg-card/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 px-2 py-2">
                    <div className="h-8 w-8 shrink-0 rounded-full border border-primary/10 flex items-center justify-center">
                        <Skeleton className="h-full w-full rounded-full" />
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-2 w-24" />
                    </div>
                </div>
            </div>
        </aside>
    );
}

export function AppLoadingSkeleton() {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Desktop Sidebar Skeleton */}
            <div className="hidden md:flex w-64 shrink-0 flex-col border-r shadow-sm">
                <SidebarSkeleton />
            </div>

            {/* Main Content Area Skeleton */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Mobile Header Skeleton */}
                <header className="flex md:hidden items-center h-14 border-b px-4 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                    <Button variant="ghost" size="icon" className="md:hidden" disabled>
                        <Menu className="h-5 w-5 opacity-50" />
                    </Button>
                    <div className="ml-4 flex items-center gap-2">
                        <Skeleton className="h-5 w-5 rounded" />
                        <Skeleton className="h-5 w-16" />
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
                    <div className="mx-auto max-w-5xl h-full space-y-8 animate-in fade-in duration-500">
                        {/* Generic Content Skeleton */}
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-64" />
                                <Skeleton className="h-4 w-96 max-w-full" />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 pt-4">
                                <Skeleton className="h-32 w-full rounded-xl" />
                                <Skeleton className="h-32 w-full rounded-xl" />
                                <Skeleton className="h-32 w-full rounded-xl" />
                                <Skeleton className="h-32 w-full rounded-xl" />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 pt-4">
                                <Skeleton className="h-[400px] col-span-4 rounded-xl" />
                                <Skeleton className="h-[400px] col-span-3 rounded-xl" />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
