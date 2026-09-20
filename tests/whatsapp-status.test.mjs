import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cf-whatsapp-"));
process.env.AUTH_DIR = tmpRoot;

const connectionModule = await import("../lib/whatsapp/connection.ts");

const { getWhatsAppAdminStatus, clearWhatsAppAuthState } = connectionModule;

test("WhatsApp status is needs_authentication when no persisted auth exists", async () => {
  await clearWhatsAppAuthState();
  const status = await getWhatsAppAdminStatus();
  assert.equal(status.status, "needs_authentication");
});

test("WhatsApp status is disconnected when persisted auth exists but is not connected", async () => {
  await fs.mkdir(tmpRoot, { recursive: true });
  await fs.writeFile(path.join(tmpRoot, "creds.json"), "{}");
  const status = await getWhatsAppAdminStatus();
  assert.equal(status.status, "disconnected");
});
