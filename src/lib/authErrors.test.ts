import test from 'node:test';
import assert from 'node:assert/strict';
import { extractFirebaseErrorCode, parseFirebaseAuthError } from './authErrors';

test('extractFirebaseErrorCode extracts error code from Error objects and Firebase error messages', () => {
  assert.equal(
    extractFirebaseErrorCode(Object.assign(new Error('err'), { code: 'auth/unauthorized-domain' })),
    'auth/unauthorized-domain'
  );
  assert.equal(
    extractFirebaseErrorCode(new Error('Firebase: Error (auth/unauthorized-domain).')),
    'auth/unauthorized-domain'
  );
  assert.equal(
    extractFirebaseErrorCode(new Error('Firebase: Error (auth/missing-email).')),
    'auth/missing-email'
  );
  assert.equal(
    extractFirebaseErrorCode(new Error('Firebase: Error (auth/popup-blocked).')),
    'auth/popup-blocked'
  );
  assert.equal(extractFirebaseErrorCode(new Error('Other failure')), 'auth/unknown');
});

test('parseFirebaseAuthError translates auth/unauthorized-domain into actionable Azerbaijani guidance', () => {
  const parsed = parseFirebaseAuthError(
    new Error('Firebase: Error (auth/unauthorized-domain).'),
    'quranqiraeti.vercel.app',
    'mindful-operator-5v0ns'
  );
  assert.equal(parsed.code, 'auth/unauthorized-domain');
  assert.equal(parsed.domain, 'quranqiraeti.vercel.app');
  assert.equal(
    parsed.consoleSettingsUrl,
    'https://console.firebase.google.com/project/mindful-operator-5v0ns/authentication/settings'
  );
  assert.ok(parsed.message.includes('quranqiraeti.vercel.app'));
  assert.ok(!parsed.message.includes('gmail'));
});

test('parseFirebaseAuthError handles auth/missing-email with Firebase console links and no PII', () => {
  const parsed = parseFirebaseAuthError(
    { code: 'auth/missing-email' },
    'quranqiraeti.vercel.app',
    'mindful-operator-5v0ns',
    {
      uid: 'uid_12345',
      databaseId: 'ai-studio-quranqiraeti-c7acecf7-1549-4be0-8e2a-500eab44da5f',
    }
  );
  assert.equal(parsed.code, 'auth/missing-email');
  assert.equal(parsed.uid, 'uid_12345');
  assert.equal(
    parsed.consoleSettingsUrl,
    'https://console.firebase.google.com/project/mindful-operator-5v0ns/authentication/settings'
  );
  assert.equal(
    parsed.consoleUsersUrl,
    'https://console.firebase.google.com/project/mindful-operator-5v0ns/authentication/users'
  );
  assert.ok(parsed.firestoreUrl?.includes('ai-studio-quranqiraeti-c7acecf7-1549-4be0-8e2a-500eab44da5f'));
  assert.ok(!parsed.message.toLowerCase().includes('gmail'));
});

test('parseFirebaseAuthError handles popup-blocked and popup-closed cleanly', () => {
  const blocked = parseFirebaseAuthError(
    { code: 'auth/popup-blocked' },
    'quranqiraeti.vercel.app',
    'mindful-operator-5v0ns'
  );
  assert.equal(blocked.code, 'auth/popup-blocked');
  assert.ok(blocked.message.includes('blokladı'));

  const closed = parseFirebaseAuthError(
    { code: 'auth/popup-closed-by-user' },
    'quranqiraeti.vercel.app',
    'mindful-operator-5v0ns'
  );
  assert.equal(closed.code, 'auth/popup-closed-by-user');
  assert.ok(closed.message.includes('bağlandı'));

  const repaired = parseFirebaseAuthError(
    { code: 'auth/session-repaired-retry' },
    'quranqiraeti.vercel.app',
    'mindful-operator-5v0ns'
  );
  assert.equal(repaired.code, 'auth/session-repaired-retry');
  assert.ok(repaired.message.includes('avtomatik təmizləndi'));
});
