import mongoose, { Schema, Document, Model } from 'mongoose';

export type AuditAction = 'TICKET_CREATED' | 'TICKET_CLOSED' | 'ADMIN_LOGIN';

export interface IAuditLogDocument extends Document {
  ticketId?: mongoose.Types.ObjectId;
  action: AuditAction;
  deviceId: string | null;
  timestamp: Date;
  details?: Record<string, unknown>;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: 'Ticket',
    },
    action: {
      type: String,
      required: true,
      enum: ['TICKET_CREATED', 'TICKET_CLOSED', 'ADMIN_LOGIN'],
      index: true,
    },
    deviceId: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: false,
  }
);

// Delete cached model in development to force re-compilation of updated schema
if (process.env.NODE_ENV !== 'production' && mongoose.models.AuditLog) {
  delete mongoose.models.AuditLog;
}

export const AuditLog: Model<IAuditLogDocument> =
  mongoose.models.AuditLog || mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema);

