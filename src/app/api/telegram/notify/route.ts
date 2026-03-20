import { NextResponse } from "next/server";
import { sendTelegramNotification } from "@/lib/telegram";

export async function POST(req: Request) {
  try {
    const { chatId, type, sessionNumber, minutes } = await req.json();

    if (!chatId) {
      return NextResponse.json({ error: "Missing chatId" }, { status: 400 });
    }

    let message = "";
    if (type === "work_end") {
      message = `🧠 <b>Break Time!</b>\nGreat focus session #${sessionNumber}. Rest for ${minutes} minutes.`;
    } else if (type === "break_end") {
      message = `🔥 <b>Back to Work!</b>\nBreak's over. Ready for session #${sessionNumber}?`;
    } else {
      return NextResponse.json({ error: "Invalid notification type" }, { status: 400 });
    }

    await sendTelegramNotification(chatId, message);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Telegram notify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
