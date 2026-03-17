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

export function HorizonTrail({
  journey,
  workspaceId,
  currentStepIndex = 0,
  memberPresences = [],
}: HorizonTrailProps) {
  const totalSteps = journey.steps.length;

  return (
    <div className="relative w-full min-h-[600px] py-32 px-4 flex flex-col items-center bg-[radial-gradient(circle_at_50%_bottom,oklch(0.94_0.02_170/0.3),transparent_70%)] rounded-[3rem] overflow-hidden">
      {/* The Climbing Path Line (Bottom to Top) */}
      <div className="absolute inset-0 pointer-events-none flex justify-center">
        <div className="w-1 h-full bg-primary/5 mask-[linear-gradient(to_top,black,transparent)]" />
      </div>

      <div className="relative z-10 w-full max-w-2xl flex flex-col-reverse gap-32">
        {journey.steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isUpcoming = index > currentStepIndex;
          const isMilestone = (index + 1) % 5 === 0;
          const isLeft = index % 2 === 0;

          // New navigation logic
          const isLocked = index > currentStepIndex;
          const lectureUrl = step.type === 'lecture' 
            ? `/workspaces/${workspaceId}/subjects/${step.subjectId}/lectures/${step.lectureId}?journeyId=${journey.id}&stepIndex=${index}`
            : null;

          // Filter members on this specific step
          const membersOnStep = memberPresences.filter(
            (p) => p.stepIndex === index
          );

          const StepContent = (
            <div className="flex flex-col items-center gap-4 relative group">
              {/* Step Node (2D flat look) */}
              <motion.div
                layout // Enables smooth width expansion
                whileHover={!isLocked ? { scale: 1.05, translateY: -5 } : {}}
                style={{ 
                  minWidth: membersOnStep.length > 1 ? `${11 + (membersOnStep.length - 1) * 2.5}rem` : '11rem' 
                }}
                className={cn(
                  "relative z-20 flex items-center justify-center rounded-3xl shadow-2xl transition-colors duration-700 h-24 border-b-8 active:scale-95 px-6 shrink-0",
                  isCompleted && "bg-primary text-primary-foreground border-primary/20",
                  isCurrent && "bg-accent text-accent-foreground border-accent/20 ring-8 ring-accent/20 animate-in fade-in zoom-in",
                  isUpcoming && "bg-secondary/30 border-primary/5 text-muted-foreground border-dashed border-2",
                  isLocked ? "cursor-not-allowed opacity-80" : "cursor-pointer"
                )}
                onClick={() => {
                  if (isLocked) {
                    toast.info("You need at least 60% on the current quiz to unlock the next horizon! 🚀", {
                      icon: <Lock className="w-4 h-4 text-primary" />,
                      className: "rounded-2xl border-primary/10",
                    });
                  }
                }}
              >
                <div className="flex flex-col items-center">
                  {isLocked ? (
                    <Lock className="w-6 h-6 mb-1 opacity-40" />
                  ) : isCompleted ? (
                    <Check className="w-7 h-7 mb-1" />
                  ) : isMilestone ? (
                    <Tent className="w-7 h-7 mb-1" />
                  ) : (
                    <span className="text-2xl font-black mb-1">{index + 1}</span>
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                    {isMilestone ? "Checkpoint" : isLocked ? "Locked" : "Step"}
                  </span>
                </div>

                {/* Multiplayer Avatars - Gathering Spot */}
                <div className="absolute -top-14 left-0 right-0 flex justify-center pointer-events-none">
                  <div className="flex flex-row flex-wrap justify-center items-end gap-1 px-4 min-w-[200%] pointer-events-auto">
                    <AnimatePresence mode="popLayout">
                      {membersOnStep.map((member, i) => {
                        const membersCount = membersOnStep.length;
                        const centerIndex = (membersCount - 1) / 2;
                        const distFromCenter = Math.abs(i - centerIndex);
                        const yOffset = distFromCenter * 6; // Push outer edges down to form convex arc
                        const rotation = (i - centerIndex) * 8; // Tilt outwards
                        
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
                                animate={isCurrent ? {
                                    y: [yOffset, yOffset - 8, yOffset],
                                } : { y: yOffset }}
                                style={{ rotate: rotation }}
                                transition={{
                                    repeat: isCurrent ? Infinity : 0,
                                    duration: 2.5,
                                    ease: "easeInOut",
                                    delay: i * 0.15 // Stagger the bounce
                                }}
                                className="relative group/avatar origin-bottom"
                            >
                                <Avatar className="w-10 h-10 ring-4 ring-background shadow-xl hover:scale-110 hover:z-50 transition-transform">
                                  <AvatarImage src={member.photoURL || undefined} />
                                  <AvatarFallback className="bg-primary/10 text-primary font-bold">{member.displayName[0]}</AvatarFallback>
                                </Avatar>
                                
                                {/* Online Indicator Dot */}
                                {member.isOnline && (
                                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-background flex items-center justify-center border-2 border-background z-20">
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse ring-2 ring-green-500/20" />
                                  </div>
                                )}

                                {/* Name Tooltip (Mini) */}
                                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-2.5 py-1.5 bg-foreground text-background text-[10px] font-bold rounded-lg opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                                  {member.displayName}
                                </div>
                            </motion.div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>

              {/* Content Label */}
              <div className={cn(
                "absolute top-1/2 -translate-y-1/2 whitespace-nowrap px-5 py-2.5 rounded-2xl bg-background/90 backdrop-blur-md border border-primary/10 shadow-2xl transition-all duration-300",
                isLeft ? "left-full ml-6" : "right-full mr-6 text-right",
                isUpcoming ? "opacity-40" : "opacity-100"
              )}>
                <div className="flex items-center gap-2">
                  {step.type === 'placeholder' && <Sparkles className="w-3.5 h-3.5 text-primary" />}
                  <h5 className="text-sm font-black tracking-tight">{step.title}</h5>
                </div>
                <p className="text-[9px] uppercase tracking-widest font-bold text-primary/60">
                  {step.type === 'lecture' ? step.subjectName : "Future Landmark"}
                </p>
              </div>
            </div>
          );

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.5,
                delay: (totalSteps - index) * 0.1, // Stagger from bottom
                type: "spring",
                stiffness: 120,
              }}
              className={cn(
                "relative flex items-center justify-center w-full",
                isLeft ? "md:justify-start md:pl-20" : "md:justify-end md:pr-20"
              )}
            >
              {!isLocked && lectureUrl ? (
                <Link href={lectureUrl}>
                  {StepContent}
                </Link>
              ) : (
                StepContent
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
