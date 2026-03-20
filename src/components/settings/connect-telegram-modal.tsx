"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Send, Loader2, CheckCircle2, Copy, ExternalLink, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export function ConnectTelegramModal() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [code, setCode] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
    const [loading, setLoading] = useState(false);
    const [connected, setConnected] = useState(false);

    // Listen to user doc for connection status
    useEffect(() => {
        if (!user) return;
        const unsub = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setConnected(!!data.telegramChatId);
            }
        });
        return () => unsub();
    }, [user]);

    // Timer logic
    useEffect(() => {
        if (!code || timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [code, timeLeft]);

    const generateCode = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await fetch("/api/telegram/link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "generate-code", userId: user.uid })
            });

            if (!res.ok) throw new Error("Failed to generate code");
            
            const data = await res.json();
            setCode(data.code);
            setTimeLeft(600);
            toast.success("Code generated!");
        } catch (_error) {
            toast.error("Failed to generate code.");
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        if (!user) return;
        try {
            const res = await fetch("/api/telegram/link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "disconnect", userId: user.uid })
            });

            if (!res.ok) throw new Error("Failed to disconnect");

            toast.success("Disconnected from Telegram.");
        } catch (_error) {
            toast.error("Failed to disconnect.");
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
    const telegramUrl = `https://t.me/${botUsername}?start=${code}`;

    const copyToClipboard = () => {
        if (code) {
            navigator.clipboard.writeText(telegramUrl);
            toast.success("Link copied to clipboard!");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {!connected ? (
                    <Button variant="outline" className="gap-2 rounded-2xl border-primary/20 hover:bg-primary/5">
                        <Send className="h-4 w-4" />
                        Connect Telegram
                    </Button>
                ) : (
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-600 rounded-full text-xs font-bold border border-green-500/20">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Connected
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleDisconnect} className="text-muted-foreground hover:text-destructive h-8 px-2">
                            Disconnect
                        </Button>
                    </div>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl p-8">
                <DialogHeader className="space-y-4 text-center">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
                        <Send className="w-8 h-8" />
                    </div>
                    <DialogTitle className="text-2xl font-bold tracking-tight">Connect to Telegram</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Get notified when your focus sessions and breaks end.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {!code ? (
                        <div className="text-center space-y-4">
                            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                                <RefreshCw className="w-4 h-4" />
                                Generate a one-time code to link your account
                            </p>
                            <Button 
                                onClick={generateCode} 
                                disabled={loading}
                                className="w-full py-6 rounded-3xl font-bold shadow-lg shadow-primary/20 text-lg"
                            >
                                {loading ? <Loader2 className="animate-spin mr-2" /> : "Generate Code"}
                            </Button>
                        </div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-6"
                        >
                            <div className="bg-muted/30 rounded-3xl p-6 text-center border-2 border-dashed border-primary/20 relative overflow-hidden">
                                <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">Your Secret Code</div>
                                <div className="text-5xl font-mono font-black tracking-widest text-primary mb-4">{code}</div>
                                <div className="text-xs font-medium text-muted-foreground flex items-center justify-center gap-1.5">
                                    <div className={timeLeft < 60 ? "text-destructive flex items-center gap-1" : "flex items-center gap-1"}>
                                        Expires in {formatTime(timeLeft)}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Button 
                                    className="w-full py-6 rounded-3xl font-bold shadow-xl shadow-primary/20 gap-2 text-lg"
                                    asChild
                                >
                                    <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
                                        Open in Telegram
                                        <ExternalLink className="w-5 h-5" />
                                    </a>
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    onClick={copyToClipboard}
                                    className="w-full text-muted-foreground hover:text-foreground text-sm gap-2"
                                >
                                    <Copy className="w-4 h-4" />
                                    Copy link instead
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </div>

                <div className="text-[10px] text-center text-muted-foreground tracking-wide font-medium">
                    This code only works once and is strictly for your account.
                </div>
            </DialogContent>
        </Dialog>
    );
}
