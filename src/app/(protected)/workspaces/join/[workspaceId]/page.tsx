"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function JoinWorkspacePage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [status, setStatus] = useState<"loading" | "error" | "joining">("loading");
    const workspaceId = params.workspaceId as string;

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            // Store the join URL to redirect back after login
            const currentUrl = typeof window !== "undefined" ? window.location.pathname : "";
            router.push(`/?redirect=${encodeURIComponent(currentUrl)}`);
            return;
        }

        const joinWorkspace = async () => {
            if (!workspaceId) return;

            try {
                setStatus("joining");
                const workspaceRef = doc(db, "workspaces", workspaceId);
                const workspaceSnap = await getDoc(workspaceRef);

                if (!workspaceSnap.exists()) {
                    toast.error("Workspace not found.");
                    setStatus("error");
                    return;
                }

                const data = workspaceSnap.data();

                // If user is owner or already a member, just redirect
                if (data.ownerId === user.uid || (data.memberIds && data.memberIds.includes(user.uid))) {
                    router.push(`/workspaces/${workspaceId}`);
                    return;
                }

                // Add user to memberIds array
                await updateDoc(workspaceRef, {
                    memberIds: arrayUnion(user.uid)
                });

                toast.success("Joined workspace successfully!");
                router.push(`/workspaces/${workspaceId}`);
            } catch (error) {
                console.error("Error joining workspace:", error);
                toast.error("Failed to join workspace.");
                setStatus("error");
            }
        };

        joinWorkspace();
    }, [user, authLoading, workspaceId, router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            {status === "loading" || status === "joining" ? (
                <>
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse">
                        {status === "joining" ? "Joining workspace..." : "Verifying invite..."}
                    </p>
                </>
            ) : (
                <>
                    <p className="text-muted-foreground">Something went wrong or the workspace doesn't exist.</p>
                    <button
                        onClick={() => router.push("/")}
                        className="text-primary hover:underline font-medium"
                    >
                        Go back to Dashboard
                    </button>
                </>
            )}
        </div>
    );
}
