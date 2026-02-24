# Quickstart: Daily Tadabbur & Gemini Integration

This guide provides a functional overview of the Spiritual Layer (Phase 7) architecture.

## Overview

The feature uses a **Batch Generation** approach. Instead of calling Google Gemini Pro on every page load—which incurs high latency and potential rate-limit blocks—the system generates 7 days of spiritual insights at once, saves them to Firestore, and serves them instantly to the user.

## Data Flow (Batch Generation)

1. **Trigger**: An Admin presses a button (or a secure cron job runs) calling `generateWeeklyTadabbur()`.
2. **Context Assembly**: The action pulls the last 30 verse references from `daily_insights` in Firestore.
3. **AI Generation**: The action sends a strict System Prompt to Gemini: *"You are an Islamic mentor. Act respectful. Output Egyptian Arabic JSON. Do not use these specific 30 verses."*
4. **Persistence**: The validated JSON is written as 7 distinct documents to `daily_insights` with sequential `displayDate` timestamps.

## Data Flow (User View)

1. **Widget Mounts**: `DailyTadabburWidget` retrieves the document where `displayDate` matches `today()`.
2. **Text Hydration**: The widget reads the `surahNumber` and `ayahNumber` from the document.
3. **External Fetch**: The client hits `api.quran.com` for the exact Uthmani text.
4. **Render**: The widget displays the Holy Text accurately alongside the AI-generated reflection.

## Key APIs & Credentials

- `GEMINI_API_KEY`: Required in `.env.local` to authenticate with the `@google/genai` SDK.
- `https://api.quran.com/api/v4/quran/verses/uthmani?verse_key={sur}:{ayah}` (No API key required for free tier usage).
