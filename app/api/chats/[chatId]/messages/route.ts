import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { waha } from "@/lib/waha";

export async function GET(req: Request, { params }: { params: { chatId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const wahaSessionId = searchParams.get("sessionId");
  const limit = parseInt(searchParams.get("limit") || "30");

  if (!wahaSessionId) {
    return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
  }

  try {
    const { chatId } = await params;
    const userId = (session.user as any).id;
    const localSession = await prisma.session.findFirst({
      where: { wahaSessionId, userId }
    });

    if (!localSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 403 });
    }

    const decodedChatId = decodeURIComponent(chatId);
    const messages = await waha.getChatMessages(wahaSessionId, decodedChatId, limit);

    return NextResponse.json(messages);
  } catch (error: any) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { chatId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { chatId } = await params;
    const { sessionId, text } = await req.json();

    if (!sessionId || !text) {
      return NextResponse.json({ error: "sessionId and text are required" }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const localSession = await prisma.session.findFirst({
      where: { wahaSessionId: sessionId, userId }
    });

    if (!localSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 403 });
    }

    const decodedChatId = decodeURIComponent(chatId);
    const result = await waha.sendTextToChat(sessionId, decodedChatId, text);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Failed to send message:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
