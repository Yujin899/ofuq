import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendTelegramNotification } from "@/lib/telegram";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Process only message starts
    const message = body.message;
    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const text = message.text as string;
    const chatId = message.chat.id.toString();

    // Check for /start {CODE}
    if (text.startsWith("/start ")) {
      const code = text.split(" ")[1];
      if (!code || code.length !== 6) {
        await sendTelegramNotification(chatId, "❌ Invalid code format.");
        return NextResponse.json({ ok: true });
      }

      // Look up code in Firestore
      const querySnap = await adminDb.collection("telegramCodes")
        .where("code", "==", code)
        .limit(1)
        .get();

      if (querySnap.empty) {
        await sendTelegramNotification(chatId, "❌ Invalid code.");
        return NextResponse.json({ ok: true });
      }

      const codeDoc = querySnap.docs[0];
      const codeData = codeDoc.data();
      const expiresAt = codeData.expiresAt?.toDate();

      if (expiresAt && expiresAt < new Date()) {
        await sendTelegramNotification(chatId, "❌ Code expired. Please generate a new one from the app.");
        await codeDoc.ref.delete();
        return NextResponse.json({ ok: true });
      }

      // Valid code! Link the user
      const userId = codeData.userId;
      const userRef = adminDb.collection("users").doc(userId);
      
      await userRef.set({ telegramChatId: chatId }, { merge: true });
      
      // Cleanup
      await codeDoc.ref.delete();

      await sendTelegramNotification(chatId, "✅ Connected! You'll now receive Pomodoro notifications here.");
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}
