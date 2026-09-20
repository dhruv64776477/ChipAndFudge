import { NextRequest, NextResponse } from 'next/server';
import { findTicketByTokenOrId, generateQrDataUrl } from '@/lib/tickets/ticket.service';
import { checkRateLimit } from '@/lib/security/rate-limit';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Ticket Not Found' }, { status: 404 });
    }

    const ip = req.headers.get('x-forwarded-for') || 'local';
    const rateCheck = checkRateLimit(`public_ticket:${ip}`, 120, 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
    }

    // Exact lookup by token hash or ticketId
    const ticket = await findTicketByTokenOrId(token);

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket Not Found' }, { status: 404 });
    }

    // The QR code contains the ticket ID for admin scanning
    const qrDataUrl = await generateQrDataUrl(ticket.ticketId);

    // Return ONLY safe public customer fields
    return NextResponse.json({
      ticketId: ticket.ticketId,
      name: ticket.name,
      mobNo: ticket.mobNo,
      status: ticket.status,
      createdAt: ticket.createdAt.toISOString(),
      closedAt: ticket.closedAt ? ticket.closedAt.toISOString() : null,
      qrDataUrl,
      orderItems: ticket.orderItems ?? [],
      grandTotal: ticket.grandTotal ?? 0,
    });
  } catch (error: unknown) {
    console.error('Public ticket fetch error:', error);
    return NextResponse.json({ error: 'Ticket Not Found' }, { status: 404 });
  }
}

