import { Timestamp } from "firebase/firestore";

export interface JourneyStep {
    id: string;
    type: 'lecture' | 'placeholder';
    lectureId?: string;
    subjectId?: string;
    workspaceId: string;
    title: string;
    subjectName?: string;
    placeholderTitle?: string;
}

export interface Journey {
    id: string;
    workspaceId: string;
    ownerId: string;
    name: string;
    description: string;
    steps: JourneyStep[];
    createdAt: Timestamp | Date;
    updatedAt?: Timestamp | Date;
}
