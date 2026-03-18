"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, useMotionValue, useMotionTemplate } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  onSnapshot,
  collection,
  setDoc,
  serverTimestamp,
  QuerySnapshot,
  DocumentSnapshot,
} from "firebase/firestore";
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
import { cn } from "@/lib/utils";

export default function JourneyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { presenceData, trackStep } = usePresence();
  const workspaceId = params.workspaceId as string;
  const journeyId = params.journeyId as string;

  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [allMembersProgress, setAllMembersProgress] = useState<
    Record<string, number>
  >({});
  const [isJoined, setIsJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [participantUsers, setParticipantUsers] = useState<
    Record<
      string,
      { displayName: string; email: string; photoURL: string | null }
    >
  >({});

  // Drag-to-pan state
  const canvasRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panOffset = useRef({ x: 0, y: 0 });
  const panX = useMotionValue(0);
  const panY = useMotionValue(0);
  const [hasInitialCentered, setHasInitialCentered] = useState(false);

  // Motion template for background must be defined before any conditional returns
  const bgPosition = useMotionTemplate`${panX}px ${panY}px`;

  const currentStepIndex = (user && allMembersProgress[user.uid]) ?? 0;

  // Center the canvas on the current step once data loads
  useEffect(() => {
    if (!journey || hasInitialCentered || !canvasRef.current) return;

    // Same constants as HorizonTrail
    const STEP_WIDTH = 160;
    const STEP_HEIGHT = 88;
    const STEP_RISE = 64;
    const AVATAR_AREA = 72;
    const LABEL_AREA = 56;
    
    const totalSteps = journey.steps.length;
    const canvasHeight = AVATAR_AREA + STEP_HEIGHT + LABEL_AREA + (totalSteps) * STEP_RISE + 80;
    
    const centerX = 40 + currentStepIndex * STEP_WIDTH + STEP_WIDTH / 2;
    const centerY = canvasHeight - LABEL_AREA - (currentStepIndex * STEP_RISE) - STEP_HEIGHT / 2;

    const viewport = canvasRef.current.getBoundingClientRect();
    
    // Pan needed to put (centerX, centerY) at the center of the viewport
    const targetX = viewport.width / 2 - centerX;
    const targetY = viewport.height / 2 - centerY;

    panX.set(targetX);
    panY.set(targetY);
    panOffset.current = { x: targetX, y: targetY };
    setHasInitialCentered(true);
  }, [journey, currentStepIndex, hasInitialCentered, panX, panY]);

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Only start dragging on the canvas itself, not on interactive children
    if ((e.target as HTMLElement).closest("a, button, [role='button']")) return;
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX - panOffset.current.x,
      y: e.clientY - panOffset.current.y,
    };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    panOffset.current = { x: newX, y: newY };
    panX.set(newX);
    panY.set(newY);
  }, [panX, panY]);

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // ── Data listeners ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!workspaceId || !journeyId || !user) return;

    const journeyDocRef = doc(db, "workspaces", workspaceId, "journeys", journeyId);
    const unsubJourney = onSnapshot(
      journeyDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setJourney({ id: docSnap.id, ...docSnap.data() } as Journey);
        } else {
          toast.error("Journey not found.");
          router.push(`/workspaces/${workspaceId}`);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching journey:", error);
        toast.error("Failed to load journey.");
        setLoading(false);
      }
    );

    const progressCollectionRef = collection(
      db,
      "workspaces",
      workspaceId,
      "journeys",
      journeyId,
      "user_progress"
    );
    const unsubProgress = onSnapshot(
      progressCollectionRef,
      (snapshot: QuerySnapshot) => {
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
      }
    );

    return () => {
      unsubJourney();
      unsubProgress();
    };
  }, [workspaceId, journeyId, user, router]);

  // Fetch participant user profiles
  useEffect(() => {
    const missingUids = Object.keys(allMembersProgress).filter(
      (uid) => !participantUsers[uid]
    );
    if (missingUids.length === 0) return;

    missingUids.forEach(async (uid) => {
      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setParticipantUsers((prev) => ({
            ...prev,
            [uid]: {
              displayName: data.displayName || "",
              email: data.email || "",
              photoURL: data.photoURL || null,
            },
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
      const progressRef = doc(
        db,
        "workspaces",
        workspaceId,
        "journeys",
        journeyId,
        "user_progress",
        user.uid
      );
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

  // Track user presence step
  useEffect(() => {
    if (journey && user) {
      trackStep(journeyId, currentStepIndex);
    }
  }, [journey, journeyId, user, currentStepIndex, trackStep]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">
          Loading your study path...
        </p>
      </div>
    );
  }

  if (!journey) return null;

  // Merge progress + presence for HorizonTrail
  const joinedMembers = Object.entries(allMembersProgress).map(
    ([uid, stepIndex]) => {
      const presence = presenceData[uid];
      const profile = participantUsers[uid];

      let finalDisplayName = "Explorer";
      if (presence?.displayName) {
        finalDisplayName = presence.displayName;
      } else if (profile?.displayName && profile.displayName !== "New User") {
        finalDisplayName = profile.displayName;
      } else if (profile?.email) {
        finalDisplayName = profile.email.split("@")[0];
      }

      return {
        userId: uid,
        stepIndex,
        displayName: finalDisplayName,
        photoURL: presence?.photoURL || profile?.photoURL || null,
        isOnline:
          presence?.state === "online" &&
          presence?.journeyId === journeyId,
      };
    }
  );

  return (
    // Full-window layout: header is fixed at top, canvas fills rest
    <div className="flex flex-col h-full">
      {/* ── Fixed Header ──────────────────────────────────────────────────── */}
      <div className="shrink-0 px-6 pt-6 pb-4 flex items-center justify-between gap-4 bg-background/80 backdrop-blur-xl border-b border-primary/5 z-30">
        {/* Left: back + title */}
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href={`/workspaces/${workspaceId}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          <div className="p-2.5 rounded-2xl bg-primary/10 shadow-inner shrink-0">
            <Map className="h-6 w-6 text-primary" />
          </div>

          <div className="min-w-0">
            <h1 className="text-xl font-black tracking-tight text-foreground truncate">
              {journey.name}
            </h1>
            <p className="text-xs text-muted-foreground font-medium truncate">
              {journey.description || "A personalized path to knowledge."}
            </p>
          </div>
        </div>

        {/* Right: mode toggle */}
        {isJoined && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMode(mode === "view" ? "edit" : "view")}
            className="rounded-xl border-primary/20 hover:bg-primary/5 text-primary gap-2 shrink-0"
          >
            {mode === "view" ? (
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

      {/* ── Canvas / Edit area ─────────────────────────────────────────────── */}
      {mode === "view" ? (
        <div className="relative flex-1 overflow-hidden">
          {/* Drag canvas — trail sits directly on the background */}
          <div
            ref={canvasRef}
            className={cn(
              "absolute inset-0 select-none",
              !isJoined && "pointer-events-none",
              isDragging.current ? "cursor-grabbing" : "cursor-grab"
            )}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            {/* Subtle grid background */}
            <motion.div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle, oklch(0.65 0.12 170 / 0.08) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
                backgroundPosition: bgPosition,
              }}
            />

            {/* Trail content — panned by transform */}
            <motion.div
              className={cn(
                "absolute transition-none",
                !isJoined && "blur-sm opacity-50",
                !hasInitialCentered && "opacity-0"
              )}
              style={{
                x: panX,
                y: panY,
              }}
            >
              <HorizonTrail
                journey={journey}
                workspaceId={workspaceId}
                currentStepIndex={currentStepIndex}
                memberPresences={joinedMembers}
              />
            </motion.div>
          </div>

          {/* Drag hint */}
          {isJoined && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-foreground/80 text-background text-xs font-semibold rounded-full shadow-xl pointer-events-none select-none opacity-60">
              Drag to explore the trail
            </div>
          )}

          {/* Join overlay — on top of the blurred canvas */}
          {!isJoined && (
            <div className="absolute inset-0 z-50 flex items-center justify-center">
              <div className="bg-background/80 backdrop-blur-md p-10 rounded-[2.5rem] border border-primary/20 shadow-2xl text-center space-y-6 max-w-sm animate-in fade-in zoom-in duration-500">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-foreground">
                    Ready to start?
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Join this journey to track your progress and see your
                    friends on the trail.
                  </p>
                </div>
                <Button
                  onClick={handleJoinJourney}
                  disabled={joining}
                  className="w-full h-12 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20"
                >
                  {joining ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    "Join Journey"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-card rounded-3xl border border-primary/5 shadow-xl p-8 max-w-5xl mx-auto">
            <JourneyBuilder
              workspaceId={workspaceId}
              existingJourney={journey}
              onClose={() => setMode("view")}
            />
          </div>
        </div>
      )}
    </div>
  );
}
