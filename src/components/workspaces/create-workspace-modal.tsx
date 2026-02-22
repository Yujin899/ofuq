"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useWorkspace } from "@/hooks/use-workspace";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
    name: z.string().min(1, "Name is required").max(50, "Name too long"),
    subjects: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateWorkspaceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface CoreSubject {
    id: string;
    name: string;
}

export function CreateWorkspaceModal({ open, onOpenChange }: CreateWorkspaceModalProps) {
    const { createWorkspace } = useWorkspace();
    const [submitting, setSubmitting] = useState(false);
    const [coreSubjects, setCoreSubjects] = useState<CoreSubject[]>([]);
    const [loadingSubjects, setLoadingSubjects] = useState(true);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            subjects: [],
        },
    });

    useEffect(() => {
        if (!open) return;

        const fetchCoreSubjects = async () => {
            setLoadingSubjects(true);
            try {
                // Fetch core subjects directly (one-time fetch per modal open)
                const q = query(collection(db, "core_subjects"), orderBy("name"));
                const snapshot = await getDocs(q);

                const subjects = snapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name
                }));

                setCoreSubjects(subjects);
            } catch (error) {
                console.error("Error fetching core subjects:", error);
                toast.error("Failed to load suggested subjects.");
            } finally {
                setLoadingSubjects(false);
            }
        };

        fetchCoreSubjects();
    }, [open]);

    const onSubmit = async (values: FormValues) => {
        setSubmitting(true);
        try {
            await createWorkspace(values);
            toast.success("Workspace and subjects created successfully!");
            form.reset();
            onOpenChange(false);
        } catch (err) {
            toast.error("Failed to create workspace.");
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Workspace</DialogTitle>
                    <DialogDescription>
                        Workspaces help you organize your studying. You can add subjects now or later.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Workspace Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. University, Personal..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="subjects"
                            render={() => (
                                <FormItem>
                                    <div className="mb-4">
                                        <FormLabel className="text-base">Core Subjects</FormLabel>
                                        <FormDescription>
                                            Select subjects to pre-populate your workspace.
                                        </FormDescription>
                                    </div>

                                    {loadingSubjects ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            {[1, 2, 3, 4, 5, 6].map(i => (
                                                <div key={i} className="flex items-center space-x-3">
                                                    <Skeleton className="h-4 w-4 rounded" />
                                                    <Skeleton className="h-4 w-24 rounded" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            {coreSubjects.map((subject) => (
                                                <FormField
                                                    key={subject.id}
                                                    control={form.control}
                                                    name="subjects"
                                                    render={({ field }) => {
                                                        return (
                                                            <FormItem
                                                                key={subject.id}
                                                                className="flex flex-row items-start space-x-3 space-y-0"
                                                            >
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={field.value?.includes(subject.name)}
                                                                        onCheckedChange={(checked) => {
                                                                            return checked
                                                                                ? field.onChange([...field.value, subject.name])
                                                                                : field.onChange(
                                                                                    field.value?.filter(
                                                                                        (value) => value !== subject.name
                                                                                    )
                                                                                );
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                                <FormLabel className="text-sm font-normal cursor-pointer">
                                                                    {subject.name}
                                                                </FormLabel>
                                                            </FormItem>
                                                        );
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit" disabled={submitting || loadingSubjects}>
                                {submitting ? "Creating..." : "Create Workspace"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
