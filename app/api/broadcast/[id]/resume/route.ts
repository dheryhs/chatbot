import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runBroadcastLoop } from "@/lib/broadcast";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const userId = (session.user as any).id;

    const broadcast = await prisma.broadcast.findFirst({
      where: { id, userId, status: "PAUSED" },
    });

    if (!broadcast) {
      return NextResponse.json({ error: "Broadcast not found or not paused" }, { status: 404 });
    }

    await prisma.broadcast.update({
      where: { id },
      data: { status: "RUNNING" },
    });

    // Restart background loop for remaining recipients
    runBroadcastLoop(id).catch((err) =>
      console.error("Resume broadcast loop error:", err)
    );

    return NextResponse.json({ success: true, status: "RUNNING" });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
