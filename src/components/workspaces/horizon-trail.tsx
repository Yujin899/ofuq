"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Journey } from "@/types/journey";
import { Tent, Check, Sparkles, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";

interface MemberPresence {
  userId: string;
  stepIndex: number;
  displayName: string;
  photoURL: string | null;
  isOnline?: boolean;
}

interface HorizonTrailProps {
  journey: Journey;
  workspaceId: string;
  currentStepIndex?: number;
  memberPresences?: MemberPresence[];
}

// Layout constants
const STEP_WIDTH = 160;       // px per step column
const STEP_HEIGHT = 88;       // height of each node in px
const STEP_RISE = 64;         // vertical lift each step goes up
const AVATAR_AREA = 72;       // space above node for avatars
const LABEL_AREA = 56;        // space below node for labels
const CONNECTOR_HEIGHT = 4;   // px for the connector line

export function HorizonTrail({
  journey,
  workspaceId,
  currentStepIndex = 0,
  memberPresences = [],
}: HorizonTrailProps) {
  const totalSteps = journey.steps.length;

  // Canvas height: enough to accommodate the tallest step
  // The highest step is the last one, rising by totalSteps * STEP_RISE
  const canvasHeight = AVATAR_AREA + STEP_HEIGHT + LABEL_AREA + (totalSteps) * STEP_RISE + 80;
  // Canvas width: all steps side by side
  const canvasWidth = totalSteps * STEP_WIDTH + 80;

  return (
    <div
      className="relative"
      style={{ width: canvasWidth, height: canvasHeight }}
    >
      {/* Connector lines between steps */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width={canvasWidth}
        height={canvasHeight}
        style={{ overflow: "visible" }}
      >
        {journey.steps.map((_, index) => {
          if (index === 0) return null;

          // Center X of current and previous step
          const x1 = 40 + (index - 1) * STEP_WIDTH + STEP_WIDTH / 2;
          const x2 = 40 + index * STEP_WIDTH + STEP_WIDTH / 2;

          // Bottom of each step node (Y from top of canvas, steps rise so higher index = lower Y value)
          const bottomY = (step: number) =>
            canvasHeight - LABEL_AREA - (step * STEP_RISE) - STEP_HEIGHT / 2;

          const isCompleted = index <= currentStepIndex;

          return (
            <line
              key={`connector-${index}`}
              x1={x1}
              y1={bottomY(index - 1)}
              x2={x2}
              y2={bottomY(index)}
              stroke={isCompleted ? "oklch(0.65 0.12 170)" : "oklch(0.94 0.02 170)"}
              strokeWidth={CONNECTOR_HEIGHT}
              strokeDasharray={isCompleted ? "none" : "8 6"}
              strokeLinecap="round"
              opacity={isCompleted ? 0.8 : 0.4}
            />
          );
        })}
      </svg>

      {/* Steps */}
      {journey.steps.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const isUpcoming = index > currentStepIndex;
        const isMilestone = (index + 1) % 5 === 0;
        const isLocked = index > currentStepIndex;

        const lectureUrl =
          step.type === "lecture"
            ? `/workspaces/${workspaceId}/subjects/${step.subjectId}/lectures/${step.lectureId}?journeyId=${journey.id}&stepIndex=${index}`
            : null;

        const membersOnStep = memberPresences.filter((p) => p.stepIndex === index);

        // Position: steps go left-to-right, each one is higher
        const centerX = 40 + index * STEP_WIDTH + STEP_WIDTH / 2;
        const centerY = canvasHeight - LABEL_AREA - (index * STEP_RISE) - STEP_HEIGHT / 2;

        const NodeInner = (
          <motion.div
            layout
            whileHover={!isLocked ? { scale: 1.07, y: -6 } : {}}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 20, delay: index * 0.04 }}
            onClick={() => {
              if (isLocked) {
                toast.info(
                  "You need at least 60% on the current quiz to unlock the next horizon! 🚀",
                  {
                    icon: <Lock className="w-4 h-4 text-primary" />,
                    className: "rounded-2xl border-primary/10",
                  }
                );
              }
            }}
            className={cn(
              "flex items-center justify-center rounded-2xl shadow-2xl transition-colors duration-700 border-b-4 active:scale-95 select-none",
              "w-[9rem] h-[5.5rem]",
              isCompleted && "bg-primary text-primary-foreground border-primary/20",
              isCurrent &&
                "bg-accent text-accent-foreground border-accent/20 ring-8 ring-accent/20",
              isUpcoming &&
                "bg-secondary/30 border-primary/5 text-muted-foreground border-dashed border-2",
              isLocked ? "cursor-not-allowed opacity-80" : "cursor-pointer"
            )}
          >
            <div className="flex flex-col items-center">
              {isLocked ? (
                <Lock className="w-5 h-5 mb-1 opacity-40" />
              ) : isCompleted ? (
                <Check className="w-6 h-6 mb-1" />
              ) : isMilestone ? (
                <Tent className="w-6 h-6 mb-1" />
              ) : (
                <span className="text-xl font-black mb-1">{index + 1}</span>
              )}
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-70">
                {isMilestone ? "Checkpoint" : isLocked ? "Locked" : "Step"}
              </span>
            </div>
          </motion.div>
        );

        return (
          <div
            key={step.id}
            className="absolute"
            style={{
              left: centerX - 72, // 72 = half node width (9rem/2)
              top: centerY - STEP_HEIGHT / 2,
            }}
          >
            {/* Avatars above the node */}
            <div className="absolute bottom-full mb-2 left-0 right-0 flex justify-center pointer-events-none">
              <div className="flex flex-row justify-center items-end gap-1 pointer-events-auto">
                <AnimatePresence mode="popLayout">
                  {membersOnStep.map((member, i) => {
                    const membersCount = membersOnStep.length;
                    const centerIdx = (membersCount - 1) / 2;
                    const distFromCenter = Math.abs(i - centerIdx);
                    const yOffset = distFromCenter * 5;
                    const rotation = (i - centerIdx) * 8;

                    return (
                      <motion.div
                        key={member.userId}
                        layout
                        initial={{ opacity: 0, scale: 0.5, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: -20 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        style={{ zIndex: 50 - Math.round(distFromCenter) }}
                        className="relative shrink-0"
                      >
                        <motion.div
                          animate={
                            isCurrent
                              ? { y: [yOffset, yOffset - 8, yOffset] }
                              : { y: yOffset }
                          }
                          style={{ rotate: rotation }}
                          transition={{
                            repeat: isCurrent ? Infinity : 0,
                            duration: 2.5,
                            ease: "easeInOut",
                            delay: i * 0.15,
                          }}
                          className="relative group/avatar origin-bottom"
                        >
                          <Avatar className="w-9 h-9 ring-4 ring-background shadow-xl hover:scale-110 hover:z-50 transition-transform">
                            <AvatarImage src={member.photoURL || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                              {member.displayName[0]}
                            </AvatarFallback>
                          </Avatar>

                          {member.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-background flex items-center justify-center border-2 border-background z-20">
                              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse ring-2 ring-green-500/20" />
                            </div>
                          )}

                          {/* Name tooltip */}
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-foreground text-background text-[9px] font-bold rounded-lg opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                            {member.displayName}
                          </div>
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* Step node */}
            {!isLocked && lectureUrl ? (
              <Link href={lectureUrl}>{NodeInner}</Link>
            ) : (
              NodeInner
            )}

            {/* Label below the node */}
            <div
              className={cn(
                "mt-3 px-3 py-2 rounded-xl bg-background/90 backdrop-blur-md border border-primary/10 shadow-xl text-center max-w-[9rem]",
                isUpcoming ? "opacity-40" : "opacity-100"
              )}
            >
              <div className="flex items-center justify-center gap-1">
                {step.type === "placeholder" && (
                  <Sparkles className="w-3 h-3 text-primary shrink-0" />
                )}
                <span className="text-[11px] font-black tracking-tight line-clamp-2 leading-tight">
                  {step.title}
                </span>
              </div>
              <p className="text-[8px] uppercase tracking-widest font-bold text-primary/60 mt-0.5">
                {step.type === "lecture" ? step.subjectName : "Future Landmark"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
