import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Method PATCH untuk Bulk Update
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { ids, tags, productLabel } = await req.json();
    const userId = (session.user as any).id;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "IDs diperlukan" }, { status: 400 });
    }

    const updateData: any = {};
    if (tags !== undefined) updateData.tags = tags;
    if (productLabel !== undefined) updateData.productLabel = productLabel;

    const result = await prisma.contact.updateMany({
      where: { id: { in: ids }, userId },
      data: updateData,
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Method DELETE untuk Bulk Delete
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { ids } = await req.json();
    const userId = (session.user as any).id;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "IDs diperlukan" }, { status: 400 });
    }

    const result = await prisma.contact.deleteMany({
      where: { id: { in: ids }, userId },
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
