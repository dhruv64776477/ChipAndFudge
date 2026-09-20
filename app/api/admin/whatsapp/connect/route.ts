import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth/admin";
import {
  ensureWhatsAppConnected,
  generateWhatsAppQrDataUrl,
  getWhatsAppAdminStatus,
} from "@/lib/whatsapp/connection";

export async function POST(req: NextRequest) {
  try {
    const { errorResponse } = await requireAdminAuth(req);
    if (errorResponse) return errorResponse;

    await ensureWhatsAppConnected(true);

    const status = await getWhatsAppAdminStatus();
    const qrCode = status.qrCode
      ? await generateWhatsAppQrDataUrl(status.qrCode)
      : null;

    return NextResponse.json({
      success: true,
      status: status.status,
      qrCode,
      requiresAuthentication:
        status.status === "needs_authentication" ||
        status.status === "logged_out",
    });
  } catch (error: unknown) {
    console.error("WhatsApp connect error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to connect WhatsApp";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
