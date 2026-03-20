"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ConnectTelegramModal } from "@/components/settings/connect-telegram-modal";

export function TelegramBanner() {
    const { user } = useAuth();
    const [isVisible, setIsVisible] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        
        const unsub = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const isConnected = !!data.telegramChatId;
                const isDismissed = !!data.telegramDismissed;
                
                setIsVisible(!isConnected && !isDismissed);
            }
            setLoading(false);
        });

        return () => unsub();
    }, [user]);

    const handleDismiss = async () => {
        if (!user) return;
        setIsVisible(false);
        try {
            await setDoc(doc(db, "users", user.uid), { telegramDismissed: true }, { merge: true });
        } catch (error) {
            console.error("Error dismissing Telegram banner:", error);
        }
    };

    if (loading || !isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl mx-auto mb-6 px-4 sm:px-0"
            >
                <div className="bg-primary/5 border border-primary/20 rounded-[2rem] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Bell className="h-5 w-5" />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-sm font-bold text-foreground">Stay Focused with Telegram</p>
                            <p className="text-xs text-muted-foreground font-medium">Get notified on Telegram when your break starts</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <ConnectTelegramModal />
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleDismiss}
                            className="text-muted-foreground hover:text-foreground h-9 px-3 rounded-xl"
                        >
                            Maybe later
                        </Button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
