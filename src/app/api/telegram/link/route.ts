import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { action, userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (action === "generate-code") {
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const expiresAt = new Date(Date.now() + 10 * 60000);
      
      await adminDb.collection("telegramCodes").add({
        code: newCode,
        userId: userId,
        createdAt: new Date(),
        expiresAt: expiresAt
      });

      return NextResponse.json({ code: newCode });
    }

    if (action === "disconnect") {
      const userRef = adminDb.collection("users").doc(userId);
      await userRef.set({ telegramChatId: null }, { merge: true });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Telegram link API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
