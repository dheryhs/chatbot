import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/agents/:id
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const { id } = await params;

  try {
    const agent = await prisma.agent.findFirst({
      where: { id, userId },
      include: { session: true },
    });
    if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(agent);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/agents/:id
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const { id } = await params;

  try {
    const body = await req.json();

    // Verify ownership
    const existing = await prisma.agent.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const agent = await prisma.agent.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        systemPrompt: body.systemPrompt,
        welcomeMessage: body.welcomeMessage,
        knowledgeText: body.knowledgeText,
        knowledgeQA: body.knowledgeQA,
        followUpEnabled: body.followUpEnabled,
        followUpDelay: body.followUpDelay,
        followUpMessage: body.followUpMessage,
        sessionBindings: body.sessionBindings,
        isActive: body.isActive,
        humanlikeBehaviour: body.humanlikeBehaviour,
        replyDelay: body.replyDelay,
        stopOnManualReply: body.stopOnManualReply,
        autoSwitchLegacy: body.autoSwitchLegacy,
      },
    });

    return NextResponse.json(agent);
  } catch (error) {
    console.error("Failed to update agent:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/agents/:id
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const { id } = await params;

  try {
    await prisma.agent.deleteMany({ where: { id, userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
