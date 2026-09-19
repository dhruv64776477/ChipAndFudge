import mongoose, { Schema, Document, Model } from 'mongoose';
import { TicketStatus } from '@/types/ticket';

export interface ITicketDocument extends Document {
  ticketId: string;
  name: string;
  mobNo: string;
  qrTokenHash: string;
  status: TicketStatus;
  items?: string[];
  amount?: number;
  notes?: string;
  closedAt: Date | null;
  closedByDeviceId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

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
    items: {
      type: [String],
      default: ['Brownie Bowl'],
    },
    amount: {
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

