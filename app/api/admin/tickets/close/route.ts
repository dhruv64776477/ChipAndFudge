import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { closeTicketAtomically } from '@/lib/tickets/ticket.service';
import { TokenActionSchema } from '@/lib/validation/ticket.schema';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate admin & 2. Validate admin session/device
    const { errorResponse, auth } = await requireAdminAuth(req);
    if (errorResponse || !auth) {
      return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Validate request with Zod
    const body = await req.json();
    const parsed = TokenActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    // 4-8. Atomically close the ticket
    const result = await closeTicketAtomically(
      parsed.data.token,
      auth.adminDevice.deviceId
    );

    if (result.notFound) {
      return NextResponse.json(
        { error: result.error || 'Ticket not found.' },
        { status: 404 }
      );
    }

    if (result.alreadyClosed) {
      return NextResponse.json(
        {
          success: false,
          alreadyClosed: true,
          ticket: result.ticket,
          message: result.error || 'Ticket is already CLOSED',
        },
        { status: 409 }
      );
    }

    // 9. Return the result
    return NextResponse.json({
      success: true,
      ticket: result.ticket,
      message: 'Ticket closed successfully',
    });
  } catch (error: unknown) {
    console.error('Close ticket error:', error);
    const message = error instanceof Error ? error.message : 'Failed to close ticket';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
