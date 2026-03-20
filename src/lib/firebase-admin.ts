import * as admin from "firebase-admin";

let serviceAccount: any = {};
try {
    let saString = (process.env.FIREBASE_SERVICE_ACCOUNT || "{}").trim();
    const start = saString.indexOf("{");
    const end = saString.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
        saString = saString.substring(start, end + 1);
        serviceAccount = JSON.parse(saString);
    }
} catch (error) {
    console.error("Error parsing FIREBASE_SERVICE_ACCOUNT:", error);
}

if (!admin.apps.length && serviceAccount.project_id) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
