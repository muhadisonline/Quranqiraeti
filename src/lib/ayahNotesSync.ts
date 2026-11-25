import { User } from 'firebase/auth';
import { mergeLocalAndCloudAyahs } from './ayahNotes';
import {
  deleteUserAyahNote,
  signInReaderWithGoogle,
  signOutReader,
  subscribeAuthState,
  subscribeUserAyahNotes,
  syncUserAyahNotesBatch,
  upsertUserAyahNote,
} from './firebase';
import {
  SavedAyahRecord,
  loadSavedAyahsFromStorage,
  persistSavedAyahsToStorage,
} from './readerState';

export interface CloudSyncStatusSnapshot {
  uid: string | null;
  email: string | null;
  displayName: string | null;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  error: string | null;
}

const DEFAULT_STATUS: CloudSyncStatusSnapshot = {
  uid: null,
  email: null,
  displayName: null,
  isSyncing: false,
  lastSyncedAt: null,
  error: null,
};

let statusSnapshot: CloudSyncStatusSnapshot = DEFAULT_STATUS;
let initialized = false;
let activeVerifiedUid: string | null = null;
let unsubFirestore: (() => void) | null = null;
let initialCloudMergeDoneForUid: string | null = null;
const listeners = new Set<() => void>();

function emitStatus(patch: Partial<CloudSyncStatusSnapshot>): void {
  statusSnapshot = { ...statusSnapshot, ...patch };
  for (const listener of listeners) {
    listener();
  }
}

function stopFirestoreSync(): void {
  if (unsubFirestore) {
    unsubFirestore();
    unsubFirestore = null;
  }
  activeVerifiedUid = null;
  initialCloudMergeDoneForUid = null;
}

async function handleAuthUserChange(user: User | null): Promise<void> {
  stopFirestoreSync();
  if (!user) {
    emitStatus({
      uid: null,
      email: null,
      displayName: null,
      isSyncing: false,
      error: null,
    });
    return;
  }

  let verified = Boolean(user.emailVerified);
  if (!verified) {
    try {
      await user.reload();
      const tokenRes = await user.getIdTokenResult(true);
      verified = Boolean(user.emailVerified || tokenRes.claims?.email_verified === true);
    } catch {
      // keep verified flag
    }
  }

  if (!verified) {
    emitStatus({
      uid: user.uid,
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      isSyncing: false,
      error: 'Google hesabınızın e-poçt ünvanı təsdiqlənmədiyi üçün bulud sinxronu açılmadı.',
    });
    return;
  }

  activeVerifiedUid = user.uid;
  emitStatus({
    uid: user.uid,
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    isSyncing: true,
    error: null,
  });

  unsubFirestore = subscribeUserAyahNotes(
    user.uid,
    (cloudNotes) => {
      if (activeVerifiedUid !== user.uid) return;
      const localNotes = loadSavedAyahsFromStorage();
      const { merged, toUpload } = mergeLocalAndCloudAyahs(localNotes, cloudNotes);

      if (initialCloudMergeDoneForUid !== user.uid) {
        initialCloudMergeDoneForUid = user.uid;
        persistSavedAyahsToStorage(merged);
        if (toUpload.length > 0) {
          void syncUserAyahNotesBatch(user.uid, toUpload).catch((err) => {
            console.warn('Initial cloud ayah sync warning:', err);
          });
        }
      } else {
        // Real-time cloud snapshot updates local view cleanly
        persistSavedAyahsToStorage(merged);
      }

      emitStatus({
        isSyncing: false,
        lastSyncedAt: new Date().toISOString(),
        error: null,
      });
    },
    (err) => {
      emitStatus({
        isSyncing: false,
        error: err.message || 'Bulud sinxronu zamanı xəta baş verdi.',
      });
    }
  );
}

export function ensureAyahCloudSyncInitialized(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  subscribeAuthState((user) => {
    void handleAuthUserChange(user);
  });
}

export function getCloudSyncStatusSnapshot(): CloudSyncStatusSnapshot {
  return statusSnapshot;
}

export function subscribeCloudSyncStatus(listener: () => void): () => void {
  ensureAyahCloudSyncInitialized();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function pushCloudAyahUpsert(record: SavedAyahRecord): void {
  const uid = activeVerifiedUid;
  if (!uid) return;
  emitStatus({ isSyncing: true, error: null });
  void upsertUserAyahNote(uid, record)
    .then(() => {
      emitStatus({ isSyncing: false, lastSyncedAt: new Date().toISOString(), error: null });
    })
    .catch((err) => {
      emitStatus({
        isSyncing: false,
        error: err instanceof Error ? err.message : 'Qeyd buluda yazıla bilmədi.',
      });
    });
}

export function pushCloudAyahDelete(surahNumber: number, ayahNumber: number): void {
  const uid = activeVerifiedUid;
  if (!uid) return;
  emitStatus({ isSyncing: true, error: null });
  void deleteUserAyahNote(uid, surahNumber, ayahNumber)
    .then(() => {
      emitStatus({ isSyncing: false, lastSyncedAt: new Date().toISOString(), error: null });
    })
    .catch((err) => {
      emitStatus({
        isSyncing: false,
        error: err instanceof Error ? err.message : 'Qeyd buluddan silinə bilmədi.',
      });
    });
}

export async function signInForAyahCloudSync(): Promise<void> {
  emitStatus({ isSyncing: true, error: null });
  try {
    await signInReaderWithGoogle();
  } catch (err) {
    emitStatus({
      isSyncing: false,
      error:
        err instanceof Error
          ? err.message
          : 'Google ilə giriş zamanı xəta baş verdi.',
    });
  }
}

export async function signOutAyahCloudSync(): Promise<void> {
  try {
    await signOutReader();
  } catch (err) {
    emitStatus({
      error: err instanceof Error ? err.message : 'Çıxış zamanı xəta baş verdi.',
    });
  }
}
