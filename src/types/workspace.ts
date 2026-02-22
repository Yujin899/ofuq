import { Timestamp } from "firebase/firestore";

export interface Workspace {
    id: string;                  // Firestore document ID (set after read)
    ownerId: string;             // Firebase Auth uid of the owner
    name: string;                // Display name, 1–50 characters
    createdAt: Timestamp;        // Firestore server timestamp
}

export interface CreateWorkspaceInput {
    name: string;                // Validated: min 1 char, max 50 chars
    subjects: string[];          // List of initial subjects to create
}

export interface WorkspaceContextType {
    workspaces: Workspace[];
    activeWorkspace: Workspace | null;
    setActiveWorkspace: (workspace: Workspace) => void;
    createWorkspace: (input: CreateWorkspaceInput) => Promise<void>;
    loading: boolean;
    error: Error | null;
}
