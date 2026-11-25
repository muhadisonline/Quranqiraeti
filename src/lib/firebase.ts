import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  User,
  deleteUser,
  getAuth,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithCredential,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import {
  buildAyahNoteId,
  fromCloudAyahNoteDoc,
  toCloudAyahNotePayload,
} from './ayahNotes';
import type { SavedAyahRecord } from './readerState';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  CONNECTED_PAGES,
  ConnectedPageKey,
  HealthStatus,
  PageHealthSnapshot,
  PageTelemetryEventRecord,
  ReferrerType,
  TelemetryStatus,
  normalizeReferrerType,
  resolvePageTelemetryMeta,
} from './analytics';

export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
export const FIREBASE_DATABASE_ID = firebaseConfig.firestoreDatabaseId;
const BOOTSTRAPPED_ADMIN_EMAIL_SHA256 =
  'c00a9c2c72ba2c120b8edf90ac1584dd117552bdfca10d4c69808fa25f01534d';

async function sha256Hex(value: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) return '';
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

if (typeof window !== 'undefined') {
  void testConnection();
}

export interface AdminUserRecord {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin';
  createdAtMs: number;
}

const SESSION_STORAGE_KEY = 'quranqiraeti_telemetry_session_v1';

export function getOrCreateSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing && /^[a-zA-Z0-9_-]{4,80}$/.test(existing)) {
      return existing;
    }
    const generated = `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(SESSION_STORAGE_KEY, generated);
    return generated;
  } catch {
    return `sess-${Date.now().toString(36)}`;
  }
}

function buildSafeEventId(): string {
  return `ev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizePathForRule(rawPath: string): string {
  const cleaned = (rawPath || '/').split('?')[0].replace(/[^a-zA-Z0-9_/-]/g, '');
  const prefixed = cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
  return prefixed.slice(0, 180) || '/';
}

export async function recordPageTelemetryEvent(params: {
  pathname: string;
  loadTimeMs: number;
  httpStatus?: number;
  statusOverride?: TelemetryStatus;
  referrer?: string;
}): Promise<void> {
  const meta = resolvePageTelemetryMeta(params.pathname);
  if (!meta) return;

  const eventId = buildSafeEventId();
  const safePath = sanitizePathForRule(meta.cleanPath);
  const clampedLatency = Math.min(
    120_000,
    Math.max(0, Math.round(Number.isFinite(params.loadTimeMs) ? params.loadTimeMs : 0))
  );
  const httpStatus = Math.min(599, Math.max(100, Math.round(params.httpStatus ?? 200)));
  const status: TelemetryStatus =
    params.statusOverride ??
    (httpStatus >= 400 ? 'error' : clampedLatency >= 2500 ? 'slow' : 'ok');
  const sessionId = getOrCreateSessionId();
  const referrerType: ReferrerType = normalizeReferrerType(
    params.referrer ?? (typeof document !== 'undefined' ? document.referrer : ''),
    typeof window !== 'undefined' ? window.location.origin : ''
  );

  // 1. Send to backend fallback tracker (non-blocking)
  void fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventId,
      pageKey: meta.pageKey,
      pageLabel: meta.pageLabel,
      path: safePath,
      status,
      httpStatus,
      loadTimeMs: clampedLatency,
      sessionId,
      referrerType,
    }),
  }).catch(() => {
    // non-fatal telemetry fallback
  });

  // 2. Persist to Firestore /page_events/{eventId}
  const docPath = `page_events/${eventId}`;
  try {
    await setDoc(doc(db, 'page_events', eventId), {
      eventId,
      pageKey: meta.pageKey,
      pageLabel: meta.pageLabel.slice(0, 100),
      path: safePath,
      status,
      httpStatus,
      loadTimeMs: clampedLatency,
      sessionId,
      referrerType,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    // Log structured context if rejected by rules without disrupting reader UX
    console.warn('Firestore telemetry write warning:', docPath, error);
  }
}

export async function signInAdminWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  const oauthCred = GoogleAuthProvider.credentialFromResult(cred);

  try {
    await cred.user.reload();
    await cred.user.getIdToken(true);
  } catch {
    // non-fatal refresh error
  }

  let activeUser = auth.currentUser ?? cred.user;

  // Automatically repair stale Auth accounts created earlier without top-level email
  if (!(activeUser.email ?? '').trim()) {
    try {
      await deleteUser(activeUser);
    } catch {
      // If deletion cannot proceed cleanly, continue with existing user check
      return activeUser;
    }

    if (oauthCred) {
      try {
        const freshCred = await signInWithCredential(auth, oauthCred);
        await freshCred.user.reload();
        await freshCred.user.getIdToken(true);
        activeUser = auth.currentUser ?? freshCred.user;
        return activeUser;
      } catch {
        // OAuth idToken may be single-use; session is now clean for an immediate fresh tap
      }
    }

    await signOut(auth).catch(() => {});
    const repairedErr = Object.assign(
      new Error('Köhnə boş sessiya avtomatik təmizləndi. İndi son dəfə Google ilə daxil olun.'),
      { code: 'auth/session-repaired-retry' }
    );
    throw repairedErr;
  }

  return activeUser;
}

export async function sendAdminVerificationEmail(): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Əvvəlcə Google hesabınızla daxil olun.');
  }
  await sendEmailVerification(user, {
    url: typeof window !== 'undefined' ? `${window.location.origin}/admin` : 'https://localhost/admin',
  });
}

export async function refreshCurrentAdminUser(): Promise<User | null> {
  const user = auth.currentUser;
  if (!user) return null;
  await user.reload();
  await user.getIdToken(true);
  return auth.currentUser;
}

export async function signOutAdmin(): Promise<void> {
  await signOut(auth);
}

export async function signInReaderWithGoogle(): Promise<User> {
  return signInAdminWithGoogle();
}

export async function signOutReader(): Promise<void> {
  await signOut(auth);
}

export function subscribeAuthState(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function verifyAndSyncAdminAccess(user: User | null): Promise<{
  isAdmin: boolean;
  code?: string;
  uid?: string;
  reason?: string;
}> {
  if (!user) return { isAdmin: false };

  const adminDocPath = `admins/${user.uid}`;

  // 1. First verify whether this exact authenticated UID is already registered in /admins/{uid}.
  // This grants access immediately even if Identity Platform is in multi-account mode (email == null).
  try {
    const existingAdminSnap = await getDoc(doc(db, 'admins', user.uid));
    if (existingAdminSnap.exists()) {
      return { isAdmin: true, uid: user.uid };
    }
  } catch {
    // Non-fatal: continue to email/token verification path below
  }

  // 2. Refresh auth user & JWT claims for bootstrapped email verification
  let refreshedUser = user;
  let effectiveVerified = Boolean(user.emailVerified);
  try {
    await user.reload();
    refreshedUser = auth.currentUser ?? user;
    const tokenRes = await refreshedUser.getIdTokenResult(true);
    effectiveVerified = Boolean(
      refreshedUser.emailVerified || tokenRes.claims?.email_verified === true
    );
  } catch {
    // fallback to existing claim state if network hiccup
  }

  const authLevelEmail = (refreshedUser.email ?? '').trim();
  if (!authLevelEmail) {
    return {
      isAdmin: false,
      code: 'auth/missing-email',
      uid: user.uid,
      reason:
        'Firebase Authentication bu layihədə e-poçtsuz hesab (Multi-account) rejimində yaradıldığı üçün e-poçt ünvanı oxuna bilmədi.',
    };
  }

  if (!effectiveVerified) {
    return {
      isAdmin: false,
      code: 'auth/email-unverified',
      uid: user.uid,
      reason:
        'Firebase hesabınızda e-poçt təsdiqi (email_verified) hələ aktiv deyil. Təsdiq linki göndərərək bir kliklə aktivləşdirə bilərsiniz.',
    };
  }

  const email = authLevelEmail.toLowerCase();
  const emailHash = await sha256Hex(email);
  const isBootstrapped = emailHash === BOOTSTRAPPED_ADMIN_EMAIL_SHA256;

  if (isBootstrapped) {
    try {
      await setDoc(doc(db, 'admins', user.uid), {
        uid: user.uid,
        email: authLevelEmail.slice(0, 160),
        displayName: (refreshedUser.displayName || 'Əsas Admin').slice(0, 120),
        role: 'admin',
        createdAt: serverTimestamp(),
      });
    } catch (writeErr) {
      handleFirestoreError(writeErr, OperationType.WRITE, adminDocPath);
    }
    return { isAdmin: true, uid: user.uid };
  }

  return {
    isAdmin: false,
    code: 'auth/not-admin',
    uid: user.uid,
    reason: 'Bu Google hesabı admin siyahısında qeydiyyatda deyil.',
  };
}

function timestampToMs(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && 'seconds' in value) {
    const sec = Number((value as { seconds?: number }).seconds ?? 0);
    return sec * 1000;
  }
  return Date.now();
}

export function subscribeAdminTelemetry(
  onEvents: (events: PageTelemetryEventRecord[]) => void,
  onHealth: (records: PageHealthSnapshot[]) => void,
  onError: (err: Error) => void
): () => void {
  const eventsPath = 'page_events';
  const healthPath = 'page_health';

  const eventsQuery = query(
    collection(db, eventsPath),
    orderBy('createdAt', 'desc'),
    limit(600)
  );

  const unsubEvents = onSnapshot(
    eventsQuery,
    (snapshot) => {
      const parsed: PageTelemetryEventRecord[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          eventId: String(data.eventId ?? d.id),
          pageKey: data.pageKey as ConnectedPageKey,
          pageLabel: String(data.pageLabel ?? ''),
          path: String(data.path ?? '/'),
          status: (data.status as TelemetryStatus) ?? 'ok',
          httpStatus: Number(data.httpStatus ?? 200),
          loadTimeMs: Number(data.loadTimeMs ?? 0),
          sessionId: String(data.sessionId ?? 'anon'),
          referrerType: (data.referrerType as ReferrerType) ?? 'direct',
          createdAtMs: timestampToMs(data.createdAt),
        };
      });
      onEvents(parsed);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, eventsPath);
      } catch (wrapped) {
        onError(wrapped as Error);
      }
    }
  );

  const unsubHealth = onSnapshot(
    collection(db, healthPath),
    (snapshot) => {
      const records: PageHealthSnapshot[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          pageKey: (data.pageKey ?? d.id) as ConnectedPageKey,
          label: String(data.label ?? ''),
          routePattern: String(data.routePattern ?? '/'),
          status: (data.status as HealthStatus) ?? 'ok',
          statusNote: String(data.statusNote ?? ''),
          lastLatencyMs: Number(data.lastLatencyMs ?? 0),
          lastCheckedAtMs: timestampToMs(data.lastCheckedAt),
          checkedByUid: String(data.checkedByUid ?? ''),
        };
      });
      onHealth(records);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, healthPath);
      } catch (wrapped) {
        onError(wrapped as Error);
      }
    }
  );

  return () => {
    unsubEvents();
    unsubHealth();
  };
}

export async function runLivePageHealthChecks(
  adminUid: string,
  onProgress?: (completed: number, total: number) => void
): Promise<PageHealthSnapshot[]> {
  const results: PageHealthSnapshot[] = [];

  for (let i = 0; i < CONNECTED_PAGES.length; i++) {
    const pageDef = CONNECTED_PAGES[i];
    const started = performance.now();
    let status: HealthStatus = 'ok';
    let statusNote = 'HTTP 200 · Normal işləyir';
    let latencyMs = 0;

    try {
      const res = await fetch(pageDef.probeUrl, {
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
      });
      latencyMs = Math.min(120_000, Math.max(1, Math.round(performance.now() - started)));
      if (!res.ok) {
        status = 'down';
        statusNote = `HTTP ${res.status} xətası aşkarlandı`;
      } else if (latencyMs > 2500) {
        status = 'degraded';
        statusNote = `Yavaş cavab (${latencyMs} ms)`;
      } else {
        status = 'ok';
        statusNote = `HTTP ${res.status} · Səhifə sağlamdır (${latencyMs} ms)`;
      }
    } catch {
      latencyMs = Math.min(120_000, Math.max(1, Math.round(performance.now() - started)));
      status = 'down';
      statusNote = 'Şəbəkə və ya vaxt limiti xətası';
    }

    const docPath = `page_health/${pageDef.pageKey}`;
    try {
      await setDoc(doc(db, 'page_health', pageDef.pageKey), {
        pageKey: pageDef.pageKey,
        label: pageDef.label.slice(0, 100),
        routePattern: pageDef.routePattern.slice(0, 120),
        status,
        statusNote: statusNote.slice(0, 240),
        lastLatencyMs: latencyMs,
        lastCheckedAt: serverTimestamp(),
        checkedByUid: adminUid,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }

    results.push({
      pageKey: pageDef.pageKey,
      label: pageDef.label,
      routePattern: pageDef.routePattern,
      status,
      statusNote,
      lastLatencyMs: latencyMs,
      lastCheckedAtMs: Date.now(),
      checkedByUid: adminUid,
    });

    onProgress?.(i + 1, CONNECTED_PAGES.length);
  }

  return results;
}

export async function listAdminUsers(): Promise<AdminUserRecord[]> {
  const path = 'admins';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        uid: String(data.uid ?? d.id),
        email: String(data.email ?? ''),
        displayName: String(data.displayName ?? ''),
        role: 'admin',
        createdAtMs: timestampToMs(data.createdAt),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function addAdminUser(input: {
  uid: string;
  email: string;
  displayName: string;
}): Promise<void> {
  const cleanUid = input.uid.trim();
  const cleanEmail = input.email.trim();
  const cleanName = input.displayName.trim();
  const path = `admins/${cleanUid}`;
  try {
    await setDoc(doc(db, 'admins', cleanUid), {
      uid: cleanUid,
      email: cleanEmail.slice(0, 160),
      displayName: cleanName.slice(0, 120),
      role: 'admin',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function removeAdminUser(uid: string): Promise<void> {
  const path = `admins/${uid}`;
  try {
    await deleteDoc(doc(db, 'admins', uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeUserAyahNotes(
  uid: string,
  onNotes: (notes: SavedAyahRecord[]) => void,
  onError: (err: Error) => void
): () => void {
  const cleanUid = uid.trim();
  const collectionPath = `users/${cleanUid}/ayah_notes`;
  const q = query(collection(db, 'users', cleanUid, 'ayah_notes'), where('ownerUid', '==', cleanUid));

  return onSnapshot(
    q,
    (snapshot) => {
      const parsed: SavedAyahRecord[] = [];
      for (const d of snapshot.docs) {
        const rec = fromCloudAyahNoteDoc(d.data() as Record<string, unknown>);
        if (rec) parsed.push(rec);
      }
      parsed.sort((a, b) => (Date.parse(b.savedAt) || 0) - (Date.parse(a.savedAt) || 0));
      onNotes(parsed);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch (wrapped) {
        onError(wrapped as Error);
      }
    }
  );
}

export async function upsertUserAyahNote(
  uid: string,
  record: SavedAyahRecord
): Promise<void> {
  const cleanUid = uid.trim();
  const payload = toCloudAyahNotePayload(cleanUid, record);
  const path = `users/${cleanUid}/ayah_notes/${payload.noteId}`;
  const docRef = doc(db, 'users', cleanUid, 'ayah_notes', payload.noteId);

  try {
    const snap = await getDoc(docRef);
    await setDoc(docRef, {
      ...payload,
      createdAt: snap.exists() && snap.data()?.createdAt ? snap.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserAyahNote(
  uid: string,
  surahNumber: number,
  ayahNumber: number
): Promise<void> {
  const cleanUid = uid.trim();
  const noteId = buildAyahNoteId(surahNumber, ayahNumber);
  const path = `users/${cleanUid}/ayah_notes/${noteId}`;
  try {
    await deleteDoc(doc(db, 'users', cleanUid, 'ayah_notes', noteId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncUserAyahNotesBatch(
  uid: string,
  records: SavedAyahRecord[]
): Promise<void> {
  for (const record of records.slice(0, 60)) {
    await upsertUserAyahNote(uid, record);
  }
}

