"use client";

import { useEffect, useState, useCallback } from "react";
import { auth, rtdb } from "@/lib/firebase";
import { ref, onValue, onDisconnect, set, serverTimestamp } from "firebase/database";

export interface UserStatus {
    state: "online" | "offline";
    lastChanged: object | number;
    stepIndex?: number;
    journeyId?: string;
    displayName?: string;
    photoURL?: string | null;
}

export function usePresence() {
    const [presenceData, setPresenceData] = useState<Record<string, UserStatus>>({});

    useEffect(() => {
        if (!auth.currentUser) return;

        const userId = auth.currentUser.uid;
        const userStatusRef = ref(rtdb, `/status/${userId}`);
        const connectedRef = ref(rtdb, ".info/connected");

        const unsubConnected = onValue(connectedRef, (snap) => {
            if (snap.val() === false) return;

            onDisconnect(userStatusRef)
                .update({
                    state: "offline",
                    lastChanged: serverTimestamp(),
                })
                .then(() => {
                    set(userStatusRef, {
                        state: "online",
                        lastChanged: serverTimestamp(),
                        displayName: auth.currentUser?.displayName,
                        photoURL: auth.currentUser?.photoURL,
                    });
                });
        });

        const statusRef = ref(rtdb, "/status");
        const unsubStatus = onValue(statusRef, (snap) => {
            setPresenceData(snap.val() || {});
        });

        return () => {
            unsubConnected();
            unsubStatus();
        };
    }, []);

    const trackStep = useCallback((journeyId: string, stepIndex: number) => {
        if (!auth.currentUser) return;
        const userStatusRef = ref(rtdb, `/status/${auth.currentUser.uid}`);
        set(userStatusRef, {
            state: "online",
            lastChanged: serverTimestamp(),
            journeyId,
            stepIndex,
            displayName: auth.currentUser.displayName,
            photoURL: auth.currentUser.photoURL,
        });
    }, []);

    return { presenceData, trackStep };
}
