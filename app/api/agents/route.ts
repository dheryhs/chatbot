import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const userId = (session.user as any).id;
    const agents = await prisma.agent.findMany({
      where: { userId },
      include: { session: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(agents);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const userId = (session.user as any).id;

    const agent = await prisma.agent.create({
      data: {
        userId,
        name: body.name,
        description: body.description || "",
        systemPrompt: body.systemPrompt || "",
        welcomeMessage: body.welcomeMessage || "",
        knowledgeText: "",
        knowledgeQA: [],
        sessionBindings: [],
        replyDelay: body.replyDelay || 2,
        sessionId: body.sessionId || null,
      },
      include: { session: true },
    });

    return NextResponse.json(agent);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
