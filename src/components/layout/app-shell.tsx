"use client";

import { Sidebar } from "./sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 shrink-0 flex-col border-r shadow-sm">
                <Sidebar />
            </aside>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Mobile Header with Sheet */}
                <header className="flex md:hidden items-center h-14 border-b px-4 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-64 p-0">
                            <Sidebar />
                        </SheetContent>
                    </Sheet>
                    <div className="ml-4 font-bold">Ofuq</div>
                </header>

                <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
                    <div className="mx-auto max-w-5xl h-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
