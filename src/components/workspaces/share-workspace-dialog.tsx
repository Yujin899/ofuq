"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface ShareWorkspaceDialogProps {
    workspaceId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ShareWorkspaceDialog({
    workspaceId,
    open,
    onOpenChange,
}: ShareWorkspaceDialogProps) {
    const [copied, setCopied] = useState(false);

    // Generate the full join URL
    const joinUrl = typeof window !== "undefined"
        ? `${window.location.origin}/workspaces/join/${workspaceId}`
        : "";

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(joinUrl);
            setCopied(true);
            toast.success("Invite link copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error("Failed to copy link.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share Workspace</DialogTitle>
                    <DialogDescription>
                        Anyone with this link can join as a read-only member.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center space-x-2 py-4">
                    <div className="grid flex-1 gap-2">
                        <Label htmlFor="link" className="sr-only">
                            Link
                        </Label>
                        <Input
                            id="link"
                            defaultValue={joinUrl}
                            readOnly
                            className="bg-muted text-muted-foreground"
                        />
                    </div>
                    <Button type="button" size="sm" onClick={handleCopy} className="px-3">
                        <span className="sr-only">Copy</span>
                        {copied ? (
                            <Check className="h-4 w-4" />
                        ) : (
                            <Copy className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
