import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const userId = (session.user as any).id;
    const warehouses = await prisma.warehouse.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(warehouses);
  } catch (error: any) {
    console.error("GET Warehouses Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, location, postalCode } = await req.json();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const userId = (session.user as any).id;
    const warehouse = await prisma.warehouse.create({
      data: {
        name,
        location,
        postalCode,
        userId,
      },
    });

    return NextResponse.json(warehouse);
  } catch (error: any) {
    console.error("POST Warehouse Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
