import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  TelegramSubscription,
  getBakuDateParts,
  normalizeTelegramSubscription,
  reduceSubscriptionEvents,
} from '../lib/telegramSubscriptions';

export interface EncryptedSubscriptionEvent {
  eventId: string;
  chatHash: string;
  encryptedPayload: string;
  active: boolean;
  hourBaku: number;
  createdAtMs: number;
}

export interface SubscriberSummaryStats {
  totalTracked: number;
  activeCount: number;
  pausedCount: number;
  fridayKahfCount: number;
  dailyVerseZikrCount: number;
  dailyPrayerCount: number;
  cityBreakdown: Array<{ cityId: string; count: number }>;
  hourBreakdown: Array<{ hourBaku: number; count: number }>;
  storageModes: string[];
}

const LOCAL_DATA_DIR = path.resolve(process.cwd(), '.data');
const LOCAL_SUBS_FILE = path.join(LOCAL_DATA_DIR, 'telegram-subscriptions.json');
const KV_SET_KEY = 'qq:telegram_sub_chats_v1';
const KV_REC_PREFIX = 'qq:telegram_sub_rec_v1:';
const KV_SENT_PREFIX = 'qq:telegram_sub_sent_v1:';

const memorySubscriptions = new Map<string, TelegramSubscription>();
const memorySentDayByChat = new Map<string, string>();
let localDiskLoaded = false;

function getEncryptionSecret(botToken: string): string {
  return (
    String(process.env.TELEGRAM_SUB_ENCRYPTION_KEY ?? '').trim() ||
    String(process.env.TELEGRAM_WEBHOOK_SECRET ?? '').trim() ||
    botToken ||
    'quran-qiraeti-sub-fallback-secret-v1'
  );
}

function deriveAesKey(secret: string): Buffer {
  return crypto
    .createHmac('sha256', secret)
    .update('quran-qiraeti-sub-aes256-v1')
    .digest();
}

export function hashTelegramChatId(chatId: number | string, secretSource: string): string {
  return crypto
    .createHmac('sha256', getEncryptionSecret(secretSource))
    .update(`chat:${String(chatId)}`)
    .digest('hex');
}

/**
 * Encrypts subscription state using AES-256-GCM into colon-delimited hex (`iv:tag:cipher`)
 * strictly matching Firestore rules regex `^[a-zA-Z0-9+/=:\\-]+$` and <= 1024 chars.
 */
export function encryptSubscriptionPayload(
  sub: TelegramSubscription,
  secretSource: string
): string {
  const key = deriveAesKey(getEncryptionSecret(secretSource));
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const compact = JSON.stringify({
    c: sub.chatId,
    a: sub.active ? 1 : 0,
    y: sub.cityId,
    h: sub.hourBaku,
    k: sub.fridayKahf ? 1 : 0,
    v: sub.dailyVerseZikr ? 1 : 0,
    p: sub.dailyPrayer ? 1 : 0,
    u: sub.updatedAt,
    ...(sub.lastSentDateKey ? { l: sub.lastSentDateKey } : {}),
  });
  const encrypted = Buffer.concat([cipher.update(compact, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptSubscriptionPayload(
  encryptedPayload: string,
  secretSource: string
): TelegramSubscription | null {
  try {
    const parts = String(encryptedPayload ?? '').split(':');
    if (parts.length !== 3) return null;
    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const data = Buffer.from(parts[2], 'hex');
    if (iv.length !== 12 || tag.length !== 16 || data.length === 0) return null;

    const key = deriveAesKey(getEncryptionSecret(secretSource));
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
    const parsed = JSON.parse(plain) as {
      c?: string;
      a?: number;
      y?: string;
      h?: number;
      k?: number;
      v?: number;
      p?: number;
      u?: number;
      l?: string;
    };
    if (!parsed.c) return null;
    return normalizeTelegramSubscription({
      chatId: parsed.c,
      active: parsed.a !== 0,
      cityId: parsed.y,
      hourBaku: parsed.h,
      fridayKahf: parsed.k !== 0,
      dailyVerseZikr: parsed.v !== 0,
      dailyPrayer: parsed.p !== 0,
      updatedAt: parsed.u,
      ...(parsed.l ? { lastSentDateKey: parsed.l } : {}),
    });
  } catch {
    return null;
  }
}

function getKvConfig(): { url: string; token: string } | null {
  const url = String(
    process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? ''
  ).trim();
  const token = String(
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? ''
  ).trim();
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ''), token };
}

async function kvCommand<T = unknown>(args: Array<string | number>): Promise<T | null> {
  const cfg = getKvConfig();
  if (!cfg) return null;
  try {
    const res = await fetch(cfg.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { result?: T };
    return json?.result ?? null;
  } catch {
    return null;
  }
}

function loadLocalDiskOnce(secretSource: string) {
  if (localDiskLoaded) return;
  localDiskLoaded = true;
  if (process.env.VERCEL) return;
  try {
    if (!fs.existsSync(LOCAL_SUBS_FILE)) return;
    const raw = fs.readFileSync(LOCAL_SUBS_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as {
      events?: EncryptedSubscriptionEvent[];
      sentByHash?: Record<string, string>;
    };
    if (Array.isArray(parsed?.events)) {
      for (const ev of parsed.events) {
        const dec = decryptSubscriptionPayload(ev.encryptedPayload, secretSource);
        if (dec) {
          const prev = memorySubscriptions.get(dec.chatId);
          if (!prev || dec.updatedAt >= prev.updatedAt) {
            memorySubscriptions.set(dec.chatId, dec);
          }
        }
      }
    }
    if (parsed?.sentByHash && typeof parsed.sentByHash === 'object') {
      for (const [k, v] of Object.entries(parsed.sentByHash)) {
        if (typeof v === 'string') memorySentDayByChat.set(k, v);
      }
    }
  } catch {
    // non-fatal disk read
  }
}

function persistLocalDisk(secretSource: string) {
  if (process.env.VERCEL) return;
  try {
    fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
    const events: EncryptedSubscriptionEvent[] = Array.from(memorySubscriptions.values()).map(
      (sub) => ({
        eventId: `sub-${hashTelegramChatId(sub.chatId, secretSource).slice(0, 16)}-${sub.updatedAt}`,
        chatHash: hashTelegramChatId(sub.chatId, secretSource),
        encryptedPayload: encryptSubscriptionPayload(sub, secretSource),
        active: sub.active,
        hourBaku: sub.hourBaku,
        createdAtMs: sub.updatedAt,
      })
    );
    const sentByHash: Record<string, string> = {};
    for (const [k, v] of memorySentDayByChat.entries()) {
      sentByHash[k] = v;
    }
    fs.writeFileSync(LOCAL_SUBS_FILE, JSON.stringify({ events, sentByHash }, null, 2), 'utf-8');
  } catch {
    // ignore read-only FS
  }
}

async function writeEncryptedEventToFirestore(
  event: EncryptedSubscriptionEvent
): Promise<boolean> {
  const projectId = firebaseConfig.projectId;
  const dbId = firebaseConfig.firestoreDatabaseId;
  const apiKey = firebaseConfig.apiKey;
  if (!projectId || !dbId || !apiKey) return false;

  const docName = `projects/${projectId}/databases/${dbId}/documents/telegram_sub_events/${event.eventId}`;
  const commitUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/${encodeURIComponent(dbId)}/documents:commit?key=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(commitUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        writes: [
          {
            currentDocument: { exists: false },
            update: {
              name: docName,
              fields: {
                eventId: { stringValue: event.eventId },
                chatHash: { stringValue: event.chatHash },
                encryptedPayload: { stringValue: event.encryptedPayload },
                active: { booleanValue: event.active },
                hourBaku: { integerValue: String(event.hourBaku) },
              },
            },
            updateTransforms: [
              {
                fieldPath: 'createdAt',
                setToServerValue: 'REQUEST_TIME',
              },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(4500),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function readSubscriptionsFromFirestore(
  adminIdToken: string,
  secretSource: string
): Promise<TelegramSubscription[]> {
  if (!adminIdToken) return [];
  const projectId = firebaseConfig.projectId;
  const dbId = firebaseConfig.firestoreDatabaseId;
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/${encodeURIComponent(dbId)}/documents/telegram_sub_events?pageSize=500`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${adminIdToken}` },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      documents?: Array<{
        fields?: {
          encryptedPayload?: { stringValue?: string };
        };
      }>;
    };
    const decoded: TelegramSubscription[] = [];
    for (const doc of json?.documents ?? []) {
      const cipher = doc.fields?.encryptedPayload?.stringValue;
      if (!cipher) continue;
      const item = decryptSubscriptionPayload(cipher, secretSource);
      if (item) decoded.push(item);
    }
    return decoded;
  } catch {
    return [];
  }
}

export async function getSubscriptionForChat(
  chatId: number | string,
  secretSource: string
): Promise<TelegramSubscription | null> {
  loadLocalDiskOnce(secretSource);
  const key = String(chatId);
  const fromMem = memorySubscriptions.get(key);
  if (fromMem) return fromMem;

  const chatHash = hashTelegramChatId(key, secretSource);
  const fromKv = await kvCommand<string>(['GET', `${KV_REC_PREFIX}${chatHash}`]);
  if (fromKv) {
    const dec = decryptSubscriptionPayload(fromKv, secretSource);
    if (dec) {
      memorySubscriptions.set(dec.chatId, dec);
      return dec;
    }
  }
  return null;
}

export async function saveSubscription(
  sub: TelegramSubscription,
  secretSource: string
): Promise<TelegramSubscription> {
  loadLocalDiskOnce(secretSource);
  const normalized = normalizeTelegramSubscription({
    ...sub,
    updatedAt: Date.now(),
  });
  memorySubscriptions.set(normalized.chatId, normalized);
  persistLocalDisk(secretSource);

  const chatHash = hashTelegramChatId(normalized.chatId, secretSource);
  const encryptedPayload = encryptSubscriptionPayload(normalized, secretSource);
  const eventId = `sub-${chatHash.slice(0, 14)}-${normalized.updatedAt.toString(36)}`;

  const event: EncryptedSubscriptionEvent = {
    eventId,
    chatHash,
    encryptedPayload: encryptedPayload.slice(0, 1024),
    active: normalized.active,
    hourBaku: normalized.hourBaku,
    createdAtMs: normalized.updatedAt,
  };

  await Promise.allSettled([
    writeEncryptedEventToFirestore(event),
    (async () => {
      await kvCommand(['SADD', KV_SET_KEY, chatHash]);
      await kvCommand(['SET', `${KV_REC_PREFIX}${chatHash}`, event.encryptedPayload]);
    })(),
  ]);

  return normalized;
}

export async function loadAllSubscriptions(
  secretSource: string,
  adminIdToken?: string
): Promise<{ subscriptions: TelegramSubscription[]; storageModes: string[] }> {
  loadLocalDiskOnce(secretSource);
  const allRecords: TelegramSubscription[] = [...memorySubscriptions.values()];
  const storageModes = [process.env.VERCEL ? 'memory' : 'local-file'];

  const kvCfg = getKvConfig();
  if (kvCfg) {
    storageModes.push('kv-redis');
    const hashes = await kvCommand<string[]>(['SMEMBERS', KV_SET_KEY]);
    if (Array.isArray(hashes) && hashes.length > 0) {
      const kvPayloads = await Promise.all(
        hashes.slice(0, 500).map((h) => kvCommand<string>(['GET', `${KV_REC_PREFIX}${h}`]))
      );
      for (const cipher of kvPayloads) {
        if (!cipher) continue;
        const dec = decryptSubscriptionPayload(cipher, secretSource);
        if (dec) allRecords.push(dec);
      }
    }
  }

  if (adminIdToken) {
    const fsRecords = await readSubscriptionsFromFirestore(adminIdToken, secretSource);
    if (fsRecords.length > 0) {
      storageModes.push('firestore');
      allRecords.push(...fsRecords);
    }
  }

  const reduced = reduceSubscriptionEvents(allRecords);
  for (const item of reduced) {
    memorySubscriptions.set(item.chatId, item);
  }
  return { subscriptions: reduced, storageModes };
}

export async function hasSentDigestToday(
  chatId: number | string,
  dateKey: string,
  secretSource: string
): Promise<boolean> {
  loadLocalDiskOnce(secretSource);
  const chatHash = hashTelegramChatId(chatId, secretSource);
  if (memorySentDayByChat.get(chatHash) === dateKey) return true;
  const fromKv = await kvCommand<string>(['GET', `${KV_SENT_PREFIX}${chatHash}`]);
  if (fromKv === dateKey) {
    memorySentDayByChat.set(chatHash, dateKey);
    return true;
  }
  return false;
}

export async function markDigestSentToday(
  chatId: number | string,
  dateKey: string,
  secretSource: string
): Promise<void> {
  loadLocalDiskOnce(secretSource);
  const chatHash = hashTelegramChatId(chatId, secretSource);
  memorySentDayByChat.set(chatHash, dateKey);
  persistLocalDisk(secretSource);
  await kvCommand(['SET', `${KV_SENT_PREFIX}${chatHash}`, dateKey, 'EX', 172800]);
}

export function buildSubscriberSummaryStats(
  subscriptions: TelegramSubscription[],
  storageModes: string[]
): SubscriberSummaryStats {
  const activeSubs = subscriptions.filter((s) => s.active);
  const cityCounts = new Map<string, number>();
  const hourCounts = new Map<number, number>();

  for (const s of activeSubs) {
    cityCounts.set(s.cityId, (cityCounts.get(s.cityId) ?? 0) + 1);
    hourCounts.set(s.hourBaku, (hourCounts.get(s.hourBaku) ?? 0) + 1);
  }

  return {
    totalTracked: subscriptions.length,
    activeCount: activeSubs.length,
    pausedCount: subscriptions.length - activeSubs.length,
    fridayKahfCount: activeSubs.filter((s) => s.fridayKahf).length,
    dailyVerseZikrCount: activeSubs.filter((s) => s.dailyVerseZikr).length,
    dailyPrayerCount: activeSubs.filter((s) => s.dailyPrayer).length,
    cityBreakdown: Array.from(cityCounts.entries())
      .map(([cityId, count]) => ({ cityId, count }))
      .sort((a, b) => b.count - a.count),
    hourBreakdown: Array.from(hourCounts.entries())
      .map(([hourBaku, count]) => ({ hourBaku, count }))
      .sort((a, b) => a.hourBaku - b.hourBaku),
    storageModes,
  };
}

export { getBakuDateParts };
