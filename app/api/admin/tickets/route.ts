import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { connectToDatabase } from '@/lib/mongodb';
import { Ticket } from '@/models/Ticket';
import { createTicket } from '@/lib/tickets/ticket.service';
import { CreateTicketSchema } from '@/lib/validation/ticket.schema';

export async function GET(req: NextRequest) {
  try {
    const { errorResponse } = await requireAdminAuth(req);
    if (errorResponse) return errorResponse;

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');
    const search = searchParams.get('search')?.trim();

    const query: Record<string, unknown> = {};
    if (statusFilter && statusFilter !== 'ALL') {
      query.status = statusFilter;
    }

    if (search) {
      query.$or = [
        { ticketId: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { mobNo: { $regex: search, $options: 'i' } },
      ];
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const tickets = await Ticket.find(query).sort({ createdAt: -1 }).lean();

    const todayTickets = await Ticket.find({
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    }).lean();

    const totalToday = todayTickets.length;
    const openQueue = todayTickets.filter((t) => t.status === 'OPEN').length;
    const closedCount = todayTickets.filter((t) => t.status === 'CLOSED').length;
    const revenueToday = todayTickets.reduce((acc, t) => acc + (t.grandTotal || 0), 0);

    return NextResponse.json({
      tickets,
      stats: {
        totalToday,
        openQueue,
        closedCount,
        revenueToday,
      },
    });
  } catch (error: unknown) {
    console.error('Fetch tickets error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch tickets';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { errorResponse, auth } = await requireAdminAuth(req);
    if (errorResponse || !auth) {
      return (
        errorResponse ||
        NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Malformed JSON in request body' },
        { status: 400 }
      );
    }

    const parsed = CreateTicketSchema.safeParse(body);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json(
        { success: false, error: errorMsg || 'Invalid ticket input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      `${req.headers.get('x-forwarded-proto') || 'http'}://${req.headers.get('host') || 'localhost:3000'}`;

    const result = await createTicket(
      parsed.data,
      baseUrl,
      auth.adminDevice.deviceId
    );

    return NextResponse.json(
      {
        success: true,
        ticket: {
          ticketId: result.ticket.ticketId,
          name: result.ticket.name,
          mobNo: result.ticket.mobNo,
          status: result.ticket.status,
          createdAt: result.ticket.createdAt,
          orderItems: result.ticket.orderItems,
          grandTotal: result.ticket.grandTotal,
        },
        url: result.customerUrl,
        customerUrl: result.customerUrl,
        qrDataUrl: result.qrDataUrl,
        rawToken: result.rawToken,
        whatsapp: result.whatsapp,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create ticket';
    console.error('Create ticket error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
