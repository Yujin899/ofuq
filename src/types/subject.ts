import { Timestamp } from "firebase/firestore";

export interface Subject {
    id: string;                  // Firestore document ID
    workspaceId: string;         // Parent workspace ID
    name: string;                // Display name, 1–50 characters
    createdAt: Timestamp;
}
