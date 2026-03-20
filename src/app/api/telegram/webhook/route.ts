import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc, deleteDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
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
      const codesRef = collection(db, "telegramCodes");
      const q = query(codesRef, where("code", "==", code), limit(1));
      const querySnap = await getDocs(q);

      if (querySnap.empty) {
        await sendTelegramNotification(chatId, "❌ Invalid code.");
        return NextResponse.json({ ok: true });
      }

      const codeDoc = querySnap.docs[0];
      const codeData = codeDoc.data();
      const expiresAt = codeData.expiresAt?.toDate();

      if (expiresAt && expiresAt < new Date()) {
        await sendTelegramNotification(chatId, "❌ Code expired. Please generate a new one from the app.");
        await deleteDoc(doc(db, "telegramCodes", codeDoc.id));
        return NextResponse.json({ ok: true });
      }

      // Valid code! Link the user
      const userId = codeData.userId;
      const userRef = doc(db, "users", userId);
      
      await setDoc(userRef, { telegramChatId: chatId }, { merge: true });
      
      // Cleanup
      await deleteDoc(doc(db, "telegramCodes", codeDoc.id));

      await sendTelegramNotification(chatId, "✅ Connected! You'll now receive Pomodoro notifications here.");
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}
