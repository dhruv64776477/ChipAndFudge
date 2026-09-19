export interface IAdminDevice {
  _id?: string;
  deviceId: string;
  credentialId: string;
  publicKey: string; // Base64-encoded COSE public key
  counter: number;
  transports?: string[];
  createdAt: Date;
  lastUsedAt?: Date | null;
}

export interface AdminSessionPayload {
  sub: string;
  deviceId: string;
  credentialId: string;
  role: 'admin';
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

