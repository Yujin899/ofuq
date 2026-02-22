# Quickstart: Phase 2 — Workspaces & Dashboard

**Branch**: `002-workspaces-dashboard`

## Prerequisites

- Phase 1 (`001-foundation-auth`) implementation complete
- `.env.local` populated with all 6 `NEXT_PUBLIC_FIREBASE_*` keys
- Firebase project has **Authentication** enabled with both:
  - **Google** sign-in provider (already configured)
  - **Email/Password** sign-in provider — **must be enabled** in Firebase Console → Authentication → Sign-in method
- Firebase project has **Firestore** enabled in **production mode** (you will tighten rules in a later phase)

## Firestore Setup

1. Open [Firebase Console](https://console.firebase.google.com/) → your project → **Firestore Database** → **Create database**
2. Select **Production mode**, choose a region close to your users.
3. After creation, go to **Rules** tab and paste the minimum rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /workspaces/{workspaceId} {
      allow read, create: if request.auth != null && request.auth.uid == request.resource.data.ownerId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.ownerId;
    }
    match /subjects/{subjectId} {
      allow read, write: if request.auth != null &&
        get(/databases/$(database)/documents/workspaces/$(resource.data.workspaceId)).data.ownerId == request.auth.uid;
    }
  }
}
```

4. Create the following **Composite Index** (required for workspace queries):
   - Collection: `workspaces` | Fields: `ownerId` ASC, `createdAt` ASC | Mode: Collection

## Running Locally

```bash
npm run dev
```

Open `http://localhost:3000`. You should land on `/login`.

## Manual Verification Checklist

See the full 15-step matrix in [`plan.md`](file:///d:/PROGRAMMING/WEB/ofuq/specs/002-workspaces-dashboard/plan.md#verification-plan).

Quick smoke test:
1. Sign up with email → redirected to `/`
2. Create a workspace → appears in sidebar
3. All 4 charts visible
4. Add Lecture dialog opens and closes
