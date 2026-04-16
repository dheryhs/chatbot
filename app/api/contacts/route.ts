import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const userId = (session.user as any).id;
    const contacts = await prisma.contact.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(contacts);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, phoneNumber, jid, email, source, note, tags } = await req.json();
    const userId = (session.user as any).id;

    // Normalize phone number: change leading 0 to 62
    let normalizedPhone = phoneNumber;
    if (normalizedPhone.startsWith("0")) {
      normalizedPhone = "62" + normalizedPhone.slice(1);
    }
    // Optional: strip non-numeric characters except leading +
    normalizedPhone = normalizedPhone.replace(/(?!^\+)\D/g, "");

    const contact = await prisma.contact.upsert({
      where: { phoneNumber: normalizedPhone },
      update: { name, jid, email, source, note, tags },
      create: {
        userId,
        name,
        phoneNumber: normalizedPhone,
        jid,
        email,
        source: source || "Manual",
        note,
        tags: tags || [],
      },
    });

    return NextResponse.json(contact);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
