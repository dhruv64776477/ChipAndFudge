import mongoose, { Schema, Document, Model } from 'mongoose';
import { TicketStatus } from '@/types/ticket';

export interface IOrderItemDocument {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ITicketDocument extends Document {
  ticketId: string;
  name: string;
  mobNo: string;
  qrTokenHash: string;
  status: TicketStatus;
  orderItems: IOrderItemDocument[];
  grandTotal: number;
  notes?: string;
  closedAt: Date | null;
  closedByDeviceId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItemDocument>(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const TicketSchema = new Schema<ITicketDocument>(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    mobNo: {
      type: String,
      required: true,
      trim: true,
    },
    qrTokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'CLOSED'],
      default: 'OPEN',
      index: true,
    },
    orderItems: {
      type: [OrderItemSchema],
      default: [],
    },
    grandTotal: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
    closedAt: {
      type: Date,
      default: null,
    },
    closedByDeviceId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for atomic status checks
TicketSchema.index({ qrTokenHash: 1, status: 1 });
TicketSchema.index({ ticketId: 1, status: 1 });
TicketSchema.index({ createdAt: -1 });

// Delete cached model in development to force re-compilation of updated schema
if (process.env.NODE_ENV !== 'production' && mongoose.models.Ticket) {
  delete mongoose.models.Ticket;
}

export const Ticket: Model<ITicketDocument> =
  mongoose.models.Ticket || mongoose.model<ITicketDocument>('Ticket', TicketSchema);
