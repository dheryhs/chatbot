import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const { name, phoneNumber, jid, email, source, note, tags, productLabel } = await req.json();
    const userId = (session.user as any).id;

    const existingContact = await prisma.contact.findFirst({
      where: { id, userId },
    });

    if (!existingContact) {
      return NextResponse.json({ error: "Contact not found or unauthorized" }, { status: 404 });
    }

    let normalizedPhone = phoneNumber;
    if (normalizedPhone.startsWith("0")) {
      normalizedPhone = "62" + normalizedPhone.slice(1);
    }
    normalizedPhone = normalizedPhone.replace(/(?!^\+)\D/g, "");

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        name,
        phoneNumber: normalizedPhone,
        jid,
        email,
        source: source || "Manual",
        note,
        tags: tags || [],
        productLabel: productLabel !== undefined ? productLabel : existingContact.productLabel,
      },
    });

    return NextResponse.json(contact);
  } catch (error: any) {
    console.error("PUT Contact Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// PATCH — partial update for inline editing (tags, productLabel)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const userId = (session.user as any).id;
    const body = await req.json();

    const existingContact = await prisma.contact.findFirst({
      where: { id, userId },
    });

    if (!existingContact) {
      return NextResponse.json({ error: "Contact not found or unauthorized" }, { status: 404 });
    }

    const updateData: any = {};
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.productLabel !== undefined) updateData.productLabel = body.productLabel;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(contact);
  } catch (error: any) {
    console.error("PATCH Contact Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const userId = (session.user as any).id;

    const existingContact = await prisma.contact.findFirst({
      where: { id, userId },
    });

    if (!existingContact) {
      return NextResponse.json({ error: "Contact not found or unauthorized" }, { status: 404 });
    }

    await prisma.contact.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Contact Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
