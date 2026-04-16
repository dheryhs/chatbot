import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const tagsParam = searchParams.get("tags"); // comma-separated

    if (!tagsParam) {
      return NextResponse.json({ error: "tags parameter required" }, { status: 400 });
    }

    const tagsArray = tagsParam.split(",").map((t) => t.trim()).filter(Boolean);

    // Find contacts that have at least one matching tag
    const contacts = await prisma.contact.findMany({
      where: {
        userId,
        tags: { hasSome: tagsArray },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error("Filter Contacts Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
