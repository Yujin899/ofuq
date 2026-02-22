"use client";

import { createContext, useEffect, useState, useCallback } from "react";
import {
    onAuthStateChanged,
    signInWithPopup,
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    type User,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import type { AuthUser, AuthContextType } from "@/types/auth";

// Helper to map Firebase User → AuthUser
function mapFirebaseUser(user: User): AuthUser {
    return {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
    };
}

export const AuthContext = createContext<AuthContextType | undefined>(
    undefined
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let unsubscribeDoc: (() => void) | undefined;

        const unsubscribeAuth = onAuthStateChanged(
            auth,
            (firebaseUser) => {
                if (firebaseUser) {
                    const baseUser = mapFirebaseUser(firebaseUser);
                    setUser(baseUser);

                    // Listen to Firestore user doc for role
                    const userDocRef = doc(db, "users", firebaseUser.uid);
                    unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
                        if (docSnap.exists()) {
                            const userData = docSnap.data();
                            setUser({
                                ...baseUser,
                                role: userData.role || "student",
                            });
                        } else {
                            // Document doesn't exist yet, default to student
                            setUser({
                                ...baseUser,
                                role: "student",
                            });
                        }
                        setLoading(false);
                    }, (err) => {
                        console.error("Error fetching user role:", err);
                        setLoading(false);
                    });
                } else {
                    setUser(null);
                    if (unsubscribeDoc) unsubscribeDoc();
                    setLoading(false);
                }
            },
            (err) => {
                setError(err);
                setLoading(false);
            }
        );

        return () => {
            unsubscribeAuth();
            if (unsubscribeDoc) unsubscribeDoc();
        };
    }, []);

    const signInWithGoogle = useCallback(async () => {
        try {
            setError(null);
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);

            // Sync user to Firestore
            if (result.user) {
                const userRef = doc(db, "users", result.user.uid);
                await setDoc(userRef, {
                    uid: result.user.uid,
                    email: result.user.email,
                    displayName: result.user.displayName || "New User",
                    photoURL: result.user.photoURL,
                    role: "student", // default role
                    createdAt: serverTimestamp(),
                    lastLoginAt: serverTimestamp(),
                }, { merge: true });
            }
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
            throw err; // Re-throw so the caller can show a toast
        }
    }, []);

    const signUpWithEmail = useCallback(
        async (email: string, password: string) => {
            try {
                setError(null);
                const result = await createUserWithEmailAndPassword(auth, email, password);

                // Sync user to Firestore
                if (result.user) {
                    const userRef = doc(db, "users", result.user.uid);
                    await setDoc(userRef, {
                        uid: result.user.uid,
                        email: result.user.email,
                        displayName: email.split("@")[0], // Fallback display name
                        role: "student", // default role
                        createdAt: serverTimestamp(),
                        lastLoginAt: serverTimestamp(),
                    }, { merge: true });
                }
            } catch (err) {
                setError(err instanceof Error ? err : new Error(String(err)));
                throw err;
            }
        },
        []
    );

    const signInWithEmail = useCallback(
        async (email: string, password: string) => {
            try {
                setError(null);
                await signInWithEmailAndPassword(auth, email, password);
            } catch (err) {
                setError(err instanceof Error ? err : new Error(String(err)));
                throw err;
            }
        },
        []
    );

    const signOut = useCallback(async () => {
        try {
            await firebaseSignOut(auth);
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
        }
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                error,
                signInWithGoogle,
                signUpWithEmail,
                signInWithEmail,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
