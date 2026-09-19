import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { closeTicketAtomically } from '@/lib/tickets/ticket.service';
import { checkRateLimit } from '@/lib/security/rate-limit';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    // 1. Enforce strict server-side admin authentication & authorized device check
    const { errorResponse, auth } = await requireAdminAuth(req);
    if (errorResponse || !auth) {
      return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await params;
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid ticket token' }, { status: 400 });
    }

    // 2. Rate limit closing attempts
    const ip = req.headers.get('x-forwarded-for') || 'local';
    const rateCheck = checkRateLimit(`close:${ip}`, 120, 60 * 1000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429 }
      );
    }

    // 3. Atomically update OPEN -> CLOSED
    const result = await closeTicketAtomically(token, auth.adminDevice.deviceId);

    if (result.success && result.ticket) {
      return NextResponse.json({
        success: true,
        message: `Ticket ${result.ticket.ticketId} successfully closed!`,
        ticket: {
          ticketId: result.ticket.ticketId,
          name: result.ticket.name,
          status: result.ticket.status,
          closedAt: result.ticket.closedAt,
        },
      });
    }

    if (result.alreadyClosed && result.ticket) {
      return NextResponse.json(
        {
          error: `Ticket ${result.ticket.ticketId} is already CLOSED`,
          alreadyClosed: true,
          ticket: {
            ticketId: result.ticket.ticketId,
            name: result.ticket.name,
            status: result.ticket.status,
            closedAt: result.ticket.closedAt,
          },
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: result.error || 'Ticket not found' },
      { status: 404 }
    );
  } catch (error: unknown) {
    console.error('Close ticket error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
