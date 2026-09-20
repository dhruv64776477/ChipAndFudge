import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { connectToDatabase } from '@/lib/mongodb';
import { Ticket } from '@/models/Ticket';
import { hashToken } from '@/lib/security/hash';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { errorResponse } = await requireAdminAuth(req);
    if (errorResponse) return errorResponse;

    const { token } = await params;
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid ticket token' }, { status: 400 });
    }

    await connectToDatabase();
    const qrTokenHash = hashToken(token);

    const ticket = await Ticket.findOne({ qrTokenHash }).lean();
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({
      ticketId: ticket.ticketId,
      name: ticket.name,
      mobNo: ticket.mobNo,
      status: ticket.status,
      orderItems: ticket.orderItems,
      grandTotal: ticket.grandTotal,
      notes: ticket.notes,
      createdAt: ticket.createdAt,
      closedAt: ticket.closedAt,
    });
  } catch (error: unknown) {
    console.error('Admin ticket lookup error:', error);
    const message = error instanceof Error ? error.message : 'Lookup failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
