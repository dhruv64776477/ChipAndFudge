// lib/whatsapp/client.ts
//
// Holds the single shared Baileys socket instance and the current
// connection status across Next.js request contexts.

import type { WASocket } from "@whiskeysockets/baileys";

export type WhatsAppConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "logged_out"
  | "needs_authentication";

interface GlobalWhatsAppState {
  socket: WASocket | null;
  connectionStatus: WhatsAppConnectionStatus;
  qrCode: string | null;
}

const globalForWhatsApp = globalThis as unknown as {
  whatsappState: GlobalWhatsAppState | undefined;
};

if (!globalForWhatsApp.whatsappState) {
  globalForWhatsApp.whatsappState = {
    socket: null,
    connectionStatus: "needs_authentication",
    qrCode: null,
  };
}

const state = globalForWhatsApp.whatsappState;

export function setSocket(newSock: WASocket | null) {
  state.socket = newSock;
}

export function getSocket(): WASocket | null {
  return state.socket;
}

export function setConnectionStatus(status: WhatsAppConnectionStatus) {
  state.connectionStatus = status;
  console.log(`[whatsapp] connection status: ${status}`);
}

export function getConnectionStatus(): WhatsAppConnectionStatus {
  return state.connectionStatus;
}

export function setQrCode(qr: string | null) {
  state.qrCode = qr;
}

export function getQrCode(): string | null {
  return state.qrCode;
}

export function isConnected(): boolean {
  return state.connectionStatus === "connected" && state.socket !== null;
}
