import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth/admin";
import {
  clearWhatsAppAuthState,
  getWhatsAppAdminStatus,
} from "@/lib/whatsapp/connection";
import { setConnectionStatus } from "@/lib/whatsapp/client";

export async function POST(req: NextRequest) {
  try {
    const { errorResponse } = await requireAdminAuth(req);
    if (errorResponse) return errorResponse;

    await clearWhatsAppAuthState();
    setConnectionStatus("logged_out");

    return NextResponse.json({
      success: true,
      status: await getWhatsAppAdminStatus().then((status) => status.status),
    });
  } catch (error: unknown) {
    console.error("WhatsApp logout error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to log out WhatsApp";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
