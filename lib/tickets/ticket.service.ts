import QRCode from 'qrcode';
import { connectToDatabase } from '@/lib/mongodb';
import { Ticket, ITicketDocument } from '@/models/Ticket';
import { AuditLog } from '@/models/AuditLog';
import { generateSecureTicketId, generateSecureToken } from './token';
import { hashToken } from '@/lib/security/hash';
import { CreateTicketInput, CloseTicketResult, OrderItem } from '@/types/ticket';
import { MENU_MAP } from '@/lib/menu/items';

export interface CreateTicketResult {
  ticket: {
    ticketId: string;
    name: string;
    mobNo: string;
    status: string;
    createdAt: Date;
    orderItems: OrderItem[];
    grandTotal: number;
  };
  rawToken: string;
  customerUrl: string;
  qrDataUrl: string;
}

/**
 * Generate a high-contrast QR code data URL for display on screen/print.
 */
export async function generateQrDataUrl(content: string): Promise<string> {
  return QRCode.toDataURL(content, {
    errorCorrectionLevel: 'H',
    width: 400,
    margin: 2,
    color: {
      dark: '#1e130c',
      light: '#ffffff',
    },
  });
}

/**
 * Helper to extract raw token or ticket ID from scanned text
 * (in case scanner reads a full URL like https://thechipandfudge.com/t/ABC...)
 */
export function extractTokenFromInput(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      const segments = url.pathname.split('/').filter(Boolean);
      if (segments.length >= 2 && segments[0] === 't') {
        return segments[1];
      }
    } catch {
      // fallback to raw string
    }
  }
  return trimmed;
}

/**
 * Compute order items with server-side prices from menu constants.
 * Client-submitted prices are ignored — only quantities are trusted.
 */
function computeOrderItems(
  inputItems: Array<{ name: string; quantity: number }>
): { orderItems: OrderItem[]; grandTotal: number } {
  const orderItems: OrderItem[] = [];
  let grandTotal = 0;

  for (const input of inputItems) {
    const menuItem = MENU_MAP.get(input.name);
    if (!menuItem) {
      throw new Error(`Unknown menu item: ${input.name}`);
    }
    const unitPrice = menuItem.sellingPrice;
    const total = unitPrice * input.quantity;
    orderItems.push({
      name: input.name,
      quantity: input.quantity,
      unitPrice,
      total,
    });
    grandTotal += total;
  }

  return { orderItems, grandTotal };
}

export async function createTicket(
  input: CreateTicketInput,
  baseUrl: string,
  deviceId: string
): Promise<CreateTicketResult> {
  await connectToDatabase();

  // 1. Generate cryptographically secure random 128-bit Ticket ID (e.g. 7KX9-M2QP-8R4T)
  let ticketId = generateSecureTicketId();
  let attempts = 0;
  while (attempts < 5) {
    const existing = await Ticket.findOne({ ticketId });
    if (!existing) break;
    ticketId = generateSecureTicketId();
    attempts++;
  }

  // 2. Generate high-entropy secret token (256 bits) and its SHA-256 hash
  const rawToken = generateSecureToken();
  const qrTokenHash = hashToken(rawToken);

  // 3. Compute order items and grand total server-side (never trust client prices)
  const { orderItems, grandTotal } = computeOrderItems(input.orderItems);

  // 4. Persist ticket in database
  const ticket = await Ticket.create({
    ticketId,
    name: input.name.trim(),
    mobNo: input.mobNo.trim(),
    qrTokenHash,
    status: 'OPEN',
    orderItems,
    grandTotal,
    notes: '',
  });

  // 5. Build customer URL and QR code
  const customerUrl = `${baseUrl}/t/${ticket.ticketId}`;

  // The QR code encodes the secret token directly
  const qrDataUrl = await generateQrDataUrl(rawToken);

  // 6. Record audit log
  await AuditLog.create({
    ticketId: ticket._id,
    action: 'TICKET_CREATED',
    deviceId,
    timestamp: new Date(),
    details: {
      ticketId: ticket.ticketId,
      name: ticket.name,
      mobNo: ticket.mobNo,
      grandTotal,
    },
  });

  return {
    ticket: {
      ticketId: ticket.ticketId,
      name: ticket.name,
      mobNo: ticket.mobNo,
      status: ticket.status,
      createdAt: ticket.createdAt,
      orderItems,
      grandTotal,
    },
    rawToken,
    customerUrl,
    qrDataUrl,
  };
}

/**
 * Look up a ticket by either secret raw token or public ticketId.
 * Used by the public customer page (/t/<id>).
 */
export async function findTicketByTokenOrId(identifier: string): Promise<ITicketDocument | null> {
  await connectToDatabase();
  const cleaned = extractTokenFromInput(identifier);

  // 1. Try finding by raw token hash
  try {
    const hash = hashToken(cleaned);
    const byHash = await Ticket.findOne({ qrTokenHash: hash });
    if (byHash) return byHash;
  } catch {
    // ignore
  }

  // 2. Try finding by exact ticketId
  return Ticket.findOne({ ticketId: cleaned });
}

/**
 * Admin lookup for previewing a ticket before closing it in the scanner.
 */
export async function lookupTicketForAdmin(input: string): Promise<CloseTicketResult> {
  await connectToDatabase();
  const ticket = await findTicketByTokenOrId(input);

  if (!ticket) {
    return {
      success: false,
      notFound: true,
      error: 'Ticket not found. Invalid QR code or identifier.',
    };
  }

  return {
    success: true,
    alreadyClosed: ticket.status === 'CLOSED',
    ticket: {
      ticketId: ticket.ticketId,
      name: ticket.name,
      mobNo: ticket.mobNo,
      status: ticket.status,
      closedAt: ticket.closedAt,
      orderItems: ticket.orderItems,
      grandTotal: ticket.grandTotal,
    },
  };
}

/**
 * Atomically close a ticket from OPEN -> CLOSED.
 * Enforces that CLOSED tickets can NEVER be re-opened.
 */
export async function closeTicketAtomically(
  input: string,
  deviceId: string
): Promise<CloseTicketResult> {
  await connectToDatabase();
  const cleaned = extractTokenFromInput(input);
  const now = new Date();

  // Compute hash if cleaned is rawToken
  let qrTokenHash = '';
  try {
    qrTokenHash = hashToken(cleaned);
  } catch {
    // ignore
  }

  // ATOMIC OPEN -> CLOSED update by either qrTokenHash OR ticketId
  const filter: Record<string, unknown> = {
    status: 'OPEN',
    $or: [{ qrTokenHash }, { ticketId: cleaned }],
  };

  const updatedTicket = await Ticket.findOneAndUpdate(
    filter,
    {
      $set: {
        status: 'CLOSED',
        closedAt: now,
        closedByDeviceId: deviceId,
      },
    },
    { new: true }
  );

  if (updatedTicket) {
    // Record audit event
    await AuditLog.create({
      ticketId: updatedTicket._id,
      action: 'TICKET_CLOSED',
      deviceId,
      timestamp: now,
      details: {
        ticketId: updatedTicket.ticketId,
        customerName: updatedTicket.name,
      },
    });

    return {
      success: true,
      ticket: {
        ticketId: updatedTicket.ticketId,
        name: updatedTicket.name,
        mobNo: updatedTicket.mobNo,
        status: updatedTicket.status,
        closedAt: updatedTicket.closedAt,
        orderItems: updatedTicket.orderItems,
        grandTotal: updatedTicket.grandTotal,
      },
    };
  }

  // If atomic update failed, determine if ticket is already CLOSED or NOT FOUND
  const existing = await Ticket.findOne({
    $or: [{ qrTokenHash }, { ticketId: cleaned }],
  });

  if (existing) {
    return {
      success: false,
      alreadyClosed: true,
      ticket: {
        ticketId: existing.ticketId,
        name: existing.name,
        mobNo: existing.mobNo,
        status: existing.status,
        closedAt: existing.closedAt,
        orderItems: existing.orderItems,
        grandTotal: existing.grandTotal,
      },
      error: `Ticket ${existing.ticketId} is already CLOSED`,
    };
  }

  return {
    success: false,
    notFound: true,
    error: 'Invalid QR token or Ticket ID. Ticket not found.',
  };
}
