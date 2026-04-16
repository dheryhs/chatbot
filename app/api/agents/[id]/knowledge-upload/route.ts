import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const { id } = await params;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = "";

    if (file.name.endsWith(".pdf")) {
      // Dynamic import pdf-parse to avoid issues if not installed
      const pdfParse = (await import("pdf-parse") as any).default;
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text;
    } else if (file.name.endsWith(".txt")) {
      extractedText = buffer.toString("utf-8");
    } else {
      return NextResponse.json({ error: "Format tidak didukung. Gunakan PDF atau TXT." }, { status: 400 });
    }

    // Get current agent
    const agent = await prisma.agent.findFirst({ where: { id, userId } });
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

    // Append to existing knowledge text
    const separator = agent.knowledgeText ? "\n\n" : "";
    const updatedKnowledge = (agent.knowledgeText || "") + separator + "--- Upload: " + file.name + " ---\n" + extractedText;

    await prisma.agent.update({
      where: { id },
      data: { knowledgeText: updatedKnowledge },
    });

    return NextResponse.json({ success: true, extractedLength: extractedText.length, filename: file.name });
  } catch (error: any) {
    console.error("Knowledge upload error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
