// lib/whatsapp/sender.ts
//
// Message sender with sequential queue, rate limiting, and duplicate protection.

import { randomUUID } from 'crypto';
import { getSocket, isConnected } from './client';
import { ensureWhatsAppConnected } from './connection';
import {
  toWhatsAppJid,
  validatePhone,
  validateMessage,
  validateLink,
} from './validation';

const MIN_SEND_INTERVAL_MS = Number(process.env.MIN_SEND_INTERVAL_MS || 1500);
const DUPLICATE_WINDOW_MS = Number(process.env.DUPLICATE_WINDOW_MS || 60000);

interface QueueItem {
  jobId: string;
  digits: string;
  message: string;
  resolve: (value: { jobId: string; messageId: string | null }) => void;
  reject: (reason: Error) => void;
}

// Store queue and recentSends on globalThis so they persist in Next.js dev environment
interface GlobalWhatsAppSenderState {
  queue: QueueItem[];
  isProcessing: boolean;
  recentSends: Map<string, number>;
  lastSendAt: number;
}

const globalForSender = globalThis as unknown as {
  whatsappSenderState: GlobalWhatsAppSenderState | undefined;
};

if (!globalForSender.whatsappSenderState) {
  globalForSender.whatsappSenderState = {
    queue: [],
    isProcessing: false,
    recentSends: new Map<string, number>(),
    lastSendAt: 0,
  };

  // Periodic cleanup of old duplicate-tracking entries
  setInterval(() => {
    const state = globalForSender.whatsappSenderState;
    if (!state) return;
    const now = Date.now();
    for (const [key, sentAt] of state.recentSends.entries()) {
      if (now - sentAt > DUPLICATE_WINDOW_MS) {
        state.recentSends.delete(key);
      }
    }
  }, DUPLICATE_WINDOW_MS).unref();
}

const senderState = globalForSender.whatsappSenderState!;

/**
 * Checks whether this exact message was already sent to this number recently.
 */
export function isDuplicate(digits: string, message: string): boolean {
  const key = `${digits}|${message}`;
  const sentAt = senderState.recentSends.get(key);
  if (!sentAt) return false;
  return Date.now() - sentAt < DUPLICATE_WINDOW_MS;
}

/**
 * Queues a WhatsApp text message to be sent.
 */
export function queueMessage(
  digits: string,
  message: string
): Promise<{ jobId: string; messageId: string | null }> {
  return new Promise((resolve, reject) => {
    const jobId = randomUUID();
    senderState.queue.push({ jobId, digits, message, resolve, reject });
    processQueue();
  });
}

/**
 * Returns how many jobs are currently waiting in the queue.
 */
export function getQueueLength(): number {
  return senderState.queue.length;
}

/**
 * Processes the queue one job at a time, respecting MIN_SEND_INTERVAL_MS.
 */
async function processQueue() {
  if (senderState.isProcessing) return;
  senderState.isProcessing = true;

  while (senderState.queue.length > 0) {
    const job = senderState.queue.shift();
    if (!job) break;

    // Wait out any remaining rate-limit interval before sending.
    const waitMs = Math.max(0, MIN_SEND_INTERVAL_MS - (Date.now() - senderState.lastSendAt));
    if (waitMs > 0) {
      await sleep(waitMs);
    }

    try {
      if (!isConnected()) {
        // Attempt connection if disconnected
        await ensureWhatsAppConnected();
      }

      if (!isConnected()) {
        throw new Error('WhatsApp client is not connected');
      }

      const sock = getSocket();
      if (!sock) {
        throw new Error('WhatsApp socket unavailable');
      }

      const jid = toWhatsAppJid(job.digits);
      const result = await sock.sendMessage(jid, { text: job.message });

      senderState.lastSendAt = Date.now();
      senderState.recentSends.set(`${job.digits}|${job.message}`, senderState.lastSendAt);

      job.resolve({ jobId: job.jobId, messageId: result?.key?.id || null });
    } catch (err: any) {
      job.reject(err instanceof Error ? err : new Error(String(err)));
    }
  }

  senderState.isProcessing = false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Send an arbitrary text message to a phone number.
 */
export async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<{ success: boolean; jobId?: string; messageId?: string | null; error?: string; status?: number }> {
  const phoneCheck = validatePhone(phone);
  if (!phoneCheck.valid) {
    return { success: false, error: phoneCheck.error, status: 400 };
  }

  const messageCheck = validateMessage(message);
  if (!messageCheck.valid) {
    return { success: false, error: messageCheck.error, status: 400 };
  }

  await ensureWhatsAppConnected();

  if (!isConnected()) {
    return { success: false, error: 'WhatsApp client is not connected', status: 503 };
  }

  if (isDuplicate(phoneCheck.digits, message)) {
    return {
      success: false,
      error: 'Duplicate message: the same message was already sent to this number recently',
      status: 429,
    };
  }

  try {
    const { jobId, messageId } = await queueMessage(phoneCheck.digits, message);
    return { success: true, jobId, messageId };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to send WhatsApp message', status: 500 };
  }
}

/**
 * Send a formatted message + link text to a phone number.
 */
export async function sendWhatsAppLink(
  phone: string,
  link: string,
  message?: string
): Promise<{ success: boolean; jobId?: string; messageId?: string | null; error?: string; status?: number }> {
  const phoneCheck = validatePhone(phone);
  if (!phoneCheck.valid) {
    return { success: false, error: phoneCheck.error, status: 400 };
  }

  const linkCheck = validateLink(link);
  if (!linkCheck.valid) {
    return { success: false, error: linkCheck.error, status: 400 };
  }

  let introText = 'Here is your link:';
  if (message !== undefined) {
    const messageCheck = validateMessage(message);
    if (!messageCheck.valid) {
      return { success: false, error: messageCheck.error, status: 400 };
    }
    introText = message;
  }

  const fullText = `${introText}\n\n${link}`;

  await ensureWhatsAppConnected();

  if (!isConnected()) {
    return { success: false, error: 'WhatsApp client is not connected', status: 503 };
  }

  if (isDuplicate(phoneCheck.digits, fullText)) {
    return {
      success: false,
      error: 'Duplicate message: the same message was already sent to this number recently',
      status: 429,
    };
  }

  try {
    const { jobId, messageId } = await queueMessage(phoneCheck.digits, fullText);
    return { success: true, jobId, messageId };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to send WhatsApp message', status: 500 };
  }
}
