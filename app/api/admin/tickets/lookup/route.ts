import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { lookupTicketForAdmin } from '@/lib/tickets/ticket.service';
import { TokenActionSchema } from '@/lib/validation/ticket.schema';

export async function POST(req: NextRequest) {
  try {
    const { errorResponse, auth } = await requireAdminAuth(req);
    if (errorResponse || !auth) {
      return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = TokenActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const result = await lookupTicketForAdmin(parsed.data.token);

    if (result.notFound) {
      return NextResponse.json(
        { error: result.error || 'Ticket not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      ticket: result.ticket,
      alreadyClosed: result.alreadyClosed,
    });
  } catch (error: unknown) {
    console.error('Lookup ticket error:', error);
    const message = error instanceof Error ? error.message : 'Failed to lookup ticket';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
