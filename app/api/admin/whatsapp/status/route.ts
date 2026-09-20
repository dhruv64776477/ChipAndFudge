import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth/admin";
import {
  ensureWhatsAppConnected,
  generateWhatsAppQrDataUrl,
  getWhatsAppAdminStatus,
} from "@/lib/whatsapp/connection";

export async function GET(req: NextRequest) {
  try {
    const { errorResponse } = await requireAdminAuth(req);
    if (errorResponse) return errorResponse;

    const currentStatus = await getWhatsAppAdminStatus();
    if (
      currentStatus.status === "needs_authentication" ||
      currentStatus.status === "disconnected"
    ) {
      await ensureWhatsAppConnected();
    }

    const refreshedStatus = await getWhatsAppAdminStatus();
    const qrCode = refreshedStatus.qrCode
      ? await generateWhatsAppQrDataUrl(refreshedStatus.qrCode)
      : null;

    return NextResponse.json({
      success: true,
      status: refreshedStatus.status,
      qrCode,
      requiresAuthentication:
        refreshedStatus.status === "needs_authentication" ||
        refreshedStatus.status === "logged_out",
    });
  } catch (error: unknown) {
    console.error("WhatsApp status check error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to check WhatsApp status";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
