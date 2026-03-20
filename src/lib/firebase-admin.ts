import * as admin from "firebase-admin";

let saString = (process.env.FIREBASE_SERVICE_ACCOUNT || "{}").trim();

// Extremely robust parsing: find the first { and last } to extract the JSON object
// This handles single quotes, multi-line issues, or extra characters
const start = saString.indexOf("{");
const end = saString.lastIndexOf("}");
if (start !== -1 && end !== -1) {
    saString = saString.substring(start, end + 1);
}

const serviceAccount = JSON.parse(saString);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
