"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
    LogOut,
    Sun,
    Moon,
    LayoutDashboard,
    Plus,
    Layers,
    ChevronDown,
    ChevronUp,
    BookOpen,
    PenLine,
    ShieldCheck,
    Link2
} from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { CreateWorkspaceModal } from "../workspaces/create-workspace-modal";
import { JoinWorkspaceModal } from "../workspaces/join-workspace-modal";
import { useWorkspace } from "@/hooks/use-workspace";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MAIN_NAV = [
    { title: "Dashboard", href: "/", icon: LayoutDashboard },
    { title: "Admin", href: "/admin", icon: ShieldCheck, adminOnly: true },
];

export function Sidebar() {
    const { signOut, user } = useAuth();
    const { theme, setTheme } = useTheme();
    const { workspaces, activeWorkspace } = useWorkspace();
    const pathname = usePathname();
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [joinModalOpen, setJoinModalOpen] = useState(false);
    const [openWorkspaces, setOpenWorkspaces] = useState<Record<string, boolean>>({});

    const toggleWorkspace = (wsId: string) => {
        setOpenWorkspaces(prev => ({
            ...prev,
            [wsId]: !prev[wsId]
        }));
    };

    const userIdentifier = useMemo(() => {
        if (user?.displayName) return user.displayName;
        if (user?.email) return user.email.split("@")[0];
        return "User";
    }, [user]);

    const filteredNav = MAIN_NAV.filter(item => !item.adminOnly || user?.role === "admin");

    return (
        <aside className="w-64 border-r bg-card h-screen flex flex-col sticky top-0 font-sans antialiased">
            <div className="p-6">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
                    <div className="h-6 w-6 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs font-black">O</div>
                    <span className="text-foreground">Ofuq</span>
                </Link>
            </div>

            <nav className="flex-1 px-4 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="space-y-1">
                    {filteredNav.map((item) => (
                        <Link
                            key={item.title}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200",
                                pathname === item.href
                                    ? "text-primary font-semibold"
                                    : "text-muted-foreground font-medium hover:bg-accent/40 hover:text-foreground"
                            )}
                        >
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span>{item.title}</span>
                        </Link>
                    ))}
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between px-3">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                            Your Workspaces
                        </h3>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 text-muted-foreground hover:text-primary hover:bg-primary/5"
                                onClick={() => setJoinModalOpen(true)}
                                title="Join Workspace"
                            >
                                <Link2 className="h-3.5 w-3.5" />
                                <span className="sr-only">Join Workspace</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 text-muted-foreground hover:text-primary hover:bg-primary/5"
                                onClick={() => setCreateModalOpen(true)}
                                title="New Workspace"
                            >
                                <Plus className="h-4 w-4" />
                                <span className="sr-only">New Workspace</span>
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-1">
                        {workspaces.map((ws) => {
                            const isOpen = openWorkspaces[ws.id];
                            const isActive = activeWorkspace?.id === ws.id;

                            return (
                                <Collapsible
                                    key={ws.id}
                                    open={isOpen}
                                    onOpenChange={() => toggleWorkspace(ws.id)}
                                    className="space-y-1"
                                >
                                    <CollapsibleTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className={cn(
                                                "w-full justify-between items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200 hover:bg-accent/40",
                                                isActive ? "text-primary font-semibold" : "text-muted-foreground font-medium"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <Layers className={cn(
                                                    "h-4 w-4 shrink-0 transition-colors",
                                                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                                )} />
                                                <span className="truncate">{ws.name}</span>
                                            </div>
                                            {isOpen ? (
                                                <ChevronUp className="h-3 w-3.5 shrink-0 transition-all opacity-50" />
                                            ) : (
                                                <ChevronDown className="h-3 w-3.5 shrink-0 transition-all opacity-50" />
                                            )}
                                        </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="space-y-1 ml-4 border-l pl-2 animate-in slide-in-from-left-1 duration-200">
                                        <Link
                                            href={`/workspaces/${ws.id}`}
                                            className={cn(
                                                "flex items-center gap-3 rounded-md px-3 py-2 text-xs transition-all duration-200",
                                                pathname === `/workspaces/${ws.id}`
                                                    ? "text-primary font-bold"
                                                    : "text-muted-foreground font-medium hover:bg-accent/40 hover:text-foreground"
                                            )}
                                        >
                                            <LayoutDashboard className="h-3.5 w-3.5" />
                                            Overview
                                        </Link>
                                        <Link
                                            href={`/workspaces/${ws.id}/subjects`}
                                            className={cn(
                                                "flex items-center gap-3 rounded-md px-3 py-2 text-xs transition-all duration-200",
                                                pathname === `/workspaces/${ws.id}/subjects`
                                                    ? "text-primary font-bold"
                                                    : "text-muted-foreground font-medium hover:bg-accent/40 hover:text-foreground"
                                            )}
                                        >
                                            <BookOpen className="h-3.5 w-3.5" />
                                            Subjects & Lectures
                                        </Link>

                                    </CollapsibleContent>
                                </Collapsible>
                            );
                        })}

                        {workspaces.length === 0 && (
                            <div className="rounded-md border border-dashed border-muted-foreground/20 px-4 py-8 text-center bg-accent/5 mx-2">
                                <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                                    No workspaces yet.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <div className="p-4 mt-auto border-t bg-card/50 backdrop-blur-sm">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full h-auto flex items-center justify-between gap-3 px-2 py-2 border-dashed hover:bg-accent/40">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-xs font-black border border-primary/20 text-primary uppercase shadow-inner">
                                    {userIdentifier[0]}
                                </div>
                                <div className="flex flex-col items-start overflow-hidden">
                                    <p className="text-xs font-bold truncate text-foreground leading-tight tracking-tight uppercase">
                                        {userIdentifier}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground truncate font-medium">
                                        {user?.email}
                                    </p>
                                </div>
                            </div>
                            <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" side="right" sideOffset={16}>
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="gap-2 cursor-pointer">
                            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                            <span>Toggle Theme</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive gap-2 cursor-pointer">
                            <LogOut className="h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <CreateWorkspaceModal
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
            />
            <JoinWorkspaceModal
                open={joinModalOpen}
                onOpenChange={setJoinModalOpen}
            />
        </aside>
    );
}
