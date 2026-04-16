import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { waha } from "@/lib/waha";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = await context.params;

  try {
    console.log(`[API] Getting session details: ${params.id}`);
    const wahaSession = await waha.getSession(params.id);
    return NextResponse.json(wahaSession);
  } catch (error: any) {
    console.error(`[API] Failed to get session ${params.id}:`, error.message);
    // If session not found in WAHA but exists in DB, we should still return something
    return NextResponse.json({ 
      name: params.id, 
      status: "STOPPED",
      error: error.message 
    });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = await context.params;

  try {
    console.log(`[API] Deleting session: ${params.id}`);
    // 1. Delete in WAHA
    await waha.deleteSession(params.id).catch((e) => {
      console.warn(`[API] Delete in WAHA failed for ${params.id}:`, e.message);
    });
    
    // 2. Delete in local DB
    await prisma.session.delete({
      where: { wahaSessionId: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`[API] Delete failed for ${params.id}:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
