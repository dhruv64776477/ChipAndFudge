export interface IAdminDevice {
  _id?: string;
  deviceId: string;
  name: string;
  webauthnCredentialId: string;
  webauthnPublicKey: string; // Base64 encoded
  counter: number;
  enabled: boolean;
  transports?: string[];
  createdAt: Date;
  lastUsedAt: Date | null;
}

export interface AdminSessionPayload {
  sub: string;
  deviceId: string;
  role: 'admin';
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}
