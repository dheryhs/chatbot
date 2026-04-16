import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const userId = (session.user as any).id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        credits: true,
        aiApiKey: true,
        aiProvider: true,
        createdAt: true,
      },
    });

    // Mask the API key for non-admin or for display (show last 4 chars only)
    if (user && user.aiApiKey) {
      user.aiApiKey = user.aiApiKey.length > 8
        ? "••••••••" + user.aiApiKey.slice(-4)
        : "••••••••";
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("GET User Settings Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const userId = (session.user as any).id;
    const body = await req.json();
    const { name, currentPassword, newPassword, aiApiKey, aiProvider } = body;

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;

    // Password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required" }, { status: 400 });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!passwordMatch) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }

      updateData.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    // AI API Key — ADMIN only
    if (aiApiKey !== undefined || aiProvider !== undefined) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Hanya Admin yang dapat mengubah AI API Key" }, { status: 403 });
      }
      if (aiApiKey !== undefined && !aiApiKey.startsWith("••")) {
        // Only update if it's a real new key (not the masked version)
        updateData.aiApiKey = aiApiKey;
      }
      if (aiProvider !== undefined) {
        updateData.aiProvider = aiProvider;
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        credits: true,
        aiApiKey: true,
        aiProvider: true,
        createdAt: true,
      },
    });

    // Mask key in response
    if (updated.aiApiKey) {
      updated.aiApiKey = updated.aiApiKey.length > 8
        ? "••••••••" + updated.aiApiKey.slice(-4)
        : "••••••••";
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT User Settings Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
