import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { waha } from "@/lib/waha";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const wahaSessionId = searchParams.get("sessionId");

  if (!wahaSessionId) {
    return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
  }

  try {
    // 1. Check if the session belongs to the user in our DB
    const userId = (session.user as any).id;
    const localSession = await prisma.session.findFirst({
      where: { wahaSessionId, userId }
    });

    if (!localSession) {
      return NextResponse.json({ error: "Session not found or unauthorized" }, { status: 403 });
    }

    // 2. Fetch contacts from WAHA
    const waContacts = await waha.getContacts(wahaSessionId);

    // 3. Format contacts for frontend
    const formattedContacts = waContacts.map((c: any) => ({
      jid: c.id,
      name: c.name || c.pushName || c.shortName || null,
      phoneNumber: c.id.split("@")[0],
    }));

    return NextResponse.json(formattedContacts);
  } catch (error: any) {
    console.error("Failed to fetch WA contacts:", error);
    
    // Check if the error is the WAHA store disabled error
    if (error.message && error.message.includes("noweb.store.enabled")) {
        return NextResponse.json({ 
          error: "Sinkronisasi kontak belum aktif di session ini. Silakan Hapus session ini dan Buat Baru agar fitur import kontak dapat digunakan." 
        }, { status: 400 });
    }

    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { contacts } = await req.json();
    if (!Array.isArray(contacts)) {
      return NextResponse.json({ error: "Contacts array is required" }, { status: 400 });
    }

    const userId = (session.user as any).id;

    // Use a transaction for consistent bulk upsert
    const results = await prisma.$transaction(
      contacts.map((c: any) => {
        // Normalize phone number (standard practice)
        let normalizedPhone = c.phoneNumber;
        if (normalizedPhone.startsWith("0")) {
          normalizedPhone = "62" + normalizedPhone.slice(1);
        }
        normalizedPhone = normalizedPhone.replace(/(?!^\+)\D/g, "");

        return prisma.contact.upsert({
          where: { phoneNumber: normalizedPhone },
          update: { 
            name: c.name || undefined,
            jid: c.jid || undefined,
            source: "WhatsApp Import"
          },
          create: {
            userId,
            name: c.name || "Unnamed",
            phoneNumber: normalizedPhone,
            jid: c.jid,
            source: "WhatsApp Import",
            tags: []
          },
        });
      })
    );

    return NextResponse.json({ success: true, count: results.length, contacts: results });
  } catch (error: any) {
    console.error("Failed to import contacts:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
