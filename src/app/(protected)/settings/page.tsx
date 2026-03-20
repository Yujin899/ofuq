"use client";

import { useAuth } from "@/hooks/use-auth";
import { ConnectTelegramModal } from "@/components/settings/connect-telegram-modal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings as SettingsIcon, Bell } from "lucide-react";

export default function SettingsPage() {
    const { user } = useAuth();

    return (
        <div className="max-w-4xl mx-auto space-y-8 py-8 px-4 sm:px-0">
            <header className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your account preferences and notifications</p>
            </header>

            <div className="grid gap-6">
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground/70">
                        <Bell className="h-4 w-4" />
                        Notifications
                    </div>
                    
                    <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xl font-bold">Telegram Notifications</CardTitle>
                            <CardDescription className="text-sm">
                                Link your Telegram account to receive alerts for your Pomodoro sessions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <ConnectTelegramModal />
                        </CardContent>
                    </Card>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground/70">
                        <SettingsIcon className="h-4 w-4" />
                        Account Details
                    </div>
                    
                    <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
                        <CardContent className="py-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</p>
                                    <p className="text-sm font-medium">{user?.email}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Role</p>
                                    <p className="text-sm font-medium capitalize">{user?.role || "Student"}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </div>
    );
}
