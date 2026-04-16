import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const userId = (session.user as any).id;

    const [
      user,
      activeSessions,
      totalContacts,
      totalProducts,
      totalBroadcasts,
      sentMessages,
    ] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { credits: true } }),
      prisma.session.count({ where: { userId, status: "WORKING" } }),
      prisma.contact.count({ where: { userId } }),
      prisma.product.count({ where: { userId } }),
      prisma.broadcast.count({ where: { userId } }),
      prisma.broadcast.aggregate({ where: { userId }, _sum: { sentCount: true } }),
    ]);

    return NextResponse.json({
      credits: user?.credits ?? 1200,
      activeSessions,
      totalContacts,
      totalProducts,
      totalBroadcasts,
      totalSentMessages: sentMessages._sum.sentCount ?? 0,
    });
  } catch (error: any) {
    console.error("Dashboard Stats Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
