import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { waha } from "@/lib/waha";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const wahaSessionId = searchParams.get("sessionId");
  const limit = parseInt(searchParams.get("limit") || "30");

  if (!wahaSessionId) {
    return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
  }

  try {
    const userId = (session.user as any).id;
    const localSession = await prisma.session.findFirst({
      where: { wahaSessionId, userId }
    });

    if (!localSession) {
      return NextResponse.json({ error: "Session not found or unauthorized" }, { status: 403 });
    }

    const chats = await waha.getChatsOverview(wahaSessionId, limit);

    return NextResponse.json(chats);
  } catch (error: any) {
    console.error("Failed to fetch chats:", error);
    
    if (error.message && error.message.includes("noweb.store.enabled")) {
      return NextResponse.json({ 
        error: "Sinkronisasi chat belum aktif di session ini. Silakan hapus session dan buat baru." 
      }, { status: 400 });
    }

    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
