import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAIResponse } from "@/lib/ai";
import { waha } from "@/lib/waha";

// We disable body parsing size limits and caching for Webhooks
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    if (!rawBody) {
      return NextResponse.json({ error: "Empty body" }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);

    // Filter only message events
    if (payload.event !== "message" && payload.event !== "message.any") {
      return NextResponse.json({ status: "ignored", reason: "not a message event" });
    }

    const data = payload.payload;
    if (!data) {
      return NextResponse.json({ status: "ignored", reason: "no payload data" });
    }

    // Identifiers
    const sessionId = payload.session;
    const chatId = data.from; // Sender ID (e.g., 628123456@c.us)
    const isGroup = chatId.includes("@g.us");
    const isFromMe = data.fromMe === true;
    const isStatus = chatId === "status@broadcast";
    const textMsg = data.body;

    // Ignore groups, self-sent, status updates, or empty texts
    if (isGroup || isFromMe || isStatus || !textMsg) {
      return NextResponse.json({ status: "ignored", reason: "filtered by rules" });
    }

    // 1. Find the DB ID for this session string
    const sessionDb = await prisma.session.findFirst({
      where: { 
        OR: [
          { sessionName: sessionId },
          { wahaSessionId: sessionId }
        ]
      },
    });

    if (!sessionDb) {
      return NextResponse.json({ status: "ignored", reason: "session not mapped in db" });
    }

    // 2. Find Active Agent bound to this session
    // We check agent's sessionBindings array
    const agents = await prisma.agent.findMany({
      where: {
        userId: sessionDb.userId,
        isActive: true,
      },
    });

    let activeAgent = null;

    for (const ag of agents) {
      const bindings = ag.sessionBindings as Array<{ sessionId: string; enabled: boolean }>;
      if (Array.isArray(bindings)) {
        const bound = bindings.find((b) => b.sessionId === sessionDb.id && b.enabled === true);
        if (bound) {
          activeAgent = ag;
          break;
        }
      }
      // Backward compat fallback
      if (ag.sessionId === sessionDb.id) {
        activeAgent = ag;
        break;
      }
    }

    if (!activeAgent) {
      return NextResponse.json({ status: "ignored", reason: "no active agent bound to this session" });
    }

    // 3. Get API Key from the Admin/User
    const user = await prisma.user.findUnique({
      where: { id: activeAgent.userId },
      select: { aiApiKey: true, aiProvider: true },
    });

    if (!user || !user.aiApiKey) {
      console.log(`[AI-Webhook] User missing API Key for agent ${activeAgent.id}`);
      return NextResponse.json({ status: "failed", reason: "missing ai config" });
    }

    // [Simulate Typing Effect - Start]
    if (activeAgent.humanlikeBehaviour) {
      await waha.startTyping(sessionId, chatId).catch(console.error);
    }

    // 4. Send the prompt to AI
    const aiResponsePromise = generateAIResponse(
      {
        systemPrompt: activeAgent.systemPrompt || undefined,
        knowledgeText: activeAgent.knowledgeText || undefined,
        knowledgeQA: activeAgent.knowledgeQA as Array<{ q: string; a: string }>,
      },
      textMsg,
      { aiApiKey: user.aiApiKey, aiProvider: user.aiProvider || "gemini" }
    );

    // Parallel processing with artificial delay mechanism
    const delayMs = typeof activeAgent.replyDelay === "number" ? activeAgent.replyDelay * 1000 : 2000;
    const [aiResponse] = await Promise.all([
      aiResponsePromise,
      new Promise(res => setTimeout(res, delayMs))
    ]);

    // [Simulate Typing Effect - Stop]
    if (activeAgent.humanlikeBehaviour) {
      await waha.stopTyping(sessionId, chatId).catch(console.error);
    }

    if (!aiResponse) {
      return NextResponse.json({ status: "failed", reason: "AI didn't generate response" });
    }

    // 5. Send back to WhatsApp
    await waha.sendTextToChat(sessionId, chatId, aiResponse);

    return NextResponse.json({ success: true, aiGeneratedLength: aiResponse.length });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Internal Server Error", detail: error.message }, { status: 500 });
  }
}
