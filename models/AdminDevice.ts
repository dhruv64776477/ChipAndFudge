import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAdminDeviceDocument extends Document {
  deviceId: string;
  credentialId: string;
  publicKey: string; // Base64-encoded COSE public key
  counter: number;
  transports?: string[];
  createdAt: Date;
  lastUsedAt?: Date | null;
}

const AdminDeviceSchema = new Schema<IAdminDeviceDocument>(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    credentialId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    publicKey: {
      type: String,
      required: true,
    },
    counter: {
      type: Number,
      required: true,
      default: 0,
    },
    transports: {
      type: [String],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: false,
  }
);

// Delete cached model in development to force re-compilation of updated schema
if (process.env.NODE_ENV !== 'production' && mongoose.models.AdminDevice) {
  delete mongoose.models.AdminDevice;
}

export const AdminDevice: Model<IAdminDeviceDocument> =
  mongoose.models.AdminDevice ||
  mongoose.model<IAdminDeviceDocument>('AdminDevice', AdminDeviceSchema);

