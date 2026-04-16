import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runBroadcastLoop } from "@/lib/broadcast";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const userId = (session.user as any).id;
    const broadcasts = await prisma.broadcast.findMany({
      where: { userId },
      include: { session: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(broadcasts);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, sessionId, contactIds, contents, delayMin, delayMax } = await req.json();
    const userId = (session.user as any).id;

    if (!name || !sessionId || !contactIds?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate contents
    if (!contents || !Array.isArray(contents) || contents.length === 0) {
       return NextResponse.json({ error: "Konten broadcast tidak boleh kosong" }, { status: 400 });
    }

    const wahaSession = await prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!wahaSession) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const contacts = await prisma.contact.findMany({
      where: { id: { in: contactIds } },
    });

    if (contacts.length === 0) {
      return NextResponse.json({ error: "No valid contacts found" }, { status: 400 });
    }

    // Create broadcast record
    const broadcast = await prisma.broadcast.create({
      data: {
        userId,
        sessionId,
        name,
        messageBody: contents.find(c => c.type === 'text')?.text || "Multi-content",
        contents: contents,
        status: "RUNNING",
        delayMin: delayMin ?? 5,
        delayMax: delayMax ?? 10,
        totalCount: contacts.length,
        startedAt: new Date(),
      },
    });

    // Create all recipient records
    await prisma.broadcastRecipient.createMany({
      data: contacts.map((c) => ({
        broadcastId: broadcast.id,
        contactId: c.id,
        phoneNumber: c.phoneNumber,
        status: "PENDING",
      })),
    });

    // Start background loop (fire-and-forget)
    runBroadcastLoop(broadcast.id).catch((err) =>
      console.error("Broadcast loop error:", err)
    );

    return NextResponse.json({ message: "Broadcast started", id: broadcast.id });
  } catch (error) {
    console.error("POST Broadcast Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
