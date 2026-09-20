// lib/whatsapp/connection.ts
//
// Sets up the Baileys socket: loads/saves auth state from disk, generates
// a QR code in the terminal when a new login is needed, and automatically
// reconnects if the connection drops (unless explicitly logged out).

import {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  WASocket,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcodeTerminal from 'qrcode-terminal';
import pino from 'pino';
import { setSocket, setConnectionStatus, getConnectionStatus, isConnected } from './client';

const logger = pino({ level: 'error' });

const AUTH_DIR = process.env.AUTH_DIR || './auth';

let connectPromise: Promise<WASocket> | null = null;

/**
 * Starts (or restarts) the WhatsApp connection.
 */
export async function connectToWhatsApp(): Promise<WASocket> {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  setConnectionStatus('connecting');

  const sock = makeWASocket({
    version,
    auth: state,
    logger: logger as any,
    printQRInTerminal: false,
  });

  setSocket(sock);

  // Persist updated credentials to disk whenever Baileys refreshes them.
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    handleConnectionUpdate(update);
  });

  return sock;
}

/**
 * Ensures that WhatsApp connection is established or connecting.
 * Safe to call on any API request.
 */
export async function ensureWhatsAppConnected(): Promise<WASocket | null> {
  if (isConnected()) {
    return (await import('./client')).getSocket();
  }

  const currentStatus = getConnectionStatus();
  if (currentStatus === 'connecting' && connectPromise) {
    try {
      return await connectPromise;
    } catch {
      return null;
    }
  }

  if (currentStatus === 'logged_out') {
    return null;
  }

  try {
    connectPromise = connectToWhatsApp();
    const sock = await connectPromise;
    connectPromise = null;
    return sock;
  } catch (err: any) {
    connectPromise = null;
    console.error('[whatsapp] Connection initialization failed:', err?.message || err);
    return null;
  }
}

/**
 * Reacts to connection.update events: shows QR code, reports status,
 * and handles reconnection.
 */
function handleConnectionUpdate(update: { connection?: string; lastDisconnect?: { error?: Error }; qr?: string }) {
  const { connection, lastDisconnect, qr } = update;

  if (qr) {
    console.log('\n[whatsapp] Scan this QR code with WhatsApp → Linked Devices:\n');
    qrcodeTerminal.generate(qr, { small: true });
  }

  if (connection === 'open') {
    setConnectionStatus('connected');
    console.log('[whatsapp] Successfully connected to WhatsApp.');
  }

  if (connection === 'close') {
    const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
    const loggedOut = statusCode === DisconnectReason.loggedOut;

    if (loggedOut) {
      setConnectionStatus('logged_out');
      console.log(
        '[whatsapp] Session logged out from the phone. Delete the auth folder and restart to re-link.'
      );
      setSocket(null);
      return;
    }

    setConnectionStatus('disconnected');
    setSocket(null);
    console.log('[whatsapp] Connection closed, reconnecting...');

    setTimeout(() => {
      connectToWhatsApp().catch((err: any) => {
        console.error('[whatsapp] Reconnect attempt failed:', err?.message || err);
      });
    }, 3000);
  }
}
