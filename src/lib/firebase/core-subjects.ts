import { db } from "../firebase";
import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc, Timestamp } from "firebase/firestore";

export interface CoreSubject {
    id: string;
    name: string;
    createdAt?: Timestamp | Date;
}

const COLLECTION_NAME = "core_subjects";

export async function getCoreSubjects(): Promise<CoreSubject[]> {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as CoreSubject[];
}

export async function createCoreSubject(name: string): Promise<string> {
    const docId = name.toLowerCase().replace(/\s+/g, "-");
    const docRef = doc(db, COLLECTION_NAME, docId);

    await setDoc(docRef, {
        name,
        createdAt: new Date(),
    });

    return docId;
}

export async function updateCoreSubject(id: string, newName: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
        name: newName
    });
}

export async function deleteCoreSubject(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
}
