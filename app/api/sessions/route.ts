import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { waha } from "@/lib/waha";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const userId = (session.user as any).id;
    
    // 1. Get sessions from WAHA
    const wahaSessions = await waha.listSessions(true);
    
    // 2. Get local sessions for this user
    const localSessions = await prisma.session.findMany({
      where: { userId }
    });

    // 3. Merge/Update logic: Only return sessions that are in our DB for this user
    // but with updated status from WAHA
    const merged = localSessions.map(local => {
      const wahaMatch = wahaSessions.find((w: any) => w.name === local.wahaSessionId);
      return {
        ...local,
        status: wahaMatch ? wahaMatch.status : "STOPPED",
        me: wahaMatch?.me || null
      };
    });

    return NextResponse.json(merged);
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { sessionName } = await req.json();
    if (!sessionName) return NextResponse.json({ error: "Session name is required" }, { status: 400 });

    const userId = (session.user as any).id;
    const wahaSessionId = `wp_${userId}_${sessionName.toLowerCase().replace(/\s+/g, "_")}`;

    // Create in WAHA with store enabled for contacts import
    await waha.createSession(wahaSessionId, {
      noweb: {
        store: {
          enabled: true,
          fullSync: true
        }
      }
    });
    // Explicitly start it to ensure it goes into STARTING/SCAN_QR_CODE state
    await waha.startSession(wahaSessionId).catch((e) => console.log('Start session notice:', e.message));

    // Save in local DB
    const newSession = await prisma.session.upsert({
      where: { wahaSessionId },
      update: { sessionName },
      create: {
        userId,
        sessionName,
        wahaSessionId,
        apiKey: "", // We might not need this anymore if we use global key, but keep it for compat
        status: "STARTING",
      },
    });

    return NextResponse.json(newSession, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create session:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
