# Implementation Plan: Phase 1 — Foundation & Authentication

**Branch**: `001-foundation-auth` | **Date**: 2026-02-22 | **Spec**: [spec.md](file:///d:/PROGRAMMING/WEB/ofuq/specs/001-foundation-auth/spec.md)
**Input**: Feature specification from `specs/001-foundation-auth/spec.md`

## Summary

Set up the Ofuq Next.js project from scratch with App Router, Tailwind CSS,
shadcn/ui, next-themes (dark default), and Firebase Google Auth. Deliver two
routes (`/login` and `/`) with full auth flow, route protection, theme toggle,
and sign-out. The dashboard is an intentional empty placeholder.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 15 (App Router), Tailwind CSS v4, shadcn/ui, framer-motion, next-themes, firebase
**Storage**: Firebase Auth only — NO Firestore in this phase
**Testing**: Manual browser testing (see Verification Plan)
**Target Platform**: Web (responsive 375px–1920px)
**Project Type**: Web application (Next.js)
**Constraints**: Constitution-mandated stack only; zero custom UI when shadcn equivalent exists

## Constitution Check

*GATE: Must pass before implementation. Re-check after design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Tech Stack | ✅ PASS | Next.js App Router, Tailwind, shadcn/ui, next-themes, Firebase |
| II. Design & UI/UX | ✅ PASS | Notion-like minimal aesthetic, no charts in Phase 1 |
| III. State Management | ✅ PASS | No Firestore; Auth state via React Context |
| IV. Code Quality | ✅ PASS | TypeScript strict, custom hooks, explicit types |

No violations. No complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-foundation-auth/
├── spec.md
├── plan.md              ← This file
├── research.md
├── data-model.md
├── quickstart.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── layout.tsx              # RootLayout: ThemeProvider + AuthProvider
│   ├── page.tsx                # Dashboard (protected, placeholder)
│   ├── not-found.tsx           # 404 page
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx        # Public login page
│   └── globals.css             # Tailwind + CSS variable tokens
├── components/
│   ├── ui/                     # shadcn/ui auto-generated (DO NOT manually edit)
│   ├── providers/
│   │   ├── theme-provider.tsx  # next-themes ThemeProvider wrapper
│   │   └── auth-provider.tsx   # Firebase Auth context
│   ├── auth/
│   │   └── protected-route.tsx # Client-side route guard
│   └── layout/
│       └── user-nav.tsx        # Avatar + dropdown (sign out, theme toggle)
├── hooks/
│   └── use-auth.ts             # useAuth() convenience hook
├── lib/
│   └── firebase.ts             # Firebase app init + auth export
├── types/
│   └── auth.ts                 # AuthUser, AuthState interfaces
└── .env.local                  # Firebase config (gitignored)
```

---

## ⚠️ FLASH DIRECTIVES (NON-NEGOTIABLE GUARDRAILS)

> These directives MUST be followed verbatim by the coding agent.

1. **DO NOT** implement **any** Firestore database logic in this phase.
   Firebase is used **strictly** for Authentication.
2. **DO NOT** invent custom UI components. Use **only** Tailwind utilities
   and the specified shadcn/ui components listed below.
3. **DO NOT** install any library not listed in the Mandatory Libraries
   table of the constitution. If unsure, STOP and ask.
4. **Ensure dark mode** is the default in the `ThemeProvider` config:
   `defaultTheme="dark"`, `enableSystem={false}`.
5. **ALL** colours MUST use CSS variable tokens in `hsl(var(--token))` format.
   No hardcoded hex/rgb/hsl values in component code.
6. **ALL** TypeScript files MUST have explicit type annotations. No `any`.
7. If Google sign-in fails, catch the error and display a **Sonner toast**
   with the message: `"Failed to sign in. Please try again."`.
8. If the auth session expires mid-use, the `onAuthStateChanged` listener
   MUST set user to `null`, which triggers redirect to `/login`.
9. **DO NOT** use `"use server"` or Server Actions. All auth logic is
   client-side in this phase.

---

## Implementation Tasks (Sequential & Atomic)

### Phase 1: Project Scaffold

#### T001 — Create Next.js Project

```bash
npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --use-npm
```

> Run from the repo root `d:\PROGRAMMING\WEB\ofuq`. This initialises Next.js
> with TypeScript, Tailwind, ESLint, App Router, and `src/` directory.

**Verify**: `npm run dev` starts without errors on `http://localhost:3000`.

---

#### T002 — Enable TypeScript Strict Mode

Open `tsconfig.json` and ensure:

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

> `create-next-app` usually sets this, but verify explicitly.

---

#### T003 — Initialise shadcn/ui

```bash
npx -y shadcn@latest init -d
```

> The `-d` flag uses defaults. This configures `components.json`,
> sets up the `cn()` utility at `src/lib/utils.ts`, and configures
> CSS variables in `globals.css`.

**Verify**: `src/components/ui/` directory exists and `components.json`
is in the repo root.

---

#### T004 — Install Required shadcn Components

```bash
npx shadcn@latest add button card avatar dropdown-menu separator skeleton sonner
```

> This installs exactly the components needed for Phase 1:
> - `Button` — sign-in button, sign-out button
> - `Card` — login page card wrapper
> - `Avatar` — user profile avatar
> - `DropdownMenu` — user nav dropdown (sign out, etc.)
> - `Separator` — dropdown divider
> - `Skeleton` — loading states while auth resolves
> - `Sonner` — toast notifications for auth errors

**Verify**: Each component file exists under `src/components/ui/`.

---

#### T005 — Install Project Dependencies

```bash
npm install firebase next-themes framer-motion
```

> These are the remaining constitution-mandated libraries not installed
> by `create-next-app` or `shadcn init`.

**Verify**: All three appear in `package.json` under `dependencies`.

---

### Phase 2: Core Infrastructure

#### T006 — Create Type Definitions

Create `src/types/auth.ts`:

```typescript
export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: Error | null;
}

export interface AuthContextType extends AuthState {
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}
```

**Verify**: File exists, no TypeScript errors.

---

#### T007 — Create Firebase Configuration

Create `src/lib/firebase.ts`:

```typescript
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
```

> **DO NOT** import Firestore here. Only Auth.

**Verify**: No TypeScript errors.

---

#### T008 — Create `.env.local` and `.env.example`

Create `.env.example` (committed to git):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Create `.env.local` (gitignored) with the same keys. User fills in values.

Ensure `.gitignore` contains `.env.local`.

---

#### T009 — Create Theme Provider

Create `src/components/providers/theme-provider.tsx`:

```typescript
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
```

> **CRITICAL**: `defaultTheme="dark"` and `enableSystem={false}` are
> non-negotiable. `attribute="class"` is required for Tailwind `dark:`.

---

#### T010 — Create Auth Provider

Create `src/components/providers/auth-provider.tsx`:

```typescript
"use client";

import { createContext, useEffect, useState, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { AuthUser, AuthContextType } from "@/types/auth";

// Helper to map Firebase User → AuthUser
function mapFirebaseUser(user: User): AuthUser {
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  };
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser ? mapFirebaseUser(firebaseUser) : null);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err; // Re-throw so the caller can show a toast
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, error, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}
```

---

#### T011 — Create useAuth Hook

Create `src/hooks/use-auth.ts`:

```typescript
"use client";

import { useContext } from "react";
import { AuthContext } from "@/components/providers/auth-provider";

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

---

### Phase 3: Layouts & Route Protection

#### T012 — Update Root Layout

Replace `src/app/layout.tsx` with:

- HTML `<html lang="en" suppressHydrationWarning>` (required by next-themes)
- Wrap `{children}` with `<ThemeProvider>` → `<AuthProvider>` → `<Toaster />`
- Import and apply a clean sans-serif font (e.g., Inter from `next/font/google`)
- Import `globals.css`

```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Ofuq — أفق",
  description: "Modern e-learning workspace",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

#### T013 — Create Protected Route Component

Create `src/components/auth/protected-route.tsx`:

```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
```

---

#### T014 — Create User Navigation Component

Create `src/components/layout/user-nav.tsx`:

```typescript
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Moon, Sun } from "lucide-react";

export function UserNav() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  if (!user) return null;

  const initials = user.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user.email?.[0]?.toUpperCase() ?? "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={user.photoURL ?? undefined}
              alt={user.displayName ?? "User avatar"}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.displayName ?? "User"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun className="mr-2 h-4 w-4" />
          ) : (
            <Moon className="mr-2 h-4 w-4" />
          )}
          <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

> `lucide-react` icons are already a shadcn dependency — no extra install.

---

### Phase 4: Pages

#### T015 — Create Login Page

Create `src/app/(auth)/login/page.tsx`:

```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch {
      toast.error("Failed to sign in. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-64 w-96" />
      </div>
    );
  }

  if (user) return null; // Will redirect via useEffect

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            أفق
          </CardTitle>
          <CardDescription className="text-base">
            Welcome to Ofuq — your e-learning workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Button
            onClick={handleSignIn}
            size="lg"
            className="w-full max-w-xs"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              {/* Google "G" icon SVG paths */}
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06
                   5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92
                   3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66
                   -2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18
                   v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35
                   -2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45
                   1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45
                   2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66
                   2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

> **Error handling**: On failure, `toast.error("Failed to sign in. Please
> try again.")` fires immediately. No alert dialogs.

---

#### T016 — Create Dashboard Page

Replace `src/app/page.tsx` with:

```typescript
"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { UserNav } from "@/components/layout/user-nav";
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "@/components/ui/separator";

function DashboardContent() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b px-6">
        <h1 className="text-lg font-semibold tracking-tight">أفق</h1>
        <UserNav />
      </header>

      {/* Main content — placeholder for future phases */}
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">
            Welcome{user?.displayName ? `, ${user.displayName}` : ""}
          </h2>
          <p className="text-muted-foreground">
            Your workspace is ready. Content will appear here soon.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
```

---

#### T017 — Create 404 Page

Create `src/app/not-found.tsx`:

```typescript
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-bold">Page not found</h2>
      <p className="text-muted-foreground">
        The page you are looking for does not exist.
      </p>
      <Button asChild>
        <Link href="/">Go to Dashboard</Link>
      </Button>
    </div>
  );
}
```

---

### Phase 5: Polish & Verification

#### T018 — Verify CSS Variable Tokens

Open `src/app/globals.css` and ensure all colour tokens use the
`hsl(var(--token))` format. shadcn init should have set this up.
Verify that both `:root` (light) and `.dark` selectors are present.

---

#### T019 — Verify Dark Mode Default

1. Clear browser localStorage.
2. Open `http://localhost:3000/login`.
3. The page MUST render in dark mode on first visit.
4. Toggle to light mode via the dropdown on the dashboard.
5. Refresh — light mode MUST persist.

---

#### T020 — Final Build Check

```bash
npm run build
```

> The build MUST complete with zero errors. Warnings about missing
> `.env.local` values are expected until Firebase credentials are added.

---

## Verification Plan

### Manual Browser Testing

These steps MUST be performed after all tasks are complete, with Firebase
credentials configured in `.env.local`.

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 1 | Cold start dark mode | Clear localStorage → open `/` | Redirects to `/login` in dark mode |
| 2 | Sign in flow | Click "Sign in with Google" → complete OAuth | Redirects to `/`, shows avatar + name |
| 3 | Failed sign-in | Block popup or cancel OAuth | Toast: "Failed to sign in. Please try again." |
| 4 | Session persistence | Sign in → close tab → reopen `/` | Dashboard loads directly, no `/login` |
| 5 | Sign out | Click avatar → "Sign out" | Redirects to `/login`, session cleared |
| 6 | Post-signout guard | After sign out → navigate to `/` | Redirects to `/login` |
| 7 | Auth redirect | While signed in → navigate to `/login` | Redirects to `/` |
| 8 | Theme toggle | On dashboard → click theme toggle | Instant switch, no flash |
| 9 | Theme persistence | Toggle to light → refresh | Light mode preserved |
| 10 | 404 page | Navigate to `/nonexistent` | Shows "Page not found" + link to `/` |
| 11 | Responsive | Resize to 375px width | All elements remain usable |
| 12 | Keyboard nav | Tab through login page | All buttons focusable + activatable |

### Automated Check

```bash
npm run build
```

> Must exit 0 with no TypeScript or build errors.

## Complexity Tracking

No constitution violations. No complexity justification needed.
