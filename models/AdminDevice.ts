import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAdminDeviceDocument extends Document {
  deviceId: string;
  name: string;
  webauthnCredentialId: string;
  webauthnPublicKey: string; // Base64 representation
  credentialID?: string;
  credentialPublicKey?: string;
  counter: number;
  enabled: boolean;
  transports: string[];
  createdAt: Date;
  lastUsedAt: Date | null;
}

const AdminDeviceSchema = new Schema<IAdminDeviceDocument>(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      default: 'Primary Admin Device',
      trim: true,
    },
    webauthnCredentialId: {
      type: String,
      required: true,
      index: true,
    },
    webauthnPublicKey: {
      type: String,
      required: true,
    },
    // Aliases to guarantee backward and forward schema compatibility
    credentialID: {
      type: String,
      default: function (this: IAdminDeviceDocument) {
        return this.webauthnCredentialId;
      },
    },
    credentialPublicKey: {
      type: String,
      default: function (this: IAdminDeviceDocument) {
        return this.webauthnPublicKey;
      },
    },
    counter: {
      type: Number,
      required: true,
      default: 0,
    },
    enabled: {
      type: Boolean,
      default: true,
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
