import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const userId = (session.user as any).id;

    const broadcast = await prisma.broadcast.findFirst({
      where: { id, userId, status: "RUNNING" },
    });

    if (!broadcast) {
      return NextResponse.json({ error: "Broadcast not found or not running" }, { status: 404 });
    }

    await prisma.broadcast.update({
      where: { id },
      data: { status: "PAUSED" },
    });

    return NextResponse.json({ success: true, status: "PAUSED" });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
