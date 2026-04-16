import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const { name, sku, price, isDigital, description, stocks } = await req.json();
    const userId = (session.user as any).id;

    const product = await prisma.$transaction(async (tx) => {
      // Verify ownership
      const existing = await tx.product.findFirst({
        where: { id, userId }
      });

      if (!existing) throw new Error("Product not found");

      const p = await tx.product.update({
        where: { id },
        data: {
          name,
          sku,
          price: parseInt(price) || 0,
          isDigital: !!isDigital,
          description,
        },
      });

      if (stocks && typeof stocks === "object") {
        for (const [warehouseId, stock] of Object.entries(stocks)) {
          await tx.productStock.upsert({
            where: {
              productId_warehouseId: {
                productId: id,
                warehouseId,
              },
            },
            update: { stock: parseInt(stock as string) || 0 },
            create: {
              productId: id,
              warehouseId,
              stock: parseInt(stock as string) || 0,
            },
          });
        }
      }

      return await tx.product.findUnique({
        where: { id },
        include: { stocks: { include: { warehouse: true } } }
      });
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.error("PUT Product Error:", error);
    if (error.message === "Product not found") {
      return NextResponse.json({ error: "Product not found or unauthorized" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const userId = (session.user as any).id;

    const deleted = await prisma.product.deleteMany({
      where: { id, userId },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Product not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Product Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
