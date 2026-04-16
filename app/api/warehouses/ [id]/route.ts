import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const { name, location, postalCode } = await req.json();
    const userId = (session.user as any).id;

    const warehouse = await prisma.warehouse.updateMany({
      where: { id, userId },
      data: { name, location, postalCode },
    });

    if (warehouse.count === 0) {
      return NextResponse.json({ error: "Warehouse not found or unauthorized" }, { status: 404 });
    }

    const updated = await prisma.warehouse.findUnique({ where: { id } });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT Warehouse Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const userId = (session.user as any).id;

    const deleted = await prisma.warehouse.deleteMany({
      where: { id, userId },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Warehouse not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Warehouse Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
