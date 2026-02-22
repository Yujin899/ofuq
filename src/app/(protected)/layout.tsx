import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import { WorkspaceProvider } from "@/components/providers/workspace-provider";

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute>
            <WorkspaceProvider>
                <AppShell>{children}</AppShell>
            </WorkspaceProvider>
        </ProtectedRoute>
    );
}
