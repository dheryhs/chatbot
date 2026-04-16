import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { waha } from "@/lib/waha";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string; action: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = await context.params;
  const { id, action } = params;
  console.log(`[API] Session Action: ${action} for ${id}`);

  try {
    let result;
    switch (action) {
      case "start":
        result = await waha.startSession(id);
        break;
      case "stop":
        result = await waha.stopSession(id);
        break;
      case "restart":
        result = await waha.restartSession(id);
        break;
      case "pairing-code":
        const { phoneNumber } = await req.json();
        result = await waha.requestPairingCode(id, phoneNumber);
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`[API] Action ${action} failed:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string; action: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = await context.params;
  const { id, action } = params;

  try {
    if (action === "qr") {
      console.log(`[API] Fetching QR for session: ${id}`);
      const result = await waha.getQR(id);
      if (!result || !result.data) {
        console.warn(`[API] QR response empty for ${id}`);
      }
      return NextResponse.json(result);
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error(`[API] GET ${action} failed for ${id}:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
