export type TicketStatus = 'OPEN' | 'CLOSED';

export interface ITicket {
  _id?: string;
  ticketId: string;
  name: string;
  mobNo: string;
  qrTokenHash: string;
  status: TicketStatus;
  items?: string[];
  amount?: number;
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
  items?: string[];
}


export interface CreateTicketInput {
  name: string;
  mobNo: string;
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

