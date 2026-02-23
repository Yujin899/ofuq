"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface JoinWorkspaceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function JoinWorkspaceModal({ open, onOpenChange }: JoinWorkspaceModalProps) {
    const router = useRouter();
    const [inviteLink, setInviteLink] = useState("");
    const [joining, setJoining] = useState(false);

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();

        if (!inviteLink.trim()) {
            toast.error("Please enter an invite link");
            return;
        }

        setJoining(true);

        try {
            // Extract the workspace ID or the path from the link
            // It could be a full URL like https://domain.com/workspaces/join/123
            // Or just the ID like 123

            let targetUrl = inviteLink.trim();

            if (targetUrl.includes("/workspaces/join/")) {
                const parts = targetUrl.split("/workspaces/join/");
                const id = parts[1].split(/[?#]/)[0]; // Remove query params or hashes
                targetUrl = `/workspaces/join/${id}`;
            } else if (!targetUrl.startsWith("http") && !targetUrl.includes("/")) {
                // Assume it's just the ID
                targetUrl = `/workspaces/join/${targetUrl}`;
            } else {
                // If it's an unrecognized URL format, try to parse its pathname
                const url = new URL(targetUrl);
                if (url.pathname.includes("/workspaces/join/")) {
                    targetUrl = url.pathname;
                } else {
                    toast.error("Invalid invite link format");
                    setJoining(false);
                    return;
                }
            }

            router.push(targetUrl);
            onOpenChange(false);
        } catch (error) {
            toast.error("Invalid invite link format");
            setJoining(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) setInviteLink("");
            onOpenChange(val);
        }}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Join Workspace</DialogTitle>
                    <DialogDescription>
                        Paste the invite link shared with you to join an existing workspace.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleJoin} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="inviteLink">Invite Link</Label>
                        <Input
                            id="inviteLink"
                            placeholder="e.g. https://.../workspaces/join/abc123"
                            value={inviteLink}
                            onChange={(e) => setInviteLink(e.target.value)}
                            autoComplete="off"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={joining}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!inviteLink.trim() || joining}>
                            {joining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Join Workspace
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
