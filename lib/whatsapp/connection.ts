// lib/whatsapp/connection.ts
//
// Sets up the Baileys socket: loads/saves auth state from disk, generates
// a QR code in the terminal when a new login is needed, and automatically
// reconnects if the connection drops (unless explicitly logged out).

import fs from "fs/promises";
import path from "path";
import QRCode from "qrcode";
import {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import qrcodeTerminal from "qrcode-terminal";
import pino from "pino";
import {
  setSocket,
  setConnectionStatus,
  getConnectionStatus,
  isConnected,
  getQrCode,
  setQrCode,
  type WhatsAppConnectionStatus,
} from "./client";

const logger = pino({ level: "error" });

const AUTH_DIR = path.resolve(process.cwd(), process.env.AUTH_DIR || "./auth");

let connectPromise: Promise<WASocket> | null = null;

export async function hasPersistedWhatsAppAuth(): Promise<boolean> {
  try {
    await fs.access(path.join(AUTH_DIR, "creds.json"));
    return true;
  } catch {
    return false;
  }
}

export async function clearWhatsAppAuthState(): Promise<void> {
  try {
    await fs.rm(AUTH_DIR, { recursive: true, force: true });
  } catch (error) {
    console.error("[whatsapp] Failed to clear auth state:", error);
  }
}

export async function awaitQrCode(timeoutMs = 10000): Promise<string | null> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const qr = getQrCode();
    if (qr) {
      return qr;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return getQrCode();
}

export async function getWhatsAppAdminStatus(): Promise<{
  status: WhatsAppConnectionStatus;
  qrCode: string | null;
}> {
  const liveStatus = getConnectionStatus();

  if (liveStatus === "connected") {
    return { status: "connected", qrCode: null };
  }

  if (liveStatus === "connecting") {
    return { status: "connecting", qrCode: getQrCode() };
  }

  if (liveStatus === "logged_out") {
    return { status: "logged_out", qrCode: null };
  }

  if (liveStatus === "needs_authentication") {
    return { status: "needs_authentication", qrCode: getQrCode() };
  }

  const hasAuth = await hasPersistedWhatsAppAuth();
  if (!hasAuth) {
    return { status: "needs_authentication", qrCode: getQrCode() };
  }

  return { status: "disconnected", qrCode: null };
}

export async function generateWhatsAppQrDataUrl(qr: string): Promise<string> {
  return QRCode.toDataURL(qr, {
    errorCorrectionLevel: "H",
    width: 420,
    margin: 2,
    color: {
      dark: "#111827",
      light: "#ffffff",
    },
  });
}

/**
 * Starts (or restarts) the WhatsApp connection.
 */
export async function connectToWhatsApp(): Promise<WASocket> {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  setConnectionStatus("connecting");
  setQrCode(null);

  const sock = makeWASocket({
    version,
    auth: state,
    logger: logger as any,
    printQRInTerminal: false,
  });

  setSocket(sock);

  // Persist updated credentials to disk whenever Baileys refreshes them.
  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    handleConnectionUpdate(update);
  });

  return sock;
}

/**
 * Ensures that WhatsApp connection is established or connecting.
 * Safe to call on any API request.
 */
export async function ensureWhatsAppConnected(
  forceReconnect = false,
): Promise<WASocket | null> {
  if (isConnected()) {
    return (await import("./client")).getSocket();
  }

  const currentStatus = getConnectionStatus();
  if (currentStatus === "connecting" && connectPromise) {
    try {
      return await connectPromise;
    } catch {
      return null;
    }
  }

  if (currentStatus === "logged_out" && !forceReconnect) {
    return null;
  }

  try {
    connectPromise = connectToWhatsApp();
    const sock = await connectPromise;
    connectPromise = null;
    return sock;
  } catch (err: any) {
    connectPromise = null;
    console.error(
      "[whatsapp] Connection initialization failed:",
      err?.message || err,
    );
    return null;
  }
}

/**
 * Reacts to connection.update events: shows QR code, reports status,
 * and handles reconnection.
 */
function handleConnectionUpdate(update: {
  connection?: string;
  lastDisconnect?: { error?: Error };
  qr?: string;
}) {
  const { connection, lastDisconnect, qr } = update;

  if (qr) {
    console.log(
      "\n[whatsapp] Scan this QR code with WhatsApp → Linked Devices:\n",
    );
    qrcodeTerminal.generate(qr, { small: true });
    setQrCode(qr);
    setConnectionStatus("needs_authentication");
    return;
  }

  if (connection === "open") {
    setQrCode(null);
    setConnectionStatus("connected");
    console.log("[whatsapp] Successfully connected to WhatsApp.");
  }

  if (connection === "close") {
    const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
    const loggedOut = statusCode === DisconnectReason.loggedOut;

    if (loggedOut) {
      setQrCode(null);
      setConnectionStatus("logged_out");
      console.log(
        "[whatsapp] Session logged out from the phone. Removing persisted auth state.",
      );
      void clearWhatsAppAuthState();
      setSocket(null);
      return;
    }

    setQrCode(null);
    setConnectionStatus("disconnected");
    setSocket(null);
    console.log("[whatsapp] Connection closed, reconnecting...");

    setTimeout(() => {
      connectToWhatsApp().catch((err: any) => {
        console.error(
          "[whatsapp] Reconnect attempt failed:",
          err?.message || err,
        );
      });
    }, 3000);
  }
}
