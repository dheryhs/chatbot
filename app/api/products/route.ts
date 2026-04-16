import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const userId = (session.user as any).id;
    const products = await prisma.product.findMany({
      where: { userId },
      include: {
        stocks: {
          include: { warehouse: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products);
  } catch (error: any) {
    console.error("GET Products Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, sku, price, isDigital, description, stocks } = await req.json();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const userId = (session.user as any).id;

    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          name,
          sku,
          price: parseInt(price) || 0,
          isDigital: !!isDigital,
          description,
          userId,
        },
      });

      if (stocks && typeof stocks === "object") {
        const stockData = Object.entries(stocks).map(([warehouseId, stock]) => ({
          productId: p.id,
          warehouseId,
          stock: parseInt(stock as string) || 0,
        }));

        if (stockData.length > 0) {
          await tx.productStock.createMany({
            data: stockData,
          });
        }
      }

      return await tx.product.findUnique({
        where: { id: p.id },
        include: { stocks: { include: { warehouse: true } } }
      });
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.error("POST Product Error:", error);
    if (error.code === 'P2002' && error.meta?.target?.includes('sku')) {
        return NextResponse.json({ error: "SKU already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
