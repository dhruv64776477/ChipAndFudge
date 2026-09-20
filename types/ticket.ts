export type TicketStatus = 'OPEN' | 'CLOSED';

/** A single order line item stored in the ticket */
export interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

/** Input from the client — quantity only; prices are computed server-side */
export interface OrderItemInput {
  name: string;
  quantity: number;
}

export interface ITicket {
  _id?: string;
  ticketId: string;
  name: string;
  mobNo: string;
  qrTokenHash: string;
  status: TicketStatus;
  orderItems?: OrderItem[];
  grandTotal?: number;
  notes?: string;
  closedAt: Date | null;
  closedByDeviceId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicTicketResponse {
  ticketId: string;
  name: string;
  mobNo: string;
  status: TicketStatus;
  createdAt: string;
  closedAt: string | null;
  qrDataUrl: string;
  orderItems?: OrderItem[];
  grandTotal?: number;
}

export interface CreateTicketInput {
  name: string;
  mobNo: string;
  orderItems: OrderItemInput[];
}

export interface CloseTicketResult {
  success: boolean;
  ticket?: {
    ticketId: string;
    name: string;
    mobNo: string;
    status: TicketStatus;
    closedAt: Date | null;
  };
  alreadyClosed?: boolean;
  notFound?: boolean;
  error?: string;
}
