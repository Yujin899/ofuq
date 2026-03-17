# ofuq (أفق) - Project Master Documentation

## 🌟 Project Identity & Mission
"ofuq" (meaning Horizon in Arabic) is a premium, high-focus study platform designed specifically for medical students and intensive learners. The mission is to transform high-stress study environments into a **gamified, serene, and empathetic experience**. 

### Core Values:
- **Vibrant Comfort**: A UI that is alive and colorful yet easy on the eyes for deep-focus sessions.
- **Empathetic UX**: Supportive copy and interactions that acknowledge the user's hard work.
- **Collective Progress**: Students aren't studying alone; they are climbing the mountain together.

---

## 🏗️ Tech Stack
- **Frontend**: Next.js 16 (App Router, Turbopack), React 19.
- **Styling**: Tailwind CSS v4, Framer Motion (Animations), shadcn/ui (Radix Primitives).
- **Backend & Real-time**: 
  - **Firebase Firestore**: Core data (Workspaces, Journeys, Subjects, Lectures, Sessions).
  - **Firebase Realtime Database (RTDB)**: High-frequency presence tracking (Online status, Current step).
- **Icons**: Lucide React.
- **Toasts**: Sonner.

---

## 🎨 Design System & UI Rules

### 1. STRICTLY Light Mode (Vibrant Comfort)
- **NO Dark Mode**: Do not implementations `dark:` utilities or check for `next-themes`.
- **System Colors (OKLCH)**:
  - **Background**: `oklch(0.98 0.01 210)` (Soft Slate White)
  - **Primary (Teal)**: `oklch(0.65 0.12 170)` (Calm focus)
  - **Accent (Peach)**: `oklch(0.92 0.03 170)` (Warm energy)
  - **Secondary (Mint)**: `oklch(0.94 0.02 170)` (Freshness)
  - **Foreground (Slate)**: `oklch(0.35 0.03 220)` (Sharp, readable text)

### 2. UI Philosophy
- **NO 3D Elements**: All components must be clean, 2D, and professional.
- **Soft Shadows**: Use `shadow-xl` or `shadow-2xl` for depth instead of hard borders.
- **Generous Radius**: Use `rounded-3xl` (1.5rem) or `rounded-[3rem]` (3rem) for a friendly, approachable feel.

---

## 🚀 Core Features

### 1. The Horizon Trail
A gamified, visual representation of a study journey.
- **Flow**: Bottom-to-Top (Progress moves upwards like climbing a mountain).
- **Pattern**: A 2D zigzagging staircase (alternating left/right horizontal offsets).
- **Auto-Progression Rule**: 
  - Strictly condition-based. No manual "Mark as Done" buttons.
  - Progression only occurs if the user submits a lecture quiz with a **score >= 60%**.
  - Upon passing, the user's progress is automatically incremented in Firestore, and their avatar jumps to the next node.
- **Visual States**:
  - **Completed**: Solid Teal (`bg-primary`).
  - **Current**: Glowing/Pulsing Peach (`bg-accent`) with floating animations for avatars.
  - **Future/Locked**: Muted Mint (`bg-secondary/30`) with a Lock icon; clicking shows a requirement toast.
- **Multiplayer Presence**: Circular user avatars appear directly ON the step they are currently studying.
- **Milestones**: Larger nodes ("Checkpoints") every 5th step with a "Tent" icon.

### 2. Multiplayer Journeys
Shared study paths where workspace members can collaborate.
- **Join Logic**: 
  - Creators automatically join at `Step 0`.
  - Other members must click "Join Journey" to initialize their progress document.
  - Trail interactions are locked behind an overlay for non-joined members.
- **Gathering Spots**: When multiple users are on the same step, the step dynamically expands its width to accommodate them, visually acting as a "landing" or "plateau".
- **Fanned Layout**: Instead of rigid stacking, avatars are arranged in an animated, overlapping Fanned (convex arc) pattern. Each avatar remains fully distinct.
- **Smooth Integration**: Framer Motion `layout` properties ensure avatars dynamically "bounce in" and readjust their positions smoothly when new members join the step.
- **Presence Indicators**: Avatars on the trail feature pulsing green activity dots if the user is currently "Online" (powered by RTDB).
- **Collective Sync**: Real-time Firestore listeners ensure everyone's progress is visible to all participants instantly.

### 3. Dynamic Journeys & Mapping
Flexible path creation for complex academic subjects.
- **Step Types**:
  - `lecture`: Directly linked to a lecture document in a subject.
  - `placeholder`: A future goal with a custom title, allowing students to map their entire semester before content is ready.
- **Persistence**: Real-time sync with Firestore sub-collections (`/workspaces/{id}/journeys`).

### 3. Multiplayer Presence System
Real-time tracking powered by Firebase RTDB.
- **Location Sync**: Tracks the specific `journeyId` and `stepIndex` of every online member.
- **Visual Indicator**: Pulsing green dots on member lists and avatars sitting on the Horizon Trail.

### 4. Smart Leaderboard
A weighted scoring system to encourage consistent progress.
- **The Formula**: `(Hours_Studied * 10) + (Avg_Quiz_Accuracy * 0.5) + (Completed_Lectures * 5)`
- **Identity**: Ranks members with beautiful podiums and real-time online status.

---

## 🚫 Forbidden Actions
1. **No Dark Mode**: Do not add dark mode support or `dark:` classes.
2. **No 3D Effects**: Do not use shadows or transforms that create a 3D "skeuomorphic" look. Stick to premium 2D.
3. **No Corporate Steppers**: Never implement a straight vertical list for journeys. It must be the zigzagging "Horizon Trail".
4. **No Ad-hoc Colors**: Only use the OKLCH variables defined in `globals.css` and documented above.
5. **No Direct DOM Manipulation**: Use React state and Framer Motion for all UI updates.
6. **No Downward Progress**: Progress always moves UP.
