import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

export const TELEGRAM_API_ID = Number(process.env.TELEGRAM_API_ID || "30337191");
export const TELEGRAM_API_HASH = process.env.TELEGRAM_API_HASH || "20e01d075ae793b54ed4249518a61314";

// Almacén temporal en memoria para la fase de apretón de manos (handshake de login)
interface PendingAuth {
  client: TelegramClient;
  phoneCodeHash: string;
  phoneNumber: string;
  createdAt: number;
}

const globalForTelegram = globalThis as unknown as {
  pendingTelegramAuths: Map<string, PendingAuth>;
};

export const pendingTelegramAuths =
  globalForTelegram.pendingTelegramAuths || new Map<string, PendingAuth>();

if (process.env.NODE_ENV !== "production") {
  globalForTelegram.pendingTelegramAuths = pendingTelegramAuths;
}

export function createTelegramClient(sessionString = "") {
  const session = new StringSession(sessionString);
  const client = new TelegramClient(session, TELEGRAM_API_ID, TELEGRAM_API_HASH, {
    connectionRetries: 5,
  });
  return client;
}
