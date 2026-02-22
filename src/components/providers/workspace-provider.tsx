"use client";

import {
    createContext,
    useEffect,
    useState,
    useCallback,
    useMemo,
} from "react";
import {
    collection,
    onSnapshot,
    query,
    where,
    serverTimestamp,
    Timestamp,
    writeBatch,
    doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import {
    Workspace,
    CreateWorkspaceInput,
    WorkspaceContextType,
} from "@/types/workspace";

export const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
    undefined
);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!user) {
            setWorkspaces([]);
            setActiveWorkspace(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        const q = query(
            collection(db, "workspaces"),
            where("ownerId", "==", user.uid)
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const ws: Workspace[] = snapshot.docs
                    .map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as Workspace[];

                // Sort in-memory to avoid Firebase composite index requirement
                ws.sort((a, b) => {
                    const timeA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
                    const timeB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
                    return timeB - timeA;
                });

                setWorkspaces(ws);

                // Auto-select first workspace if none selected or if active one no longer exists
                if (ws.length > 0) {
                    setActiveWorkspace((current) => {
                        if (!current || !ws.find((w) => w.id === current.id)) {
                            return ws[0];
                        }
                        return current;
                    });
                } else {
                    setActiveWorkspace(null);
                }

                setLoading(false);
            },
            (err) => {
                console.error("Workspace subscription error:", err);
                setError(err);
                setLoading(false);
            }
        );

        return unsubscribe;
    }, [user]);

    const createWorkspace = useCallback(
        async (input: CreateWorkspaceInput) => {
            if (!user) return;

            try {
                setError(null);
                const batch = writeBatch(db);

                // 1. Create Workspace
                const newWorkspaceRef = doc(collection(db, "workspaces"));
                batch.set(newWorkspaceRef, {
                    name: input.name,
                    ownerId: user.uid,
                    createdAt: serverTimestamp(),
                });

                // 2. Create Selected Subjects
                if (input.subjects && input.subjects.length > 0) {
                    input.subjects.forEach((subjectName) => {
                        const newSubjectRef = doc(collection(db, "workspaces", newWorkspaceRef.id, "subjects"));
                        batch.set(newSubjectRef, {
                            // workspaceId: newWorkspaceRef.id, // No longer strictly needed but okay to omit
                            name: subjectName,
                            createdAt: serverTimestamp(),
                        });
                    });
                }

                await batch.commit();

                // Note: onSnapshot will pick this up and add it to the list.
                // The effect will auto-select it if it's the first one.
            } catch (err) {
                setError(err instanceof Error ? err : new Error("Failed to create workspace"));
                throw err;
            }
        },
        [user]
    );

    const value = useMemo(
        () => ({
            workspaces,
            activeWorkspace,
            setActiveWorkspace,
            createWorkspace,
            loading,
            error,
        }),
        [workspaces, activeWorkspace, createWorkspace, loading, error]
    );

    return (
        <WorkspaceContext.Provider value={value}>
            {children}
        </WorkspaceContext.Provider>
    );
}
