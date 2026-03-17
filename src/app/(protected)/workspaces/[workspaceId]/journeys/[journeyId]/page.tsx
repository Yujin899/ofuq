"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, onSnapshot, collection, setDoc, serverTimestamp, QuerySnapshot, DocumentSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Journey } from "@/types/journey";
import { JourneyBuilder } from "@/components/workspaces/journey-builder";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Map, Loader2, Edit2, Eye, Sparkles } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { HorizonTrail } from "@/components/workspaces/horizon-trail";
import { usePresence } from "@/hooks/use-presence";
import { useAuth } from "@/hooks/use-auth";

export default function JourneyDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { presenceData, trackStep } = usePresence();
    const workspaceId = params.workspaceId as string;
    const journeyId = params.journeyId as string;

    const [journey, setJourney] = useState<Journey | null>(null);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState<'view' | 'edit'>('view');
    const [allMembersProgress, setAllMembersProgress] = useState<Record<string, number>>({});
    const [isJoined, setIsJoined] = useState(false);
    const [joining, setJoining] = useState(false);

    const [participantUsers, setParticipantUsers] = useState<Record<string, { displayName: string, email: string, photoURL: string | null }>>({});

    const currentStepIndex = (user && allMembersProgress[user.uid]) ?? 0;

    useEffect(() => {
        if (!workspaceId || !journeyId || !user) return;

        // Live-sync Journey Data (so edits are reflected immediately)
        const journeyDocRef = doc(db, "workspaces", workspaceId, "journeys", journeyId);
        const unsubJourney = onSnapshot(journeyDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setJourney({ id: docSnap.id, ...docSnap.data() } as Journey);
            } else {
                toast.error("Journey not found.");
                router.push(`/workspaces/${workspaceId}`);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching journey:", error);
            toast.error("Failed to load journey.");
            setLoading(false);
        });

        // Listen for ALL Users' Progress in this Journey
        const progressCollectionRef = collection(db, "workspaces", workspaceId, "journeys", journeyId, "user_progress");
        const unsubProgress = onSnapshot(progressCollectionRef, (snapshot: QuerySnapshot) => {
            const progressMap: Record<string, number> = {};
            let joined = false;
            
            snapshot.docs.forEach((docSnap: DocumentSnapshot) => {
                const data = docSnap.data();
                if (data) {
                    progressMap[docSnap.id] = data.currentStepIndex || 0;
                    if (docSnap.id === user.uid) joined = true;
                }
            });
            
            setAllMembersProgress(progressMap);
            setIsJoined(joined);
        });

        return () => {
            unsubJourney();
            unsubProgress();
        };
    }, [workspaceId, journeyId, user, router]);

    // Fetch User Profiles for participants
    useEffect(() => {
        const missingUids = Object.keys(allMembersProgress).filter(uid => !participantUsers[uid]);
        if (missingUids.length === 0) return;

        missingUids.forEach(async (uid) => {
            try {
                const userDoc = await getDoc(doc(db, "users", uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setParticipantUsers(prev => ({
                        ...prev,
                        [uid]: {
                            displayName: data.displayName || "",
                            email: data.email || "",
                            photoURL: data.photoURL || null,
                        }
                    }));
                }
            } catch (err) {
                console.error("Failed to fetch user data for", uid, err);
            }
        });
    }, [allMembersProgress, participantUsers]);

    const handleJoinJourney = async () => {
        if (!user || !workspaceId || !journeyId || joining) return;
        
        setJoining(true);
        try {
            const progressRef = doc(db, "workspaces", workspaceId, "journeys", journeyId, "user_progress", user.uid);
            await setDoc(progressRef, {
                currentStepIndex: 0,
                lastUpdated: serverTimestamp(),
            });
            toast.success("Welcome to the path! 🚀");
        } catch (error) {
            console.error("Error joining journey:", error);
            toast.error("Failed to join journey.");
        } finally {
            setJoining(false);
        }
    };

    // Track user position for Multiplayer Presence (RTDB)
    useEffect(() => {
        if (journey && user) {
            trackStep(journeyId, currentStepIndex);
        }
    }, [journey, journeyId, user, currentStepIndex, trackStep]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-muted-foreground animate-pulse">Loading your study path...</p>
            </div>
        );
    }

    if (!journey) return null;

    // Merge Firestore progress with RTDB presence for HorizonTrail
    const joinedMembers = Object.entries(allMembersProgress).map(([uid, stepIndex]) => {
        const presence = presenceData[uid];
        const profile = participantUsers[uid];
        
        let finalDisplayName = "Explorer";
        if (presence?.displayName) {
            finalDisplayName = presence.displayName;
        } else if (profile?.displayName && profile.displayName !== "New User") {
            finalDisplayName = profile.displayName;
        } else if (profile?.email) {
            finalDisplayName = profile.email.split('@')[0];
        }

        return {
            userId: uid,
            stepIndex: stepIndex,
            displayName: finalDisplayName,
            photoURL: presence?.photoURL || profile?.photoURL || null,
            isOnline: presence?.state === "online" && presence?.journeyId === journeyId,
        };
    });

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header & Navigation */}
            <div className="flex flex-col space-y-6">
                <div className="flex items-center justify-between">
                    <Link 
                        href={`/workspaces/${workspaceId}`}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors w-fit"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Workspace
                    </Link>

                    {isJoined && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setMode(mode === 'view' ? 'edit' : 'view')}
                            className="rounded-xl border-primary/20 hover:bg-primary/5 text-primary gap-2"
                        >
                            {mode === 'view' ? (
                                <>
                                    <Edit2 className="h-4 w-4" />
                                    Edit Journey
                                </>
                            ) : (
                                <>
                                    <Eye className="h-4 w-4" />
                                    View Trail
                                </>
                            )}
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <div className="p-4 rounded-3xl bg-primary/10 shadow-inner">
                        <Map className="h-10 w-10 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-foreground">{journey.name}</h1>
                        <p className="text-muted-foreground font-medium">{journey.description || "A personalized path to knowledge."}</p>
                    </div>
                </div>
            </div>

            {/* Content Switcher */}
            {mode === 'view' ? (
                <div className="relative">
                    <div className={cn(
                        "bg-card/30 rounded-[3rem] border border-primary/5 shadow-2xl p-4 md:p-10 backdrop-blur-xl transition-all duration-500",
                        !isJoined && "blur-sm pointer-events-none opacity-50 select-none"
                    )}>
                        <HorizonTrail 
                            journey={journey} 
                            workspaceId={workspaceId}
                            currentStepIndex={currentStepIndex}
                            memberPresences={joinedMembers}
                        />
                    </div>
                    
                    {!isJoined && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center">
                            <div className="bg-background/80 backdrop-blur-md p-10 rounded-[2.5rem] border border-primary/20 shadow-2xl text-center space-y-6 max-w-sm animate-in fade-in zoom-in duration-500">
                                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                                    <Sparkles className="h-8 w-8 text-primary" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-foreground">Ready to start?</h3>
                                    <p className="text-muted-foreground text-sm">Join this journey to track your progress and see your friends on the trail.</p>
                                </div>
                                <Button 
                                    onClick={handleJoinJourney} 
                                    disabled={joining}
                                    className="w-full h-12 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20"
                                >
                                    {joining ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Join Journey"}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-card rounded-3xl border border-primary/5 shadow-xl p-8">
                    <JourneyBuilder 
                        workspaceId={workspaceId} 
                        existingJourney={journey} 
                        onClose={() => setMode('view')} 
                    />
                </div>
            )}
        </div>
    );
}

function cn(...inputs: (string | boolean | undefined | null | { [key: string]: boolean })[]) {
    return inputs.filter(Boolean).join(" ");
}
