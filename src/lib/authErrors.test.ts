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
});
