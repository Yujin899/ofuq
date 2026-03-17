"use client";

import { useEffect, useState } from "react";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Journey } from "@/types/journey";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Map, ArrowRight, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface JourneysListProps {
    workspaceId: string;
    onCreateClick: () => void;
}

export function JourneysList({ workspaceId, onCreateClick }: JourneysListProps) {
    const [journeys, setJourneys] = useState<Journey[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!workspaceId) return;

        const q = query(
            collection(db, "workspaces", workspaceId, "journeys"),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Journey[];
            setJourneys(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [workspaceId]);

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-40 w-full rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Map className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Study Journeys</h3>
                </div>
                <Button size="sm" onClick={onCreateClick} className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Journey
                </Button>
            </div>

            {journeys.length === 0 ? (
                <Card className="border-dashed bg-muted/20">
                    <CardContent className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                        <div className="p-3 rounded-full bg-primary/10">
                            <BookOpen className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium">No journeys yet</p>
                            <p className="text-sm text-muted-foreground max-w-[200px]">
                                Create a custom path through your subjects.
                            </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={onCreateClick}>
                            Create your first journey
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <AnimatePresence>
                        {journeys.map((journey) => (
                            <Link 
                                key={journey.id} 
                                href={`/workspaces/${workspaceId}/journeys/${journey.id}`}
                                className="block h-full"
                            >
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    layout
                                    className="h-full"
                                >
                                    <Card
                                        className="group cursor-pointer hover:border-primary/50 transition-all hover:shadow-md h-full flex flex-col"
                                    >
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-base group-hover:text-primary transition-colors">
                                                {journey.name}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex-1 flex flex-col justify-between">
                                            <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                                                {journey.description || "A personalized study path."}
                                            </p>
                                            <div className="flex items-center justify-between mt-auto">
                                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary/50 text-secondary-foreground">
                                                    {journey.steps.length} {journey.steps.length === 1 ? 'Step' : 'Steps'}
                                                </span>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </Link>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
