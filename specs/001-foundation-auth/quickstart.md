# Quickstart: Phase 1 — Foundation & Authentication

**Feature**: `001-foundation-auth`
**Date**: 2026-02-22

## Prerequisites

- Node.js 18+ and npm installed
- A Firebase project with Google Auth provider enabled
- Firebase project config values (apiKey, authDomain, projectId, etc.)

## Setup

```bash
# 1. Clone and enter the repository
git clone <repo-url> ofuq && cd ofuq

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env.local
# Edit .env.local with your Firebase config values

# 4. Run the development server
npm run dev
```

## Environment Variables

Create `.env.local` with:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Verifying Phase 1

1. Open `http://localhost:3000` — you should be redirected to `/login`.
2. The login page should render in **dark mode** with the Ofuq branding.
3. Click "Sign in with Google" — complete the OAuth flow.
4. You should arrive at `/` (the dashboard) showing your avatar and name.
5. Click your avatar → "Sign out" → you should return to `/login`.
6. Toggle the theme switch — verify instant dark ↔ light mode switch.
